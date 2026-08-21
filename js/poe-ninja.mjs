import assert from "node:assert";

const POE_NINJA_URL = "https://poe.ninja";

/**
 * Gets the current standard challenge league
 */
export async function getLeague() {
  const url = [POE_NINJA_URL, "poe1", "api", "data", "index-state"].join("/");
  console.log("getLeague url", url);
  const res = await fetch(url);
  let resText = await res.text();
  let resJson = {};
  try {
    resJson = JSON.parse(resText);
  } catch (e) {
    console.error(resText);
    console.error("error parsing response", err);
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

  const res = await fetch(url);
  const resText = await res.text();
  let resJson = {};

  try {
    resJson = JSON.parse(resText);

    return resJson;
  } catch (e) {
    console.log("url", url);
    console.error("response", resText);
    console.error("error parsing response", e);
  }

  return false;
}
