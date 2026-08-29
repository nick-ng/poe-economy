#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

echo "update started at $(date)"

cd "$(dirname $0)"

mkdir -p temp

node ./js/lab-gems.mjs
node ./js/beasts.mjs
node ./js/forbidden-jewels.mjs

git add ./md-fragments/
git commit -m "chore: auto update - $(date)"
git push

echo "update ended at $(date)"
