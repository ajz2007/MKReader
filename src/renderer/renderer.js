const contentElement = document.getElementById("content");
let stopWatching;
let currentFilePath = null;
let outlineNavigator = null;
let tabManager = null;
let exportManager = null;
let codeHighlighter = null;
let codeSettingsDialog = null;
let mermaidRenderer = null;
let mermaidSettingsDialog = null;

// 初始化所有组件
document.addEventListener("DOMContentLoaded", () => {
  try {
    // 初始化大纲导航器
    outlineNavigator = new OutlineNavigator();
    console.log("Outline navigator created successfully");

    // 初始化标签管理器
    tabManager = new TabManager();

    // 初始化导出管理器
    exportManager = new ExportManager(tabManager);

    // 初始化代码高亮器
    codeHighlighter = new CodeHighlighter();
    console.log("Code highlighter created successfully");

    // 初始化代码设置对话框
    codeSettingsDialog = new CodeHighlightSettings(codeHighlighter);

    // 初始化 Mermaid 渲染器
    mermaidRenderer = new MermaidRenderer();
    console.log("Mermaid renderer created successfully");

    // 初始化 Mermaid 设置对话框
    mermaidSettingsDialog = new MermaidSettingsDialog(mermaidRenderer);

    // 建立组件之间的关联
    tabManager.setOutlineNavigator(outlineNavigator);
    tabManager.setContentElement(contentElement);

    // 设置代码高亮回调
    tabManager.setCodeHighlighter(codeHighlighter);

    // 设置 Mermaid 渲染器回调
    tabManager.setMermaidRenderer(mermaidRenderer);

    console.log("Tab manager created successfully");
    console.log("Export manager created successfully");
  } catch (error) {
    console.error("Failed to initialize components:", error);
  }
});

// 重构后的文件渲染函数 - 现在通过标签管理器处理
const renderMarkdown = async (filePath) => {
  if (tabManager) {
    await tabManager.createTab(filePath);
  } else {
    // 降级处理（如果标签管理器未初始化）
    fallbackRenderMarkdown(filePath);
  }
};

// 降级渲染函数（保持向后兼容）
const fallbackRenderMarkdown = (filePath) => {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }
    const result = window.api.renderFile(filePath);
    contentElement.innerHTML = result.html;
    currentFilePath = filePath;

    // 应用代码高亮
    if (codeHighlighter && codeHighlighter.isInitialized) {
      setTimeout(() => {
        codeHighlighter.highlightAllCodeBlocks();
      }, 100);
    }

    // 更新大纲导航
    if (outlineNavigator) {
      outlineNavigator.updateOutline(result.headers);
      console.log("Outline updated with", result.headers.length, "headers");
    } else {
      console.warn("Outline navigator not yet initialized");
    }
  } catch (error) {
    console.error("Failed to render markdown:", error);
    contentElement.innerText = `Error loading file: ${filePath || "unknown"}`;

    // 重置大纲
    if (outlineNavigator) {
      outlineNavigator.reset();
    }
  }
}; // 渲染拖拽文件的方法 - 重构为支持标签页
const renderDroppedFile = async (file) => {
  try {
    const result = await window.api.renderDroppedFile(file);

    if (tabManager) {
      // 使用标签管理器创建新标签
      const tab = await tabManager.createTab(
        result.filePath || result.fileName,
        result.html
      );
      if (tab) {
        // 更新标签的标题信息
        tab.outlineHeaders = result.headers || [];
        if (outlineNavigator) {
          outlineNavigator.updateOutline(tab.outlineHeaders);
        }
      }
      return result.filePath;
    } else {
      // 降级处理
      contentElement.innerHTML = result.html;
      currentFilePath = result.filePath || result.fileName;

      if (outlineNavigator) {
        outlineNavigator.updateOutline(result.headers);
      }

      return result.filePath;
    }
  } catch (error) {
    console.error("Failed to render dropped file:", error);
    contentElement.innerText = `Error loading file: ${file.name}`;

    // 重置大纲
    if (outlineNavigator) {
      outlineNavigator.reset();
    }

    return null;
  }
};

// 打开文件的通用函数（用于菜单）
const openFile = (filePath) => {
  if (!filePath) {
    console.error("No file path provided");
    return;
  }

  if (stopWatching) {
    stopWatching();
  }

  renderMarkdown(filePath);
  stopWatching = window.api.watchFile(filePath, () => {
    renderMarkdown(filePath);
  });
};

// 打开拖拽文件的函数
const openDroppedFile = async (file) => {
  if (stopWatching) {
    stopWatching();
  }

  const filePath = await renderDroppedFile(file);

  // 只有当文件有有效路径时才启用监控
  if (filePath) {
    console.log("Setting up file watcher for:", filePath);
    stopWatching = window.api.watchFile(filePath, () => {
      renderMarkdown(filePath);
    });
  } else {
    console.log("File path not available, skipping file watcher setup");
  }
};

// 检查是否为支持的Markdown文件
const isMarkdownFile = (filePath) => {
  const markdownExtensions = [".md", ".markdown", ".mdown", ".mkd", ".mkdn"];
  return markdownExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
};

// 拖拽事件处理
let dragCounter = 0;

