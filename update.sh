#!/bin/bash

mkdir -p temp


echo "" > README.md

node ./js/lab-gems.mjs


cat ./md-fragments/readme-footer.md >> README.md

# git add ./md-fragments/
# git add README.md
# git commit -m "chore: auto update - $(date)"
# git push
