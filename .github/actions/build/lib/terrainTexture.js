const { join } = require("path");
const { readJson, outputJSON } = require("fs-extra");
const { DIR_SRC, PACK_NS, DIR_RP } = require("./util.js");

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
    join(DIR_RP, "/textures/terrain_texture.json"),
    terrainData
  );
}

module.exports = {
  writeTerrainTexture,
};
