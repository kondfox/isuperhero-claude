#!/usr/bin/env bash
# Playwright UI verification hook — runs after PostToolUse on Edit/Write.
# Only fires when the modified file is inside apps/web/.
# Runs Playwright smoke test and injects result into Claude's context.

set -euo pipefail

INPUT=$(cat)
ROOT="/Users/kond/kondfox/isuperhero-claude"

# Extract the file path from the hook payload
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty' 2>/dev/null || true)
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null || true)

# Only run when a web app file was modified
if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" != *"apps/web"* ]]; then
  exit 0
fi

# Only run if Playwright is available and the dev server might be running
if ! command -v bunx &>/dev/null; then
  exit 0
fi

# Check if the dev server is running on port 5173 (Vite default)
if ! curl -s --max-time 1 http://localhost:5173 &>/dev/null; then
  # Dev server not running — skip silently
  exit 0
fi

# Run Playwright smoke test
cd "$ROOT"
RESULT=$(bunx playwright test --reporter=line --timeout=10000 apps/web/e2e/smoke.spec.ts 2>&1 || true)

if echo "$RESULT" | grep -q "passed"; then
  echo '{"playwright": {"status": "pass", "message": "UI smoke tests passed after edit."}}'
elif echo "$RESULT" | grep -q "failed\|error"; then
  ESCAPED=$(echo "$RESULT" | tail -20 | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"playwright\": {\"status\": \"fail\", \"message\": \"UI smoke test failed after editing ${FILE_PATH}\", \"output\": \"${ESCAPED}\"}}"
fi
