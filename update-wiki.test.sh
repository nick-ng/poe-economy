#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

cd "$(dirname $0)"

mkdir -p ./js/temp
mkdir -p ./wiki-temp

node ./js/lab-gems.mjs
node ./js/beasts.mjs
node ./js/forbidden-jewels.mjs

echo "Test: Published wiki"
