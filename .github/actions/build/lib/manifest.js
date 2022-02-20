const { join } = require("path");
const { readJson, writeJson } = require("fs-extra");
const deepExtend = require("deep-extend");
const { DIR_RP, DIR_SRC, DIR_BP } = require("./util.js");
const { v4: uuidv4 } = require("uuid");

const loadManifest = async (rp = true) => {
  const srcFile = join(
    DIR_SRC,
    "static/",
    rp ? "/RP" : "/BP",
    "/manifest.json"
  );

  try {
    return await readJson(srcFile);
  } catch (err) {
    console.warn('Failed loading manifest file from "%s": ', srcFile, err);
  }

  return {};
};

const arrayFromVersion = (ver) => {
  if (Array.isArray(ver)) {
    ver.length = 3;
    return ver;
  }

  return ver
    .toString()
    .split(".", 3)
    .map((n) => parseInt(n, 10));
};

const bumpVersion = (version = [], patch = true) => {
  version.length = 3;

  return [
    +version[0],
    +version[1] + (patch ? 1 : 0),
    +version[2] + (patch ? 0 : 1),
  ];
};

/**
 * Generate manifests for BP and RP
 * @param {string} packVersion Pack version number
 * @param {string|Number[]} targetVersion Minecraft version number
 * @returns
 */
const generateManifest = async (
  packVersion = "1.0.0",
  targetVersion = "1.18.20",
  newId = true
) => {
  const rpSrc = await loadManifest();

  let version = rpSrc.header.version || arrayFromVersion(packVersion);

  if (rpSrc.header?.version !== undefined) {
    version = bumpVersion(arrayFromVersion(rpSrc.header.version));
  }

  const rpManifest = {
    format_version: 2,
    header: {
      version,
      min_engine_version: arrayFromVersion(targetVersion),
    },
    modules: [
      {
        version,
        description: rpSrc.header.description || "Resources",
        type: "resources",
      },
    ],
    capabilities: ["raytraced"],
  };

  const bpSrc = await loadManifest(false);

  if (newId) {
    // Realms requires a new UUID for every add-on installation
    rpManifest.header.uuid = uuidv4();

    bpSrc.header.uuid = uuidv4();
  }

  const bpManifest = {
    format_version: 2,
    header: bpSrc.header,
    modules: [
      {
        version,
        description: bpSrc.header.description || "Data",
        type: "data",
      },
    ],
    dependencies: [
      {
        uuid: rpSrc.header.uuid,
        version,
      },
    ],
  };

  return Promise.all([
    writeJson(join(DIR_RP, "/manifest.json"), deepExtend(rpManifest, rpSrc)),
    writeJson(join(DIR_BP, "/manifest.json"), deepExtend(bpManifest, bpSrc)),
  ]);
};

module.exports = generateManifest;
