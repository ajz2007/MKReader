/**
 * Mermaid 图表渲染器
 * 支持各种类型的 Mermaid 图表，包括泳道图（序列图）
 */
class MermaidRenderer {
  constructor() {
    this.isInitialized = false;
    this.currentTheme = "default";
    this.settings = {
      enabled: true,
      showZoomControls: true,
      showExportButton: true,
      showFullscreenButton: true,
      autoFitWidth: true,
      showParticipantLabels: true,
      enableInteraction: true,
      autoWrapText: true,
    };

    this.diagramCounter = 0;
    this.initializeMermaid();
  }

  /**
   * 初始化 Mermaid.js
   */
  async initializeMermaid() {
    try {
      // 等待 Mermaid 全局变量可用（应该已经通过 HTML script 标签加载）
      let attempts = 0;
      const maxAttempts = 50;
      while (!window.mermaid && attempts < maxAttempts) {
        console.log(
          `⏳ Waiting for Mermaid library... attempt ${
            attempts + 1
          }/${maxAttempts}`
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.mermaid) {
        throw new Error("Mermaid library not found after waiting");
      }

      console.log(
        "📦 Mermaid library found, version:",
        window.mermaid.version || "unknown"
      );

      // 配置 Mermaid
      window.mermaid.initialize({
        startOnLoad: false,
        theme: this.currentTheme,
        securityLevel: "loose",
        logLevel: "error", // 减少日志输出
        // 关键：添加错误处理回调
        errorCallback: (errorMessage, hash) => {
          console.warn("🚫 Mermaid parsing error:", errorMessage);
          // 返回 false 阻止默认错误对话框
          return false;
        },
        // 禁用错误渲染，防止弹窗
        suppressErrorRendering: true,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
        },
        sequence: {
          diagramMarginX: 50,
          diagramMarginY: 10,
          actorMargin: 50,
          width: 150,
          height: 65,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
          mirrorActors: false,
          bottomMarginAdj: 1,
          useMaxWidth: true,
          rightAngles: false,
          showSequenceNumbers: false,
        },
        gantt: {
          titleTopMargin: 25,
          barHeight: 20,
          fontFamily: '"Open-Sans", "sans-serif"',
          fontSize: 11,
          gridLineStartPadding: 35,
          bottomPadding: 10,
          numberSectionStyles: 4,
        },
        journey: {
          diagramMarginX: 50,
          diagramMarginY: 10,
          leftMargin: 150,
          width: 150,
          height: 50,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
        },
      });

      // 全局错误处理器 - 拦截所有可能的 Mermaid 错误弹窗
      this.setupGlobalErrorHandler();

      // 加载用户设置
      this.loadSettings();

      this.isInitialized = true;
      console.log("✅ Mermaid renderer initialized successfully");
      console.log("📋 Mermaid settings:", this.settings);
    } catch (error) {
      console.error("❌ Failed to initialize Mermaid:", error);
    }
  }

