/**
 * 导出管理器
 * 支持 PDF、HTML、PNG 三种格式的导出功能
 */
class ExportManager {
  constructor(tabManager = null) {
    this.exporters = new Map();
    this.tabManager = tabManager;
    this.currentDocument = null;

    this.init();
  }

  init() {
    this.registerExporters();
    this.createExportUI();
  }

  /**
   * 注册所有导出器
   */
  registerExporters() {
    this.exporters.set("pdf", new PDFExporter());
    this.exporters.set("html", new HTMLExporter());
    this.exporters.set("png", new PNGExporter());
  }

  /**
   * 显示导出对话框
   */
  showExportDialog(defaultFormat = "pdf") {
    const dialog = new ExportDialog(this);
    dialog.show(defaultFormat);
  }

  /**
   * 执行导出
   */
  async export(format, options = {}) {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new Error(`不支持的导出格式: ${format}`);
    }

    // 获取当前文档内容
    const activeTab = this.tabManager ? this.tabManager.getActiveTab() : null;
    if (!activeTab) {
      throw new Error("没有可导出的文档");
    }

    const content = this.getCurrentContent();
    const defaultFilename = this.generateFilename(activeTab, format);

    // 显示文件保存对话框选择路径
    const saveDialogResult = await window.api.showSaveDialog({
      title: `导出为 ${format.toUpperCase()}`,
      defaultPath: defaultFilename,
      filters: this.getFileFilters(format),
      properties: ["createDirectory"],
    });

    // 用户取消了保存
    if (saveDialogResult.canceled) {
      return { canceled: true };
    }

    const selectedPath = saveDialogResult.filePath;
    if (!selectedPath) {
      throw new Error("未选择保存路径");
    }

    // 显示进度对话框
    const progressDialog = new ExportProgressDialog();
    progressDialog.show(`导出为 ${format.toUpperCase()}`);

