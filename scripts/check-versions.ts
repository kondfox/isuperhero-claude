/**
 * Version checker for the monorepo.
 *
 * - Detects version mismatches: same external dep with different ranges across workspaces.
 * - Reports outdated packages via `bun outdated` with severity levels.
 * - Detects transitive dependency conflicts from the lockfile.
 * - Resolves mismatches and transitive conflicts automatically with --fix.
 *
 * Usage:
 *   bun scripts/check-versions.ts              # All checks (pre-commit)
 *   bun scripts/check-versions.ts --mismatch   # Mismatch only (fast)
 *   bun scripts/check-versions.ts --fix        # Auto-resolve mismatches + transitive conflicts
 *   bun scripts/check-versions.ts --json       # JSON output (for Claude hook)
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')

interface PackageJson {
  name?: string
  workspaces?: string[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  overrides?: Record<string, string>
}

interface Mismatch {
  package: string
  versions: Record<string, string[]> // versionRange -> workspaceNames[]
  resolved?: string // the chosen version range (when --fix)
}

interface OutdatedEntry {
  name: string
  current: string
  latest: string
  severity: 'patch' | 'minor' | 'major'
}

interface TransitiveConflict {
  package: string
  versions: string[] // resolved versions found in lockfile
  resolved?: string // override version chosen (when --fix)
}

// --- Semver helpers ---

function parseSemver(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function classifySeverity(current: string, latest: string): 'patch' | 'minor' | 'major' {
  const c = parseSemver(current)
  const l = parseSemver(latest)
  if (!c || !l) return 'minor'
  if (c[0] !== l[0]) return 'major'
  if (c[1] !== l[1]) return 'minor'
  return 'patch'
}

/** Extract the bare semver from a range like "^1.2.3" or "~1.2.3" or ">=1.2.3" */
function extractSemver(range: string): [number, number, number] | null {
  return parseSemver(range.replace(/^[\^~>=<]+/, ''))
}

/** Compare two semver ranges by their base version, returning the higher one */
function higherRange(a: string, b: string): string {
  const sa = extractSemver(a)
  const sb = extractSemver(b)
  if (!sa || !sb) return a
  for (let i = 0; i < 3; i++) {
    if (sa[i] > sb[i]) return a
    if (sb[i] > sa[i]) return b
  }
  return a // equal
}

/** Pick the highest semver string from an array like ["2.0.4", "2.1.0", "1.9.3"] */
function highestVersion(versions: string[]): string {
  let best = versions[0]
  for (let i = 1; i < versions.length; i++) {
    const a = parseSemver(best)
    const b = parseSemver(versions[i])
    if (!a || !b) continue
    for (let j = 0; j < 3; j++) {
      if (b[j] > a[j]) {
        best = versions[i]
        break
      }
      if (a[j] > b[j]) break
    }
  }
  return best
}

// --- Workspace discovery ---

function getWorkspacePackageJsonPaths(): string[] {
  const rootPkgPath = join(ROOT, 'package.json')
  const rootPkg: PackageJson = JSON.parse(readFileSync(rootPkgPath, 'utf-8'))
  const paths = [rootPkgPath]

  for (const pattern of rootPkg.workspaces ?? []) {
    const dir = join(ROOT, pattern.replace('/*', '').replace('/*', ''))
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const pkgPath = join(dir, entry.name, 'package.json')
        if (existsSync(pkgPath)) {
          paths.push(pkgPath)
        }
      }
    }
  }

  return paths
}

// --- Mismatch detection ---

function checkMismatches(): Mismatch[] {
  const paths = getWorkspacePackageJsonPaths()

  // depName -> Map<versionRange, workspaceName[]>
  const depMap = new Map<string, Map<string, string[]>>()

  for (const pkgPath of paths) {
    const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const workspaceName = pkg.name ?? '(root)'

    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    for (const [dep, range] of Object.entries(allDeps)) {
      if (range.startsWith('workspace:')) continue

      let versions = depMap.get(dep)
      if (!versions) {
        versions = new Map()
        depMap.set(dep, versions)
      }
      let workspaces = versions.get(range)
      if (!workspaces) {
        workspaces = []
        versions.set(range, workspaces)
      }
      workspaces.push(workspaceName)
    }
  }

  const mismatches: Mismatch[] = []
  for (const [dep, versions] of depMap) {
    if (versions.size > 1) {
      const versionObj: Record<string, string[]> = {}
      for (const [range, workspaces] of versions) {
        versionObj[range] = workspaces
      }
      mismatches.push({ package: dep, versions: versionObj })
    }
  }

  return mismatches
}

