/**
 * @prop {string} blockName Texture name
 **/
const guessSound = (texture) => {
  const blockName = texture.toLowerCase();

  if (blockName.includes("brick") || blockName.includes("tile")) {
    return "brick";
  }

  if (blockName.includes("sand")) {
    return "sand";
  }

  if (blockName.includes("pebble") || blockName.includes("gravel")) {
    return "gravel";
  }

  if (blockName.includes("copper")) {
    return "copper";
  }

  if (blockName.includes("wallpaper")) {
    return "cloth";
  }

  if (blockName.includes("glass")) {
    return "glass";
  }

  if (
    blockName.includes("metal") ||
    blockName.includes("gold") ||
    blockName.includes("silver") ||
    blockName.includes("iron") ||
    blockName.includes("brass")
  ) {
    return "metal";
  }

  if (
    blockName.includes("stone") ||
    blockName.includes("concrete") ||
    blockName.includes("cement") ||
    blockName.includes("rock") ||
    blockName.includes("plaster")
  ) {
    return "stone";
  }

  console.warn(`Using default sound for block ${blockName}`);

  return "wood";
};

module.exports = guessSound;
