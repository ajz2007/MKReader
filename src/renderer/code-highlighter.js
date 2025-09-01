/**
 * 代码高亮管理器
 * 基于 Prism.js 实现的代码语法高亮功能
 */
class CodeHighlighter {
  constructor() {
    this.currentTheme = "prism";
    this.supportedLanguages = new Set();
    this.settings = {
      showLineNumbers: true,
      showLanguageLabel: true,
      showCopyButton: true,
      enableCodeFolding: false,
    };

    this.isInitialized = false;
    this.initializePrism();
  }

  /**
   * 初始化 Prism.js 及其插件
   */
  async initializePrism() {
    try {
      // 添加全局错误处理器
      const originalError = console.error;
      console.error = function (...args) {
        // 忽略 Prism 扩展相关的错误
        const errorStr = args.join(" ");
        if (
          errorStr.includes("Cannot set properties of undefined") &&
          errorStr.includes("class-name")
        ) {
          return; // 静默忽略这类错误
        }
        originalError.apply(console, args);
      };

      // 动态加载 Prism 核心
      await this.loadScript("../../node_modules/prismjs/prism.js");

      // 加载插件
      await this.loadCSS(
        "../../node_modules/prismjs/plugins/line-numbers/prism-line-numbers.css"
      );
      await this.loadScript(
        "../../node_modules/prismjs/plugins/line-numbers/prism-line-numbers.js"
      );

      await this.loadCSS(
        "../../node_modules/prismjs/plugins/toolbar/prism-toolbar.css"
      );
      await this.loadScript(
        "../../node_modules/prismjs/plugins/toolbar/prism-toolbar.js"
      );

      // 加载常用语言
      await this.loadLanguages([
        "javascript",
        "typescript",
        "python",
        "java",
        "cpp",
        "csharp",
        "go",
        "rust",
        "php",
        "markup", // HTML 在 Prism 中叫做 markup
        "css",
        "scss",
        "sass",
        "sql",
        "bash",
        "powershell",
        "yaml",
        "json",
        "markdown",
      ]);

      // 加载默认主题
      await this.loadTheme(this.currentTheme);

      // 加载用户设置
      this.loadSettings();

      // 恢复原始错误处理器
      console.error = originalError;

      this.isInitialized = true;
      console.log("Code highlighter initialized successfully");
    } catch (error) {
      console.error("Failed to initialize code highlighter:", error);
    }
  }

  /**
   * 动态加载脚本文件
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * 动态加载 CSS 文件
   */
  loadCSS(href, id = null) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      if (id) link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  /**
   * 加载编程语言支持
   */
  async loadLanguages(languages) {
    for (const lang of languages) {
      try {
        // 为某些语言添加错误处理
        await this.loadScript(
          `../../node_modules/prismjs/components/prism-${lang}.js`
        );
        this.supportedLanguages.add(lang);
        console.log(`Loaded language: ${lang}`);
      } catch (error) {
        console.warn(`Failed to load language: ${lang}`, error);
        // 对于某些依赖其他语言的语言，尝试静默失败
        continue;
      }
    }
  }

  /**
   * 加载主题
   */
  async loadTheme(themeName) {
    try {
      // 移除旧主题
      const oldTheme = document.getElementById("prism-theme");
      if (oldTheme) {
        oldTheme.remove();
      }

      // 加载新主题
      let themeFile;
      if (themeName.startsWith("prism-") && themeName !== "prism") {
        themeFile = `../../node_modules/prism-themes/themes/${themeName}.css`;
      } else {
        themeFile = `../../node_modules/prismjs/themes/prism.css`;
      }

      await this.loadCSS(themeFile, "prism-theme");
      this.currentTheme = themeName;
      console.log(`Theme loaded: ${themeName}`);
    } catch (error) {
      console.error("Failed to load theme:", themeName, error);
      // 降级到默认主题
      try {
        await this.loadCSS(
          "../../node_modules/prismjs/themes/prism.css",
          "prism-theme"
        );
        this.currentTheme = "prism";
      } catch (fallbackError) {
        console.error("Failed to load fallback theme:", fallbackError);
      }
    }
  }

  /**
   * 高亮指定的代码元素
   */
  highlightCode(codeElement) {
    if (!this.isInitialized || !window.Prism) {
      console.warn("Prism not initialized yet");
      return;
    }

    try {
      // 检测语言
      const language = this.detectLanguage(codeElement);

      // 设置语言类
      codeElement.className = `language-${language}`;

      // 添加父容器类（用于行号等功能）
      const preElement = codeElement.parentElement;
      if (preElement && preElement.tagName === "PRE") {
        if (this.settings.showLineNumbers) {
          preElement.classList.add("line-numbers");
        }

        // 添加自定义工具栏
        this.addCustomToolbar(preElement, language);
      }

      // 执行高亮
      window.Prism.highlightElement(codeElement);
    } catch (error) {
      console.error("Failed to highlight code:", error);
    }
  }

