module.exports = {
  getTextureSet: (base) => {
    const color = base.toLowerCase().replace(/[\s\/\+]+/g, "_");

    return {
      format_version: "1.16.100",
      "minecraft:texture_set": {
        color,
        metalness_emissive_roughness: `${color}_mer`,
        normal: `${color}_normal`,
      },
    };
  },
  hasTextureSet: (base = "", files = []) =>
    files.includes(`${base}.texture_set.json`) ||
    !files.includes(`${base}_mer.png`) ||
    !files.includes(`${base}_normal.png`),
};
