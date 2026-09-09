import assert from "node:assert";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "path";

const POE_NINJA_URL = "https://poe.ninja";
const CACHE_DIR = join("js", "temp");
const CACHE_MAX_AGE_MS = 1000 * 60 * 5; // 5 minutes

const cache = {};
const LEAGUE_KEY = "poe1-league-name";

/**
 * Gets the current standard challenge league
 */
export async function getLeague() {
  const url = [POE_NINJA_URL, "poe1", "api", "data", "index-state"].join("/");
  let resJson = {};
  if (cache[LEAGUE_KEY]) {
    resJson = cache[LEAGUE_KEY];
  } else {
    const fileCache = await loadJson(LEAGUE_KEY);
    if (fileCache && (fileCache.fetchedAt + CACHE_MAX_AGE_MS) > (Date.now())) {
      resJson = fileCache.body;
      cache[LEAGUE_KEY] = resJson;
    } else {
      const res = await fetch(url);
      let resText = await res.text();
      try {
        resJson = JSON.parse(resText);
        cache[LEAGUE_KEY] = resJson;
        await saveJson(LEAGUE_KEY, resJson, url);
      } catch (e) {
        console.error(resText);
        console.error("error parsing response", err);
      }
    }
  }

  const temp = resJson.economyLeagues.filter((l) => {
    const leagueName = l.name.toLowerCase();
    if (leagueName === "standard") {
      return false;
    }

    if (leagueName.includes("hardcore")) {
      return false;
    }

    return true;
  });

  if (temp.length !== 1) {
    console.warn(`${temp.length} leagues found. Expected 1`);
    temp.forEach((t) => {
      console.info(t.displayName, t.uri);
    });
  }
  if (temp.length < 1) {
    console.warn("Error, no economy league found");
    const rl = readlineCreateInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const leagueName = await rl.question(
      "Go to https://poe.ninja and enter the league's uri. It should be one word with no / characters",
    );

    assert(leagueName, "Couldn't get league name and no league name provided");

    return {
      name: leagueName,
      url: leagueName,
      displayName: leagueName,
    };
  }

  return temp[0];
}

/**
 * @param {string} leagueName
 * @param {string} type e.g. "SkillGem", "Beast"
 */
export async function fetchPoeNinjaItems(leagueName, type) {
  const url = [
    POE_NINJA_URL,
    "poe1",
    "api",
    "economy",
    "stash",
    "current",
    "item",
    `overview?league=${leagueName}&type=${type}`,
  ].join("/");

  const cacheKey = `${leagueName}-${type}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  } else {
    const fileCache = await loadJson(cacheKey);
    if (fileCache && (fileCache.fetchedAt + CACHE_MAX_AGE_MS) > (Date.now())) {
      cache[cacheKey] = fileCache.body;
      return fileCache.body;
    }
    const res = await fetch(url);
    const resText = await res.text();

    try {
      const resJson = JSON.parse(resText);
      await saveJson(cacheKey, resJson, url);
      cache[cacheKey] = resJson;

      return resJson;
    } catch (e) {
      console.error("response", resText);
      console.error("error parsing response", e);
    }
  }

  return false;
}

async function loadJson(filename) {
  try {
    const temp = await readFile(join(CACHE_DIR, `${filename}.json`), {
      encoding: "utf8",
    });
    if (temp.length > 0) {
      return JSON.parse(temp);
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      console.error("error reading beast info", e);

      throw e;
    }

    return {};
  }
}

/**
 * @param {string} filename
 * @param {Object} body object to be serialsed and saved to disk
 */
function saveJson(filename, body, url = "") {
  return writeFile(
    join(CACHE_DIR, `${filename}.json`),
    JSON.stringify({ body, fetchedAt: Date.now(), url }),
  );
}
