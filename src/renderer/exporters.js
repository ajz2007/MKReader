/**
 * 基础导出器类
 */
class BaseExporter {
  constructor(name, extension, defaultOptions = {}) {
    this.name = name;
    this.extension = extension;
    this.defaultOptions = defaultOptions;
  }

  async export(content, options = {}) {
    throw new Error("子类必须实现 export 方法");
  }

  validateOptions(options) {
    return { ...this.defaultOptions, ...options };
  }

  updateProgress(callback, progress, status) {
    if (callback) {
      callback(progress, status);
    }
  }
}

/**
 * PDF 导出器
 */
class PDFExporter extends BaseExporter {
  constructor() {
    super("PDF Document", "pdf", {
      pageSize: "A4",
      orientation: "portrait",
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    });
  }

  async export(content, options = {}) {
    const settings = this.validateOptions(options);
    const { progressCallback } = settings;

    this.updateProgress(progressCallback, 10, "准备PDF生成...");

    try {
      this.updateProgress(progressCallback, 30, "处理文档内容...");

      // 准备导出选项
      const exportOptions = {
        pageSize: settings.pageSize || "A4",
        orientation: settings.orientation || "portrait",
        includeBackground: settings.includeBackground !== false,
        margin: settings.margin || {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        },
      };

      this.updateProgress(progressCallback, 50, "生成PDF文件...");

      // 对于PDF导出，我们需要确保传递完整的HTML内容
      console.log("开始PDF导出，内容长度:", content.html.length);
      console.log("内容预览:", content.html.substring(0, 200) + "...");

      // 通过预加载的API生成PDF
      const result = await window.api.exportToPDF(content.html, exportOptions);

      if (!result.success) {
        throw new Error(result.error || "PDF生成失败");
      }

      this.updateProgress(progressCallback, 80, "保存文件...");

      // 保存PDF文件
      const saveResult = await window.api.saveFile(
        settings.filename,
        result.data
      );

      if (!saveResult.success) {
        throw new Error(saveResult.error || "文件保存失败");
      }

      this.updateProgress(progressCallback, 100, "导出完成");

      return {
        filePath: saveResult.filePath,
        format: "pdf",
        size: result.data.length,
      };
    } catch (error) {
      console.error("PDF导出失败:", error);
      throw new Error(`PDF导出失败: ${error.message}`);
    }
  }
}

/**
 * HTML 导出器
 */
class HTMLExporter extends BaseExporter {
  constructor() {
    super("HTML Document", "html", {
      standalone: true,
      includeCSS: true,
      theme: "github",
    });
  }

  async export(content, options = {}) {
    const settings = this.validateOptions(options);
    const { progressCallback } = settings;

    this.updateProgress(progressCallback, 10, "准备HTML导出...");

    try {
      this.updateProgress(progressCallback, 30, "处理样式和内容...");

      // 获取当前页面的样式
      const stylesheets = await this.extractStylesheets();

      this.updateProgress(progressCallback, 50, "生成HTML文件...");

      // 构建完整的HTML文档
      const htmlDocument = this.buildHTMLDocument(
        content,
        stylesheets,
        settings
      );

      this.updateProgress(progressCallback, 80, "保存文件...");

      // 保存文件
      const result = await window.api.saveFile(settings.filename, htmlDocument);

      if (!result.success) {
        throw new Error(result.error || "文件保存失败");
      }

      this.updateProgress(progressCallback, 100, "导出完成");

      return {
        filePath: result.filePath,
        format: "html",
        size: htmlDocument.length,
      };
    } catch (error) {
      console.error("HTML导出失败:", error);
      throw new Error(`HTML导出失败: ${error.message}`);
    }
  }

  async extractStylesheets() {
    const stylesheets = [];

    // 获取所有链接的CSS文件
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of linkElements) {
      try {
        const response = await fetch(link.href);
        const css = await response.text();
        stylesheets.push({
          url: link.href,
          content: css,
        });
      } catch (error) {
        console.warn("无法加载样式表:", link.href);
      }
    }

    // 获取内联样式
    const styleElements = document.querySelectorAll("style");
    for (const style of styleElements) {
      stylesheets.push({
        url: "inline",
        content: style.textContent,
      });
    }

    return stylesheets;
  }

  buildHTMLDocument(content, stylesheets, settings) {
    const cssContent = stylesheets.map((sheet) => sheet.content).join("\n");

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <style>
        /* GitHub Markdown CSS */
        ${cssContent}
        
        /* Print optimizations */
        @media print {
            body { margin: 0; }
            .markdown-body { 
                max-width: none;
                padding: 20px;
            }
        }
        
        /* Custom export styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #24292e;
            background-color: #ffffff;
        }
    </style>
</head>
<body>
    <div class="markdown-body">
        ${content.html}
    </div>
    
    <!-- Export metadata -->
    <script type="application/json" id="export-metadata">
    {
        "exportedAt": "${new Date().toISOString()}",
        "exportedBy": "MKReader",
        "originalTitle": "${content.title}",
        "format": "html"
    }
    </script>
</body>
</html>`;
  }
}

/**
 * PNG 图片导出器
 */
class PNGExporter extends BaseExporter {
  constructor() {
    super("PNG Image", "png", {
      width: 1200,
      quality: 0.9,
      background: "#ffffff",
    });
  }

  async export(content, options = {}) {
    const settings = this.validateOptions(options);
    const { progressCallback } = settings;

    this.updateProgress(progressCallback, 10, "准备图片导出...");

    try {
      // 动态加载 html2canvas
      if (!window.html2canvas) {
        this.updateProgress(progressCallback, 20, "加载渲染引擎...");
        await this.loadHtml2Canvas();
      }

      this.updateProgress(progressCallback, 40, "渲染页面内容...");

      // 获取要截图的元素
      const element = content.element || document.getElementById("content");

      // 配置 html2canvas 选项
      const html2canvasOptions = {
        backgroundColor: settings.background,
        width: settings.width,
        useCORS: true,
        allowTaint: true,
        scale: 2, // 高分辨率
        scrollX: 0,
        scrollY: 0,
        windowWidth: settings.width,
        windowHeight: element.scrollHeight,
      };

      this.updateProgress(progressCallback, 60, "生成图片...");

      // 使用 html2canvas 截图
      const canvas = await window.html2canvas(element, html2canvasOptions);

      this.updateProgress(progressCallback, 80, "保存图片文件...");

      // 转换为 blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/png", settings.quality);
      });

      // 转换blob为ArrayBuffer以便保存
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // 保存文件
      const result = await window.api.saveFile(settings.filename, buffer);

      if (!result.success) {
        throw new Error(result.error || "文件保存失败");
      }

      this.updateProgress(progressCallback, 100, "导出完成");

      return {
        filePath: result.filePath,
        format: "png",
        size: blob.size,
        dimensions: {
          width: canvas.width,
          height: canvas.height,
        },
      };
    } catch (error) {
      console.error("PNG导出失败:", error);
      throw new Error(`PNG导出失败: ${error.message}`);
    }
  }

  async loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "../../node_modules/html2canvas/dist/html2canvas.min.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("无法加载 html2canvas"));
      document.head.appendChild(script);
    });
  }
}

// 导出所有类
window.BaseExporter = BaseExporter;
window.PDFExporter = PDFExporter;
window.HTMLExporter = HTMLExporter;
window.PNGExporter = PNGExporter;
