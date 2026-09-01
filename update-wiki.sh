#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

cd "$(dirname $0)"

git clone --quiet "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.wiki.git" wiki-temp

ls wiki-temp

node ./js/lab-gems.mjs
node ./js/beasts.mjs
node ./js/forbidden-jewels.mjs

cd wiki-temp

ls

git config user.email nick-ng@users.noreply.github.com
git config user.name "${GITHUB_ACTOR}"

git add -A

git commit -m "chore: auto update - $(date)"

if git diff --cached --quiet; then
  echo "Wiki already up to date."
  exit 0
fi

git push --quiet

echo "Published to https://github.com/${repository}/wiki"
