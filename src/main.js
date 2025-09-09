const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// 存储主窗口引用
let mainWindow = null;

// 检查文件是否为有效的Markdown文件
const isValidMarkdownFile = (filePath) => {
  if (!filePath) return false;
  try {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".md" && fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// 在窗口中打开文件
const openFileInWindow = (window, filePath) => {
  if (window && isValidMarkdownFile(filePath)) {
    window.webContents.send("file-opened", filePath);
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
  // 生产环境下不打开开发者工具
  // mainWindow.webContents.openDevTools();

  // 窗口关闭时清空引用
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // --- Menu and Dialog Logic ---
  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        {
          label: "Open File",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            dialog
              .showOpenDialog(mainWindow, {
                properties: ["openFile"],
                filters: [{ name: "Markdown Files", extensions: ["md"] }],
              })
              .then((result) => {
                if (!result.canceled && result.filePaths.length > 0) {
                  mainWindow.webContents.send(
                    "file-opened",
                    result.filePaths[0]
                  );
                }
              })
              .catch((err) => {
                console.log(err);
              });
          },
        },
        {
          label: "Open Multiple Files",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => {
            dialog
              .showOpenDialog(mainWindow, {
                properties: ["openFile", "multiSelections"],
                filters: [{ name: "Markdown Files", extensions: ["md"] }],
              })
              .then((result) => {
                if (!result.canceled && result.filePaths.length > 0) {
                  mainWindow.webContents.send(
                    "open-multiple-files",
                    result.filePaths
                  );
                }
              })
              .catch((err) => {
                console.log(err);
              });
          },
        },
        {
          type: "separator",
        },
        {
          label: "New Tab",
          accelerator: "CmdOrCtrl+T",
          click: () => {
            mainWindow.webContents.send("new-tab");
          },
        },
        {
          label: "Close Tab",
          accelerator: "CmdOrCtrl+W",
          click: () => {
            mainWindow.webContents.send("close-tab");
          },
        },
        {
          type: "separator",
        },
        {
          label: "Exit",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Outline",
          accelerator: "CmdOrCtrl+\\",
          click: () => {
            mainWindow.webContents.send("toggle-outline");
          },
        },
        {
          type: "separator",
        },
        {
          label: "Code Highlighting Settings",
          click: () => {
            mainWindow.webContents.send("open-code-settings");
          },
        },
        {
          label: "Mermaid Diagram Settings",
          click: () => {
            mainWindow.webContents.send("open-mermaid-settings");
          },
        },
        {
          type: "separator",
        },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.webContents.reload();
          },
        },
        {
          label: "Toggle Developer Tools",
          accelerator: "F12",
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  // IPC 事件监听
  const { ipcMain } = require("electron");

  // 处理文件对话框请求
  ipcMain.on("open-file-dialog", () => {
    dialog
      .showOpenDialog(mainWindow, {
        properties: ["openFile", "multiSelections"],
        filters: [{ name: "Markdown Files", extensions: ["md"] }],
      })
      .then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          if (result.filePaths.length === 1) {
            mainWindow.webContents.send("file-opened", result.filePaths[0]);
          } else {
            mainWindow.webContents.send(
              "open-multiple-files",
              result.filePaths
            );
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

  // 处理多文件对话框请求
  ipcMain.on("open-multiple-file-dialog", () => {
    dialog
      .showOpenDialog(mainWindow, {
        properties: ["openFile", "multiSelections"],
        filters: [{ name: "Markdown Files", extensions: ["md"] }],
      })
      .then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          mainWindow.webContents.send("open-multiple-files", result.filePaths);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

  return mainWindow;
};

// 确保只有一个应用实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // 当第二个实例启动时，聚焦到第一个实例并处理文件参数
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    console.log("Second instance detected with command line:", commandLine);
    // 有人试图运行第二个实例，聚焦到我们的窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // 处理命令行参数中的文件路径
      if (commandLine.length > 1) {
        const filePath = commandLine[commandLine.length - 1];
        console.log("Processing file from second instance:", filePath);
        openFileInWindow(mainWindow, filePath);
      }
    }
  });

  app.whenReady().then(() => {
    const window = createWindow();

    // 处理启动时的命令行参数
    const args = process.argv;
    console.log("Command line arguments:", args);

    if (args.length > 1) {
      // 在开发环境中，第二个参数可能是 '.'，第三个才是文件路径
      // 在打包后的环境中，第二个参数就是文件路径
      let filePath = null;

      // 查找第一个 .md 文件路径
      for (let i = 1; i < args.length; i++) {
        console.log(`Checking argument ${i}: ${args[i]}`);
        if (isValidMarkdownFile(args[i])) {
          filePath = args[i];
          console.log("Found valid Markdown file:", filePath);
          break;
        }
      }

      if (filePath) {
        console.log("Opening file on startup:", filePath);
        // 延迟打开文件，确保渲染进程已准备好
        setTimeout(() => {
          openFileInWindow(window, filePath);
        }, 1000);
      } else {
        console.log("No valid Markdown file found in arguments");
        // 当没有找到有效的 Markdown 文件时，显示欢迎信息
        setTimeout(() => {
          window.webContents.send("show-welcome-message");
        }, 1000);
      }
    } else {
      console.log("No command line arguments provided");
      // 当没有命令行参数时，显示欢迎信息
      setTimeout(() => {
        window.webContents.send("show-welcome-message");
      }, 1000);
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

// 导出相关IPC处理器
ipcMain.handle("export-to-pdf", async (event, content, options) => {
  console.log("收到PDF导出请求");
  console.log("选项:", options);
  console.log("内容长度:", content ? content.length : "undefined");

  let pdfWindow = null;

  try {
    // 创建一个隐藏的窗口用于PDF导出
    pdfWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false, // 隐藏窗口
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    console.log("创建PDF导出窗口成功");
    // 旧逻辑等待 dom-ready（但此时尚未 loadURL）会永远不触发，移除该等待
    // 在加载 data URL 后再确认是否完成

    // 创建完整的HTML页面用于PDF导出
    const fullHTML = createPDFHTML(content, options);
    console.log("生成PDF HTML，长度:", fullHTML.length);

    // 加载HTML内容（loadURL 本身返回 Promise，若过早完成仍做稳定等待）
    const dataURL = `data:text/html;charset=utf-8,${encodeURIComponent(
      fullHTML
    )}`;
    const loadStart = Date.now();
    await pdfWindow.loadURL(dataURL);
    console.log("loadURL 完成, 耗时(ms):", Date.now() - loadStart);

    // 等待图片资源加载（防止图片未渲染导致内容缺失）；不阻塞超过 8 秒
    try {
      const imgStatus = await Promise.race([
        pdfWindow.webContents.executeJavaScript(`
          new Promise(resolve => {
            const imgs = Array.from(document.images);
            if (imgs.length === 0) return resolve('no-images');
            let remaining = imgs.length;
            let done = false;
            const finish = (tag) => { if(!done){ done = true; resolve(tag); } };
            const timer = setTimeout(()=>finish('timeout'), 8000);
            imgs.forEach(img => {
              if (img.complete) {
                if (--remaining === 0) { clearTimeout(timer); finish('loaded-instant'); }
              } else {
                const handler = () => { if (--remaining === 0) { clearTimeout(timer); finish('loaded'); } };
                img.addEventListener('load', handler, { once: true });
                img.addEventListener('error', handler, { once: true });
              }
            });
          });
        `),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("等待图片脚本执行超时")), 10000)
        ),
      ]);
      console.log("图片加载状态:", imgStatus);
    } catch (e) {
      console.warn("图片加载等待出错/超时, 忽略继续: ", e.message);
    }

    // 额外短暂等待字体/布局稳定
    await new Promise((resolve) => setTimeout(resolve, 200));

    const pdfOptions = {
      marginsType: 1, // 默认边距
      pageSize: options.pageSize || "A4",
      landscape: options.orientation === "landscape",
      printBackground: options.includeBackground !== false,
    };

    // 如果有自定义边距，设置为自定义类型
    if (options.margin) {
      pdfOptions.marginsType = 2; // 自定义边距
      pdfOptions.margins = {
        top: (options.margin.top || 20) / 25.4, // 转换mm到英寸
        bottom: (options.margin.bottom || 20) / 25.4,
        left: (options.margin.left || 20) / 25.4,
        right: (options.margin.right || 20) / 25.4,
      };
    }

    console.log("PDF导出选项:", pdfOptions);

    // 检查webContents是否可用
    if (!pdfWindow.webContents) {
      throw new Error("PDF窗口的webContents不可用");
    }

    console.log("开始生成PDF...");
    const pdfBuffer = await Promise.race([
      pdfWindow.webContents.printToPDF(pdfOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("printToPDF 超时")), 20000)
      ),
    ]);
    console.log("PDF生成成功，大小:", pdfBuffer.length, "字节");

    // 关闭PDF导出窗口
    pdfWindow.close();

    return { success: true, data: pdfBuffer };
  } catch (error) {
    console.error("PDF export error:", error);
    // 确保在错误时也关闭窗口
    if (pdfWindow && !pdfWindow.isDestroyed()) {
      pdfWindow.close();
    }
    return { success: false, error: error.message };
  }
});

// 创建用于PDF导出的完整HTML
function createPDFHTML(content, options) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Export</title>
  <style>
    /* GitHub Markdown样式的简化版本 */
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: none;
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: #24292e;
      background-color: #fff;
    }
    
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: none;
      margin: 0;
      padding: 0;
    }
    
    /* 标题样式 */
    .markdown-body h1 {
      font-size: 2em;
      font-weight: 600;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    .markdown-body h2 {
      font-size: 1.5em;
      font-weight: 600;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    
    .markdown-body h3 {
      font-size: 1.25em;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    
    .markdown-body h4, .markdown-body h5, .markdown-body h6 {
      font-size: 1em;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    
    /* 段落样式 */
    .markdown-body p {
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    /* 代码样式 */
    .markdown-body code {
      background-color: rgba(27,31,35,0.05);
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      border-radius: 3px;
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
    }
    
    .markdown-body pre {
      background-color: #f6f8fa;
      border-radius: 6px;
      font-size: 85%;
      line-height: 1.45;
      overflow: visible;
      padding: 16px;
      margin-top: 0;
      margin-bottom: 16px;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    
    .markdown-body pre code {
      background-color: transparent;
      border: 0;
      display: inline;
      line-height: inherit;
      margin: 0;
      padding: 0;
      word-wrap: normal;
    }
    
    /* 列表样式 */
    .markdown-body ul, .markdown-body ol {
      margin-top: 0;
      margin-bottom: 16px;
      padding-left: 2em;
    }
    
    .markdown-body li {
      margin-top: 0.25em;
    }
    
    /* 表格样式 */
    .markdown-body table {
      border-spacing: 0;
      border-collapse: collapse;
      width: 100%;
      overflow: visible;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    .markdown-body table th, .markdown-body table td {
      padding: 6px 13px;
      border: 1px solid #dfe2e5;
    }
    
    .markdown-body table th {
      font-weight: 600;
      background-color: #f6f8fa;
    }
    
    .markdown-body table tr:nth-child(2n) {
      background-color: #f6f8fa;
    }
    
    /* 引用样式 */
    .markdown-body blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin: 0 0 16px 0;
    }
    
    /* 分页控制 */
    .markdown-body h1, .markdown-body h2 {
      page-break-before: auto;
      page-break-after: avoid;
    }
    
    .markdown-body pre, .markdown-body blockquote, .markdown-body table {
      page-break-inside: avoid;
    }
    
    /* 链接样式 */
    .markdown-body a {
      color: #0366d6;
      text-decoration: none;
    }
    
    .markdown-body a:hover {
      text-decoration: underline;
    }
    
    /* 图片样式 */
    .markdown-body img {
      max-width: 100%;
      height: auto;
    }
    
    /* 水平线样式 */
    .markdown-body hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #e1e4e8;
      border: 0;
    }
    
    /* 打印样式 */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      .markdown-body {
        font-size: 12pt;
        line-height: 1.5;
      }
      
      .markdown-body h1 {
        font-size: 20pt;
      }
      
      .markdown-body h2 {
        font-size: 16pt;
      }
      
      .markdown-body h3 {
        font-size: 14pt;
      }
    }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${content}
  </div>
</body>
</html>
  `;
}

ipcMain.handle("export-to-html", async (event, content, options) => {
  try {
    return { success: true, html: content };
  } catch (error) {
    console.error("HTML export error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("export-to-png", async (event, content, options) => {
  try {
    // PNG导出将在渲染进程中使用html2canvas处理
    return { success: true, message: "PNG export initiated" };
  } catch (error) {
    console.error("PNG export error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("save-file", async (event, filename, content) => {
  try {
    // 如果filename不包含路径，则保存到用户文档目录
    let filePath = filename;
    if (!path.isAbsolute(filename)) {
      const os = require("os");
      const documentsPath = path.join(os.homedir(), "Documents");
      filePath = path.join(documentsPath, filename);
    }

    console.log("保存文件到:", filePath);

    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (typeof content === "string") {
      // 文本内容
      fs.writeFileSync(filePath, content, "utf8");
    } else {
      // 二进制内容 (Buffer)
      fs.writeFileSync(filePath, content);
    }

    return { success: true, filePath };
  } catch (error) {
    console.error("Save file error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  } catch (error) {
    console.error("Save dialog error:", error);
    return { canceled: true, error: error.message };
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
