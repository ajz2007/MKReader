const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// 读取 SVG 文件
const svgContent = fs.readFileSync(path.join(__dirname, "assets", "icon.svg"));

// 创建不同尺寸的 PNG 图标
const sizes = [16, 24, 32, 48, 64, 128, 256];

async function generateIcons() {
  // 确保输出目录存在
  const iconsDir = path.join(__dirname, "assets", "icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 生成不同尺寸的 PNG 文件
  for (const size of sizes) {
    try {
      await sharp(svgContent)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));

      console.log(`Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`Error generating ${size}x${size} icon:`, error);
    }
  }

  // 生成主图标文件
  try {
    await sharp(svgContent)
      .resize(256, 256)
      .png()
      .toFile(path.join(__dirname, "assets", "icon.png"));

    console.log("Generated main icon.png");
  } catch (error) {
    console.error("Error generating main icon:", error);
  }

  // 生成适用于 electron-builder 的图标
  try {
    await sharp(svgContent)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, "assets", "icon@2x.png"));

    console.log("Generated icon@2x.png");
  } catch (error) {
    console.error("Error generating 2x icon:", error);
  }
}

generateIcons()
  .then(() => {
    console.log("All icons generated successfully!");
  })
  .catch((error) => {
    console.error("Error generating icons:", error);
  });