    try {
      // 执行导出
      const result = await exporter.export(content, {
        ...options,
        filename: selectedPath, // 使用用户选择的完整路径
        progressCallback: (progress, status) => {
          progressDialog.updateProgress(progress, status);
        },
      });

      progressDialog.close();

      // 显示完成对话框
      this.showCompletionDialog(result.filePath, format);

      return result;
    } catch (error) {
      progressDialog.close();
      this.showErrorDialog(error.message);
      throw error;
    }
  }

  /**
   * 快速导出（使用默认设置但仍选择路径）
   */
  async quickExport(format) {
    const defaultOptions = this.getDefaultOptions(format);
    return this.export(format, defaultOptions);
  }

  /**
   * 获取当前文档内容
   */
  getCurrentContent() {
    const contentElement = document.getElementById("content");
    return {
      html: contentElement.innerHTML,
      element: contentElement,
      title: this.getCurrentTitle(),
      url: window.location.href,
    };
  }

  /**
   * 获取当前文档标题
   */
  getCurrentTitle() {
    if (this.tabManager) {
      const activeTab = this.tabManager.getActiveTab();
      return activeTab ? activeTab.displayName : "Document";
    }
    return "Document";
  }

  /**
   * 生成文件名
   */
  generateFilename(tab, format) {
    const baseName = tab
      ? tab.displayName.replace(/[^\w\s-]/g, "")
      : "document";
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseName}-${timestamp}.${format}`;
  }

  /**
   * 获取默认导出选项
   */
  getDefaultOptions(format) {
    const defaults = {
      pdf: {
        pageSize: "A4",
        orientation: "portrait",
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        includeBackground: true,
      },
      html: {
        standalone: true,
        includeCSS: true,
        theme: "github",
      },
      png: {
        width: 1200,
        quality: 0.9,
        background: "#ffffff",
      },
    };
    return defaults[format] || {};
  }

  /**
   * 获取文件过滤器（用于保存对话框）
   */
  getFileFilters(format) {
    const filters = {
      pdf: [
        { name: "PDF 文档", extensions: ["pdf"] },
        { name: "所有文件", extensions: ["*"] },
      ],
      html: [
        { name: "HTML 文档", extensions: ["html", "htm"] },
        { name: "所有文件", extensions: ["*"] },
      ],
      png: [
        { name: "PNG 图片", extensions: ["png"] },
        { name: "图片文件", extensions: ["png", "jpg", "jpeg", "gif", "bmp"] },
        { name: "所有文件", extensions: ["*"] },
      ],
    };
    return filters[format] || [{ name: "所有文件", extensions: ["*"] }];
  }

  /**
   * 创建导出UI元素
   */
  createExportUI() {
    this.createExportButton();
  }

  /**
   * 创建导出按钮
   */
  createExportButton() {
    const exportContainer = document.getElementById("exportContainer");
    if (!exportContainer) {
      console.warn("Export container not found, retrying...");
      // 如果容器不存在，延迟重试
      setTimeout(() => this.createExportButton(), 100);
      return;
    }

    const exportButton = document.createElement("button");
    exportButton.className = "export-btn toolbar-btn";
    exportButton.innerHTML = "📤 导出";
    exportButton.title = "导出文档 (Ctrl+E)";

    // 添加到工具栏容器
    exportContainer.appendChild(exportButton);

    // 绑定事件
    exportButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.showExportMenu(e);
    });

    // 绑定快捷键
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        this.showExportDialog();
      }
    });
  }

  /**
   * 显示导出菜单
   */
  showExportMenu(event) {
    const menu = document.createElement("div");
    menu.className = "export-menu";
    menu.innerHTML = `
      <div class="export-menu-item" data-format="pdf">
        <span class="icon">📄</span>
        <span class="text">导出为 PDF</span>
        <span class="shortcut">Ctrl+Shift+P</span>
      </div>
      <div class="export-menu-item" data-format="html">
        <span class="icon">🌐</span>
        <span class="text">导出为 HTML</span>
        <span class="shortcut">Ctrl+Shift+H</span>
      </div>
      <div class="export-menu-item" data-format="png">
        <span class="icon">🖼️</span>
        <span class="text">导出为图片</span>
        <span class="shortcut">Ctrl+Shift+I</span>
      </div>
      <div class="export-menu-divider"></div>
      <div class="export-menu-item" data-action="options">
        <span class="icon">⚙️</span>
        <span class="text">导出设置...</span>
      </div>
    `;

    // 定位菜单
    const rect = event.target.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    menu.style.zIndex = "1000";

    document.body.appendChild(menu);

    // 绑定菜单项点击事件
    menu.addEventListener("click", async (e) => {
      e.stopPropagation();
      const item = e.target.closest(".export-menu-item");
      if (!item) return;

      const format = item.dataset.format;
      const action = item.dataset.action;

      // 安全地移除菜单
      if (menu.parentNode) {
        menu.parentNode.removeChild(menu);
      }

      if (format) {
        try {
          await this.quickExport(format);
        } catch (error) {
          console.error("导出失败:", error);
        }
      } else if (action === "options") {
        this.showExportDialog();
      }
    });

    // 点击其他地方关闭菜单
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        // 检查菜单是否仍然存在于DOM中
        if (menu.parentNode) {
          menu.parentNode.removeChild(menu);
        }
        document.removeEventListener("click", closeMenu);
      }
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
  }

  /**
   * 显示完成对话框
   */
  async showCompletionDialog(filePath, format) {
    const formatNames = {
      pdf: "PDF文档",
      html: "HTML网页",
      png: "PNG图片",
    };

    // 创建通知元素
    const notification = document.createElement("div");
    notification.className = "export-notification success";
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">✅</div>
        <div class="notification-text">
          <div class="notification-title">导出成功</div>
          <div class="notification-message">${formatNames[format]} 已保存到：${filePath}</div>
        </div>
        <div class="notification-actions">
          <button class="notification-btn open-file">打开文件</button>
          <button class="notification-btn open-folder">打开文件夹</button>
          <button class="notification-btn close">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // 绑定按钮事件
    notification.querySelector(".open-file").addEventListener("click", () => {
      window.api.openFile(filePath);
      document.body.removeChild(notification);
    });

    notification.querySelector(".open-folder").addEventListener("click", () => {
      window.api.showInFolder(filePath);
      document.body.removeChild(notification);
    });

    notification.querySelector(".close").addEventListener("click", () => {
      document.body.removeChild(notification);
    });

    // 5秒后自动关闭
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * 显示错误对话框
   */
  showErrorDialog(message) {
    const notification = document.createElement("div");
    notification.className = "export-notification error";
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">❌</div>
        <div class="notification-text">
          <div class="notification-title">导出失败</div>
          <div class="notification-message">${message}</div>
        </div>
        <div class="notification-actions">
          <button class="notification-btn close">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    notification.querySelector(".close").addEventListener("click", () => {
      document.body.removeChild(notification);
    });

    // 3秒后自动关闭
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * 设置标签管理器引用
   */
  setTabManager(tabManager) {
    this.tabManager = tabManager;
  }

  /**
   * 获取支持的格式列表
   */
  getSupportedFormats() {
    return Array.from(this.exporters.keys());
  }
}

// 导出供主模块使用
window.ExportManager = ExportManager;
