/**
 * Version checker for the monorepo.
 *
 * - Detects version mismatches: same external dep with different ranges across workspaces.
 * - Reports outdated packages via `bun outdated`.
 *
 * Usage:
 *   bun scripts/check-versions.ts              # Both checks (pre-commit)
 *   bun scripts/check-versions.ts --mismatch   # Mismatch only (fast)
 *   bun scripts/check-versions.ts --json       # JSON output (for Claude hook)
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')

interface PackageJson {
  name?: string
  workspaces?: string[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface Mismatch {
  package: string
  versions: Record<string, string[]> // versionRange -> workspaceNames[]
}

interface OutdatedEntry {
  name: string
  current: string
  latest: string
}

// --- Workspace discovery ---

function getWorkspacePackageJsonPaths(): string[] {
  const rootPkgPath = join(ROOT, 'package.json')
  const rootPkg: PackageJson = JSON.parse(readFileSync(rootPkgPath, 'utf-8'))
  const paths = [rootPkgPath]

  for (const pattern of rootPkg.workspaces ?? []) {
    // patterns like "apps/*" or "packages/*"
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
      // Skip internal workspace deps
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
        entries.push({ name, current, latest })
      }
    }

    return entries
  } catch {
    return []
  }
}

// --- Main ---

const args = new Set(Bun.argv.slice(2))
const jsonOutput = args.has('--json')
const mismatchOnly = args.has('--mismatch')
const runBoth = !mismatchOnly

let exitCode = 0

// Mismatch check (always runs)
const mismatches = checkMismatches()
if (mismatches.length > 0) {
  exitCode = 1
}

// Outdated check (skip with --mismatch)
const outdated = runBoth ? checkOutdated() : []

// Output
if (jsonOutput) {
  const result: Record<string, unknown> = {
    status: exitCode === 0 ? 'pass' : 'fail',
  }
  if (mismatches.length > 0) {
    result.mismatches = mismatches
  }
  if (outdated.length > 0) {
    result.outdated = outdated
  }
  console.log(JSON.stringify({ versionCheck: result }))
} else {
  if (mismatches.length > 0) {
    console.log('\x1b[31m✗ VERSION MISMATCHES:\x1b[0m')
    for (const m of mismatches) {
      console.log(`  ${m.package}`)
      for (const [range, workspaces] of Object.entries(m.versions)) {
        console.log(`    ${range.padEnd(16)} ${workspaces.join(', ')}`)
      }
    }
    console.log()
  }

  if (outdated.length > 0) {
    console.log('\x1b[33m⚠ OUTDATED PACKAGES:\x1b[0m')
    for (const entry of outdated) {
      const name = entry.name.padEnd(24)
      console.log(`  ${name} ${entry.current} → ${entry.latest}`)
    }
    console.log()
  }

  if (mismatches.length === 0 && outdated.length === 0) {
    console.log('\x1b[32m✓ All dependency versions are consistent and up to date.\x1b[0m')
  } else if (mismatches.length === 0) {
    console.log('\x1b[32m✓ No version mismatches.\x1b[0m')
  }
}

process.exit(exitCode)
