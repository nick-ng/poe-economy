import { writeFile } from "node:fs/promises";
import { join } from "path";

import { fetchPoeNinjaItems, getLeague } from "./poe-ninja.mjs";

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
    node: "The Grand Architect's Temple",
    image: "50px-The_Grand_Architect's_Temple_delve_node_icon.png",
    drops: [
      { item: "Cerberus Limb", chance: 0.6, type: "", market: "" },
      { item: "Doryani's Machinarium", chance: 0.16, type: "", market: "" },
      { item: "Ahkeli's Mountain", chance: 0.08, type: "", market: "" },
      { item: "Uzaza's Medow", chance: 0.08, type: "", market: "" },
      { item: "Putembo's Valley", chance: 0.08, type: "", market: "" },
      { item: "Curiosity", chance: 0.4, type: "", market: "" },
    ],
  },
  {
    boss: "Kurgal, the Blackblooded",
    node: "The Lich's Tomb",
    image: "50px-The_Lich's_Tomb_delve_node_icon.png",
    drops: [
      {
        item: "Hale Negator",
        chance: 0.5,
        type: "",
        market: "",
        notes: "1 socket 40%, 2 socket 10%",
      },
      {
        item: "Command of the Pit",
        chance: 0.2,
        type: "",
        market: "",
        notes: "1 socket 15%, 2 socket 5%",
      },
      { item: "Ahkeli's Valley", chance: 0.1, type: "", market: "" },
      { item: "Uzaza's Mountain", chance: 0.1, type: "", market: "" },
      { item: "Putembo's Meadow", chance: 0.1, type: "", market: "" },
      { item: "Misery in Darkness", chance: 0.2, type: "", market: "" },
      {
        item: "Zorath's Eye of the Inevitable",
        chance: 0.5,
        type: "",
        market: "",
      },
    ],
  },
  {
    boss: "Aul, the Crystal King",
    node: "The Crystal King's Throne",
    image: "50px-The_Crystal_King's_Throne_delve_node_icon.png",
    drops: [
      { item: "Aul's Uprising", chance: 0.61, type: "", market: "" },
      { item: "Crown of the Tyrant", chance: 0.15, type: "", market: "" },
      { item: "Ahkeli's Meadow", chance: 0.08, type: "", market: "" },
      { item: "Uzaza's Valley", chance: 0.08, type: "", market: "" },
      { item: "Putembo's Mountain", chance: 0.08, type: "", market: "" },
      { item: "Luminous Trove", chance: 0.16, type: "", market: "" },
    ],
  },
];

const main = async () => {
  const league = await getLeague();

  const fossilJson = await fetchPoeNinjaItems(
    league.name,
    "Fossil",
    "exchange",
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
    "exchange",
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

  // console.log("Fossils", fossilsPoeNinja);
  // console.log("Resonators", resonatorsPoeNinja);

  lines.push(
    "# Delve",
    "",
    `[${league.name} League](https://poe.ninja/poe1/economy/${league.url}/fossils), fetched at ${new Date()}`,
    "",
  );

  const pricedResonators = resonators.map((r) => {
    const rPoeNinja = resonatorsPoeNinja[r.id];
    const azuritePerChaos = r.azurite / rPoeNinja.primaryValue;
    return {
      ...r,
      chaosValue: rPoeNinja.primaryValue,
      azuritePerChaos,
      tableLine: `${r.display} | ${rPoeNinja.primaryValue.toFixed(1)}c | ${
        azuritePerChaos > 0 ? azuritePerChaos.toFixed(1) : "-"
      }`,
    };
  }).sort((a, b) => a.azuritePerChaos - b.azuritePerChaos);

  lines.push(
    "## Resonators",
    "",
    "Resonator | Chaos | Azurite / Chaos",
    ":- | -: | -:",
    ...pricedResonators.map((r) => r.tableLine),
    "",
  );

  const pricedBiomes = biomes.map((b) => {
    const averageFossilValue = b.fossils.reduce((prev, curr) => {
      const fossilP = fossilsPoeNinja[`${curr}-fossil`];

      return prev + fossilP.primaryValue / b.fossils.length;
    }, 0);

    const imageUrl =
      `https://raw.githubusercontent.com/nick-ng/poe-economy/refs/heads/main/images/${b.image}`;
    let tableParts = [
      `![${b.name}](${imageUrl})`,
      `${averageFossilValue.toFixed(1)}c`,
    ];
    if (b.specialFossil) {
      const specialFossil = fossilsPoeNinja[`${b.specialFossil.fossil}-fossil`];
      tableParts.push(
        b.specialFossil.nodeName,
        specialFossil.name,
        `${specialFossil.primaryValue.toFixed(1)}c`,
      );
    } else {
      tableParts.push("-", "-", "-");
    }

    return { ...b, averageFossilValue, tableLine: tableParts.join(" | ") };
  }).sort((a, b) => a.depth - b.depth);

  lines.push(
    "## Biomes",
    "",
    "Biome | Average Fossil | Exclusive Node | Exclusive Fossil | Exclusive Price",
    ":- | -: | :- | :- | -:",
    ...pricedBiomes.map((b) => b.tableLine),
    "",
  );

  lines.push("## Bosses", "", "WIP");

  await writeFile(join("wiki-temp", "Delve.md"), lines.join("\n"));
};

main();
