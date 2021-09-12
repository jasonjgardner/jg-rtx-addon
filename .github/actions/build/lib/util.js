const { join } = require("path");

const DIR_ROOT = process.cwd();

module.exports = {
  DIR_SRC: join(DIR_ROOT, "/src"),
  DIR_DIST: join(DIR_ROOT, "/dist"),
  PACK_NS: "jgrtx",
};
