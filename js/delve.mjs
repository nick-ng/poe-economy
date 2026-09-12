import { writeFile } from "node:fs/promises";
import assert from "node:assert";
import { join } from "path";

import {
  fetchPoeNinjaItems,
  getLeague,
  getPoeNinjaItemFetcherByName,
} from "./poe-ninja.mjs";

const lines = [];

const biomes = [
  {
    name: "Abyssal Depths",
    image: "60px-Delve_Biome_Abyssal_Depths.png",
    fossils: ["aberrant", "bound", "gilded", "lucent"],
    depth: 25,
    specialFossil: {
      nodeName: "Crystal Spire",
      fossil: "hollow",
    },
  },
  {
    name: "Frozen Hollow",
    image: "60px-Delve_Biome_Frozen_Hollow.png",
    fossils: ["frigid", "serrated", "prismatic", "sanctified", "shuddering"],
    depth: 30,
    specialFossil: {
      nodeName: "Time-Lost Cavern",
      fossil: "glyphic",
    },
  },
  {
    name: "Fungal Caverns",
    image: "60px-Delve_Biome_Fungal_Caverns.png",
    fossils: ["dense", "aberrant", "opulent", "corroded", "gilded"],
    depth: 20,
    specialFossil: {
      nodeName: "Haunted Tomb",
      fossil: "tangled",
    },
  },
  {
    name: "Magma Fissure",
    image: "60px-Delve_Biome_Magma_Fissure.png",
    fossils: ["scorched", "prismatic", "pristine", "deft", "fundamental"],
    depth: 40,
    specialFossil: {
      nodeName: "Molten Cavity",
      fossil: "faceted",
    },
  },
  {
    name: "Mines",
    image: "60px-Delve_Biome_Mines.png",
    fossils: ["metallic", "serrated", "pristine", "aetheric"],
    depth: 0,
  },
  {
    name: "Petrified Forest",
    image: "60px-Delve_Biome_Petrified_Forest.png",
    fossils: ["bound", "jagged", "corroded", "sanctified"],
    depth: 20,
    specialFossil: {
      nodeName: "Stonewood Hollow",
      fossil: "bloodstained",
    },
  },
  {
    name: "Sulfur Vents",
    image: "60px-Delve_Biome_Sulfur_Vents.png",
    fossils: ["metallic", "opulent", "aetheric", "fundamental"],
    depth: 55,
    specialFossil: {
      nodeName: "Humid Fissure",
      fossil: "fractured",
    },
  },
];

const resonators = [
  {
    id: "primitive-chaotic-resonator",
    name: "Primitive Chaotic Resonator",
    display: "1 socket resonator",
    azurite: 300,
  },
  {
    id: "potent-chaotic-resonator",
    name: "Potent Chaotic Resonator",
    display: "2 socket resonator",
    azurite: 750,
  },
  {
    id: "powerful-chaotic-resonator",
    name: "Powerful Chaotic Resonator",
    display: "3 socket resonator",
    azurite: 3750,
  },
  {
    id: "prime-chaotic-resonator",
    name: "Prime Chaotic Resonator",
    display: "4 socket resonator",
    azurite: -1,
  },
];

const bosses = [
  {
    boss: "Ahuatotli, the Blind",
    wikiUrl: "https://www.poewiki.net/wiki/Ahuatotli,_the_Blind",
    node: "The Grand Architect's Temple",
    image: "50px-The_Grand_Architect's_Temple_delve_node_icon.png",
    drops: [
      {
        item: "Cerberus Limb",
        chance: 0.6,
        type: "UniqueWeapon",
      },
      {
        item: "Doryani's Machinarium",
        chance: 0.16,
        type: "UniqueMap",
      },
      {
        item: "Ahkeli's Mountain",
        chance: 0.08,
        type: "UniqueAccessory",
      },
      {
        item: "Uzaza's Meadow",
        chance: 0.08,
        type: "UniqueAccessory",
      },
      {
        item: "Putembo's Valley",
        chance: 0.08,
        type: "UniqueAccessory",
      },
      { item: "Curiosity", chance: 0.4, type: "UniqueJewel" },
    ],
  },
  {
    boss: "Kurgal, the Blackblooded",
    wikiUrl: "https://www.poewiki.net/wiki/Kurgal,_the_Blackblooded",
    node: "The Lich's Tomb",
    image: "50px-The_Lich's_Tomb_delve_node_icon.png",
    drops: [
      {
        item: "Hale Negator",
        chance: 0.5,
        type: "UniqueArmour",
        notes: "1 socket 40%, 2 socket 10%",
      },
      {
        item: "Command of the Pit",
        chance: 0.2,
        type: "UniqueArmour",
        notes: "1 socket 15%, 2 socket 5%",
      },
      {
        item: "Ahkeli's Valley",
        chance: 0.1,
        type: "UniqueAccessory",
      },
      {
        item: "Uzaza's Mountain",
        chance: 0.1,
        type: "UniqueAccessory",
      },
      {
        item: "Putembo's Meadow",
        chance: 0.1,
        type: "UniqueAccessory",
      },
      { item: "Misery in Darkness", chance: 0.2, type: "DivinationCard" },
      {
        item: "Zorath's Eye of the Inevitable",
        chance: 0.5,
        type: "Fragment",
      },
    ],
  },
  {
    boss: "Aul, the Crystal King",
    wikiUrl: "https://www.poewiki.net/wiki/Aul,_the_Crystal_King",
    node: "The Crystal King's Throne",
    image: "50px-The_Crystal_King's_Throne_delve_node_icon.png",
    drops: [
      { item: "Aul's Uprising", chance: 0.61, type: "UniqueAccessory" },
      { item: "Crown of the Tyrant", chance: 0.15, type: "UniqueArmour" },
      {
        item: "Ahkeli's Meadow",
        chance: 0.08,
        type: "UniqueAccessory",
      },
      {
        item: "Uzaza's Valley",
        chance: 0.08,
        type: "UniqueAccessory",
      },
      {
        item: "Putembo's Mountain",
        chance: 0.08,
        type: "UniqueAccessory",
      },
      {
        item: "Luminous Trove",
        chance: 0.16,
        type: "DivinationCard",
      },
    ],
  },
];

