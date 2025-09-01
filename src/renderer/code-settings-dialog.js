/**
 * 代码高亮设置对话框
 */
class CodeHighlightSettings {
  constructor(codeHighlighter) {
    this.codeHighlighter = codeHighlighter;
    this.dialog = null;
    this.previewCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 计算斐波那契数列
const result = fibonacci(10);
console.log(\`第10个斐波那契数是: \${result}\`);

/* 
 * 这是一个递归实现
 * 时间复杂度: O(2^n)
 */`;
  }

  /**
   * 显示设置对话框
   */
  show() {
    if (this.dialog) {
      this.dialog.style.display = "flex";
      return;
    }

    this.createDialog();
    this.populateSettings();
    this.setupEventListeners();
  }

  /**
   * 创建设置对话框
   */
  createDialog() {
    this.dialog = document.createElement("div");
    this.dialog.className = "code-settings-overlay";
    this.dialog.innerHTML = this.getDialogHTML();
    document.body.appendChild(this.dialog);
  }

  /**
   * 获取对话框HTML
   */
  getDialogHTML() {
    return `
      <div class="code-settings-dialog">
        <div class="settings-header">
          <h2>代码高亮设置</h2>
          <button class="close-btn" type="button">×</button>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <h3>主题选择</h3>
            <div class="theme-selector">
              <select id="theme-select">
                ${this.getThemeOptions()}
              </select>
              <div class="theme-preview" id="theme-preview">
                <pre><code class="language-javascript">${
                  this.previewCode
                }</code></pre>
              </div>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>显示选项</h3>
            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" id="show-line-numbers">
                <span class="checkmark"></span>
                显示行号
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="show-language-label">
                <span class="checkmark"></span>
                显示语言标签
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="show-copy-button">
                <span class="checkmark"></span>
                显示复制按钮
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="enable-code-folding">
                <span class="checkmark"></span>
                启用代码折叠
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>支持的语言</h3>
            <div class="language-grid" id="language-grid">
              ${this.getLanguageCheckboxes()}
            </div>
          </div>
        </div>
        
        <div class="settings-footer">
          <button class="btn btn-secondary" id="reset-btn">重置默认</button>
          <div class="button-group">
            <button class="btn btn-secondary" id="cancel-btn">取消</button>
            <button class="btn btn-primary" id="apply-btn">应用</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 获取主题选项HTML
   */
  getThemeOptions() {
    const themes = this.codeHighlighter.getSupportedThemes();
    return themes
      .map((theme) => `<option value="${theme.value}">${theme.name}</option>`)
      .join("");
  }

  /**
   * 获取语言复选框HTML
   */
  getLanguageCheckboxes() {
    const languages = this.codeHighlighter.getSupportedLanguages();
    const languageNames = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      java: "Java",
      cpp: "C++",
      csharp: "C#",
      go: "Go",
      rust: "Rust",
      php: "PHP",
      html: "HTML",
      css: "CSS",
      scss: "SCSS",
      sass: "Sass",
      sql: "SQL",
      bash: "Bash",
      powershell: "PowerShell",
      yaml: "YAML",
      json: "JSON",
      xml: "XML",
      markdown: "Markdown",
    };

    return languages
      .map(
        (lang) => `
      <label class="language-checkbox">
        <input type="checkbox" value="${lang}" class="language-check">
        <span class="checkmark"></span>
        ${languageNames[lang] || lang.toUpperCase()}
      </label>
    `
      )
      .join("");
  }

  /**
   * 填充当前设置
   */
  populateSettings() {
    const settings = this.codeHighlighter.getCurrentSettings();

    // 设置主题
    const themeSelect = this.dialog.querySelector("#theme-select");
    themeSelect.value = settings.theme;

    // 设置选项
    this.dialog.querySelector("#show-line-numbers").checked =
      settings.showLineNumbers;
    this.dialog.querySelector("#show-language-label").checked =
      settings.showLanguageLabel;
    this.dialog.querySelector("#show-copy-button").checked =
      settings.showCopyButton;
    this.dialog.querySelector("#enable-code-folding").checked =
      settings.enableCodeFolding;

    // 设置语言
    const languageChecks = this.dialog.querySelectorAll(".language-check");
    languageChecks.forEach((checkbox) => {
      checkbox.checked = settings.supportedLanguages.includes(checkbox.value);
    });

    // 初始预览
    this.updatePreview();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    const dialog = this.dialog;

    // 关闭按钮
    dialog
      .querySelector(".close-btn")
      .addEventListener("click", () => this.close());
    dialog
      .querySelector("#cancel-btn")
      .addEventListener("click", () => this.close());

    // 应用按钮
    dialog
      .querySelector("#apply-btn")
      .addEventListener("click", () => this.applySettings());

    // 重置按钮
    dialog
      .querySelector("#reset-btn")
      .addEventListener("click", () => this.resetToDefaults());

    // 主题变化时更新预览
    dialog
      .querySelector("#theme-select")
      .addEventListener("change", () => this.updatePreview());

    // 选项变化时更新预览
    const optionCheckboxes = dialog.querySelectorAll(
      "#show-line-numbers, #show-language-label, #show-copy-button, #enable-code-folding"
    );
    optionCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => this.updatePreview());
    });

    // 点击遮罩关闭
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dialog.style.display !== "none") {
        this.close();
      }
    });
  }

  /**
   * 更新预览
   */
  updatePreview() {
    const preview = this.dialog.querySelector("#theme-preview");
    const themeSelect = this.dialog.querySelector("#theme-select");
    const selectedTheme = themeSelect.value;

    // 临时应用主题
    this.codeHighlighter.loadTheme(selectedTheme).then(() => {
      // 清空并重新创建预览
      preview.innerHTML = `<pre><code class="language-javascript">${this.previewCode}</code></pre>`;

      const codeElement = preview.querySelector("code");
      const preElement = preview.querySelector("pre");

      // 应用当前设置到预览
      const showLineNumbers =
        this.dialog.querySelector("#show-line-numbers").checked;
      const showLanguageLabel = this.dialog.querySelector(
        "#show-language-label"
      ).checked;
      const showCopyButton =
        this.dialog.querySelector("#show-copy-button").checked;

      if (showLineNumbers) {
        preElement.classList.add("line-numbers");
      }

      // 添加临时工具栏（仅用于预览）
      if (showLanguageLabel || showCopyButton) {
        const toolbar = document.createElement("div");
        toolbar.className = "code-toolbar-custom";

        if (showLanguageLabel) {
          const label = document.createElement("span");
          label.className = "language-label";
          label.textContent = "JavaScript";
          toolbar.appendChild(label);
        }

        if (showCopyButton) {
          const buttonGroup = document.createElement("div");
          buttonGroup.className = "toolbar-buttons";

          const copyBtn = document.createElement("button");
          copyBtn.className = "copy-button";
          copyBtn.innerHTML = "📋";
          copyBtn.title = "复制代码";
          buttonGroup.appendChild(copyBtn);

          toolbar.appendChild(buttonGroup);
        }

        preElement.insertBefore(toolbar, preElement.firstChild);
      }

      // 高亮代码
      if (window.Prism) {
        window.Prism.highlightElement(codeElement);
      }
    });
  }

  /**
   * 应用设置
   */
  applySettings() {
    const newSettings = this.collectSettings();
    this.codeHighlighter.applySettings(newSettings);
    this.showSuccessMessage("设置已应用");
    this.close();
  }

  /**
   * 收集当前设置
   */
  collectSettings() {
    const dialog = this.dialog;

    const enabledLanguages = Array.from(
      dialog.querySelectorAll(".language-check:checked")
    ).map((checkbox) => checkbox.value);

    return {
      theme: dialog.querySelector("#theme-select").value,
      showLineNumbers: dialog.querySelector("#show-line-numbers").checked,
      showLanguageLabel: dialog.querySelector("#show-language-label").checked,
      showCopyButton: dialog.querySelector("#show-copy-button").checked,
      enableCodeFolding: dialog.querySelector("#enable-code-folding").checked,
      enabledLanguages,
    };
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults() {
    const dialog = this.dialog;

    // 重置主题
    dialog.querySelector("#theme-select").value = "prism";

    // 重置选项
    dialog.querySelector("#show-line-numbers").checked = true;
    dialog.querySelector("#show-language-label").checked = true;
    dialog.querySelector("#show-copy-button").checked = true;
    dialog.querySelector("#enable-code-folding").checked = false;

    // 重置语言（选择常用语言）
    const commonLanguages = [
      "javascript",
      "typescript",
      "python",
      "java",
      "cpp",
      "html",
      "css",
    ];
    const languageChecks = dialog.querySelectorAll(".language-check");
    languageChecks.forEach((checkbox) => {
      checkbox.checked = commonLanguages.includes(checkbox.value);
    });

    this.updatePreview();
    this.showSuccessMessage("已重置为默认设置");
  }

  /**
   * 显示成功消息
   */
  showSuccessMessage(message) {
    const toast = document.createElement("div");
    toast.className = "copy-toast copy-toast-success show";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * 关闭对话框
   */
  close() {
    if (this.dialog) {
      this.dialog.style.display = "none";
    }
  }

  /**
   * 销毁对话框
   */
  destroy() {
    if (this.dialog && this.dialog.parentNode) {
      this.dialog.parentNode.removeChild(this.dialog);
      this.dialog = null;
    }
  }
}

// 导出类
window.CodeHighlightSettings = CodeHighlightSettings;
