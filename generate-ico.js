const { pngToIco } = require("png-to-ico");
const fs = require("fs");
const path = require("path");

async function generateIcoIcon() {
  try {
    // 使用多个尺寸生成 ICO 文件
    const iconsDir = path.join(__dirname, "assets", "icons");
    const iconPaths = [
      path.join(iconsDir, "icon-16x16.png"),
      path.join(iconsDir, "icon-24x24.png"),
      path.join(iconsDir, "icon-32x32.png"),
      path.join(iconsDir, "icon-48x48.png"),
      path.join(iconsDir, "icon-64x64.png"),
      path.join(iconsDir, "icon-128x128.png"),
      path.join(iconsDir, "icon-256x256.png"),
    ];

    // 读取所有 PNG 文件
    const buffers = iconPaths
      .map((iconPath) => {
        if (fs.existsSync(iconPath)) {
          return fs.readFileSync(iconPath);
        }
        return null;
      })
      .filter((buffer) => buffer !== null);

    // 生成 ICO 文件
    const icoBuffer = await pngToIco(buffers);

    // 保存 ICO 文件
    fs.writeFileSync(path.join(__dirname, "assets", "icon.ico"), icoBuffer);

    console.log("Generated icon.ico successfully!");
  } catch (error) {
    console.error("Error generating ICO file:", error);
  }
}

generateIcoIcon();
