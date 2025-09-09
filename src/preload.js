const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const chokidar = require("chokidar");
const MarkdownIt = require("markdown-it");
const path = require("path");

const md = new MarkdownIt();

// 生成唯一ID的辅助函数
const generateId = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // 移除特殊字符
    .replace(/\s+/g, "-") // 空格替换为连字符
    .trim();
};

// 提取标题的函数
const extractHeaders = (content) => {
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  const headers = [];
  let match;
  const lines = content.split("\n");

  while ((match = headerRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateId(text);

    // 计算行号
    const beforeMatch = content.substring(0, match.index);
    const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

    headers.push({
      id,
      level,
      text,
      line: lineNumber,
      rawMatch: match[0],
    });
  }

  return headers;
};

// 为标题添加ID的markdown-it插件
const addHeaderIds = (md) => {
  const defaultRender =
    md.renderer.rules.heading_open ||
    function (tokens, idx, options, env, renderer) {
      return renderer.renderToken(tokens, idx, options);
    };

  md.renderer.rules.heading_open = function (
    tokens,
    idx,
    options,
    env,
    renderer
  ) {
    const token = tokens[idx];
    const title = tokens[idx + 1].content;
    const id = generateId(title);

    if (token.attrIndex("id") < 0) {
      token.attrPush(["id", id]);
    }

    return defaultRender(tokens, idx, options, env, renderer);
  };
};

// 配置markdown-it
md.use(addHeaderIds);

contextBridge.exposeInMainWorld("api", {
  renderFile: (filePath) => {
    if (!filePath) {
      throw new Error("File path is required");
    }
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const html = md.render(content);
      const headers = extractHeaders(content);
      return { html, headers };
    } catch (error) {
      console.error("Error reading file:", error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  },
  // 处理拖拽文件的方法
  renderDroppedFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const html = md.render(content);
          const headers = extractHeaders(content);
          resolve({
            html: html,
            headers: headers,
            fileName: file.name,
            filePath: file.path || null, // 可能为undefined
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  },
  onFileOpened: (callback) =>
    ipcRenderer.on("file-opened", (event, filePath) => {
      console.log("File opened via IPC:", filePath);
      callback(filePath);
    }),
  onToggleOutline: (callback) =>
    ipcRenderer.on("toggle-outline", () => {
      callback();
    }),
  onOpenCodeSettings: (callback) =>
    ipcRenderer.on("open-code-settings", () => {
      callback();
    }),
  onOpenMermaidSettings: (callback) =>
    ipcRenderer.on("open-mermaid-settings", () => {
      callback();
    }),
  onShowWelcomeMessage: (callback) =>
    ipcRenderer.on("show-welcome-message", () => {
      callback();
    }),

  // 标签页相关API
  openFileDialog: () => {
    ipcRenderer.send("open-file-dialog");
  },
  openMultipleFileDialog: () => {
    ipcRenderer.send("open-multiple-file-dialog");
  },

  fileExists: (filePath) => {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  },

  onOpenMultipleFiles: (callback) =>
    ipcRenderer.on("open-multiple-files", (event, filePaths) => {
      callback(filePaths);
    }),
  watchFile: (filePath, callback) => {
    // 如果没有文件路径，返回一个空函数
    if (!filePath) {
      console.warn("No file path provided for watching");
      return () => {};
    }
    const watcher = chokidar.watch(filePath);
    watcher.on("change", () => callback());
    // Return a function to stop watching
    return () => watcher.close();
  },

  // 导出相关API
  exportToPDF: async (content, options) => {
    return await ipcRenderer.invoke("export-to-pdf", content, options);
  },

  exportToHTML: async (content, options) => {
    return await ipcRenderer.invoke("export-to-html", content, options);
  },

  exportToPNG: async (content, options) => {
    return await ipcRenderer.invoke("export-to-png", content, options);
  },

  saveFile: async (filePath, content) => {
    return await ipcRenderer.invoke("save-file", filePath, content);
  },

  showSaveDialog: async (options) => {
    return await ipcRenderer.invoke("show-save-dialog", options);
  },

  getStylesheets: () => {
    const stylesheets = [];
    for (const sheet of document.styleSheets) {
      try {
        const rules = [];
        for (const rule of sheet.cssRules) {
          rules.push(rule.cssText);
        }
        stylesheets.push({
          href: sheet.href,
          rules: rules,
        });
      } catch (e) {
        // 跨域CSS无法访问，跳过
        console.warn("Cannot access stylesheet:", sheet.href);
      }
    }
    return stylesheets;
  },
});
