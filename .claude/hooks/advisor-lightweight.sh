#!/usr/bin/env bash
# Lightweight agentic advisor — runs after every Claude Stop event.
# Reads hook payload from stdin, outputs advisory JSON to stdout
# which gets injected into Claude's next context window.

set -euo pipefail

INPUT=$(cat)
ROOT="/Users/kond/kondfox/isuperhero-claude"

advisories=()

# 1. Check for source files missing a corresponding test file
if [ -d "$ROOT/packages/game-logic/src" ]; then
  while IFS= read -r -d '' src_file; do
    base=$(basename "$src_file" .ts)
    dir=$(dirname "$src_file")
    test_file="$dir/$base.test.ts"
    spec_file="$dir/$base.spec.ts"
    if [[ "$base" != *.test && "$base" != *.spec ]] && \
       [ ! -f "$test_file" ] && [ ! -f "$spec_file" ]; then
      advisories+=("Untested file: ${src_file#$ROOT/}")
    fi
  done < <(find "$ROOT/packages/game-logic/src" -name "*.ts" -not -name "*.d.ts" -print0 2>/dev/null)
fi

# 2. Count TODO/FIXME comments accumulating in source
todo_count=0
if command -v grep &>/dev/null; then
  todo_count=$(grep -r --include="*.ts" --include="*.tsx" -l "TODO\|FIXME\|HACK\|XXX" "$ROOT/apps" "$ROOT/packages" 2>/dev/null | wc -l | tr -d ' ')
fi
if [ "$todo_count" -gt 5 ]; then
  advisories+=("${todo_count} files contain TODO/FIXME comments — consider resolving before adding more features")
fi

# 3. Check if CLAUDE.md was updated recently (within last 7 days)
if [ -f "$ROOT/CLAUDE.md" ]; then
  last_modified=$(find "$ROOT/CLAUDE.md" -mtime +7 2>/dev/null | wc -l | tr -d ' ')
  if [ "$last_modified" -gt 0 ]; then
    advisories+=("CLAUDE.md has not been updated in over 7 days — review if it reflects current patterns")
  fi
fi

# 4. Check for any .ts files in apps/ that import directly from relative paths crossing package boundaries
# (should use workspace package names instead)
cross_pkg=$(grep -r --include="*.ts" --include="*.tsx" -l "\.\./\.\./packages\|\.\.\/packages" "$ROOT/apps" 2>/dev/null | wc -l | tr -d ' ')
if [ "$cross_pkg" -gt 0 ]; then
  advisories+=("${cross_pkg} files use relative cross-package imports — use workspace package names instead (e.g. '@isuperhero/types')")
fi

# Build output JSON
if [ ${#advisories[@]} -eq 0 ]; then
  echo '{"advisor": {"status": "ok", "message": "No issues detected."}}'
else
  # Encode array as JSON
  json_items=""
  for item in "${advisories[@]}"; do
    escaped=$(echo "$item" | sed 's/"/\\"/g')
    json_items="${json_items}\"${escaped}\","
  done
  json_items="${json_items%,}"
  echo "{\"advisor\": {\"status\": \"warn\", \"issues\": [${json_items}]}}"
fi
