const { join, basename } = require("path");
const {
  outputJSON,
  outputFile,
  copyFile,
  ensureDir,
  emptyDir,
} = require("fs-extra");
const { DIR_DIST, DIR_SRC, PACK_NS, DIR_BP, DIR_RP } = require("./lib/util.js");
const { getBlockList, getBlockData } = require("./lib/blocks.js");
const { getTextureSet, hasTextureSet } = require("./lib/textureSet.js");
const { writeTerrainTexture } = require("./lib/terrainTexture.js");
const guessSound = require("./lib/sounds.js");
const generateManifest = require("./lib/manifest.js");
const fg = require("fast-glob");

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
  const textureDest = join(DIR_RP, "/textures/blocks/");

  const buildProcess = async (file, idx, files) => {
    const texturePath = file.replace(/\.[^/.]+$/, "");

    if (hasTextureSet(texturePath, files)) {
      console.info("Skipping texture set JSON creation for file %s", file);
      return;
    }

    const textureFace = `${file}`.split(/[\/\\]/, 3);
    const isTextureFace = textureFace.length > 1;

    const textureSet = getTextureSet(texturePath);
    const baseTexture = `${textureSet["minecraft:texture_set"].color}`;

    tasks.push(
      outputJSON(
        join(textureDest, `${baseTexture}.texture_set.json`),
        textureSet
      ),
      copyFile(
        join(DIR_SRC, "/materials/", file),
        join(textureDest, `${baseTexture}.png`)
      )
    );

    if (files.includes(`${texturePath}_mer.png`)) {
      tasks.push(
        copyFile(
          join(DIR_SRC, `/materials/${texturePath}_mer.png`),
          join(textureDest, `${baseTexture}_mer.png`)
        )
      );
    }

    if (files.includes(`${texturePath}_normal.png`)) {
      tasks.push(
        copyFile(
          join(DIR_SRC, `/materials/${texturePath}_normal.png`),
          join(textureDest, `${baseTexture}_normal.png`)
        )
      );
    }

    /**
     * @var {string} blockTitle Full, readable title of block
     */
    const blockTitle = basename(file, ".png").trim();

    /**
     * @var {string} blockName Minecraft block ID
     */
    const blockName = blockTitle.toLowerCase().replace(/\s+/g, "_");

    /**
     * @var {string} nsBlockName Minecraft block name with namespace
     */
    const nsBlockName = `${PACK_NS}:${blockName}`;

    const tileName = `tile.${nsBlockName}.name=${blockTitle}`;

    if (!tileNames.has(tileName)) {
      tileNames.add(tileName);
    }

    if (!blocks[nsBlockName]) {
      blocks[nsBlockName] = {};
    }

    if (!blocks[nsBlockName].sound) {
      blocks[nsBlockName].sound = guessSound(blockTitle);
    }

    if (isTextureFace) {
      if (!blocks[nsBlockName].textures) {
        blocks[nsBlockName].textures = {};
      }

      const resourceId = `${PACK_NS}_${blockName}_${textureFace[0].replace(
        "+",
        "_"
      )}`;

      textureData[resourceId] = {
        textures: `textures/blocks/${baseTexture}`,
      };

      blocks[nsBlockName].textures = {
        ...blocks[nsBlockName].textures,
        ...Object.fromEntries(
          textureFace[0].split("+").map((pos) => {
            return [pos, resourceId];
          })
        ),
      };
    } else {
      textureData[`${PACK_NS}_${blockName}`] = {
        textures: `textures/blocks/${baseTexture}`,
      };

      blocks[nsBlockName].textures = `${PACK_NS}_${blockName}`;
    }

    const hasBlockModel = files.includes(`${texturePath}.geo.json`);

    if (hasBlockModel) {
      // Copy block model
      tasks.push(
        copyFile(
          join(DIR_SRC, `/materials/${texturePath}.geo.json`),
          join(DIR_RP, `/models/blocks/${blockName}.geo.json`)
        )
      );
    }

    try {
      tasks.push(
        outputJSON(
          join(DIR_BP, `/blocks/${blockName}.json`),
          await getBlockData(blockName, blockTitle, hasBlockModel)
        )
      );
    } catch (err) {
      console.error("Could not write block behavior data: %s", err);
    }
    return tasks;
  };

  await emptyDir(DIR_DIST);

  await Promise.all([
    ensureDir(join(DIR_BP, "/blocks")),
    ensureDir(join(DIR_BP, "/functions")),
    ensureDir(join(DIR_RP, "/texts")),
    ensureDir(join(DIR_RP, "/models/blocks")),
    ensureDir(join(DIR_RP, "/textures/blocks")),
  ]);

  const buildTasks = [
    generateManifest(process.env.GITHUB_ACTIONS !== undefined),
    copyFile(
      join(DIR_SRC, "/static/RP/pack_icon.png"),
      join(DIR_RP, "/pack_icon.png")
    ),
    copyFile(
      join(DIR_SRC, "/static/BP/pack_icon.png"),
      join(DIR_BP, "/pack_icon.png")
    ),
  ];

  const entries = await fg([`./*.{png,tga,json}`, `./**/*.{png,tga,json}`], {
    cwd: join(DIR_SRC, "/materials"),
  });

  buildTasks.push(...entries.map(buildProcess));

  await Promise.all(buildTasks);
  await Promise.all([
    outputJSON(join(DIR_RP, "/blocks.json"), blocks),
    writeTerrainTexture(textureData),
    outputFile(join(DIR_RP, "/texts/en_US.lang"), [...tileNames].join("\n")),
  ]);
})();
