import { writeFile } from "node:fs/promises";
import { join } from "path";

import { fetchPoeNinjaItems, getLeague } from "./poe-ninja.mjs";
import notableIds from "./forbidden-flesh-flame.json" with { type: "json" };

const lines = [];

const MAX_EFFECT_LENGTH = 30;

const getTradeUrl = (name, variant, league) => {
  const notableId = notableIds.find((n) => n.notable === name)?.id;

  if (!notableId) {
    console.error("couldn't find notable id", name, variant);
    return "";
  }

  const qObject = {
    "query": {
      "filters": {},
      "status": { "option": "securable" }, // "Instant Buyout"
      "stats": [{
        "type": "and",
        "filters": [{
          disabled: variant === "Forbidden Flesh",
          "id": "explicit.stat_2460506030",
          "value": { "option": notableId.toString() },
        }, {
          disabled: variant === "Forbidden Flame",
          "id": "explicit.stat_1190333629",
          "value": { "option": notableId.toString() },
        }],
      }],
    },
  };

  const search = new URLSearchParams({
    q: JSON.stringify(qObject),
  });

  return `https://www.pathofexile.com/trade/search/${league}?${search.toString()}`;
};

const main = async () => {
  const league = await getLeague();
  // https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=Allflame&type=ForbiddenJewel
  const resJson = await fetchPoeNinjaItems(league.name, "ForbiddenJewel");

  const ascendancies = {};
  const notables = {};

  resJson.lines.forEach((l) => {
    const baseClass = l.metadata.baseClass;
    let ascendancy = l.metadata.ascendancy;
    if (
      [
        "Fatal Flourish",
        "Fury of Nature",
        "Harness the Void",
        "Indomitable Resolve",
        "Nine Lives",
        "Searing Purity",
        "Unleashed Potential",
      ].includes(l.name)
    ) {
      ascendancy = "!Hidden";
    }

    if (!notables[l.name]) {
      notables[l.name] = {};
    }
    const notableEffect = notableIds.find((n) => n.notable === l.name)?.effect;

    notables[l.name][l.variant] = {
      ...l,
      baseClass: l.metadata.baseClass,
      ascendancy: l.metadata.ascendency,
      tradeUrl: getTradeUrl(l.name, l.variant, league.name),
      effect: notableEffect || "",
    };
    if (!ascendancies[baseClass]) {
      ascendancies[baseClass] = {};
    }

    if (!ascendancies[baseClass][ascendancy]) {
      ascendancies[baseClass][ascendancy] = new Set();
    }

    ascendancies[baseClass][ascendancy].add(l.name);
  });

  lines.push(
    "# Forbidden Jewels",
    "",
    "For builds that want Forbidden jewels of their own ascendancy, this can help you find the cheapest set to buy",
    "",
    "Click on the price to open the trade site",
    "",
  );
  Object.keys(ascendancies).sort((a, b) => a.localeCompare(b)).forEach(
    (baseClass) => {
      lines.push(`## ${baseClass}`);
      Object.keys(ascendancies[baseClass]).sort((a, b) => a.localeCompare(b))
        .forEach((as) => {
          lines.push(
            "",
            `### ${as === "!Hidden" ? "Hidden" : as}`,
            "",
            "| Notable | Flesh | Flame | Total |",
            "| :- | -: | -: | -: |",
          );
          [...ascendancies[baseClass][as]].map((n) => {
            const flesh = notables[n]["Forbidden Flesh"];
            const flame = notables[n]["Forbidden Flame"];

            return {
              notable: n,
              fleshChaosValue: flesh.chaosValue,
              fleshUrl: flesh.tradeUrl,
              flameChaosValue: flame.chaosValue,
              flameUrl: flame.tradeUrl,
              totalChaosValue: flesh.chaosValue + flame.chaosValue,
              effect: flesh.effect,
              // effect: flesh.effect.length < MAX_EFFECT_LENGTH
              //   ? flesh.effect
              //   : `${flesh.effect.slice(0, MAX_EFFECT_LENGTH - 1)}…`,
            };
          }).sort((a, b) => a.totalChaosValue - b.totalChaosValue).forEach(
            (p) => {
              lines.push(
                `| [${p.notable}](https://www.poewiki.net/wiki/${
                  p.notable.replaceAll(" ", "_")
                } "${p.effect}") | [${
                  p.fleshChaosValue.toFixed(1)
                }c](${p.fleshUrl}) | [${
                  p.flameChaosValue.toFixed(1)
                }c](${p.flameUrl}) | ${p.totalChaosValue.toFixed(1)}c |`,
              );
            },
          );
        });
    },
  );

  lines.push("");

  await writeFile(
    join("md-fragments", "FORBIDDEN_JEWELS.md"),
    lines.join("\n"),
  );
};

main();
