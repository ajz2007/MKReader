# Mermaid 图表测试

本文档用于测试 MKReader 中的 Mermaid 图表渲染功能。

## 1. 序列图/泳道图

以下是一个客户购买流程的序列图：

```mermaid
sequenceDiagram
    participant 客户
    participant 前端界面
    participant 后端API
    participant 数据库
    participant 支付系统

    客户->>前端界面: 浏览商品
    前端界面->>后端API: 获取商品列表
    后端API->>数据库: 查询商品信息
    数据库-->>后端API: 返回商品数据
    后端API-->>前端界面: 商品列表
    前端界面-->>客户: 显示商品

    客户->>前端界面: 添加到购物车
    前端界面->>后端API: 更新购物车
    后端API->>数据库: 保存购物车数据

    客户->>前端界面: 确认订单
    前端界面->>后端API: 创建订单
    后端API->>数据库: 保存订单信息
    后端API->>支付系统: 发起支付
    支付系统-->>后端API: 支付结果
    后端API-->>前端界面: 订单状态
    前端界面-->>客户: 显示支付结果
```

## 2. 流程图

下面是一个软件开发流程图：

```mermaid
flowchart TD
    A[需求分析] --> B{需求明确吗?}
    B -->|是| C[系统设计]
    B -->|否| D[补充需求]
    D --> A

    C --> E[架构设计]
    E --> F[详细设计]
    F --> G[编码实现]

    G --> H[单元测试]
    H --> I{测试通过?}
    I -->|否| G
    I -->|是| J[集成测试]

    J --> K{测试通过?}
    K -->|否| L[修复Bug]
    L --> G
    K -->|是| M[系统测试]

    M --> N{验收通过?}
    N -->|否| O[问题分析]
    O --> P{需求变更?}
    P -->|是| A
    P -->|否| G
    N -->|是| Q[部署上线]

    Q --> R[运维监控]
```

## 3. 类图

这是一个简单的电商系统类图：

```mermaid
classDiagram
    class User {
        +String username
        +String email
        +String password
        +Date createTime
        +login()
        +logout()
        +updateProfile()
    }

    class Product {
        +String id
        +String name
        +String description
        +Double price
        +Integer stock
        +String category
        +updateStock()
        +updatePrice()
    }

    class Order {
        +String id
        +String userId
        +Date orderTime
        +Double totalAmount
        +String status
        +addProduct()
        +calculateTotal()
        +updateStatus()
    }

    class OrderItem {
        +String orderId
        +String productId
        +Integer quantity
        +Double unitPrice
        +Double subtotal
        +calculateSubtotal()
    }

    User ||--o{ Order
    Order ||--o{ OrderItem
    Product ||--o{ OrderItem
```

## 4. 甘特图

项目开发时间计划：

```mermaid
gantt
    title 电商系统开发计划
    dateFormat  YYYY-MM-DD
    section 需求阶段
    需求收集调研    :done,    des1, 2024-01-01,2024-01-15
    需求分析整理    :done,    des2, 2024-01-16,2024-01-31
    需求评审确认    :done,    des3, 2024-02-01,2024-02-05

    section 设计阶段
    系统架构设计    :active,  des4, 2024-02-06,2024-02-20
    数据库设计      :         des5, 2024-02-21,2024-03-05
    界面原型设计    :         des6, 2024-02-21,2024-03-10
    接口设计文档    :         des7, 2024-03-06,2024-03-15

    section 开发阶段
    后端接口开发    :         des8, 2024-03-16,2024-04-30
    前端界面开发    :         des9, 2024-03-25,2024-05-10
    移动端开发      :         des10, 2024-04-15,2024-05-20

    section 测试阶段
    单元测试        :         des11, 2024-04-01,2024-05-15
    集成测试        :         des12, 2024-05-11,2024-05-25
    系统测试        :         des13, 2024-05-21,2024-06-05

    section 发布阶段
    预发布环境      :         des14, 2024-06-06,2024-06-15
    生产环境部署    :         des15, 2024-06-16,2024-06-20
    上线运维        :         des16, 2024-06-21,2024-06-30
```

## 5. 饼图

用户操作系统分布：

```mermaid
pie title 用户操作系统分布
    "Windows" : 45
    "MacOS" : 25
    "Linux" : 15
    "iOS" : 8
    "Android" : 7
```

## 6. 状态图

用户账户状态流转：

```mermaid
stateDiagram-v2
    [*] --> 未激活

    未激活 --> 已激活 : 邮箱验证
    未激活 --> 已删除 : 管理员删除

    已激活 --> 已锁定 : 违规操作
    已激活 --> 已冻结 : 长期未活跃
    已激活 --> 已删除 : 用户注销

    已锁定 --> 已激活 : 申诉成功
    已锁定 --> 已删除 : 申诉失败

    已冻结 --> 已激活 : 重新登录
    已冻结 --> 已删除 : 超时未激活

    已删除 --> [*]
```

## 7. ER 图

数据库实体关系图：

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        string user_id PK
        string username
        string email
        string password_hash
        datetime created_at
        datetime updated_at
    }

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        string order_id PK
        string user_id FK
        datetime order_date
        decimal total_amount
        string status
        string shipping_address
    }

    PRODUCT ||--o{ ORDER_ITEM : included_in
    PRODUCT {
        string product_id PK
        string name
        string description
        decimal price
        integer stock_quantity
        string category
        datetime created_at
    }

    ORDER_ITEM {
        string order_id FK
        string product_id FK
        integer quantity
        decimal unit_price
        decimal subtotal
    }

    CATEGORY ||--o{ PRODUCT : categorizes
    CATEGORY {
        string category_id PK
        string name
        string description
        string parent_id FK
    }
```

## 8. 旅程图

用户购物体验旅程：

```mermaid
journey
    title 用户购物体验旅程
    section 发现阶段
      访问网站: 5: 用户
      浏览商品: 4: 用户
      搜索商品: 3: 用户
    section 考虑阶段
      查看详情: 4: 用户
      比较价格: 3: 用户
      阅读评价: 4: 用户
      咨询客服: 2: 用户, 客服
    section 购买阶段
      添加购物车: 5: 用户
      结算订单: 4: 用户
      选择支付: 3: 用户
      确认支付: 4: 用户, 支付系统
    section 履约阶段
      订单确认: 5: 用户, 系统
      商品发货: 4: 用户, 物流
      配送跟踪: 3: 用户, 物流
      确认收货: 5: 用户
    section 售后阶段
      商品评价: 4: 用户
      售后服务: 3: 用户, 客服
      推荐分享: 5: 用户
```

---

## 测试说明

以上图表覆盖了 Mermaid 支持的主要图表类型：

1. **序列图** - 展示系统交互流程
2. **流程图** - 描述业务或技术流程
3. **类图** - 显示系统类结构关系
4. **甘特图** - 项目时间进度规划
5. **饼图** - 数据比例分布
6. **状态图** - 状态流转过程
7. **ER 图** - 数据库实体关系
8. **旅程图** - 用户体验流程

每个图表都应该能够：

- ✅ 正确渲染显示
- ✅ 支持缩放控制
- ✅ 提供导出功能
- ✅ 复制源代码
- ✅ 响应式适配

如果图表无法正常显示，请检查：

1. Mermaid 库是否正确加载
2. 图表语法是否正确
3. 浏览器控制台是否有错误信息
4. 网络连接是否正常
