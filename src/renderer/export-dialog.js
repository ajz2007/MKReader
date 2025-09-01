/**
 * 导出对话框组件
 */
class ExportDialog {
  constructor(exportManager) {
    this.exportManager = exportManager;
    this.selectedFormat = "pdf";
    this.settings = {};
    this.dialog = null;
  }

  show(initialFormat = "pdf") {
    this.selectedFormat = initialFormat;
    this.createDialog();
    this.bindEvents();
    this.selectFormat(initialFormat);
  }

  createDialog() {
    const overlay = document.createElement("div");
    overlay.className = "export-dialog-overlay";

    overlay.innerHTML = `
      <div class="export-dialog">
        <div class="dialog-header">
          <h3>📤 导出文档</h3>
          <button class="dialog-close-btn">×</button>
        </div>
        
        <div class="dialog-content">
          <!-- 格式选择 -->
          <div class="format-selection">
            <h4>选择导出格式</h4>
            <div class="format-options">
              <div class="format-option" data-format="pdf">
                <div class="format-icon">📄</div>
                <div class="format-name">PDF文档</div>
                <div class="format-desc">便于打印和分享</div>
              </div>
              <div class="format-option" data-format="html">
                <div class="format-icon">🌐</div>
                <div class="format-name">HTML网页</div>
                <div class="format-desc">可在浏览器中查看</div>
              </div>
              <div class="format-option" data-format="png">
                <div class="format-icon">🖼️</div>
                <div class="format-name">PNG图片</div>
                <div class="format-desc">高质量图片格式</div>
              </div>
            </div>
          </div>

          <!-- 设置面板 -->
          <div class="settings-panel">
            <h4>导出设置</h4>
            <div class="settings-content" id="settingsContent">
              <!-- 动态生成的设置内容 -->
            </div>
          </div>

          <!-- 预览信息 -->
          <div class="preview-panel">
            <h4>预览信息</h4>
            <div class="preview-info">
              <div class="info-item">
                <span class="info-label">文档标题:</span>
                <span class="info-value" id="documentTitle">-</span>
              </div>
              <div class="info-item">
                <span class="info-label">预计文件大小:</span>
                <span class="info-value" id="estimatedSize">-</span>
              </div>
              <div class="info-item">
                <span class="info-label">导出时间:</span>
                <span class="info-value" id="exportTime">${new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="dialog-btn cancel-btn">取消</button>
          <button class="dialog-btn export-btn primary">导出</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.dialog = overlay;

    // 更新预览信息
    this.updatePreviewInfo();
  }

  bindEvents() {
    // 关闭对话框
    this.dialog
      .querySelector(".dialog-close-btn")
      .addEventListener("click", () => {
        this.close();
      });

    this.dialog.querySelector(".cancel-btn").addEventListener("click", () => {
      this.close();
    });

    // 点击遮罩关闭
    this.dialog.addEventListener("click", (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener("keydown", this.handleKeydown.bind(this));

    // 格式选择
    this.dialog.querySelectorAll(".format-option").forEach((option) => {
      option.addEventListener("click", () => {
        const format = option.dataset.format;
        this.selectFormat(format);
      });
    });

    // 导出按钮
    this.dialog.querySelector(".export-btn").addEventListener("click", () => {
      this.handleExport();
    });
  }

  handleKeydown(e) {
    if (e.key === "Escape") {
      this.close();
    }
  }

  selectFormat(format) {
    this.selectedFormat = format;

    // 更新格式选择UI
    this.dialog.querySelectorAll(".format-option").forEach((option) => {
      option.classList.toggle("selected", option.dataset.format === format);
    });

    // 更新设置面板
    this.updateSettingsPanel(format);
    this.updatePreviewInfo();
  }

  updateSettingsPanel(format) {
    const settingsContent = this.dialog.querySelector("#settingsContent");

    switch (format) {
      case "pdf":
        settingsContent.innerHTML = this.getPDFSettings();
        break;
      case "html":
        settingsContent.innerHTML = this.getHTMLSettings();
        break;
      case "png":
        settingsContent.innerHTML = this.getPNGSettings();
        break;
    }

    // 绑定设置变化事件
    settingsContent.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("change", () => {
        this.updatePreviewInfo();
      });
    });
  }

  getPDFSettings() {
    return `
      <div class="setting-group">
        <label class="setting-label">页面大小</label>
        <select class="setting-input" name="pageSize">
          <option value="A4" selected>A4</option>
          <option value="A3">A3</option>
          <option value="Letter">Letter</option>
        </select>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">页面方向</label>
        <select class="setting-input" name="orientation">
          <option value="portrait" selected>纵向</option>
          <option value="landscape">横向</option>
        </select>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">页边距 (mm)</label>
        <div class="margin-inputs">
          <input type="number" name="marginTop" value="20" min="0" max="50" class="margin-input" placeholder="上">
          <input type="number" name="marginRight" value="20" min="0" max="50" class="margin-input" placeholder="右">
          <input type="number" name="marginBottom" value="20" min="0" max="50" class="margin-input" placeholder="下">
          <input type="number" name="marginLeft" value="20" min="0" max="50" class="margin-input" placeholder="左">
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-checkbox">
          <input type="checkbox" name="includeBackground" checked>
          <span class="checkmark"></span>
          包含背景颜色
        </label>
      </div>
    `;
  }

  getHTMLSettings() {
    return `
      <div class="setting-group">
        <label class="setting-label">HTML类型</label>
        <select class="setting-input" name="htmlType">
          <option value="standalone" selected>独立文件</option>
          <option value="fragment">HTML片段</option>
        </select>
      </div>
      
      <div class="setting-group">
        <label class="setting-checkbox">
          <input type="checkbox" name="includeCSS" checked>
          <span class="checkmark"></span>
          包含样式表
        </label>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">主题样式</label>
        <select class="setting-input" name="theme">
          <option value="github" selected>GitHub样式</option>
          <option value="minimal">简洁样式</option>
          <option value="classic">经典样式</option>
        </select>
      </div>
      
      <div class="setting-group">
        <label class="setting-checkbox">
          <input type="checkbox" name="optimizeForPrint">
          <span class="checkmark"></span>
          优化打印样式
        </label>
      </div>
    `;
  }

  getPNGSettings() {
    return `
      <div class="setting-group">
        <label class="setting-label">图片宽度 (像素)</label>
        <input type="number" class="setting-input" name="width" value="1200" min="400" max="3000" step="100">
      </div>
      
      <div class="setting-group">
        <label class="setting-label">图片质量</label>
        <select class="setting-input" name="quality">
          <option value="0.6">标准 (60%)</option>
          <option value="0.8">良好 (80%)</option>
          <option value="0.9" selected>高质量 (90%)</option>
          <option value="1.0">最高质量 (100%)</option>
        </select>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">背景颜色</label>
        <div class="color-options">
          <label class="color-option">
            <input type="radio" name="background" value="#ffffff" checked>
            <span class="color-preview" style="background: #ffffff; border: 1px solid #ddd;"></span>
            白色
          </label>
          <label class="color-option">
            <input type="radio" name="background" value="transparent">
            <span class="color-preview transparent"></span>
            透明
          </label>
          <label class="color-option">
            <input type="radio" name="background" value="#f6f8fa">
            <span class="color-preview" style="background: #f6f8fa;"></span>
            浅灰
          </label>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-checkbox">
          <input type="checkbox" name="highDPI" checked>
          <span class="checkmark"></span>
          高分辨率 (2x)
        </label>
      </div>
    `;
  }

  updatePreviewInfo() {
    const titleElement = this.dialog.querySelector("#documentTitle");
    const sizeElement = this.dialog.querySelector("#estimatedSize");

    // 更新文档标题
    const title = this.exportManager.getCurrentTitle();
    titleElement.textContent = title;

    // 估算文件大小
    const estimatedSize = this.estimateFileSize();
    sizeElement.textContent = estimatedSize;
  }

  estimateFileSize() {
    const contentLength = document.getElementById("content").innerHTML.length;

    switch (this.selectedFormat) {
      case "pdf":
        return this.formatFileSize(contentLength * 0.5); // PDF压缩比约50%
      case "html":
        return this.formatFileSize(contentLength * 1.5); // HTML包含CSS等
      case "png":
        const width = parseInt(this.getSettingValue("width") || 1200);
        const estimatedHeight = Math.max(800, contentLength / 50); // 粗略估算高度
        const pixels = width * estimatedHeight;
        return this.formatFileSize(pixels * 4); // 4 bytes per pixel (RGBA)
      default:
        return "未知";
    }
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return Math.round((bytes / 1024 / 1024) * 10) / 10 + " MB";
  }

  getSettingValue(name) {
    const input = this.dialog.querySelector(`[name="${name}"]`);
    if (!input) return null;

    if (input.type === "checkbox") {
      return input.checked;
    } else if (input.type === "radio") {
      const checked = this.dialog.querySelector(`[name="${name}"]:checked`);
      return checked ? checked.value : null;
    } else {
      return input.value;
    }
  }

  getSettings() {
    const settings = {};
    const inputs = this.dialog.querySelectorAll(
      '.setting-input, input[type="checkbox"], input[type="radio"]:checked, .margin-input'
    );

    inputs.forEach((input) => {
      const name = input.name;
      if (!name) return;

      if (input.type === "checkbox") {
        settings[name] = input.checked;
      } else if (input.type === "number") {
        settings[name] = parseFloat(input.value) || 0;
      } else {
        settings[name] = input.value;
      }
    });

    // 处理边距设置
    if (settings.marginTop !== undefined) {
      settings.margin = {
        top: settings.marginTop,
        right: settings.marginRight,
        bottom: settings.marginBottom,
        left: settings.marginLeft,
      };
    }

    return settings;
  }

  async handleExport() {
    try {
      const settings = this.getSettings();
      settings.filename = this.exportManager.generateFilename(
        this.exportManager.tabManager?.getActiveTab(),
        this.selectedFormat
      );

      this.close();

      await this.exportManager.export(this.selectedFormat, settings);
    } catch (error) {
      console.error("导出失败:", error);
      this.exportManager.showErrorDialog(error.message);
    }
  }

  close() {
    if (this.dialog) {
      document.removeEventListener("keydown", this.handleKeydown.bind(this));
      document.body.removeChild(this.dialog);
      this.dialog = null;
    }
  }
}

/**
 * 导出进度对话框
 */
class ExportProgressDialog {
  constructor() {
    this.dialog = null;
    this.progress = 0;
    this.status = "";
  }

  show(title = "正在导出...") {
    this.createDialog(title);
  }

  createDialog(title) {
    const overlay = document.createElement("div");
    overlay.className = "progress-dialog-overlay";

    overlay.innerHTML = `
      <div class="progress-dialog">
        <div class="progress-header">
          <h3>${title}</h3>
        </div>
        
        <div class="progress-content">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">准备导出...</div>
          <div class="progress-percent">0%</div>
        </div>
        
        <div class="progress-footer">
          <button class="progress-cancel-btn">取消</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.dialog = overlay;

    // 绑定取消按钮
    this.dialog
      .querySelector(".progress-cancel-btn")
      .addEventListener("click", () => {
        this.close();
      });
  }

  updateProgress(percent, status) {
    if (!this.dialog) return;

    this.progress = Math.max(0, Math.min(100, percent));
    this.status = status || "";

    const fillElement = this.dialog.querySelector(".progress-fill");
    const textElement = this.dialog.querySelector(".progress-text");
    const percentElement = this.dialog.querySelector(".progress-percent");

    if (fillElement) fillElement.style.width = `${this.progress}%`;
    if (textElement) textElement.textContent = this.status;
    if (percentElement)
      percentElement.textContent = `${Math.round(this.progress)}%`;
  }

  close() {
    if (this.dialog) {
      document.body.removeChild(this.dialog);
      this.dialog = null;
    }
  }
}

// 导出组件
window.ExportDialog = ExportDialog;
window.ExportProgressDialog = ExportProgressDialog;
