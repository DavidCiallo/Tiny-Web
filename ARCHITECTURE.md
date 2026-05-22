# Tiny Web Architecture

## 概述

Tiny Web 是一个基于 Bun 的多应用架构，多个子应用共享同一个 V8 引擎实例（通过 Bun 进程），通过域名（Host 头）进行请求分发。

优势：多个应用共享内存、共享基础设施代码（kernel）、共享数据模块（shared modules），无需为每个应用单独启动进程。

---

## 目录结构

```
.
├── apps/
│   ├── entry/                  # 根入口，域名分发
│   │   └── index.ts
│   ├── kernel/                 # 共享基础设施（所有应用公用）
│   │   ├── lib/
│   │   │   ├── database.ts     # bun:sqlite 连接 + 自动建表
│   │   │   ├── mount.ts        # HTTP 路由匹配 + 静态文件服务 + WebSocket
│   │   │   └── repository.ts   # 通用 CRUD 仓库类
│   │   └── methods/
│   │       └── crypto.ts       # AES 加解密、SHA-256 哈希
│   ├── shared/                 # 跨应用共享模块
│   │   └── modules/
│   │       └── account/        # Account 实体/接口/路由（多应用共享）
│   ├── app1/                   # 应用1
│   │   ├── server/
│   │   │   ├── app/
│   │   │   │   ├── index.ts    # setupApp1() - 初始化 + 返回挂载配置
│   │   │   │   └── initialize.ts  # 初始化种子数据
│   │   │   └── modules/
│   │   │       ├── account/    # Account CRUD 控制器+服务
│   │   │       ├── auth/       # 登录/注册/Token 验证
│   │   │       └── demo/       # Demo 模块 CRUD
│   │   ├── client/             # React 前端
│   │   │   ├── api/            # API 客户端
│   │   │   ├── pages/          # 页面组件
│   │   │   └── ...
│   │   └── shared/             # app1 私有共享模块
│   │       └── modules/
│   │           ├── auth/       # 认证接口/路由
│   │           └── demo/       # Demo 接口/路由
│   └── app2/                   # 应用2（示例）
│       ├── server/
│       │   ├── app/
│       │   │   └── index.ts    # setupApp2()
│       │   └── modules/
│       │       └── blog/       # Blog 模块 CRUD
│       └── shared/
│           └── modules/
│               └── blog/       # Blog 接口/路由
├── dist/                       # Rsbuild 构建输出（前端静态文件）
├── rsbuild.config.ts           # 前端构建配置
├── tsconfig.json               # TypeScript 配置（类型检查用）
└── package.json
```

---

## 请求生命周期

```
客户端请求 (Host: localhost:3300)
        │
        ▼
apps/entry/index.ts  (Bun.serve)
        │
        ├── mountws()        → WebSocket 升级
        ├── domainMap[host]  → 域名匹配 => appName
        │                       例如 localhost:3300 → "app1"
        │                       app2.example.com → "app2"
        ├── getApp(appName)  → 懒加载 app setup（缓存）
        │                       首次请求时调用 setupApp1/setupApp2
        ├── mounthttp()      → API 路由匹配
        │                       匹配成功 → 返回 JSON
        ├── mountstatic()    → 静态文件服务
        │                       / → dist/app1.html
        │                       /js/... → dist/static/js/...
        └── 404              → Not Found
```

### 域名配置

通过环境变量配置域名到应用的映射：

```
APP1_DOMAINS=localhost:3300,app1.example.com
APP2_DOMAINS=app2.example.com
```

未配置域名的应用默认不可访问。

---

## 核心机制

### 1. 数据库

- 使用 `bun:sqlite`，位置: `apps/data/s.db`
- 自动建表（启动时自动执行 CREATE TABLE IF NOT EXISTS）
- 表: account, demo, blog

### 2. Repository 模式

`apps/kernel/lib/repository.ts` 提供通用 CRUD：
- `Repository.instance("TableName")` — 单例模式获取仓库实例
- `find(filter, opts)` / `findOne(filter)` / `insert(data)` / `update(filter, data)` / `delete(filter)`
- 自动处理 id（nanoid）、时间戳、软删除

### 3. 路由挂载

每个模块导出一个 mount 对象：

```typescript
export const accountMount = {
    routes: accountRoutes,    // 路由定义（base + prefix + path）
    handlers: { list, detail, create, update, delete },  // 处理函数
};
```

`mounthttp()` 遍历所有 mount，匹配 pathname 后调用对应 handler。

### 4. 认证

- Token 使用 AES 加密，包含 identity + 过期时间
- 每个请求自动提取 Header 中的 `token` / `x-api-key` / `Authorization: Bearer`
- 注入到 handler 的 `request.auth` 字段

### 5. 前端构建

- 使用 Rsbuild 构建前端
- 每个应用独立入口，输出到 `dist/`
- `@shared` 路径别名指向 `apps/shared/`（Rsbuild resolve 配置）
- 开发模式通过 proxy 将 `/api` 转发到后端

---

## 模块共享规则

| 目录 | 共享范围 | 示例 |
|------|----------|------|
| `apps/kernel/` | 所有应用共享 | repository, database, mount |
| `apps/shared/modules/` | 所有应用共享 | account 实体/接口/路由 |
| `apps/appN/shared/modules/` | 仅 appN 使用 | auth, demo, blog |

- 服务端使用**相对路径**导入（Bun 不支持 tsconfig paths）
- 前端使用 `@shared` 别名 + 相对路径（Rsbuild 解析）

---

## 添加新应用

1. 创建 `apps/app3/` 目录结构
2. 实现 `apps/app3/server/app/index.ts` → 导出 `setupApp3()`
3. 在 `apps/entry/index.ts` 注册 app3 的 loader 和域名
4. 创建 `apps/app3/client/` + Rsbuild 入口
5. 在 `rsbuild.config.ts` 添加 entry

---

## 命令

| 命令 | 说明 |
|------|------|
| `bun run serve` | 生产模式启动服务器 |
| `bun run dev` | Rsbuild 开发服务器（带 HMR） |
| `bun run build` | Rsbuild 构建前端 |
| `bun run reset` | 清空数据库 + 启动 |
