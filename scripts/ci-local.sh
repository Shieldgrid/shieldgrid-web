#!/usr/bin/env bash
set -euo pipefail

echo "==> [1/4] Running typecheck (tsc --noEmit)..."
npx tsc --noEmit

echo "==> [2/4] Building production bundle (npm run build)..."
npm run build

echo "==> [3/4] Checking bundle for exposed secret strings..."
if grep -E -i "secret|jwt_secret|private_key|bearer[[:space:]]+ey" dist/assets/*.js; then
    echo "ERROR: Potential secret string detected in build bundle!"
    exit 1
fi
echo "    Bundle clean."

echo "==> [4/4] Running security audit..."
npm audit || true

echo "==> Shieldgrid Web Local CI Passed! ✨"
