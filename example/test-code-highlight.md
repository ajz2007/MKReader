# 代码高亮测试文档

这是一个用于测试代码高亮功能的 Markdown 文档。

## JavaScript 代码示例

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 计算斐波那契数列
const result = fibonacci(10);
console.log(`第10个斐波那契数是: ${result}`);

/*
 * 这是一个递归实现
 * 时间复杂度: O(2^n)
 */
```

## Python 代码示例

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

# 测试排序算法
numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = bubble_sort(numbers.copy())
print(f"原数组: {numbers}")
print(f"排序后: {sorted_numbers}")
```

## HTML 代码示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>代码高亮测试</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>欢迎使用MKReader</h1>
      <p>这是一个功能强大的Markdown阅读器。</p>
    </div>
  </body>
</html>
```

## CSS 代码示例

```css
/* 响应式布局样式 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    padding: 10px;
  }
}
```

## SQL 代码示例

```sql
-- 创建用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入测试数据
INSERT INTO users (username, email, password_hash) VALUES
('john_doe', 'john@example.com', 'hashed_password_1'),
('jane_smith', 'jane@example.com', 'hashed_password_2'),
('bob_wilson', 'bob@example.com', 'hashed_password_3');

-- 查询活跃用户
SELECT
    u.username,
    u.email,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.username, u.email
ORDER BY post_count DESC;
```

## JSON 配置示例

```json
{
  "name": "mkreader",
  "version": "1.1.0",
  "description": "A powerful Markdown reader with code highlighting",
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "test": "jest"
  },
  "devDependencies": {
    "electron": "^37.2.6",
    "electron-builder": "^26.0.12"
  },
  "dependencies": {
    "prismjs": "^1.29.0",
    "prism-themes": "^1.9.0",
    "markdown-it": "^14.1.0"
  },
  "build": {
    "appId": "com.example.mkreader",
    "productName": "MKReader",
    "directories": {
      "output": "dist"
    }
  }
}
```

## 内联代码测试

这里有一些内联代码示例：`console.log('Hello, World!')`，以及 `npm install prismjs`，还有 `git commit -m "Add code highlighting"`。

## 测试说明

请测试以下功能：

1. **语法高亮**：检查各种编程语言的语法高亮是否正确显示
2. **行号显示**：验证行号是否正确显示
3. **语言标签**：确认代码块顶部是否显示正确的语言标签
4. **复制功能**：点击复制按钮测试是否能正确复制代码
5. **主题切换**：通过 View → Code Highlighting Settings 切换不同主题
6. **折叠功能**：对于长代码块测试折叠展开功能

如果以上功能都正常工作，说明代码高亮功能实现成功！
