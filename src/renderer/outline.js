/**
 * 大纲导航功能模块
 * 提供标题提取、导航生成、滚动同步等功能
 */
class OutlineNavigator {
  constructor() {
    this.outlinePanel = document.getElementById("outlinePanel");
    this.outlineContent = document.getElementById("outlineContent");
    this.outlineSearch = document.getElementById("outlineSearch");
    this.outlineToggle = document.getElementById("outlineToggle");
    this.keyboardShortcut = document.getElementById("keyboardShortcut");
    this.mainContent = document.querySelector(".main-content");

    this.headers = [];
    this.currentActiveId = null;
    this.isOutlineVisible = true;

    console.log("OutlineNavigator initialized");
    this.init();
  }

  init() {
    try {
      this.bindEvents();
      this.showKeyboardShortcut();
    } catch (error) {
      console.error("Failed to initialize outline navigator:", error);
    }
  }

  bindEvents() {
    // 大纲面板切换
    this.outlineToggle.addEventListener("click", () => {
      this.toggleOutline();
    });

    // 搜索功能
    this.outlineSearch.addEventListener("input", (e) => {
      this.filterOutline(e.target.value);
    });

    // 全局快捷键
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "\\") {
        e.preventDefault();
        this.toggleOutline();
      }
    });

    // 滚动同步
    this.mainContent.addEventListener("scroll", () => {
      this.updateActiveHeader();
    });

    // 监听大纲点击事件（事件委托）
    this.outlineContent.addEventListener("click", (e) => {
      if (e.target.classList.contains("outline-item")) {
        e.preventDefault();
        const headerId = e.target.dataset.headerId;
        this.scrollToHeader(headerId);
      }
    });
  }

  showKeyboardShortcut() {
    this.keyboardShortcut.classList.add("visible");
    setTimeout(() => {
      this.keyboardShortcut.classList.remove("visible");
    }, 3000);
  }

  toggleOutline() {
    this.isOutlineVisible = !this.isOutlineVisible;

    if (this.isOutlineVisible) {
      this.outlinePanel.classList.remove("hidden");
      this.outlineToggle.innerHTML = "✕";
      this.outlineToggle.title = "隐藏大纲 (Ctrl+\\)";
    } else {
      this.outlinePanel.classList.add("hidden");
      this.outlineToggle.innerHTML = "☰";
      this.outlineToggle.title = "显示大纲 (Ctrl+\\)";
    }
  }

  updateOutline(headers) {
    this.headers = headers || [];
    this.renderOutline();
  }

  renderOutline() {
    if (!this.headers || this.headers.length === 0) {
      this.outlineContent.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #586069; font-size: 13px;">
          当前文档没有标题
        </div>
      `;
      return;
    }

    const outlineHtml = this.headers
      .map((header) => this.createOutlineItem(header))
      .join("");

    this.outlineContent.innerHTML = outlineHtml;
  }

  createOutlineItem(header) {
    return `
      <a class="outline-item level-${header.level}" 
         data-header-id="${header.id}" 
         href="#${header.id}"
         title="${header.text}">
        ${this.escapeHtml(header.text)}
      </a>
    `;
  }

  filterOutline(searchTerm) {
    const items = this.outlineContent.querySelectorAll(".outline-item");
    const term = searchTerm.toLowerCase().trim();

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const isVisible = !term || text.includes(term);
      item.style.display = isVisible ? "block" : "none";
    });
  }

  scrollToHeader(headerId) {
    const element = document.getElementById(headerId);
    if (element) {
      // 平滑滚动到目标位置
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // 更新活动状态
      this.setActiveHeader(headerId);
    }
  }

  updateActiveHeader() {
    if (!this.headers || this.headers.length === 0) return;

    const scrollTop = this.mainContent.scrollTop;
    const offset = 100; // 偏移量，提前激活标题

    let activeHeader = null;

    // 找到当前可见的标题
    for (let i = this.headers.length - 1; i >= 0; i--) {
      const header = this.headers[i];
      const element = document.getElementById(header.id);

      if (element) {
        const rect = element.getBoundingClientRect();
        const containerRect = this.mainContent.getBoundingClientRect();

        // 相对于容器的位置
        const relativeTop = rect.top - containerRect.top;

        if (relativeTop <= offset) {
          activeHeader = header;
          break;
        }
      }
    }

    if (activeHeader && activeHeader.id !== this.currentActiveId) {
      this.setActiveHeader(activeHeader.id);
    }
  }

  setActiveHeader(headerId) {
    // 移除之前的活动状态
    const prevActive = this.outlineContent.querySelector(
      ".outline-item.active"
    );
    if (prevActive) {
      prevActive.classList.remove("active");
    }

    // 设置新的活动状态
    const newActive = this.outlineContent.querySelector(
      `[data-header-id="${headerId}"]`
    );
    if (newActive) {
      newActive.classList.add("active");
      this.currentActiveId = headerId;

      // 确保活动项可见
      this.scrollActiveItemIntoView(newActive);
    }
  }

  scrollActiveItemIntoView(activeItem) {
    const container = this.outlineContent;
    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    // 检查是否需要滚动
    if (itemRect.top < containerRect.top) {
      // 项目在容器上方，滚动到顶部
      container.scrollTop = activeItem.offsetTop - 10;
    } else if (itemRect.bottom > containerRect.bottom) {
      // 项目在容器下方，滚动到底部
      container.scrollTop =
        activeItem.offsetTop -
        container.clientHeight +
        activeItem.clientHeight +
        10;
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 重置大纲状态
  reset() {
    this.headers = [];
    this.currentActiveId = null;
    this.outlineSearch.value = "";
    this.renderOutline();
  }
}

// 导出给主模块使用
window.OutlineNavigator = OutlineNavigator;
