const { join } = require("path");
const { readJson, writeJson } = require("fs-extra");
const deepExtend = require('deep-extend')
const { DIR_DIST, DIR_SRC } = require("./util.js");

const loadManifest = async (rp = true) => {
  const srcFile = join(DIR_SRC, 'static/', (rp ? '/RP' : '/BP'), '/manifest.json')

  try {
    return await readJson(srcFile)
  } catch (err) {
    console.warn('Failed loading manifest file from "%s": ', srcFile, err)
  }

  return {}
}

const arrayFromVersion = ver => {
  if (Array.isArray(ver)) {
    ver.length = 3;
    return ver
  }
  
  return ver.toString().split(".", 3).map((n) => parseInt(n, 10));
}

/**
 * Generate manifests for BP and RP
 * @param {string} packVersion Pack version number
 * @param {string|Number[]} targetVersion Minecraft version number
 * @returns
 */
const generateManifest = async (
  packVersion = "1.0.0",
  targetVersion = "1.17.10"
) => {
  const rpSrc = await loadManifest()
  const version = rpSrc.header?.version || arrayFromVersion(packVersion)

  const rpManifest = {
    format_version: 2,
    header: {
      version,
      min_engine_version: arrayFromVersion(targetVersion),
    },
    modules: [
      {
        version,
        description: rpSrc.header?.description || 'Resources',
        type: "resources",
      },
    ],
    capabilities: [
      'raytraced'
    ]
  };

  const bpSrc = await loadManifest(true)

  const bpManifest = {
    format_version: 2,
    header: bpSrc.header || rpManifest.header,
    modules: [
      {
        version,
        description: bpSrc.header?.description || 'Data',
        type: "data",
      },
    ],
    dependencies: [
      {
        uuid: rpManifest.header.uuid,
        version,
      },
    ],
  }

  return Promise.all([
    writeJson(join(DIR_DIST, "/RP/manifest.json"), deepExtend(rpManifest, rpSrc)),
    writeJson(join(DIR_DIST, "/BP/manifest.json"), deepExtend(bpManifest, bpSrc)),
  ]);
};

module.exports = generateManifest;
