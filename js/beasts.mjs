import { readFile, writeFile } from "node:fs/promises";
import { join } from "path";

import { fetchPoeNinjaItems, getLeague } from "./poe-ninja.mjs";

const lines = [];

// this is designed to be run from the repo's root with `node ./js/beasts.mjs`
const BEASTS_JSON_PATH = join("js", "generated", "beasts.json");
const RED_BEASTS_TXT_PATH = join("js", "red-beasts.txt");

const getBeastsJson = async (beastNames) => {
  try {
    const temp = await readFile(BEASTS_JSON_PATH, { encoding: "utf8" });

    if (temp.length > 0) {
      return JSON.parse(temp);
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      console.error("error reading beast info", e);

      return {};
    }
  }

  // there was no beasts.json so create one
  let redBeastNames = [];
  try {
    const redBeastsRaw = await readFile(RED_BEASTS_TXT_PATH, {
      encoding: "utf8",
    });

    redBeastNames = redBeastsRaw.split("\n").filter((a) => a.trim());
  } catch (e) {
    console.error("error reading red beasts", e);

    return {};
  }

  const redBeasts = redBeastNames.map((n) => {
    const lowerCaseName = n.toLowerCase();
    if (!beastNames.includes(n)) {
      console.warn(`${n} is not in the list of beasts from poe.ninja`);

      return null;
    }

    // look for the first substring that is unique
    let shortest = n;
    for (let start = 0; start < (n.length - 1); start++) {
      for (let end = start + 1; end < n.length; end++) {
        const subStr = lowerCaseName.slice(start, end + 1);
        if (
          !beastNames.some((bn) => {
            const beastNameLowerCase = bn.toLowerCase();
            return beastNameLowerCase !== lowerCaseName &&
              beastNameLowerCase.includes(subStr);
          })
        ) {
          if (
            subStr.trim().length > 3 &&
            subStr.length < shortest.length
          ) {
            shortest = subStr;
          }
        }
      }
    }

    return { beast: n, regex: shortest };
  }).filter((a) => a);

  writeFile(BEASTS_JSON_PATH, JSON.stringify(redBeasts, null, 2));
};

const getBeastRegexes = (beasts, redBeasts, message) => {
  if (beasts.length === 0) {
    return [];
  }

  const tempLines = [];
  tempLines.push(message, "");
  let beastRegexes = [];
  for (let i = 0; i < beasts.length; i++) {
    const currentBeast = beasts[i];
    const temp = redBeasts.find((rb) => rb.beast === currentBeast.name);
    if (temp) {
      if (beastRegexes.join("|").length + temp.regex.length + 1 > 100) {
        tempLines.push("```", beastRegexes.join("|"), "```", "");
        beastRegexes = [temp.regex];
      } else {
        beastRegexes.push(temp.regex);
      }
    }
  }

  tempLines.push("```", beastRegexes.join("|"), "```");

  return tempLines;
};

const main = async () => {
  const league = await getLeague();

  const resJson = await fetchPoeNinjaItems(league.name, "Beast");

  const beastNames = resJson.lines.map((a) => a.name);

  lines.push(
    "# Beasts",
    "",
    `[${league.name} League](https://poe.ninja/poe1/economy/${league.url}/beasts), fetched at ${new Date()}`,
    "",
  );

  const redBeasts = await getBeastsJson(beastNames);
  const redBeastNames = redBeasts.map((r) => r.beast);

  const yellowBeastsPrices = [];
  const redBeastPrices = [];
  for (let i = 0; i < resJson.lines.length; i++) {
    const beast = resJson.lines[i];

    if (redBeastNames.includes(beast.name)) {
      redBeastPrices.push(beast);
    } else {
      yellowBeastsPrices.push(beast);
    }
  }

  yellowBeastsPrices.sort((a, b) => b.chaosValue - a.chaosValue);
  const yellowBeastMedian =
    yellowBeastsPrices[Math.floor(yellowBeastsPrices.length / 2)].chaosValue;

  lines.push(`Yellow Beasts: ${yellowBeastMedian}c`, "");

  const expensiveBeasts = redBeastPrices.filter((r) =>
    r.chaosValue >= yellowBeastMedian
  );

  lines.push(...getBeastRegexes(
    expensiveBeasts,
    redBeasts,
    `\nKeep (${yellowBeastMedian}c+)`,
  ));

  const borderlineBeasts = redBeastPrices.filter((r) =>
    r.chaosValue < yellowBeastMedian && r.chaosValue >= yellowBeastMedian / 2
  );

  lines.push(...getBeastRegexes(
    borderlineBeasts,
    redBeasts,
    `\nBorderline (${yellowBeastMedian / 2}c+)`,
  ));

  const cheapBeasts = redBeastPrices.filter((r) =>
    r.chaosValue < yellowBeastMedian / 2
  );
  lines.push(...getBeastRegexes(
    cheapBeasts,
    redBeasts,
    `\nTrash (under ${yellowBeastMedian / 2}c)`,
  ));

  await writeFile(join("md-fragments", "BEASTS.md"), lines.join("\n"));
};

main();
