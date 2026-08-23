#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

echo "update started at $(date)"

mkdir -p temp

echo "" > README.md

node ./js/lab-gems.mjs
cat ./md-fragments/LAB_GEMS.md >> README.md
echo "" >> README.md
echo "" >> README.md

node ./js/beasts.mjs
cat ./md-fragments/BEASTS.md >> README.md
echo "" >> README.md
echo "" >> README.md

cat ./md-fragments/readme-footer.md >> README.md

git add ./md-fragments/
git add README.md
git commit -m "chore: auto update - $(date)"
git push

echo "update ended at $(date)"