// 防止默认拖拽行为
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// 拖拽进入
document.addEventListener("dragenter", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter++;

  // 检查拖拽的文件类型
  const items = Array.from(e.dataTransfer.items);
  const hasMarkdownFile = items.some((item) => {
    if (item.kind === "file") {
      const file = item.getAsFile();
      return file && isMarkdownFile(file.name);
    }
    return false;
  });

  if (hasMarkdownFile) {
    document.body.classList.add("drag-over");
    document.body.classList.remove("drag-invalid");
  } else {
    document.body.classList.add("drag-invalid");
    document.body.classList.remove("drag-over");
  }
});

// 拖拽离开
document.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter--;

  if (dragCounter === 0) {
    document.body.classList.remove("drag-over", "drag-invalid");
  }
});

// 拖拽释放
document.addEventListener("drop", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter = 0;
  document.body.classList.remove("drag-over", "drag-invalid");

  const files = Array.from(e.dataTransfer.files);

  // 查找第一个Markdown文件
  const markdownFile = files.find((file) => isMarkdownFile(file.name));

  if (markdownFile) {
    console.log("Opening file via drag and drop:", markdownFile.name);
    console.log("File path from drop event:", markdownFile.path);

    // 使用新的方法处理拖拽文件
    try {
      await openDroppedFile(markdownFile);
    } catch (error) {
      console.error("Error opening dropped file:", error);
      contentElement.innerHTML =
        "<h2>⚠️ Error</h2><p>Failed to open the dropped file. Please try using File > Open instead.</p>";
      setTimeout(() => {
        if (
          contentElement.innerHTML.includes("Failed to open the dropped file")
        ) {
          contentElement.innerHTML =
            "<h1>Welcome to MKReader</h1><p>Use File > Open File (Ctrl+O) to select a Markdown file, or drag and drop a .md file here.</p>";
        }
      }, 3000);
    }
  } else {
    // 显示错误提示
    contentElement.innerHTML =
      "<h2>⚠️ File type not supported</h2><p>Please drop a Markdown file (.md) to preview.</p>";

    // 重置大纲
    if (outlineNavigator) {
      outlineNavigator.reset();
    }

    setTimeout(() => {
      if (contentElement.innerHTML.includes("File type not supported")) {
        contentElement.innerHTML =
          "<h1>Welcome to MKReader</h1><p>Use File > Open File (Ctrl+O) to select a Markdown file, or drag and drop a .md file here.</p>";
      }
    }, 3000);
  }
});

// Set initial content
contentElement.innerHTML =
  "<h1>Welcome to MKReader</h1><p>Use File > Open File (Ctrl+O) to select a Markdown file, or drag and drop a .md file here.</p>";

// Listen for the file-opened event from the main process
window.api.onFileOpened((filePath) => {
  console.log("Single file opened:", filePath);
  openFile(filePath);
});

// Listen for multiple files opened event
window.api.onOpenMultipleFiles((filePaths) => {
  console.log("Multiple files opened:", filePaths);
  if (tabManager) {
    filePaths.forEach(async (filePath) => {
      await tabManager.createTab(filePath);
    });
  } else {
    // 降级处理：只打开第一个文件
    if (filePaths.length > 0) {
      openFile(filePaths[0]);
    }
  }
});

// Listen for the toggle-outline event from the main process
window.api.onToggleOutline(() => {
  if (outlineNavigator) {
    outlineNavigator.toggleOutline();
  }
});

// Listen for the open-code-settings event from the main process
window.api.onOpenCodeSettings(() => {
  if (codeSettingsDialog) {
    codeSettingsDialog.show();
  }
});

// Listen for the open-mermaid-settings event from the main process
window.api.onOpenMermaidSettings(() => {
  if (mermaidSettingsDialog) {
    mermaidSettingsDialog.show();
  }
});

// Listen for the show-welcome-message event from the main process
window.api.onShowWelcomeMessage(() => {
  showWelcomeMessage();
});

// 显示欢迎消息的函数
function showWelcomeMessage() {
  contentElement.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
      <h1 style="color: #0366d6; margin-bottom: 20px;">欢迎使用 MKReader</h1>
      <p style="font-size: 18px; color: #586069; margin-bottom: 30px;">一个简洁易用的 Markdown 文件阅读器</p>
      
      <div style="background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="margin-top: 0; color: #24292e;">开始使用</h2>
        <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
          <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
            <button onclick="window.api.openFileDialog()" style="
              background: #0366d6; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              font-size: 16px; 
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              📁 选择文件 (Ctrl+O)
            </button>
            <button onclick="window.api.openMultipleFileDialog()" style="
              background: #28a745; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              font-size: 16px; 
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              📚 打开多个文件 (Ctrl+Shift+O)
            </button>
          </div>
          <p style="margin: 15px 0 0 0; color: #586069;">或者直接将 .md 文件拖拽到这里</p>
        </div>
      </div>

      <div style="text-align: left; background: white; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px;">
        <h3 style="margin-top: 0; color: #24292e;">支持的功能</h3>
        <ul style="color: #586069; line-height: 1.6;">
          <li>📖 标准 Markdown 语法渲染</li>
          <li>🎨 代码语法高亮 (支持多种主题)</li>
          <li>📊 Mermaid 图表渲染</li>
          <li>🗂️ 多标签页管理</li>
          <li>📑 文档大纲导航</li>
          <li>📤 导出为 PDF/HTML</li>
          <li>🌙 深色/浅色主题切换</li>
        </ul>
      </div>
    </div>
  `;
}
