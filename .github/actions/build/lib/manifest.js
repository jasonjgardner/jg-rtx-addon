const { join } = require("path");
const { readJson, writeJson } = require("fs-extra");
const { DIR_DIST } = require("./util.js");

const generateManifest = async () => {
  const {
    version: v,
    name,
    description,
    config: { BP_UUID, RP_UUID, TARGET_VERSION },
  } = await readJson(join(process.cwd(), "/package.json"));

  const version = v.split(".", 3).map(n => parseInt(n, 10));

  const rpManifest = {
    format_version: 2,
    header: {
      name,
      description,
      version,
      min_engine_version:
        typeof TARGET_VERSION === "string"
          ? TARGET_VERSION.split(".", 3).map(n => parseInt(n, 10))
          : Array.from(TARGET_VERSION || [1, 17, 10]),
      uuid: RP_UUID[0],
    },
    modules: [
      {
        version,
        description: `${name} resources`,
        type: "resources",
        uuid: RP_UUID[1],
      },
    ],
  };

  return Promise.all([
    writeJson(join(DIR_DIST, "/RP/manifest.json"), rpManifest),
    writeJson(join(DIR_DIST, "/BP/manifest.json"), {
      format_version: 2,
      header: {
        ...rpManifest.header,
        ...{
          uuid: BP_UUID[0],
        },
      },
      modules: [
        {
          version,
          description: `${name} data`,
          type: "data",
          uuid: BP_UUID[1],
        },
      ],
      dependencies: [
        {
          uuid: RP_UUID[0],
          version,
        },
      ],
    }),
  ]);
};

module.exports = generateManifest;