// --- Mismatch resolution ---

function fixMismatches(mismatches: Mismatch[]): void {
  if (mismatches.length === 0) return

  const paths = getWorkspacePackageJsonPaths()

  for (const mismatch of mismatches) {
    // Pick the highest version range
    const ranges = Object.keys(mismatch.versions)
    let chosen = ranges[0]
    for (let i = 1; i < ranges.length; i++) {
      chosen = higherRange(chosen, ranges[i])
    }
    mismatch.resolved = chosen

    // Update all workspace package.json files
    for (const pkgPath of paths) {
      const raw = readFileSync(pkgPath, 'utf-8')
      const pkg: PackageJson = JSON.parse(raw)

      let changed = false
      if (pkg.dependencies?.[mismatch.package] && pkg.dependencies[mismatch.package] !== chosen) {
        pkg.dependencies[mismatch.package] = chosen
        changed = true
      }
      if (
        pkg.devDependencies?.[mismatch.package] &&
        pkg.devDependencies[mismatch.package] !== chosen
      ) {
        pkg.devDependencies[mismatch.package] = chosen
        changed = true
      }

      if (changed) {
        writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
      }
    }
  }
}

// --- Outdated detection ---

function checkOutdated(): OutdatedEntry[] {
  try {
    const result = Bun.spawnSync(['bun', 'outdated'], {
      cwd: ROOT,
      env: process.env,
    })

    const output = result.stdout.toString()
    const entries: OutdatedEntry[] = []

    // Parse ASCII table rows: | Package | Current | Update | Latest |
    for (const line of output.split('\n')) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('Package')) continue
      const cols = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
      if (cols.length < 4) continue

      const name = cols[0].replace(/\s*\(dev\)/, '')
      const current = cols[1]
      const latest = cols[3]

      if (current !== latest) {
        const severity = classifySeverity(current, latest)
        entries.push({ name, current, latest, severity })
      }
    }

    // Sort: major first, then minor, then patch
    const order = { major: 0, minor: 1, patch: 2 }
    entries.sort((a, b) => order[a.severity] - order[b.severity])

    return entries
  } catch {
    return []
  }
}

// --- Transitive conflict detection ---

function checkTransitiveConflicts(): TransitiveConflict[] {
  const lockPath = join(ROOT, 'bun.lock')
  if (!existsSync(lockPath)) return []

  try {
    const raw = readFileSync(lockPath, 'utf-8')
    // bun.lock is JSONC — strip trailing commas for JSON.parse
    const cleaned = raw.replace(/,(\s*[}\]])/g, '$1')
    const lock = JSON.parse(cleaned)

    // bun.lock "packages" is a flat object: key = "name@version" or a tarball, value = metadata
    const packages: Record<string, unknown> = lock.packages
    if (!packages) return []

    // Group resolved versions by package name
    // Keys look like: "@colyseus/schema@2.0.35", "react@19.1.0", etc.
    const versionsByPkg = new Map<string, string[]>()

    for (const key of Object.keys(packages)) {
      // Skip workspace entries and non-scoped simple entries
      if (key === '' || key.startsWith('workspace:')) continue

      // Parse "name@version" — handle scoped packages like @foo/bar@1.2.3
      let name: string
      let version: string
      const lastAt = key.lastIndexOf('@')
      if (lastAt <= 0) continue // no version or just "@scope"
      name = key.slice(0, lastAt)
      version = key.slice(lastAt + 1)

      if (!name || !version || !parseSemver(version)) continue

      let versions = versionsByPkg.get(name)
      if (!versions) {
        versions = []
        versionsByPkg.set(name, versions)
      }
      if (!versions.includes(version)) {
        versions.push(version)
      }
    }

    const conflicts: TransitiveConflict[] = []
    for (const [name, versions] of versionsByPkg) {
      if (versions.length > 1) {
        conflicts.push({ package: name, versions: versions.sort() })
      }
    }

    conflicts.sort((a, b) => a.package.localeCompare(b.package))
    return conflicts
  } catch {
    return []
  }
}

// --- Transitive conflict resolution ---

