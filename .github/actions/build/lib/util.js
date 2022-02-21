const { join } = require("path");

const DIR_ROOT = process.cwd();
const DIR_DIST = join(DIR_ROOT, "/dist");
const PACK_NS = "jgrtx";
const PACK_NAME = `${PACK_NS} Add-on`;

const getBlockName = (name) =>
  `${PACK_NS}:${name.trim().toLowerCase().replace(/\s+/g, "_")}`;

module.exports = {
  getBlockName,
  PACK_NS,
  PACK_NAME,
  DIR_DIST,
  DIR_SRC: join(DIR_ROOT, "/src"),
  DIR_RP: join(DIR_DIST, `/${PACK_NAME} RP`),
  DIR_BP: join(DIR_DIST, `/${PACK_NAME} BP`),
  getTextureName: (name) => getBlockName(`${name}`).replace(":", "_"),
};
