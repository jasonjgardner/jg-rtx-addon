const { join } = require("path");

const DIR_ROOT = process.cwd();
const PACK_NS = "jgrtx";

const getBlockName = (name) =>
  `${PACK_NS}:${name.trim().toLowerCase().replace(/\s+/g, "_")}`;

module.exports = {
  getBlockName,
  PACK_NS,
  DIR_SRC: join(DIR_ROOT, "/src"),
  DIR_DIST: join(DIR_ROOT, "/dist"),
  getTextureName: (name) => getBlockName(`${name}`).replace(":", "_"),
};