  /**
   * 检测代码语言
   */
  detectLanguage(codeElement) {
    // 语言别名映射
    const languageAliases = {
      html: "markup",
      xml: "markup",
      svg: "markup",
      mathml: "markup",
      htm: "markup",
    };

    // 从 data 属性检测
    const dataLang = codeElement.getAttribute("data-language");
    if (dataLang) {
      const mappedLang = languageAliases[dataLang] || dataLang;
      if (this.supportedLanguages.has(mappedLang)) {
        return mappedLang;
      }
    }

    // 从类名检测
    const className = codeElement.className;
    const match = className.match(/language-(\w+)/);
    if (match) {
      const mappedLang = languageAliases[match[1]] || match[1];
      if (this.supportedLanguages.has(mappedLang)) {
        return mappedLang;
      }
    }

    // 内容启发式检测
    const code = codeElement.textContent;
    return this.heuristicLanguageDetection(code);
  }

  /**
   * 启发式语言检测
   */
  heuristicLanguageDetection(code) {
    const patterns = [
      { pattern: /^\s*function\s+\w+\s*\(/m, language: "javascript" },
      { pattern: /^\s*def\s+\w+\s*\(/m, language: "python" },
      { pattern: /^\s*public\s+class\s+\w+/m, language: "java" },
      { pattern: /^\s*#include\s*</m, language: "cpp" },
      { pattern: /^\s*using\s+System/m, language: "csharp" },
      { pattern: /^\s*package\s+main/m, language: "go" },
      { pattern: /^\s*fn\s+main\(\)/m, language: "rust" },
      { pattern: /^\s*<?php/m, language: "php" },
      { pattern: /<!DOCTYPE\s+html>/i, language: "markup" }, // HTML 映射到 markup
      { pattern: /^\s*<\?xml/i, language: "markup" }, // XML 也映射到 markup
      { pattern: /^\s*SELECT\s+.+FROM/im, language: "sql" },
      { pattern: /^\s*#!/, language: "bash" },
      { pattern: /^\s*\{[\s\S]*\}$/, language: "json" },
    ];

    for (const { pattern, language } of patterns) {
      if (pattern.test(code) && this.supportedLanguages.has(language)) {
        return language;
      }
    }

    return "text"; // 默认纯文本
  }

  /**
   * 添加自定义工具栏
   */
  addCustomToolbar(preElement, language) {
    // 检查是否已存在工具栏
    if (preElement.querySelector(".code-toolbar-custom")) {
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.className = "code-toolbar-custom";

    if (this.settings.showLanguageLabel) {
      const label = document.createElement("span");
      label.className = "language-label";
      label.textContent = this.getLanguageDisplayName(language);
      toolbar.appendChild(label);
    }

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "toolbar-buttons";

    if (this.settings.showCopyButton) {
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-button";
      copyBtn.innerHTML = "📋";
      copyBtn.title = "复制代码";
      copyBtn.setAttribute("data-tooltip", "复制");
      copyBtn.onclick = (e) => {
        e.preventDefault();
        this.copyToClipboard(preElement.querySelector("code"));
      };
      buttonGroup.appendChild(copyBtn);
    }

    if (
      this.settings.enableCodeFolding &&
      this.shouldEnableFolding(preElement)
    ) {
      const foldBtn = document.createElement("button");
      foldBtn.className = "fold-button";
      foldBtn.innerHTML = "⏷";
      foldBtn.title = "折叠代码";
      foldBtn.setAttribute("data-tooltip", "折叠");
      foldBtn.onclick = (e) => {
        e.preventDefault();
        this.toggleCodeFolding(preElement);
      };
      buttonGroup.appendChild(foldBtn);
    }

    toolbar.appendChild(buttonGroup);
    preElement.insertBefore(toolbar, preElement.firstChild);
  }

  /**
   * 获取语言显示名称
   */
  getLanguageDisplayName(language) {
    const displayNames = {
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
      text: "Text",
    };

    return displayNames[language] || language.toUpperCase();
  }

  /**
   * 判断是否应该启用代码折叠
   */
  shouldEnableFolding(preElement) {
    const code = preElement.querySelector("code");
    if (!code) return false;

    const lines = code.textContent.split("\n");
    return lines.length > 10; // 超过10行才显示折叠按钮
  }

  /**
   * 切换代码折叠状态
   */
  toggleCodeFolding(preElement) {
    const isCollapsed = preElement.classList.contains("code-collapsed");
    const foldBtn = preElement.querySelector(".fold-button");

    if (isCollapsed) {
      preElement.classList.remove("code-collapsed");
      foldBtn.innerHTML = "⏷";
      foldBtn.title = "折叠代码";
    } else {
      preElement.classList.add("code-collapsed");
      foldBtn.innerHTML = "⏵";
      foldBtn.title = "展开代码";
    }
  }

  /**
   * 复制代码到剪贴板
   */
  async copyToClipboard(codeElement) {
    try {
      const code = codeElement.textContent;
      await navigator.clipboard.writeText(code);
      this.showCopySuccessToast();
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      this.showCopyErrorToast();
    }
  }

  /**
   * 显示复制成功提示
   */
  showCopySuccessToast() {
    this.showToast("代码已复制到剪贴板", "success");
  }

  /**
   * 显示复制失败提示
   */
  showCopyErrorToast() {
    this.showToast("复制失败，请手动复制", "error");
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = "info") {
    // 移除现有的 toast
    const existingToast = document.querySelector(".copy-toast");
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = `copy-toast copy-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发动画
    setTimeout(() => toast.classList.add("show"), 10);

    // 自动移除
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * 高亮所有代码块
   */
  highlightAllCodeBlocks() {
    if (!this.isInitialized) {
      console.warn("Code highlighter not initialized yet");
      return;
    }

    const codeElements = document.querySelectorAll(
      'pre code, code[class*="language-"]'
    );
    codeElements.forEach((element) => {
      // 跳过 Mermaid 代码块，让 Mermaid 渲染器处理
      if (this.isMermaidCodeBlock(element)) {
        console.log("Skipping Mermaid code block for code highlighting");
        return;
      }
      this.highlightCode(element);
    });
  }

  /**
   * 检查是否是 Mermaid 代码块
   */
  isMermaidCodeBlock(element) {
    // 检查类名
    const className = element.className || "";
    if (
      className.includes("mermaid") ||
      className.includes("language-mermaid")
    ) {
      return true;
    }

    // 检查内容是否是 Mermaid 语法
    const content = element.textContent.trim().toLowerCase();
    const mermaidKeywords = [
      "sequencediagram",
      "flowchart",
      "graph",
      "classDiagram",
      "stateDiagram",
      "erDiagram",
      "journey",
      "gantt",
      "pie",
      "gitgraph",
      "mindmap",
      "timeline",
    ];

    return mermaidKeywords.some(
      (keyword) =>
        content.startsWith(keyword) ||
        content.startsWith(`${keyword}:`) ||
        content.startsWith(`${keyword} `)
    );
  }

  /**
   * 应用设置
   */
  applySettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveUserSettings();

    // 如果主题改变，重新加载主题
    if (newSettings.theme && newSettings.theme !== this.currentTheme) {
      this.loadTheme(newSettings.theme);
    }

    // 重新渲染所有代码块
    this.reRenderAllCodeBlocks();
  }

  /**
   * 重新渲染所有代码块
   */
  reRenderAllCodeBlocks() {
    // 移除现有的工具栏
    document.querySelectorAll(".code-toolbar-custom").forEach((toolbar) => {
      toolbar.remove();
    });

    // 重新高亮
    this.highlightAllCodeBlocks();
  }

  /**
   * 保存用户设置
   */
  saveUserSettings() {
    const settings = {
      theme: this.currentTheme,
      ...this.settings,
    };
    localStorage.setItem("codeHighlightSettings", JSON.stringify(settings));
  }

  /**
   * 加载用户设置
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem("codeHighlightSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        this.settings = { ...this.settings, ...settings };
        if (settings.theme) {
          this.currentTheme = settings.theme;
        }
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
    }
  }

  /**
   * 获取支持的主题列表
   */
  getSupportedThemes() {
    return [
      { value: "prism", name: "Default Light" },
      { value: "prism-dark", name: "Default Dark" },
      { value: "prism-vsc-dark-plus", name: "VS Code Dark+" },
      { value: "prism-github", name: "GitHub" },
      { value: "prism-monokai", name: "Monokai" },
      { value: "prism-dracula", name: "Dracula" },
      { value: "prism-atom-dark", name: "Atom Dark" },
      { value: "prism-coldark-dark", name: "Coldark Dark" },
      { value: "prism-coldark-cold", name: "Coldark Cold" },
      { value: "prism-nord", name: "Nord" },
    ];
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return Array.from(this.supportedLanguages).sort();
  }

  /**
   * 获取当前设置
   */
  getCurrentSettings() {
    return {
      theme: this.currentTheme,
      ...this.settings,
      supportedLanguages: this.getSupportedLanguages(),
    };
  }
}

// 导出类
window.CodeHighlighter = CodeHighlighter;
