const { join, basename } = require("path");
const { readdir, writeFile, copyFile, readFile } = require("fs/promises");
const { DIR_DIST, DIR_SRC, PACK_NS } = require("./lib/util.js");
const { getBlockList, getBlockData } = require("./lib/blocks.js");
const guessSound = require("./lib/sounds.js");

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
    terrainData = JSON.parse(
      (
        await readFile(join(DIR_SRC, "/static/RP/textures/terrain_texture.json"))
      ).toString()
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

  await writeFile(
    join(DIR_DIST, "/RP/textures/terrain_texture.json"),
    JSON.stringify(terrainData, null, 2)
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
      writeFile(
        join(textureDest, `${color}.texture_set.json`),
        JSON.stringify(textureSet, null, 2)
      ),
      copyFile(join(DIR_SRC, '/materials/', file), join(textureDest, `${color}.png`)),
      writeFile(
        join(DIR_DIST, `/BP/blocks/${color}.json`),
        JSON.stringify(getBlockData(color, base), null, 2)
      )
    );

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

    await Promise.all(tasks);
  };

  (await readdir(join(DIR_SRC, '/materials'))).map(
    async (file, idx, files) => await processDir(file, files)
  );

  await writeFile(
    join(DIR_DIST, "/RP/blocks.json"),
    JSON.stringify(blocks, null, 2)
  );

  await writeFile(
    join(DIR_DIST, "/RP/texts/en_US.lang"),
    [...tileNames].join("\n")
  );

  await writeTerrainTexture(textureData);
})();