function fixTransitiveConflicts(conflicts: TransitiveConflict[]): boolean {
  if (conflicts.length === 0) return false

  const rootPkgPath = join(ROOT, 'package.json')
  const pkg: PackageJson = JSON.parse(readFileSync(rootPkgPath, 'utf-8'))
  const overrides = pkg.overrides ?? {}
  let changed = false

  for (const conflict of conflicts) {
    const chosen = highestVersion(conflict.versions)
    conflict.resolved = chosen

    if (overrides[conflict.package] !== chosen) {
      overrides[conflict.package] = chosen
      changed = true
    }
  }

  if (changed) {
    pkg.overrides = overrides
    writeFileSync(rootPkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  }

  return changed
}

// --- Main ---

const args = new Set(Bun.argv.slice(2))
const jsonOutput = args.has('--json')
const mismatchOnly = args.has('--mismatch')
const fix = args.has('--fix')
const runBoth = !mismatchOnly

let exitCode = 0

// Mismatch check (always runs)
const mismatches = checkMismatches()
if (mismatches.length > 0) {
  exitCode = 1
  if (fix) {
    fixMismatches(mismatches)
  }
}

// Outdated check (skip with --mismatch)
const outdated = runBoth ? checkOutdated() : []

// Transitive conflict check (skip with --mismatch)
const transitiveConflicts = runBoth ? checkTransitiveConflicts() : []
if (transitiveConflicts.length > 0 && fix) {
  const didFix = fixTransitiveConflicts(transitiveConflicts)
  if (didFix) {
    // Re-install to apply overrides
    Bun.spawnSync(['bun', 'install'], { cwd: ROOT, env: process.env })
  }
}

// Output
if (jsonOutput) {
  const result: Record<string, unknown> = {
    status: exitCode === 0 && transitiveConflicts.length === 0 ? 'pass' : 'fail',
  }
  if (mismatches.length > 0) {
    result.mismatches = mismatches
  }
  if (outdated.length > 0) {
    result.outdated = outdated
  }
  if (transitiveConflicts.length > 0) {
    result.transitiveConflicts = transitiveConflicts
  }
  console.log(JSON.stringify({ versionCheck: result }))
} else {
  // --- Mismatches ---
  if (mismatches.length > 0) {
    if (fix) {
      console.log('\x1b[32m✓ VERSION MISMATCHES RESOLVED:\x1b[0m')
    } else {
      console.log('\x1b[31m✗ VERSION MISMATCHES:\x1b[0m')
    }
    for (const m of mismatches) {
      const suffix = m.resolved ? ` → ${m.resolved}` : ''
      console.log(`  ${m.package}${suffix}`)
      for (const [range, workspaces] of Object.entries(m.versions)) {
        console.log(`    ${range.padEnd(16)} ${workspaces.join(', ')}`)
      }
    }
    console.log()
  }

  // --- Outdated ---
  if (outdated.length > 0) {
    const severityLabel = {
      major: '\x1b[31m▲ major\x1b[0m',
      minor: '\x1b[33m▲ minor\x1b[0m',
      patch: '\x1b[36m▲ patch\x1b[0m',
    }
    console.log('\x1b[33m⚠ OUTDATED PACKAGES:\x1b[0m')
    for (const entry of outdated) {
      const name = entry.name.padEnd(30)
      const versions = `${entry.current} → ${entry.latest}`
      console.log(`  ${name} ${versions.padEnd(20)} ${severityLabel[entry.severity]}`)
    }
    console.log()
  }

  // --- Transitive conflicts ---
  if (transitiveConflicts.length > 0) {
    if (fix) {
      console.log('\x1b[32m✓ TRANSITIVE CONFLICTS RESOLVED (overrides added):\x1b[0m')
    } else {
      console.log('\x1b[33m⚠ TRANSITIVE DEPENDENCY CONFLICTS:\x1b[0m')
    }
    for (const c of transitiveConflicts) {
      const suffix = c.resolved ? ` → ${c.resolved}` : ''
      console.log(`  ${c.package.padEnd(30)} ${c.versions.join(', ')}${suffix}`)
    }
    console.log()
    if (!fix) {
      console.log('  Run with --fix to add overrides to root package.json')
      console.log()
    }
  }

  // --- Summary ---
  const allClear =
    mismatches.length === 0 && outdated.length === 0 && transitiveConflicts.length === 0
  if (allClear) {
    console.log('\x1b[32m✓ All dependency versions are consistent and up to date.\x1b[0m')
  } else if (mismatches.length === 0 && transitiveConflicts.length === 0) {
    console.log('\x1b[32m✓ No version mismatches or transitive conflicts.\x1b[0m')
  } else if (fix) {
    console.log('\x1b[32m✓ All issues resolved. Run `bun install` to update the lockfile.\x1b[0m')
  }
}

// Don't fail on outdated-only — that's informational
if (mismatches.length > 0 && !fix) {
  process.exit(1)
}
