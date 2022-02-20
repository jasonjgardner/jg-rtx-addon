const { join } = require("path");
const { readFile, readJson, pathExists } = require("fs-extra");
//const { getColorFromURL } = require('color-thief-node')
const { DIR_SRC, PACK_NS } = require("./util.js");

// const getMapColor = async (texturePath) => {
//   const palette = await getColorFromURL(
//     (await readFile(join(DIR_SRC, texturePath))).toString("base64")
//   );

//   return palette
// }

const guessCategory = (texture) => {
  const blockName = texture.toLowerCase();
  let category = "construction";
  let creativeCategory = "concrete";

  if (blockName.includes("brick") || blockName.includes("stonebrick")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.stoneBrick",
    };
  }

  if (
    blockName.includes("stone") ||
    blockName.includes("gravel") ||
    blockName.includes("marble")
  ) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.stone",
    };
  }

  if (blockName.includes("tile")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.glazedTerracotta",
    };
  }

  if (blockName.includes("planks")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.planks",
    };
  }

  if (blockName.includes("copper") || blockName.includes("metal")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.copper",
    };
  }

  if (blockName.includes("netherrack")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.netherWartBlock",
    };
  }

  if (blockName.includes("glass")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.glass",
    };
  }

  if (blockName.includes("leaves") || blockName.includes("leaf")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.leaves",
    };
  }

  if (blockName.includes("wood") || blockName.includes("wooden")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.wood",
    };
  }

  if (blockName.includes("wool") || blockName.includes("fabric")) {
    return {
      category: "construction",
      creative_category: "itemGroup.name.wool",
    };
  }

  return {
    category: "construction",
    creative_category: "itemGroup.name.concrete",
  };
};

const getDefaultBlock = async (color, base) => {
  const components = {
    "minecraft:flammable": {
      burn_odds: 0,
      flame_odds: 0,
    },
    "minecraft:destroy_time": 1,
    "minecraft:friction": 0.6,
    "minecraft:creative_category": guessCategory(base),
  };

  // try {
  //   components["minecraft:map_color"] = await getMapColor(`${base}.png`);
  // } catch (err) {
  //   console.warn("Can not load block dominant color: %s", err);
  // }

  return {
    format_version: "1.16.100",
    "minecraft:block": {
      description: {
        identifier: `${PACK_NS}:${color}`,
        is_experimental: false,
        register_to_creative_menu: true,
      },
      components,
    },
  };
};

const getBlockData = async (color, base) => {
  const blockFile = join(DIR_SRC, `/static/BP/blocks/${color}.json`);

  return {
    ...(await getDefaultBlock(color, base)),
    ...((await pathExists(blockFile)) ? await readJson(blockFile) : {}),
  };
};

const getBlockList = async () =>
  JSON.parse(await readFile(join(DIR_SRC, "/static/RP/blocks.json")));

const getExistingBlockNames = async () => [
  ...new Set(
    (await readFile(join(DIR_SRC, "/static/RP/texts/en_US.lang")))
      .toString()
      .split(/(\n|\r)+/)
      .filter((v) => v !== "\n")
  ),
];

module.exports = {
  getBlockData,
  getBlockList,
  getExistingBlockNames,
};
