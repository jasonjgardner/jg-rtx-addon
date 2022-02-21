const { join } = require("path");
const { DIR_DIST, PACK_NAME } = require("./.github/actions/build/lib/util.js");
const { copy, emptyDir, ensureDir } = require("fs-extra");

const appData = process.env.LOCALAPPDATA || "%LocalAppData%";

const comMojang = join(
  appData,
  "Packages",
  "Microsoft.MinecraftUWP_8wekyb3d8bbwe",
  "LocalState",
  "games",
  "com.mojang"
);

const devBehaviorPacks = join(
  comMojang,
  "development_behavior_packs",
  `${PACK_NAME} BP`
);
const devResourcePacks = join(
  comMojang,
  "development_resource_packs",
  `${PACK_NAME} RP`
);

const buildBehaviorPacks = join(DIR_DIST, `${PACK_NAME} BP`);
const buildResourcePacks = join(DIR_DIST, `${PACK_NAME} RP`);

async function resetDev() {
  const paths = [devBehaviorPacks, devResourcePacks];
  await Promise.all(paths.map((dir) => emptyDir(dir)));
}

async function deployToDev() {
  await resetDev();
  await Promise.all([ensureDir(devBehaviorPacks), ensureDir(devResourcePacks)]);
  return await Promise.all([
    copy(buildBehaviorPacks, devBehaviorPacks),
    copy(buildResourcePacks, devResourcePacks),
  ]);
}

(async function run() {
  await deployToDev();
})();
