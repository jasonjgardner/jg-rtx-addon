const { join, basename } = require("path");
const {
  readJson,
  outputJSON,
  outputFile,
  readdir,
  copyFile,
  ensureDir,
  pathExists,
} = require("fs-extra");
const { DIR_DIST, DIR_SRC, PACK_NS } = require("./lib/util.js");
const { getBlockList, getBlockData } = require("./lib/blocks.js");
const guessSound = require("./lib/sounds.js");
const generateManifest = require("./lib/manifest.js");

const getTextureSet = (base) => {
  const color = base.toLowerCase().replace(/\s+/g, "_");

  return {
    format_version: "1.16.100",
    "minecraft:texture_set": {
      color,
      metalness_emissive_roughness: `${color}_mer`,
      normal: `${color}_normal`,
    },
  };
};

async function writeTerrainTexture(textureData = {}) {
  let terrainData = {};

  try {
    terrainData = await readJson(
      join(DIR_SRC, "/static/RP/textures/terrain_texture.json")
    );
  } catch (err) {
    console.warn("Unable to open terrain_texture.json: %s", err);
  }

  terrainData.texture_name = "atlas.terrain";
  terrainData.num_mip_levels = 0;
  terrainData.padding = 2;
  terrainData.resource_pack_name = PACK_NS;
  terrainData.texture_data = {
    ...(terrainData.texture_data || {}),
    ...textureData,
  };

  return outputJSON(
    join(DIR_DIST, "/RP/textures/terrain_texture.json"),
    terrainData
  );
}

(async function build() {
  let blocks = {};

  try {
    blocks = await getBlockList();
  } catch (err) {
    console.warn("Failed loading blocks.json: %s", err);
  }

  const textureData = {};
  const tileNames = new Set();
  const tasks = [];

  const processDir = async (file, files) => {
    const base = basename(file, ".png");

    if (
      files.includes(`${base}.texture_set.json`) ||
      !files.includes(`${base}_mer.png`) ||
      !files.includes(`${base}_normal.png`)
    ) {
      console.info("Skipping %s", base);
      return;
    }

    const textureSet = getTextureSet(base);
    const color = textureSet["minecraft:texture_set"].color;
    const blockName = `${PACK_NS}:${color}`;
    /// Reformat block and namespace for texture name
    const textureId = blockName.replace(":", "_");
    const tileName = `tile.${blockName}.name=${base}`;

    const textureDest = join(DIR_DIST, "/RP/textures/blocks/");

    if (!tileNames.has(tileName)) {
      tileNames.add(tileName);
    }

    if (!blocks[blockName]) {
      blocks[blockName] = {};
    }

    if (!blocks[blockName].sound) {
      blocks[blockName].sound = guessSound(color);
    }

    blocks[blockName].textures = textureId;

    textureData[textureId] = { textures: `textures/blocks/${color}` };

    tasks.push(
      outputJSON(join(textureDest, `${color}.texture_set.json`), textureSet),
      copyFile(
        join(DIR_SRC, "/materials/", file),
        join(textureDest, `${color}.png`)
      )
    );

    try {
      tasks.push(
        outputJSON(
          join(DIR_DIST, `/BP/blocks/${color}.json`),
          await getBlockData(color, base)
        )
      );
    } catch (err) {
      console.error("Could not write block behavior data: %s", err);
    }

    if (files.includes(`${base}_mer.png`)) {
      tasks.push(
        copyFile(
          join(DIR_SRC, `/materials/${base}_mer.png`),
          join(textureDest, `${color}_mer.png`)
        )
      );
    }

    if (files.includes(`${base}_normal.png`)) {
      tasks.push(
        copyFile(
          join(DIR_SRC, `/materials/${base}_normal.png`),
          join(textureDest, `${color}_normal.png`)
        )
      );
    }

    return tasks;
  };

  await ensureDir(join(DIR_DIST, "/RP/textures/blocks"));

  const buildTasks = [
    outputJSON(join(DIR_DIST, "/RP/blocks.json"), blocks),
    outputFile(
      join(DIR_DIST, "/RP/texts/en_US.lang"),
      [...tileNames].join("\n")
    ),
    writeTerrainTexture(textureData),
    generateManifest(),
    copyFile(
      join(DIR_SRC, "/static/RP/pack_icon.png"),
      join(DIR_DIST, "/RP/pack_icon.png")
    ),
    copyFile(
      join(DIR_SRC, "/static/BP/pack_icon.png"),
      join(DIR_DIST, "/BP/pack_icon.png")
    ),
  ];

  const materialsDir = join(DIR_SRC, "/materials");

  if (await pathExists(materialsDir)) {
    buildTasks.push(
      ...[...(await readdir(materialsDir))].map((file, idx, files) =>
        processDir(file, files)
      )
    );
  }

  await Promise.all(buildTasks);
})();
