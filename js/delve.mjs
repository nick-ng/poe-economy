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
  },
  {
    name: "Frozen Hollow",
    image: "60px-Delve_Biome_Frozen_Hollow.png",
    fossils: ["frigid", "serrated", "prismatic", "sanctified", "shuddering"],
    depth: 30,
  },
  {
    name: "Fungal Caverns",
    image: "60px-Delve_Biome_Fungal_Caverns.png",
    fossils: ["dense", "aberrant", "opulent", "corroded", "gilded"],
    depth: 20,
  },
  {
    name: "Magma Fissure",
    image: "60px-Delve_Biome_Magma_Fissure.png",
    fossils: ["scorched", "prismatic", "pristine", "deft", "fundamental"],
    depth: 40,
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
  },
  {
    name: "Sulfur Vents",
    image: "60px-Delve_Biome_Sulfur_Vents.png",
    fossils: ["metallic", "opulent", "aetheric", "fundamental"],
    depth: 55,
  },
];

const main = async () => {
  const league = await getLeague();
  console.log("league.name", league.name);

  const fossilJson = await fetchPoeNinjaItems(
    league.name,
    "Fossil",
    "exchange",
  );
  const fossils = fossilJson.lines.reduce((prev, l) => {
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
  const resonators = resonatorJson.lines.reduce((prev, l) => {
    const item = resonatorJson.items.find((i) => i.id === l.id);
    if (!item) {
      console.warn(`couldn't find item for ${l.id}`, l);
      return prev;
    }

    prev[l.id] = { ...l, name: item.name || l.id };

    return prev;
  }, {});

  console.log("Fossils", fossils);
  console.log("Resonators", resonators);

  lines.push(
    "# Delve",
    "",
    `[${league.name} League](https://poe.ninja/poe1/economy/${league.url}/fossils), fetched at ${new Date()}`,
    "",
  );
};

main();
