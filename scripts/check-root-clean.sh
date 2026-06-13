#!/bin/bash
# Verifies no .sql or stray .md files are at the repo root.
# Usage: bash scripts/check-root-clean.sh
# Add to CI or pre-commit hook.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
errors=0

# Check for .sql files at root
sql_files=$(find "$REPO_ROOT" -maxdepth 1 -name "*.sql" 2>/dev/null)
if [ -n "$sql_files" ]; then
  echo "ERROR: .sql files found at repo root (move to /database/):"
  echo "$sql_files"
  errors=$((errors + 1))
fi

# Check for unexpected .md files at root (README.md and CLAUDE.md are allowed)
md_files=$(find "$REPO_ROOT" -maxdepth 1 -name "*.md" ! -name "README.md" ! -name "CLAUDE.md" 2>/dev/null)
if [ -n "$md_files" ]; then
  echo "ERROR: .md files found at repo root (move to /docs/):"
  echo "$md_files"
  errors=$((errors + 1))
fi

if [ $errors -eq 0 ]; then
  echo "OK: repo root is clean."
  exit 0
else
  exit 1
fi
