/**
 * 标签页管理器
 * 负责多文件标签页的创建、切换、关闭等功能
 */
class TabManager {
  constructor() {
    this.tabs = new Map();
    this.activeTabId = null;
    this.tabIdCounter = 0;
    this.maxTabs = 10;

    // DOM 元素
    this.tabContainer = null;
    this.tabsContent = null;
    this.newTabBtn = null;
    this.tabMenuBtn = null;

    // 绑定的组件
    this.outlineNavigator = null;
    this.contentElement = null;
    this.codeHighlighter = null;
    this.mermaidRenderer = null;

    this.init();
  }

  init() {
    this.createTabBarUI();
    this.bindEvents();
    this.loadSavedTabs();
  }

  /**
   * 创建标签栏UI
   */
  createTabBarUI() {
    // 创建标签栏容器
    const tabBarHTML = `
      <div class="tab-container" id="tabContainer">
        <div class="tab-bar">
          <div class="tabs-wrapper" id="tabsWrapper">
            <div class="tab-scroll-left" id="tabScrollLeft">‹</div>
            <div class="tabs-content" id="tabsContent">
              <!-- 动态生成的标签 -->
            </div>
            <div class="tab-scroll-right" id="tabScrollRight">›</div>
          </div>
          <div class="toolbar" id="toolbar">
            <div class="export-container" id="exportContainer">
              <!-- 导出按钮将由ExportManager动态添加 -->
            </div>
          </div>
          <button class="new-tab-btn" id="newTabBtn" title="打开新文件 (Ctrl+T)">+</button>
          <button class="tab-menu-btn" id="tabMenuBtn" title="标签选项">⋮</button>
        </div>
      </div>
    `;

    // 插入到页面顶部
    document.body.insertAdjacentHTML("afterbegin", tabBarHTML);

    // 获取DOM引用
    this.tabContainer = document.getElementById("tabContainer");
    this.tabsContent = document.getElementById("tabsContent");
    this.newTabBtn = document.getElementById("newTabBtn");
    this.tabMenuBtn = document.getElementById("tabMenuBtn");
    this.tabScrollLeft = document.getElementById("tabScrollLeft");
    this.tabScrollRight = document.getElementById("tabScrollRight");
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 新建标签按钮
    this.newTabBtn.addEventListener("click", () => {
      this.openNewTab();
    });

    // 标签菜单按钮
    this.tabMenuBtn.addEventListener("click", (e) => {
      this.showTabMenu(e);
    });

    // 标签滚动按钮
    this.tabScrollLeft.addEventListener("click", () => {
      this.scrollTabs("left");
    });

    this.tabScrollRight.addEventListener("click", () => {
      this.scrollTabs("right");
    });

    // 全局快捷键
    document.addEventListener("keydown", (e) => {
      this.handleKeydown(e);
    });

    // 标签容器事件委托
    this.tabsContent.addEventListener("click", (e) => {
      this.handleTabClick(e);
    });

    // 鼠标中键关闭标签
    this.tabsContent.addEventListener("mousedown", (e) => {
      if (e.button === 1) {
        // 中键
        e.preventDefault();
        const tabElement = e.target.closest(".tab");
        if (tabElement) {
          const tabId = tabElement.dataset.tabId;
          this.closeTab(tabId);
        }
      }
    });

    // 右键菜单
    this.tabsContent.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const tabElement = e.target.closest(".tab");
      if (tabElement) {
        const tabId = tabElement.dataset.tabId;
        this.showTabContextMenu(e, tabId);
      }
    });
  }

  /**
   * 创建新标签
   */
  async createTab(filePath, content = null) {
    // 检查是否已经打开
    const existingTab = this.findTabByPath(filePath);
    if (existingTab) {
      this.switchTab(existingTab.id);
      return existingTab;
    }

    // 检查标签数量限制
    if (this.tabs.size >= this.maxTabs) {
      this.showMaxTabsWarning();
      return null;
    }

    try {
      let result = { html: content, headers: [] };

      // 读取文件内容（如果没有提供）
      if (!content && filePath) {
        result = await window.api.renderFile(filePath);
        content = result.html;
      }

      // 创建标签数据
      const tab = new Tab(filePath, content);
      tab.outlineHeaders = result.headers || [];
      this.tabs.set(tab.id, tab);

      // 渲染标签UI
      this.renderTabElement(tab);

      // 切换到新标签
      this.switchTab(tab.id);

      // 保存状态
      this.saveTabsState();

      console.log(`Created new tab: ${tab.displayName}`);
      return tab;
    } catch (error) {
      console.error("Failed to create tab:", error);
      this.showError(`无法打开文件: ${error.message}`);
      return null;
    }
  }

  /**
   * 关闭标签
   */
  closeTab(tabId, force = false) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    // 检查是否有未保存的更改
    if (!force && tab.isModified) {
      if (!this.confirmCloseModifiedTab(tab)) {
        return;
      }
    }

    // 清理资源
    if (tab.fileWatcher) {
      tab.fileWatcher.close();
    }

    // 移除标签
    this.tabs.delete(tabId);

    // 移除UI元素
    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.remove();
    }

    // 如果关闭的是活动标签，切换到其他标签
    if (this.activeTabId === tabId) {
      this.switchToAlternativeTab();
    }

    // 如果没有标签了，显示欢迎页面
    if (this.tabs.size === 0) {
      this.showWelcomePage();
    }

    // 保存状态
    this.saveTabsState();

    console.log(`Closed tab: ${tab.displayName}`);
  }

  /**
   * 切换标签
   */
  switchTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    // 保存当前标签状态
    if (this.activeTabId && this.activeTabId !== tabId) {
      this.saveCurrentTabState();
    }

    // 更新活动标签
    this.activeTabId = tabId;

    // 更新UI状态
    this.updateTabAppearance();

    // 恢复标签内容
    this.restoreTabContent(tab);

    // 更新大纲导航
    if (this.outlineNavigator) {
      this.outlineNavigator.updateOutline(tab.outlineHeaders || []);
    }

    // 恢复滚动位置
    if (this.contentElement) {
      this.contentElement.scrollTop = tab.scrollPosition || 0;
    }

    // 保存状态
    this.saveTabsState();

    console.log(`Switched to tab: ${tab.displayName}`);
  }

  /**
   * 打开新标签（文件选择器）
   */
  async openNewTab() {
    try {
      // 通过主进程打开文件选择器
      window.api.openFileDialog();
    } catch (error) {
      console.error("Failed to open file dialog:", error);
    }
  }

  /**
   * 通过文件路径查找标签
   */
  findTabByPath(filePath) {
    for (const tab of this.tabs.values()) {
      if (tab.filePath === filePath) {
        return tab;
      }
    }
    return null;
  }

  /**
   * 渲染标签元素
   */
  renderTabElement(tab) {
    const tabHTML = `
      <div class="tab" data-tab-id="${tab.id}" title="${
      tab.filePath || tab.displayName
    }">
        <div class="tab-icon">📄</div>
        <div class="tab-title">${tab.displayName}</div>
        <div class="tab-modified ${tab.isModified ? "visible" : ""}">●</div>
        <div class="tab-close" title="关闭 (Ctrl+W)">×</div>
      </div>
    `;

    this.tabsContent.insertAdjacentHTML("beforeend", tabHTML);
    this.updateTabScrollButtons();
  }

  /**
   * 更新标签外观
   */
  updateTabAppearance() {
    // 移除所有活动状态
    document.querySelectorAll(".tab.active").forEach((tab) => {
      tab.classList.remove("active");
    });

    // 添加当前活动标签的样式
    if (this.activeTabId) {
      const activeTab = document.querySelector(
        `[data-tab-id="${this.activeTabId}"]`
      );
      if (activeTab) {
        activeTab.classList.add("active");
      }
    }
  }

  /**
   * 处理标签点击事件
   */
  handleTabClick(e) {
    const tabElement = e.target.closest(".tab");
    if (!tabElement) return;

    const tabId = tabElement.dataset.tabId;

    if (e.target.classList.contains("tab-close")) {
      // 点击关闭按钮
      e.stopPropagation();
      this.closeTab(tabId);
    } else {
      // 点击标签切换
      this.switchTab(tabId);
    }
  }

  /**
   * 处理键盘快捷键
   */
  handleKeydown(e) {
    if (e.ctrlKey) {
      switch (e.key) {
        case "t":
        case "T":
          e.preventDefault();
          this.openNewTab();
          break;
        case "w":
        case "W":
          e.preventDefault();
          if (this.activeTabId) {
            this.closeTab(this.activeTabId);
          }
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            this.switchToPrevTab();
          } else {
            this.switchToNextTab();
          }
          break;
        default:
          // Ctrl+数字 切换到指定标签
          const num = parseInt(e.key);
          if (num >= 1 && num <= 9) {
            e.preventDefault();
            this.switchToTabByIndex(num - 1);
          }
          break;
      }
    }
  }

  /**
   * 切换到下一个标签
   */
  switchToNextTab() {
    const tabIds = Array.from(this.tabs.keys());
    const currentIndex = tabIds.indexOf(this.activeTabId);
    const nextIndex = (currentIndex + 1) % tabIds.length;
    this.switchTab(tabIds[nextIndex]);
  }

  /**
   * 切换到上一个标签
   */
  switchToPrevTab() {
    const tabIds = Array.from(this.tabs.keys());
    const currentIndex = tabIds.indexOf(this.activeTabId);
    const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    this.switchTab(tabIds[prevIndex]);
  }

  /**
   * 按索引切换标签
   */
  switchToTabByIndex(index) {
    const tabIds = Array.from(this.tabs.keys());
    if (index >= 0 && index < tabIds.length) {
      this.switchTab(tabIds[index]);
    }
  }

  /**
   * 保存标签状态
   */
  saveTabsState() {
    try {
      const tabsData = {
        tabs: Array.from(this.tabs.values()).map((tab) => ({
          id: tab.id,
          filePath: tab.filePath,
          displayName: tab.displayName,
          isModified: tab.isModified,
          scrollPosition: tab.scrollPosition,
        })),
        activeTabId: this.activeTabId,
        timestamp: Date.now(),
      };

      localStorage.setItem("mkreader-tabs", JSON.stringify(tabsData));
    } catch (error) {
      console.error("Failed to save tabs state:", error);
    }
  }

  /**
   * 加载保存的标签
   */
  async loadSavedTabs() {
    try {
      const saved = localStorage.getItem("mkreader-tabs");
      if (!saved) return;

      const tabsData = JSON.parse(saved);

      // 验证保存的数据
      if (!tabsData.tabs || !Array.isArray(tabsData.tabs)) return;

      // 恢复标签
      for (const tabData of tabsData.tabs) {
        if (tabData.filePath && (await this.fileExists(tabData.filePath))) {
          await this.createTab(tabData.filePath);
        }
      }

      // 恢复活动标签
      if (tabsData.activeTabId && this.tabs.has(tabsData.activeTabId)) {
        this.switchTab(tabsData.activeTabId);
      }
    } catch (error) {
      console.error("Failed to load saved tabs:", error);
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filePath) {
    try {
      return await window.api.fileExists(filePath);
    } catch {
      return false;
    }
  }

  // 其他辅助方法...
  saveCurrentTabState() {
    if (this.activeTabId && this.contentElement) {
      const tab = this.tabs.get(this.activeTabId);
      if (tab) {
        tab.scrollPosition = this.contentElement.scrollTop;
      }
    }
  }

  restoreTabContent(tab) {
    if (this.contentElement && tab.content) {
      this.contentElement.innerHTML = tab.content;

      // 先渲染 Mermaid 图表，然后再进行代码高亮
      if (this.mermaidRenderer && this.mermaidRenderer.isInitialized) {
        setTimeout(() => {
          this.mermaidRenderer.renderAllMermaidBlocks();

          // Mermaid 渲染完成后再进行代码高亮
          if (this.codeHighlighter && this.codeHighlighter.isInitialized) {
            setTimeout(() => {
              this.codeHighlighter.highlightAllCodeBlocks();
            }, 50);
          }
        }, 50);
      } else {
        // 如果没有 Mermaid 渲染器，直接进行代码高亮
        if (this.codeHighlighter && this.codeHighlighter.isInitialized) {
          setTimeout(() => {
            this.codeHighlighter.highlightAllCodeBlocks();
          }, 50);
        }
      }
    }
  }

  switchToAlternativeTab() {
    const tabIds = Array.from(this.tabs.keys());
    if (tabIds.length > 0) {
      this.switchTab(tabIds[0]);
    } else {
      this.activeTabId = null;
    }
  }

  showWelcomePage() {
    if (this.contentElement) {
      this.contentElement.innerHTML = `
        <h1>Welcome to MKReader</h1>
        <p>Use File > Open File (Ctrl+O) or click the + button to open a Markdown file.</p>
      `;
    }
    this.activeTabId = null;
  }

  updateTabScrollButtons() {
    // 简化实现，后续可以添加滚动逻辑
    const hasOverflow =
      this.tabsContent.scrollWidth > this.tabsContent.clientWidth;
    this.tabScrollLeft.style.display = hasOverflow ? "block" : "none";
    this.tabScrollRight.style.display = hasOverflow ? "block" : "none";
  }

  showError(message) {
    // 简单的错误提示，可以后续改进
    alert(message);
  }

  showMaxTabsWarning() {
    alert(`最多只能打开 ${this.maxTabs} 个标签页`);
  }

  confirmCloseModifiedTab(tab) {
    return confirm(`文件 "${tab.displayName}" 有未保存的更改，确定要关闭吗？`);
  }

  scrollTabs(direction) {
    const scrollAmount = 100;
    if (direction === "left") {
      this.tabsContent.scrollLeft -= scrollAmount;
    } else {
      this.tabsContent.scrollLeft += scrollAmount;
    }
  }

  showTabMenu(e) {
    // 实现标签菜单，暂时用简单的alert代替
    alert("标签菜单功能待实现");
  }

  showTabContextMenu(e, tabId) {
    // 实现右键菜单，暂时用简单的alert代替
    const tab = this.tabs.get(tabId);
    alert(`右键菜单: ${tab.displayName}`);
  }

  // 公共接口方法
  setOutlineNavigator(navigator) {
    this.outlineNavigator = navigator;
  }

  setContentElement(element) {
    this.contentElement = element;
  }

  setCodeHighlighter(highlighter) {
    this.codeHighlighter = highlighter;
  }

  setMermaidRenderer(renderer) {
    this.mermaidRenderer = renderer;
  }

  getActiveTab() {
    return this.activeTabId ? this.tabs.get(this.activeTabId) : null;
  }

  getAllTabs() {
    return Array.from(this.tabs.values());
  }
}

/**
 * 标签页数据类
 */
class Tab {
  constructor(filePath, content = "") {
    this.id = this.generateId();
    this.filePath = filePath;
    this.fileName = filePath ? this.extractFileName(filePath) : "Untitled";
    this.displayName = this.fileName.replace(/\.md$/i, "");
    this.content = content;
    this.isModified = false;
    this.scrollPosition = 0;
    this.outlineHeaders = [];
    this.fileWatcher = null;
    this.lastModified = Date.now();
  }

  generateId() {
    return "tab-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }

  extractFileName(filePath) {
    return filePath.split(/[/\\]/).pop();
  }

  markAsModified() {
    this.isModified = true;
    this.updateModifiedIndicator();
  }

  markAsSaved() {
    this.isModified = false;
    this.updateModifiedIndicator();
  }

  updateModifiedIndicator() {
    const tabElement = document.querySelector(`[data-tab-id="${this.id}"]`);
    if (tabElement) {
      const indicator = tabElement.querySelector(".tab-modified");
      if (indicator) {
        indicator.classList.toggle("visible", this.isModified);
      }
    }
  }
}

// 导出供主模块使用
window.TabManager = TabManager;
window.Tab = Tab;
