import { writeFile } from "node:fs/promises";
import { join } from "path";

import { fetchPoeNinjaItems, getLeague } from "./poe-ninja.mjs";
import notableIds from "./forbidden-flesh-flame.json" with { type: "json" };

const lines = [];

const DIVINE_THRESHOLD = 1.5;

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
          disabled: variant === "Forbidden Flame",
          "id": `explicit.stat_2460506030|${notableId}`,
        }, {
          disabled: variant === "Forbidden Flesh",
          "id": `explicit.stat_1190333629|${notableId}`,
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

  const poeNinjaUrl =
    `https://poe.ninja/poe1/economy/${league.url}/forbidden-jewels`;

  lines.push(
    "# Forbidden Jewels",
    "",
    `[${league.name} League](${poeNinjaUrl}), fetched at ${new Date()}`,
    "",
    "For builds that want Forbidden jewels of their own ascendancy, this can help you find the cheapest set to buy",
    "",
    "Hover over the Notable's name to see the effect",
    "",
  );
  Object.keys(ascendancies).sort((a, b) => a.localeCompare(b)).forEach(
    (baseClass) => {
      lines.push(`## ${baseClass}`);
      Object.keys(ascendancies[baseClass]).sort((a, b) => a.localeCompare(b))
        .forEach((as) => {
          lines.push(
            "",
            `### ${
              as === "!Hidden"
                ? "Hidden"
                : `[${as}](${poeNinjaUrl}?${
                  (new URLSearchParams({ ascendancy: as })).toString()
                })`
            }`,
            "",
            "| Notable | Flesh | Flame | Total |",
            "| :- | -: | -: | -: |",
          );
          [...ascendancies[baseClass][as]].map((n) => {
            const flesh = notables[n]["Forbidden Flesh"];
            const flame = notables[n]["Forbidden Flame"];

            const jewelPoeNinjaUrl = `${poeNinjaUrl}?${
              (new URLSearchParams({ name: n })).toString()
            }`;

            if (!flesh || !flame) {
              return {
                notable: n,
                fleshChaosValue: -1,
                fleshDivineValue: -1,
                fleshPriceString: "???",
                fleshUrl: jewelPoeNinjaUrl,
                flameChaosValue: -1,
                flameDivineValue: -1,
                flamePriceString: "???",
                flameUrl: jewelPoeNinjaUrl,
                effect: flesh.effect,
                totalPriceString: "???",
                poeNinjaUrl: jewelPoeNinjaUrl,
              };
            }

            return {
              notable: n,
              fleshChaosValue: flesh.chaosValue,
              fleshDivineValue: flesh.divineValue,
              fleshPriceString: flesh.divineValue >= DIVINE_THRESHOLD
                ? `**${flesh.divineValue.toFixed(1)} d**`
                : `${flesh.chaosValue.toFixed(1)} c`,
              fleshUrl: flesh.tradeUrl,
              flameChaosValue: flame.chaosValue,
              flameDivineValue: flame.divineValue,
              flamePriceString: flame.divineValue >= DIVINE_THRESHOLD
                ? `**${flame.divineValue.toFixed(1)} d**`
                : `${flame.chaosValue.toFixed(1)} c`,
              flameUrl: flame.tradeUrl,
              effect: flesh.effect,
              totalPriceString:
                (flesh.divineValue + flame.divineValue) >= DIVINE_THRESHOLD
                  ? `**${
                    (flesh.divineValue + flame.divineValue).toFixed(1)
                  } d**`
                  : `${(flesh.chaosValue + flame.chaosValue).toFixed(1)} c`,
              poeNinjaUrl: jewelPoeNinjaUrl,
            };
          }).sort((a, b) =>
            (b.fleshChaosValue + b.flameChaosValue) -
            (a.fleshChaosValue + a.flameChaosValue)
          ).forEach(
            (p) => {
              lines.push(
                `| [${p.notable}](https://www.poewiki.net/wiki/${
                  p.notable.replaceAll(" ", "_")
                } "${p.effect}") | [${p.fleshPriceString}](${p.fleshUrl}) | [${p.flamePriceString}](${p.flameUrl}) | [${p.totalPriceString}](${p.poeNinjaUrl}) |`,
              );
            },
          );
        });
    },
  );

  lines.push("");

  await writeFile(
    join("wiki-temp", "Forbidden_Jewels.md"),
    lines.join("\n"),
  );
};

main();