  /**
   * 设置全局错误处理器
   */
  setupGlobalErrorHandler() {
    // 保存原始的 alert 和 console.error 方法
    const originalAlert = window.alert;
    const originalError = console.error;

    // 重写 alert 方法以拦截 Mermaid 错误弹窗
    window.alert = (message) => {
      if (
        typeof message === "string" &&
        (message.includes("Syntax error") ||
          message.includes("mermaid") ||
          message.includes("Error parsing"))
      ) {
        console.warn("🚫 拦截 Mermaid 错误弹窗:", message);
        // 不显示弹窗，改为控制台警告
        return;
      }
      // 其他 alert 正常显示
      originalAlert(message);
    };

    // 拦截控制台错误并检查是否为 Mermaid 相关
    console.error = (...args) => {
      const errorStr = args.join(" ");
      if (errorStr.includes("mermaid") || errorStr.includes("Syntax error")) {
        console.warn("🚫 Mermaid 错误被拦截:", ...args);
        return;
      }
      // 其他错误正常输出
      originalError.apply(console, args);
    };

    // 监听全局未捕获的错误
    window.addEventListener("error", (event) => {
      if (
        event.message &&
        (event.message.includes("mermaid") ||
          event.message.includes("Syntax error"))
      ) {
        console.warn("🚫 全局 Mermaid 错误被拦截:", event.message);
        event.preventDefault();
        return false;
      }
    });

    // 监听 Promise 拒绝
    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason && event.reason.toString().includes("mermaid")) {
        console.warn("🚫 Mermaid Promise 错误被拦截:", event.reason);
        event.preventDefault();
      }
    });

    console.log("🛡️ 全局 Mermaid 错误处理器已设置");
  }

  /**
   * 动态加载脚本文件
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      if (document.querySelector(`script[src="${src}"]`)) {
        console.log(`📦 Script already loaded: ${src}`);
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        console.log(`📦 Script loaded successfully: ${src}`);
        resolve();
      };
      script.onerror = (error) => {
        console.error(`❌ Script load failed: ${src}`, error);
        reject(new Error(`Failed to load script: ${src}`));
      };

      // 设置超时
      const timeout = setTimeout(() => {
        script.onload = null;
        script.onerror = null;
        reject(new Error(`Script load timeout: ${src}`));
      }, 10000);

      script.onload = () => {
        clearTimeout(timeout);
        console.log(`📦 Script loaded successfully: ${src}`);
        resolve();
      };

      document.head.appendChild(script);
    });
  }

  /**
   * 渲染 Mermaid 图表
   */
  async renderDiagram(element, diagramCode) {
    if (!this.isInitialized || !this.settings.enabled) {
      return false;
    }

    let container;
    try {
      container = this.createDiagramContainer(element);
      const diagramId = `mermaid-${Date.now()}-${++this.diagramCounter}`;

      // 验证 Mermaid 语法
      if (!this.validateMermaidSyntax(diagramCode)) {
        this.showError(container, "代码内容不是有效的 Mermaid 图表语法");
        return false;
      }

      // 清理代码
      const cleanCode = this.cleanDiagramCode(diagramCode);

      // 渲染图表
      const diagramWrapper = container.querySelector(".mermaid-diagram");
      diagramWrapper.id = diagramId;

      // 使用 Mermaid 渲染 - 添加更严格的错误处理
      try {
        // 首先预检查语法
        if (!this.preValidateMermaidCode(cleanCode)) {
          throw new Error("Mermaid 语法验证失败");
        }

        // 尝试新的 API
        const { svg } = await window.mermaid.render(
          `svg-${diagramId}`,
          cleanCode
        );
        diagramWrapper.innerHTML = svg;

        // 隐藏错误信息（如果之前有显示）
        this.hideError(container);
      } catch (renderError) {
        console.log("🔄 新 API 失败，尝试传统方式:", renderError.message);

        try {
          // 降级到传统渲染方式
          diagramWrapper.innerHTML = cleanCode;
          diagramWrapper.className += " mermaid-fallback";

          // 重新初始化 Mermaid
          if (window.mermaid.init) {
            await window.mermaid.init(undefined, diagramWrapper);
            // 隐藏错误信息
            this.hideError(container);
          } else {
            throw new Error("Mermaid init 方法不可用");
          }
        } catch (fallbackError) {
          console.error("🚫 传统渲染方式也失败:", fallbackError.message);
          throw new Error(`图表渲染失败: ${fallbackError.message}`);
        }
      }

      // 添加交互控制
      this.addDiagramControls(container, diagramWrapper, cleanCode);

      // 应用设置
      this.applyDiagramSettings(container);

      return true;
    } catch (error) {
      console.error("🚫 Mermaid 图表渲染失败:", error);
      if (container) {
        this.showError(container, `渲染失败: ${error.message}`);
      } else {
        // 如果连容器都没创建成功，创建一个简单的错误显示
        this.showSimpleError(element.parentElement || element, error.message);
      }
      return false;
    }
  }

  /**
   * 创建图表容器
   */
  createDiagramContainer(originalElement) {
    const container = document.createElement("div");
    container.className = "mermaid-container";
    container.innerHTML = `
      <div class="mermaid-toolbar">
        <span class="diagram-type">Mermaid</span>
        <div class="diagram-controls">
          <button class="refresh-btn" title="刷新图表">🔄</button>
          <button class="copy-btn" title="复制代码">📋</button>
          <button class="export-btn" title="导出图片">📤</button>
          <button class="fullscreen-btn" title="全屏查看">⛶</button>
          <button class="zoom-controls-toggle" title="缩放控制">🔍</button>
        </div>
      </div>
      <div class="mermaid-content">
        <div class="mermaid-diagram"></div>
        <div class="zoom-controls">
          <button class="zoom-in" title="放大">+</button>
          <button class="zoom-out" title="缩小">-</button>
          <button class="zoom-fit" title="适应大小">🏠</button>
          <button class="zoom-width" title="适应宽度">📱</button>
        </div>
      </div>
      <div class="mermaid-error hidden"></div>
    `;

    // 替换原始元素
    const parent = originalElement.parentElement;
    if (parent) {
      parent.replaceChild(container, originalElement);
    }

    return container;
  }

  /**
   * 预验证 Mermaid 代码
   */
  preValidateMermaidCode(code) {
    try {
      const trimmedCode = code.trim();

      // 基本检查
      if (!trimmedCode || trimmedCode.length < 5) {
        return false;
      }

      // 检查是否包含危险语法
      const dangerousPatterns = [
        /javascript:/i,
        /onclick/i,
        /onload/i,
        /<script/i,
        /eval\(/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(trimmedCode)) {
          console.warn("🚫 检测到潜在危险语法:", pattern);
          return false;
        }
      }

      // 检查基本语法结构
      const hasValidStructure =
        /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline|requirementDiagram|c4Context|sankey|quadrantChart|xyChart|block-beta)/i.test(
          trimmedCode
        );

      return hasValidStructure;
    } catch (error) {
      console.warn("🚫 预验证出错:", error);
      return false;
    }
  }

  /**
   * 验证 Mermaid 语法
   */
  validateMermaidSyntax(code) {
    const diagramTypes = [
      "graph",
      "flowchart",
      "sequenceDiagram",
      "classDiagram",
      "stateDiagram",
      "stateDiagram-v2",
      "erDiagram",
      "journey",
      "gantt",
      "pie",
      "gitgraph",
      "mindmap",
      "timeline",
      "requirementDiagram",
      "c4Context",
      "sankey",
      "quadrantChart",
      "xyChart",
      "block-beta",
    ];

    const trimmedCode = code.trim();

    // 简单检查：必须包含某个图表类型关键字
    const hasValidStart = diagramTypes.some((type) => {
      const regex = new RegExp(`\\b${type}\\b`, "i");
      return regex.test(trimmedCode);
    });

    // 或者包含典型的 Mermaid 语法元素
    const hasMermaidSyntax =
      /(->>|-->>|->|-->|\|\|--|\|\|\.\.|participant|actor|note\s+(over|left of|right of)|alt\s+|opt\s+|loop\s+|rect\s+|activate\s+|deactivate\s+|\[.*\]|\{.*\}|%%)/i.test(
        trimmedCode
      );

    return (hasValidStart || hasMermaidSyntax) && trimmedCode.length > 5;
  }

  /**
   * 清理图表代码
   */
  cleanDiagramCode(code) {
    return code
      .trim()
      .replace(/^\s*```mermaid\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }

  /**
   * 添加图表控制
   */
  addDiagramControls(container, diagramWrapper, originalCode) {
    const toolbar = container.querySelector(".mermaid-toolbar");
    const zoomControls = container.querySelector(".zoom-controls");

    // 刷新按钮
    toolbar.querySelector(".refresh-btn").onclick = () => {
      this.refreshDiagram(container, originalCode);
    };

    // 复制按钮
    toolbar.querySelector(".copy-btn").onclick = () => {
      this.copyDiagramCode(originalCode);
    };

    // 导出按钮
    toolbar.querySelector(".export-btn").onclick = () => {
      this.exportDiagram(diagramWrapper);
    };

    // 全屏按钮
    toolbar.querySelector(".fullscreen-btn").onclick = () => {
      this.showFullscreenModal(diagramWrapper, originalCode);
    };

    // 缩放控制切换
    toolbar.querySelector(".zoom-controls-toggle").onclick = () => {
      zoomControls.classList.toggle("visible");
    };

    // 缩放控制
    this.setupZoomControls(diagramWrapper, zoomControls);
  }

  /**
   * 设置缩放控制
   */
  setupZoomControls(diagramWrapper, controls) {
    let currentScale = 1;
    const scaleStep = 0.2;
    const minScale = 0.1;
    const maxScale = 5;

    const applyScale = (scale) => {
      currentScale = Math.max(minScale, Math.min(maxScale, scale));
      const svg = diagramWrapper.querySelector("svg");
      if (svg) {
        svg.style.transform = `scale(${currentScale})`;
        svg.style.transformOrigin = "top left";

        // 更新容器大小
        const rect = svg.getBoundingClientRect();
        diagramWrapper.style.width = `${rect.width * currentScale}px`;
        diagramWrapper.style.height = `${rect.height * currentScale}px`;
        diagramWrapper.style.overflow = "auto";
      }
    };

    controls.querySelector(".zoom-in").onclick = () => {
      applyScale(currentScale + scaleStep);
    };

    controls.querySelector(".zoom-out").onclick = () => {
      applyScale(currentScale - scaleStep);
    };

    controls.querySelector(".zoom-fit").onclick = () => {
      currentScale = 1;
      const svg = diagramWrapper.querySelector("svg");
      if (svg) {
        svg.style.transform = "scale(1)";
        diagramWrapper.style.width = "";
        diagramWrapper.style.height = "";
        diagramWrapper.style.overflow = "";
      }
    };

    controls.querySelector(".zoom-width").onclick = () => {
      const svg = diagramWrapper.querySelector("svg");
      if (svg) {
        const containerWidth = diagramWrapper.parentElement.offsetWidth - 40;
        const svgWidth = svg.getBBox ? svg.getBBox().width : svg.offsetWidth;
        if (svgWidth > 0) {
          const scale = containerWidth / svgWidth;
          applyScale(scale);
        }
      }
    };
  }

  /**
   * 刷新图表
   */
  async refreshDiagram(container, code) {
    const diagramWrapper = container.querySelector(".mermaid-diagram");
    const errorDiv = container.querySelector(".mermaid-error");

    // 清空内容
    diagramWrapper.innerHTML = '<div class="loading">正在渲染图表...</div>';
    errorDiv.classList.add("hidden");

    // 重新渲染
    try {
      const diagramId = `mermaid-refresh-${Date.now()}`;
      diagramWrapper.id = diagramId;

      // 清理代码
      const cleanCode = this.cleanDiagramCode(code);

      // 使用更稳定的渲染方式
      try {
        // 尝试新的 API
        const { svg } = await window.mermaid.render(
          `svg-${diagramId}`,
          cleanCode
        );
        diagramWrapper.innerHTML = svg;
      } catch (renderError) {
        console.log("新 API 失败，尝试传统方式:", renderError.message);

        // 降级到传统渲染方式
        diagramWrapper.innerHTML = cleanCode;
        diagramWrapper.className += " mermaid-fallback";

        // 重新初始化 Mermaid
        if (window.mermaid.init) {
          await window.mermaid.init(undefined, diagramWrapper);
        } else {
          throw new Error("Mermaid init method not available");
        }
      }

      this.applyDiagramSettings(container);
      this.showToast("图表已刷新", "success");
    } catch (error) {
      console.error("刷新图表失败:", error);
      this.showError(container, `刷新失败: ${error.message}`);
    }
  }

  /**
   * 复制图表代码
   */
  async copyDiagramCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      this.showToast("代码已复制到剪贴板", "success");
    } catch (error) {
      console.error("Copy failed:", error);
      this.showToast("复制失败", "error");
    }
  }

  /**
   * 导出图表
   */
  async exportDiagram(diagramWrapper) {
    try {
      const svg = diagramWrapper.querySelector("svg");
      if (!svg) {
        this.showToast("没有可导出的图表", "error");
        return;
      }

      // 如果 html2canvas 可用，使用它
      if (window.html2canvas) {
        const canvas = await window.html2canvas(svg, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
        });

        // 创建下载链接
        const link = document.createElement("a");
        link.download = `mermaid-diagram-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        this.showToast("图表已导出为 PNG", "success");
      } else {
        // 降级到 SVG 导出
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.download = `mermaid-diagram-${Date.now()}.svg`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        this.showToast("图表已导出为 SVG", "success");
      }
    } catch (error) {
      console.error("Export failed:", error);
      this.showToast("导出失败", "error");
    }
  }

  /**
   * 显示全屏模态框
   */
  async showFullscreenModal(originalDiagramWrapper, originalCode) {
    // 创建模态框容器
    const modal = document.createElement("div");
    modal.className = "mermaid-fullscreen-modal";

    // 创建模态框内容
    const modalContent = document.createElement("div");
    modalContent.className = "mermaid-fullscreen-content";

    // 创建头部工具栏
    const header = document.createElement("div");
    header.className = "mermaid-fullscreen-header";
    header.innerHTML = `
      <div class="mermaid-fullscreen-title">
        <span>📊 Mermaid 图表 - 全屏查看</span>
      </div>
      <div class="mermaid-fullscreen-controls">
        <button class="fullscreen-zoom-in" title="放大">🔍+</button>
        <button class="fullscreen-zoom-out" title="缩小">🔍-</button>
        <button class="fullscreen-zoom-fit" title="适应大小">📐</button>
        <button class="fullscreen-reset" title="重置视图">🔄</button>
        <button class="fullscreen-export" title="导出图片">📤</button>
        <button class="fullscreen-close" title="关闭">✕</button>
      </div>
    `;

    // 创建图表容器
    const diagramContainer = document.createElement("div");
    diagramContainer.className = "mermaid-fullscreen-diagram";

    // 创建图表包装器（类似于主渲染器的结构）
    const diagramWrapper = document.createElement("div");
    diagramWrapper.className = "mermaid-diagram";
    const diagramId = `mermaid-fullscreen-${Date.now()}`;
    diagramWrapper.id = diagramId;

    diagramContainer.appendChild(diagramWrapper);

    // 组装模态框
    modalContent.appendChild(header);
    modalContent.appendChild(diagramContainer);
    modal.appendChild(modalContent);

    // 添加到页面
    document.body.appendChild(modal);

    try {
      // 渲染图表
      const cleanCode = this.cleanDiagramCode(originalCode);
      console.log("Full-screen rendering code:", cleanCode);
      console.log("Diagram ID:", diagramId);

      // 检查 Mermaid 是否可用
      if (!window.mermaid) {
        throw new Error("Mermaid library not available");
      }

      // 使用与主渲染函数相同的逻辑
      try {
        // 尝试新的 API
        const { svg } = await window.mermaid.render(
          `svg-${diagramId}`,
          cleanCode
        );
        diagramWrapper.innerHTML = svg;
        console.log("Rendered with new API successfully");
      } catch (renderError) {
        console.log("新 API 失败，尝试传统方式:", renderError.message);

        // 降级到传统渲染方式
        diagramWrapper.innerHTML = cleanCode;
        diagramWrapper.className += " mermaid-fallback";

        // 重新初始化 Mermaid
        if (window.mermaid.init) {
          await window.mermaid.init(undefined, diagramWrapper);
          console.log("Rendered with fallback method successfully");
        } else {
          throw new Error("Mermaid init method not available");
        }
      }

      // 设置初始状态
      let currentScale = 1;
      let translateX = 0;
      let translateY = 0;
      let isDragging = false;
      let lastMouseX = 0;
      let lastMouseY = 0;

      const svgElement = diagramWrapper.querySelector("svg");
      if (svgElement) {
        svgElement.style.cursor = "grab";
        svgElement.style.transition = "transform 0.3s ease";
      }

      // 应用变换
      const applyTransform = () => {
        if (svgElement) {
          svgElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
        }
      };

      // 缩放功能
      const zoomIn = () => {
        currentScale = Math.min(currentScale * 1.2, 5);
        applyTransform();
      };

      const zoomOut = () => {
        currentScale = Math.max(currentScale / 1.2, 0.1);
        applyTransform();
      };

      const fitToScreen = () => {
        if (!svgElement) return;

        const containerRect = diagramContainer.getBoundingClientRect();
        const svgRect = svgElement.getBoundingClientRect();

        const scaleX = (containerRect.width - 40) / svgRect.width;
        const scaleY = (containerRect.height - 40) / svgRect.height;

        currentScale = Math.min(scaleX, scaleY, 1);
        translateX = 0;
        translateY = 0;
        applyTransform();
      };

      const resetView = () => {
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
      };

      // 拖拽功能
      const startDrag = (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        if (svgElement) {
          svgElement.style.cursor = "grabbing";
        }
        e.preventDefault();
      };

      const drag = (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        translateX += deltaX;
        translateY += deltaY;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        applyTransform();
        e.preventDefault();
      };

      const endDrag = () => {
        isDragging = false;
        if (svgElement) {
          svgElement.style.cursor = "grab";
        }
      };

      // 滚轮缩放
      const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        currentScale = Math.max(0.1, Math.min(5, currentScale * delta));
        applyTransform();
      };

      // 事件监听器
      header.querySelector(".fullscreen-zoom-in").onclick = zoomIn;
      header.querySelector(".fullscreen-zoom-out").onclick = zoomOut;
      header.querySelector(".fullscreen-zoom-fit").onclick = fitToScreen;
      header.querySelector(".fullscreen-reset").onclick = resetView;

      header.querySelector(".fullscreen-export").onclick = () => {
        this.exportDiagram(diagramContainer);
      };

      header.querySelector(".fullscreen-close").onclick = () => {
        modal.remove();
      };

      // 图表交互事件
      if (svgElement) {
        svgElement.addEventListener("mousedown", startDrag);
        svgElement.addEventListener("wheel", handleWheel);
      }

      diagramContainer.addEventListener("mousemove", drag);
      diagramContainer.addEventListener("mouseup", endDrag);
      diagramContainer.addEventListener("mouseleave", endDrag);

      // 点击背景关闭
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      };

      // ESC 键关闭
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          modal.remove();
          document.removeEventListener("keydown", handleKeyDown);
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      // 初始适应屏幕
      setTimeout(fitToScreen, 100);
    } catch (error) {
      console.error("Full-screen diagram rendering failed:", error);
      diagramContainer.innerHTML = `
        <div class="mermaid-fullscreen-error">
          <h3>渲染失败</h3>
          <p>${error.message}</p>
          <pre>${originalCode}</pre>
        </div>
      `;
    }
  }

  /**
   * 显示错误信息
   */
  showError(container, message) {
    const errorDiv = container.querySelector(".mermaid-error");
    if (errorDiv) {
      errorDiv.innerHTML = `
        <div class="mermaid-error-content">
          <strong>🚫 Mermaid 渲染错误:</strong>
          <br>
          <span class="error-message">${message}</span>
          <br>
          <small>请检查图表语法是否正确，或查看控制台获取详细信息</small>
          <button class="error-close-btn" title="关闭错误信息">✕</button>
        </div>
      `;
      errorDiv.classList.remove("hidden");

      // 添加关闭按钮事件
      const closeBtn = errorDiv.querySelector(".error-close-btn");
      if (closeBtn) {
        closeBtn.onclick = () => {
          this.hideError(container);
        };
      }

      // 5秒后自动隐藏（可选）
      setTimeout(() => {
        if (!errorDiv.classList.contains("hidden")) {
          this.hideError(container);
        }
      }, 10000);
    }
  }

  /**
   * 隐藏错误信息
   */
  hideError(container) {
    const errorDiv = container.querySelector(".mermaid-error");
    if (errorDiv) {
      errorDiv.classList.add("hidden");
    }
  }

  /**
   * 显示简单错误（当容器创建失败时使用）
   */
  showSimpleError(element, message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "mermaid-simple-error";
    errorDiv.innerHTML = `
      <div class="mermaid-error-content">
        <strong>🚫 Mermaid 错误:</strong>
        <span class="error-message">${message}</span>
        <button class="error-close-btn" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `;

    // 替换原始元素
    if (element && element.parentElement) {
      element.parentElement.replaceChild(errorDiv, element);
    }
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = "info") {
    // 移除现有的 toast
    const existingToast = document.querySelector(".mermaid-toast");
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = `mermaid-toast mermaid-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发动画
    setTimeout(() => toast.classList.add("show"), 10);

    // 自动移除
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * 应用图表设置
   */
  applyDiagramSettings(container) {
    const zoomControls = container.querySelector(".zoom-controls");
    const exportBtn = container.querySelector(".export-btn");
    const fullscreenBtn = container.querySelector(".fullscreen-btn");
    const refreshBtn = container.querySelector(".refresh-btn");

    // 显示/隐藏控制元素
    if (zoomControls) {
      zoomControls.style.display = this.settings.showZoomControls
        ? "flex"
        : "none";
    }
    if (exportBtn) {
      exportBtn.style.display = this.settings.showExportButton
        ? "inline-block"
        : "none";
    }
    if (fullscreenBtn) {
      fullscreenBtn.style.display = this.settings.showFullscreenButton
        ? "inline-block"
        : "none";
    }

    // 自适应宽度
    if (this.settings.autoFitWidth) {
      const svg = container.querySelector("svg");
      if (svg) {
        svg.style.maxWidth = "100%";
        svg.style.height = "auto";
      }
    }
  }

  /**
   * 应用设置
   */
  applySettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // 如果主题改变，重新初始化 Mermaid
    if (newSettings.theme && newSettings.theme !== this.currentTheme) {
      this.currentTheme = newSettings.theme;
      if (window.mermaid) {
        window.mermaid.initialize({
          ...window.mermaid.defaultConfig,
          theme: this.currentTheme,
        });
      }
    }

    this.updateAllDiagrams();
  }

  /**
   * 更新所有图表
   */
  updateAllDiagrams() {
    document.querySelectorAll(".mermaid-container").forEach((container) => {
      this.applyDiagramSettings(container);
    });
  }

  /**
   * 保存设置
   */
  saveSettings() {
    const settings = {
      theme: this.currentTheme,
      ...this.settings,
    };
    localStorage.setItem("mermaidSettings", JSON.stringify(settings));
  }

  /**
   * 加载设置
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem("mermaidSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        this.settings = { ...this.settings, ...settings };
        if (settings.theme) {
          this.currentTheme = settings.theme;
        }
      }
    } catch (error) {
      console.error("Failed to load Mermaid settings:", error);
    }
  }

  /**
   * 检测和渲染所有 Mermaid 代码块
   */
  renderAllMermaidBlocks() {
    if (!this.settings.enabled || !this.isInitialized) {
      return;
    }

    // 尝试多种选择器来匹配 Mermaid 代码块
    const selectors = [
      "pre code.language-mermaid",
      'pre code[class*="language-mermaid"]',
      'pre code[class*="mermaid"]',
      "code.language-mermaid",
      'code[class*="language-mermaid"]',
      'code[class*="mermaid"]',
    ];

    let mermaidBlocks = [];

    // 尝试每个选择器
    for (const selector of selectors) {
      const blocks = document.querySelectorAll(selector);
      if (blocks.length > 0) {
        mermaidBlocks = [...blocks];
        console.log(
          `Found ${blocks.length} Mermaid blocks using selector: ${selector}`
        );
        break;
      }
    }

    // 如果没有找到，尝试通过内容匹配
    if (mermaidBlocks.length === 0) {
      const allCodeBlocks = document.querySelectorAll("pre code");
      allCodeBlocks.forEach((block) => {
        const content = block.textContent.trim();
        if (this.validateMermaidSyntax(content)) {
          mermaidBlocks.push(block);
          console.log("Found Mermaid block by content validation");
        }
      });
    }

    console.log(`Total Mermaid blocks to render: ${mermaidBlocks.length}`);

    mermaidBlocks.forEach(async (block) => {
      const code = block.textContent;
      if (code && code.trim()) {
        // 使用父元素（pre 标签）作为容器
        const container = block.closest("pre") || block.parentElement;
        await this.renderDiagram(container, code);
      }
    });
  }

  /**
   * 获取支持的图表类型
   */
  getSupportedDiagramTypes() {
    return [
      {
        type: "sequenceDiagram",
        name: "序列图/泳道图",
        example: `sequenceDiagram
    participant A as 客户
    participant B as 销售
    participant C as 仓库
    A->>B: 下订单
    B->>C: 确认库存
    C-->>B: 库存充足
    B-->>A: 确认订单`,
      },
      {
        type: "flowchart",
        name: "流程图",
        example: `flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作]
    B -->|否| D[其他操作]
    C --> E[结束]
    D --> E`,
      },
      {
        type: "classDiagram",
        name: "类图",
        example: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`,
      },
      {
        type: "gantt",
        name: "甘特图",
        example: `gantt
    title 项目计划
    dateFormat  YYYY-MM-DD
    section 设计
    需求分析      :2024-01-01, 30d
    原型设计      :30d
    section 开发
    前端开发      :2024-02-01, 45d
    后端开发      :45d`,
      },
      {
        type: "pie",
        name: "饼图",
        example: `pie title 市场份额
    "产品A" : 386
    "产品B" : 85
    "产品C" : 150
    "其他" : 179`,
      },
    ];
  }

  /**
   * 获取当前设置
   */
  getCurrentSettings() {
    return {
      theme: this.currentTheme,
      ...this.settings,
    };
  }
}

// 导出类
window.MermaidRenderer = MermaidRenderer;
