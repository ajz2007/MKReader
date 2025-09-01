/**
 * Mermaid 设置对话框
 */
class MermaidSettingsDialog {
  constructor(mermaidRenderer) {
    this.mermaidRenderer = mermaidRenderer;
    this.dialog = null;
    this.currentSettings = this.mermaidRenderer.getCurrentSettings();
  }

  /**
   * 显示设置对话框
   */
  show() {
    if (this.dialog) {
      this.dialog.remove();
    }

    this.createDialog();
    this.populateSettings();
    this.attachEventListeners();

    // 显示对话框
    document.body.appendChild(this.dialog);
    this.dialog.classList.add("show");

    // 聚焦第一个输入元素
    const firstInput = this.dialog.querySelector("input, select");
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * 隐藏设置对话框
   */
  hide() {
    if (this.dialog) {
      this.dialog.classList.remove("show");
      setTimeout(() => {
        if (this.dialog && this.dialog.parentNode) {
          this.dialog.parentNode.removeChild(this.dialog);
        }
        this.dialog = null;
      }, 300);
    }
  }

  /**
   * 创建对话框HTML
   */
  createDialog() {
    this.dialog = document.createElement("div");
    this.dialog.className = "mermaid-settings-dialog";
    this.dialog.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>🧜‍♀️ Mermaid 图表设置</h3>
          <button class="close-btn" title="关闭">×</button>
        </div>
        
        <div class="dialog-body">
          <div class="settings-tabs">
            <button class="tab-btn active" data-tab="general">常规设置</button>
            <button class="tab-btn" data-tab="appearance">外观主题</button>
            <button class="tab-btn" data-tab="controls">控制选项</button>
            <button class="tab-btn" data-tab="examples">示例模板</button>
          </div>
          
          <!-- 常规设置面板 -->
          <div class="tab-panel active" data-panel="general">
            <div class="setting-group">
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="enableMermaid">
                  <span class="setting-title">启用 Mermaid 图表渲染</span>
                  <span class="setting-desc">在 Markdown 中自动渲染 Mermaid 代码块</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="autoFitWidth">
                  <span class="setting-title">自动适应宽度</span>
                  <span class="setting-desc">图表自动适应容器宽度</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="enableInteraction">
                  <span class="setting-title">启用交互功能</span>
                  <span class="setting-desc">允许点击图表元素进行交互</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="autoWrapText">
                  <span class="setting-title">自动文本换行</span>
                  <span class="setting-desc">长文本自动换行显示</span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- 外观主题面板 -->
          <div class="tab-panel" data-panel="appearance">
            <div class="setting-group">
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">图表主题</span>
                  <select id="mermaidTheme" class="setting-select">
                    <option value="default">默认主题</option>
                    <option value="neutral">中性主题</option>
                    <option value="dark">暗色主题</option>
                    <option value="forest">森林主题</option>
                    <option value="base">基础主题</option>
                  </select>
                  <span class="setting-desc">选择图表的显示主题</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="showParticipantLabels">
                  <span class="setting-title">显示参与者标签</span>
                  <span class="setting-desc">在序列图中显示参与者名称</span>
                </label>
              </div>
            </div>
            
            <div class="theme-preview">
              <h4>主题预览</h4>
              <div class="preview-container">
                <div class="preview-diagram" id="themePreview">
                  <div class="preview-loading">正在加载预览...</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 控制选项面板 -->
          <div class="tab-panel" data-panel="controls">
            <div class="setting-group">
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="showZoomControls">
                  <span class="setting-title">显示缩放控制</span>
                  <span class="setting-desc">显示图表缩放按钮</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="showExportButton">
                  <span class="setting-title">显示导出按钮</span>
                  <span class="setting-desc">显示图表导出功能</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="showFullscreenButton">
                  <span class="setting-title">显示全屏按钮</span>
                  <span class="setting-desc">显示图表全屏查看功能</span>
                </label>
              </div>
            </div>
            
            <div class="control-preview">
              <h4>控制预览</h4>
              <div class="mock-toolbar">
                <span class="mock-type">Mermaid</span>
                <div class="mock-controls">
                  <button class="mock-btn">🔄</button>
                  <button class="mock-btn">📋</button>
                  <button class="mock-btn export-preview">📤</button>
                  <button class="mock-btn fullscreen-preview">⛶</button>
                  <button class="mock-btn zoom-preview">🔍</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 示例模板面板 -->
          <div class="tab-panel" data-panel="examples">
            <div class="examples-container">
              <h4>常用图表模板</h4>
              <div class="example-list">
                <div class="example-item" data-type="sequenceDiagram">
                  <div class="example-header">
                    <span class="example-title">序列图/泳道图</span>
                    <button class="copy-example-btn">复制代码</button>
                  </div>
                  <div class="example-preview">
                    <pre><code>sequenceDiagram
    participant A as 用户
    participant B as 系统
    participant C as 数据库
    
    A->>B: 发送请求
    B->>C: 查询数据
    C-->>B: 返回结果
    B-->>A: 响应数据</code></pre>
                  </div>
                </div>
                
                <div class="example-item" data-type="flowchart">
                  <div class="example-header">
                    <span class="example-title">流程图</span>
                    <button class="copy-example-btn">复制代码</button>
                  </div>
                  <div class="example-preview">
                    <pre><code>flowchart TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行A]
    B -->|否| D[执行B]
    C --> E[结束]
    D --> E</code></pre>
                  </div>
                </div>
                
                <div class="example-item" data-type="gantt">
                  <div class="example-header">
                    <span class="example-title">甘特图</span>
                    <button class="copy-example-btn">复制代码</button>
                  </div>
                  <div class="example-preview">
                    <pre><code>gantt
    title 项目时间线
    dateFormat YYYY-MM-DD
    section 设计阶段
    需求分析    :2024-01-01, 30d
    界面设计    :30d
    section 开发阶段
    前端开发    :2024-02-01, 45d
    后端开发    :45d</code></pre>
                  </div>
                </div>
                
                <div class="example-item" data-type="classDiagram">
                  <div class="example-header">
                    <span class="example-title">类图</span>
                    <button class="copy-example-btn">复制代码</button>
                  </div>
                  <div class="example-preview">
                    <pre><code>classDiagram
    class Vehicle {
        +String brand
        +int year
        +start()
        +stop()
    }
    class Car {
        +int doors
        +accelerate()
    }
    Vehicle <|-- Car</code></pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn-secondary cancel-btn">取消</button>
          <button class="btn-primary apply-btn">应用设置</button>
        </div>
      </div>
    `;
  }

  /**
   * 填充当前设置
   */
  populateSettings() {
    const settings = this.currentSettings;

    // 常规设置
    this.dialog.querySelector("#enableMermaid").checked = settings.enabled;
    this.dialog.querySelector("#autoFitWidth").checked = settings.autoFitWidth;
    this.dialog.querySelector("#enableInteraction").checked =
      settings.enableInteraction;
    this.dialog.querySelector("#autoWrapText").checked = settings.autoWrapText;

    // 外观设置
    this.dialog.querySelector("#mermaidTheme").value =
      settings.theme || "default";
    this.dialog.querySelector("#showParticipantLabels").checked =
      settings.showParticipantLabels;

    // 控制设置
    this.dialog.querySelector("#showZoomControls").checked =
      settings.showZoomControls;
    this.dialog.querySelector("#showExportButton").checked =
      settings.showExportButton;
    this.dialog.querySelector("#showFullscreenButton").checked =
      settings.showFullscreenButton;

    // 更新主题预览
    this.updateThemePreview();
    this.updateControlPreview();
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    // 关闭按钮
    this.dialog.querySelector(".close-btn").onclick = () => this.hide();
    this.dialog.querySelector(".cancel-btn").onclick = () => this.hide();

    // 背景点击关闭
    this.dialog.querySelector(".dialog-backdrop").onclick = () => this.hide();

    // 阻止内容点击事件冒泡
    this.dialog.querySelector(".dialog-content").onclick = (e) =>
      e.stopPropagation();

    // 标签页切换
    this.dialog.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.onclick = () => this.switchTab(btn.dataset.tab);
    });

    // 主题选择
    this.dialog.querySelector("#mermaidTheme").onchange = () => {
      this.updateThemePreview();
    };

    // 控制选项变化
    this.dialog.querySelector("#showZoomControls").onchange = () =>
      this.updateControlPreview();
    this.dialog.querySelector("#showExportButton").onchange = () =>
      this.updateControlPreview();
    this.dialog.querySelector("#showFullscreenButton").onchange = () =>
      this.updateControlPreview();

    // 示例复制按钮
    this.dialog.querySelectorAll(".copy-example-btn").forEach((btn) => {
      btn.onclick = (e) => this.copyExample(e.target.closest(".example-item"));
    });

    // 应用设置
    this.dialog.querySelector(".apply-btn").onclick = () =>
      this.applySettings();

    // ESC 键关闭
    document.addEventListener("keydown", this.handleKeyDown);
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown = (e) => {
    if (e.key === "Escape" && this.dialog) {
      this.hide();
    }
  };

  /**
   * 切换标签页
   */
  switchTab(tabName) {
    // 切换按钮状态
    this.dialog.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // 切换面板显示
    this.dialog.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === tabName);
    });
  }

  /**
   * 更新主题预览
   */
  updateThemePreview() {
    const themeSelect = this.dialog.querySelector("#mermaidTheme");
    const previewContainer = this.dialog.querySelector("#themePreview");
    const selectedTheme = themeSelect.value;

    // 简单的主题预览内容
    const previewCode = `graph LR
    A[用户] --> B[系统]
    B --> C[数据库]
    C --> B
    B --> A`;

    previewContainer.innerHTML = `
      <div class="theme-demo theme-${selectedTheme}">
        <div class="demo-node">用户</div>
        <div class="demo-arrow">→</div>
        <div class="demo-node">系统</div>
        <div class="demo-arrow">→</div>
        <div class="demo-node">数据库</div>
      </div>
    `;
  }

  /**
   * 更新控制预览
   */
  updateControlPreview() {
    const showExport = this.dialog.querySelector("#showExportButton").checked;
    const showZoom = this.dialog.querySelector("#showZoomControls").checked;
    const showFullscreen = this.dialog.querySelector(
      "#showFullscreenButton"
    ).checked;

    const exportBtn = this.dialog.querySelector(".export-preview");
    const zoomBtn = this.dialog.querySelector(".zoom-preview");
    const fullscreenBtn = this.dialog.querySelector(".fullscreen-preview");

    exportBtn.style.display = showExport ? "inline-block" : "none";
    zoomBtn.style.display = showZoom ? "inline-block" : "none";
    fullscreenBtn.style.display = showFullscreen ? "inline-block" : "none";
  }

  /**
   * 复制示例代码
   */
  async copyExample(exampleItem) {
    const codeElement = exampleItem.querySelector("code");
    const code = codeElement.textContent;
    const btn = exampleItem.querySelector(".copy-example-btn");

    try {
      await navigator.clipboard.writeText(code);

      // 显示成功反馈
      const originalText = btn.textContent;
      btn.textContent = "已复制!";
      btn.style.background = "#10b981";
      btn.style.color = "white";

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "";
        btn.style.color = "";
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);

      // 显示错误反馈
      const originalText = btn.textContent;
      btn.textContent = "复制失败";
      btn.style.background = "#ef4444";
      btn.style.color = "white";

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "";
        btn.style.color = "";
      }, 2000);
    }
  }

  /**
   * 应用设置
   */
  applySettings() {
    const newSettings = {
      enabled: this.dialog.querySelector("#enableMermaid").checked,
      autoFitWidth: this.dialog.querySelector("#autoFitWidth").checked,
      enableInteraction:
        this.dialog.querySelector("#enableInteraction").checked,
      autoWrapText: this.dialog.querySelector("#autoWrapText").checked,
      theme: this.dialog.querySelector("#mermaidTheme").value,
      showParticipantLabels: this.dialog.querySelector("#showParticipantLabels")
        .checked,
      showZoomControls: this.dialog.querySelector("#showZoomControls").checked,
      showExportButton: this.dialog.querySelector("#showExportButton").checked,
      showFullscreenButton: this.dialog.querySelector("#showFullscreenButton")
        .checked,
    };

    // 应用到渲染器
    this.mermaidRenderer.applySettings(newSettings);
    this.currentSettings = newSettings;

    // 显示成功消息
    this.showSuccessMessage();

    // 关闭对话框
    setTimeout(() => this.hide(), 1000);
  }

  /**
   * 显示成功消息
   */
  showSuccessMessage() {
    const applyBtn = this.dialog.querySelector(".apply-btn");
    const originalText = applyBtn.textContent;

    applyBtn.textContent = "✓ 设置已保存";
    applyBtn.style.background = "#10b981";
    applyBtn.disabled = true;

    setTimeout(() => {
      applyBtn.textContent = originalText;
      applyBtn.style.background = "";
      applyBtn.disabled = false;
    }, 1000);
  }

  /**
   * 销毁对话框
   */
  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
    if (this.dialog && this.dialog.parentNode) {
      this.dialog.parentNode.removeChild(this.dialog);
    }
    this.dialog = null;
  }
}

// 导出类
window.MermaidSettingsDialog = MermaidSettingsDialog;
