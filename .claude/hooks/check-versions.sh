#!/usr/bin/env bash
# Version checker hook — runs after PostToolUse on Edit/Write.
# Only fires when the modified file is a package.json.
# Runs mismatch check and injects result into Claude's context.

set -euo pipefail

INPUT=$(cat)
ROOT="/Users/kond/kondfox/isuperhero-claude"

# Extract the file path from the hook payload
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty' 2>/dev/null || true)
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null || true)

# Only run when a package.json was modified
if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" != *"package.json"* ]]; then
  exit 0
fi

# Run mismatch check only (fast, no network call)
cd "$ROOT"
RESULT=$(~/.bun/bin/bun scripts/check-versions.ts --mismatch --json 2>&1 || true)

echo "$RESULT"
