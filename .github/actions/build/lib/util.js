const { join } = require("node:path");

const DIR_ROOT = process.cwd();
const DIR_DIST = join(DIR_ROOT, "/dist");
const PACK_NS = "jgrtx";

const getBlockName = (name) =>
  `${PACK_NS}:${name.trim().toLowerCase().replace(/\s+/g, "_")}`;

module.exports = {
  getBlockName,
  PACK_NS,
  DIR_DIST,
  DIR_SRC: join(DIR_ROOT, "/src"),
  DIR_RP: join(DIR_DIST, `/${PACK_NS} RP`),
  DIR_BP: join(DIR_DIST, `/${PACK_NS} BP`),
  getTextureName: (name) => getBlockName(`${name}`).replace(":", "_"),
};
