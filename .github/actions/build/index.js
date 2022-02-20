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
      console.info("Skipping %s", file);
      return;
    }

    const textureFace = file.split(/[/\/]/, 3);
    const isTextureFace = textureFace.length > 1;

    const textureSet = getTextureSet(texturePath);
    const color = `${textureSet["minecraft:texture_set"].color}`;

    tasks.push(
      outputJSON(join(textureDest, `${color}.texture_set.json`), textureSet),
      copyFile(
        join(DIR_SRC, "/materials/", file),
        join(textureDest, `${color}.png`)
      )
    );

    if (files.includes(`${texturePath}_mer.png`)) {
      tasks.push(
        copyFile(
          join(DIR_SRC, `/materials/${texturePath}_mer.png`),
          join(textureDest, `${color}_mer.png`)
        )
      );
    }

    if (files.includes(`${texturePath}_normal.png`)) {
      tasks.push(
        copyFile(
          join(DIR_SRC, `/materials/${texturePath}_normal.png`),
          join(textureDest, `${color}_normal.png`)
        )
      );
    }

    const base = basename(file, ".png").trim();
    const blockName = base.toLowerCase().replace(/\s+/g, "_");
    const nsBlockName = `${PACK_NS}:${blockName}`;
    /// Reformat block and namespace for texture name
    const textureId = nsBlockName.replace(":", "_");

    textureData[textureId] = {
      textures: `textures/blocks/${color}`,
    };

    const tileName = `tile.${nsBlockName}.name=${base}`;

    if (!tileNames.has(tileName)) {
      tileNames.add(tileName);
    }

    if (!blocks[nsBlockName]) {
      blocks[nsBlockName] = {};
    }

    if (!blocks[nsBlockName].sound) {
      blocks[nsBlockName].sound = guessSound(base);
    }

    if (isTextureFace) {
      if (!blocks[nsBlockName].textures) {
        blocks[nsBlockName].textures = {};
      }

      blocks[nsBlockName].textures = {
        ...blocks[nsBlockName].textures,
        ...Object.fromEntries(
          textureFace[0].split("+").map((pos) => {
            return [pos, color];
          })
        ),
      };
    } else {
      blocks[nsBlockName].textures = color;

      try {
        tasks.push(
          outputJSON(
            join(DIR_BP, `/blocks/${blockName}.json`),
            await getBlockData(blockName, base)
          )
        );
      } catch (err) {
        console.error("Could not write block behavior data: %s", err);
      }
    }

    return tasks;
  };

  await emptyDir(DIR_DIST);

  await Promise.all([
    ensureDir(join(DIR_BP, "/blocks")),
    ensureDir(join(DIR_RP, "/texts")),
    ensureDir(join(DIR_RP, "/textures/blocks")),
  ]);

  const buildTasks = [
    generateManifest(),
    copyFile(
      join(DIR_SRC, "/static/RP/pack_icon.png"),
      join(DIR_RP, "/pack_icon.png")
    ),
    copyFile(
      join(DIR_SRC, "/static/BP/pack_icon.png"),
      join(DIR_BP, "/pack_icon.png")
    ),
  ];

  const entries = await fg([`./*.{png,tga}`, `./**/*.{png,tga}`], {
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
