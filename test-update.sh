#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

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