const main = async () => {
  const league = await getLeague();

  const fossilJson = await fetchPoeNinjaItems(
    league.name,
    "Fossil",
  );
  const fossilsPoeNinja = fossilJson.lines.reduce((prev, l) => {
    const item = fossilJson.items.find((i) => i.id === l.id);
    if (!item) {
      console.warn(`couldn't find item for ${l.id}`, l);
      return prev;
    }

    prev[l.id] = { ...l, name: item.name || l.id };

    return prev;
  }, {});

  const resonatorJson = await fetchPoeNinjaItems(
    league.name,
    "Resonator",
  );
  const resonatorsPoeNinja = resonatorJson.lines.reduce((prev, l) => {
    const item = resonatorJson.items.find((i) => i.id === l.id);
    if (!item) {
      console.warn(`couldn't find item for ${l.id}`, l);
      return prev;
    }

    prev[l.id] = { ...l, name: item.name || l.id };

    return prev;
  }, {});

  lines.push(
    "# Delve",
    "",
    "[poewiki](https://www.poewiki.net/wiki/Delve)",
    "",
    `[${league.name} League](https://poe.ninja/poe1/economy/${league.url}/fossils), fetched at ${new Date()}`,
    "",
  );

  const pricedResonators = resonators.map((resonator) => {
    const rPoeNinja = resonatorsPoeNinja[resonator.id];
    const azuritePerChaos = resonator.azurite / rPoeNinja.primaryValue;
    return {
      ...resonator,
      chaosValue: rPoeNinja.primaryValue,
      azuritePerChaos,
      tableLine: `${resonator.display} | ${
        rPoeNinja.primaryValue.toFixed(1)
      }c | ${azuritePerChaos > 0 ? azuritePerChaos.toFixed(1) : "-"}`,
    };
  }).sort((a, b) => a.azuritePerChaos - b.azuritePerChaos);

  lines.push(
    "## Resonators",
    "",
    "Resonator | Chaos | Azurite / Chaos",
    ":- | -: | -:",
    ...pricedResonators.map((resonator) => resonator.tableLine),
    "",
  );

  const pricedBiomes = biomes.map((biome) => {
    const averageFossilValue = biome.fossils.reduce((prev, curr) => {
      const fossilP = fossilsPoeNinja[`${curr}-fossil`];

      return prev + fossilP.primaryValue / biome.fossils.length;
    }, 0);

    const imageUrl =
      `https://raw.githubusercontent.com/nick-ng/poe-economy/refs/heads/main/images/${biome.image}`;
    let tableParts = [
      `![${biome.name}](${imageUrl})`,
      `${averageFossilValue.toFixed(1)}c`,
    ];
    if (biome.specialFossil) {
      const specialFossil =
        fossilsPoeNinja[`${biome.specialFossil.fossil}-fossil`];
      tableParts.push(
        biome.specialFossil.nodeName,
        specialFossil.name,
        `${specialFossil.primaryValue.toFixed(1)}c`,
      );
    } else {
      tableParts.push("-", "-", "-");
    }

    return { ...biome, averageFossilValue, tableLine: tableParts.join(" | ") };
  }).sort((a, b) => a.depth - b.depth);

  lines.push(
    "## Biomes",
    "",
    "Biome | Average Fossil | Exclusive Node | Exclusive Fossil | Exclusive Price",
    ":- | -: | :- | :- | -:",
    ...pricedBiomes.map((biome) => biome.tableLine),
    "",
  );

  lines.push("## Bosses", "");

  for (let i = 0; i < bosses.length; i++) {
    const boss = bosses[i];

    const bossImageUrl =
      `https://raw.githubusercontent.com/nick-ng/poe-economy/refs/heads/main/images/${boss.image}`;
    lines.push(
      `### [${boss.boss}](${boss.wikiUrl})`,
      "",
      `![${boss.boss}](${bossImageUrl})`,
      "",
    );

    let totalExpectedValue = 0;
    const drops = [];
    for (let j = 0; j < boss.drops.length; j++) {
      const drop = boss.drops[j];

      const getItemByName = await getPoeNinjaItemFetcherByName(
        league.name,
        drop.type,
      );

      const item = getItemByName(drop.item);
      if (!item) {
        assert(false, `no item: ${JSON.stringify(drop, null, 2)}`);
      }
      const expectedValue = item.chaosValue * drop.chance;
      totalExpectedValue = totalExpectedValue + item.chaosValue * drop.chance;
      drops.push({
        chaosValue: item.chaosValue,
        expectedValue,
        line: `${drop.item} | ${
          (drop.chance * 100).toFixed(0)
        }% | ${item.chaosValue}c`,
      });
    }

    drops.sort((a, b) => b.chaosValue - a.chaosValue);

    lines.push(
      `Expected Value: ${totalExpectedValue.toFixed(1)}c`,
      "",
      "Item | Chance | Price",
      ":- | -: | -:",
      ...drops.map((d) => d.line),
      "",
    );
  }

  await writeFile(join("wiki-temp", "Delve.md"), lines.join("\n"));
};

main();
