# 全屏模式测试文档

## 流程图测试

```mermaid
flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[处理结果]
    D --> E
    E --> F[更新状态]
    F --> G{是否继续}
    G -->|是| H[继续下一步]
    G -->|否| I[结束流程]
    H --> J[复杂的业务逻辑处理]
    J --> K[数据验证]
    K --> L[数据存储]
    L --> M[发送通知]
    M --> N[日志记录]
    N --> O[性能监控]
    O --> P[错误处理]
    P --> Q[资源清理]
    Q --> I
```

## 序列图（泳道图）测试

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端系统
    participant A as API网关
    participant S as 服务层
    participant D as 数据库
    participant C as 缓存
    participant Q as 消息队列
    participant N as 通知服务

    U->>F: 1. 发起请求
    F->>A: 2. 转发请求
    A->>S: 3. 路由到服务

    alt 缓存命中
        S->>C: 4a. 查询缓存
        C-->>S: 4b. 返回缓存数据
    else 缓存未命中
        S->>D: 4c. 查询数据库
        D-->>S: 4d. 返回数据
        S->>C: 4e. 更新缓存
    end

    S->>Q: 5. 发送异步消息
    Q->>N: 6. 触发通知

    S-->>A: 7. 返回处理结果
    A-->>F: 8. 返回响应
    F-->>U: 9. 显示结果

    Note over N: 异步处理通知
    N->>U: 10. 推送通知
```

## 甘特图测试

```mermaid
gantt
    title 项目开发时间线
    dateFormat  YYYY-MM-DD
    section 需求分析
    需求收集          :done,    des1, 2024-01-01,2024-01-05
    需求分析          :done,    des2, after des1, 5d
    需求评审          :done,    des3, after des2, 2d
    section 设计阶段
    系统设计          :active,  design1, after des3, 10d
    界面设计          :         design2, after des3, 8d
    数据库设计        :         design3, after design1, 5d
    section 开发阶段
    前端开发          :         dev1, after design2, 15d
    后端开发          :         dev2, after design1, 20d
    接口开发          :         dev3, after design3, 10d
    section 测试阶段
    单元测试          :         test1, after dev1, 5d
    集成测试          :         test2, after dev2, 8d
    系统测试          :         test3, after test2, 10d
    section 上线部署
    预生产部署        :         deploy1, after test3, 3d
    生产环境部署      :         deploy2, after deploy1, 2d
```

## 状态图测试

```mermaid
stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中 : 开始处理
    处理中 --> 暂停 : 暂停操作
    暂停 --> 处理中 : 恢复处理
    处理中 --> 完成 : 处理成功
    处理中 --> 失败 : 处理失败
    失败 --> 待处理 : 重新开始
    失败 --> 取消 : 放弃处理
    完成 --> [*]
    取消 --> [*]

    state 处理中 {
        [*] --> 验证数据
        验证数据 --> 执行业务逻辑
        执行业务逻辑 --> 保存结果
        保存结果 --> [*]

        验证数据 --> 数据错误
        数据错误 --> [*]
    }
```

## 实体关系图测试

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    USER {
        int user_id PK
        string username
        string email
        string password
        datetime created_at
        datetime updated_at
    }

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int order_id PK
        int user_id FK
        decimal total_amount
        string status
        datetime order_date
        datetime updated_at
    }

    ORDER_ITEM }|--|| PRODUCT : references
    ORDER_ITEM {
        int order_item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal total_price
    }

    PRODUCT ||--o{ REVIEW : receives
    PRODUCT ||--o{ CATEGORY_PRODUCT : belongs_to
    PRODUCT {
        int product_id PK
        string name
        string description
        decimal price
        int stock_quantity
        datetime created_at
        datetime updated_at
    }

    CATEGORY ||--o{ CATEGORY_PRODUCT : contains
    CATEGORY {
        int category_id PK
        string name
        string description
        int parent_id FK
    }

    CATEGORY_PRODUCT {
        int category_id FK
        int product_id FK
    }

    REVIEW {
        int review_id PK
        int user_id FK
        int product_id FK
        int rating
        string comment
        datetime created_at
    }
```

通过这个测试文档，你可以：

1. **测试全屏功能**：点击任一图表右上角的 ⛶ 按钮进入全屏模式
2. **测试缩放功能**：使用工具栏上的缩放按钮或鼠标滚轮
3. **测试拖拽功能**：在全屏模式下拖拽图表查看不同区域
4. **测试适应功能**：点击 📐 按钮自动适应屏幕尺寸
5. **测试导出功能**：在全屏模式下导出高清图片
6. **测试关闭功能**：点击 ✕ 按钮或按 ESC 键关闭全屏模式
