# MIXIA Builder Phase 1 -- AI执行主序列

> **文档版本：** v1.0
> **创建日期：** 2026-04-07
> **定位：** AI agent的"总指挥文件"。agent从头到尾按顺序执行每一步。
> **源文档：** pm-builder-chapter-15-roadmap.md 15.2节、pm-builder-chapters-12-13.md 第12章
> **Phase 1目标：** 实现从PM说需求到看到可预览产品的完整链路（F-1.1 ~ F-1.7）
> **预估总周期：** 8-12周

---

## 阶段一：项目骨架（STEP-001 ~ STEP-015）

初始化项目、安装依赖、创建目录结构、配置文件、基础类型定义。
对应里程碑 W1-2: 基础设施搭建。

---

### STEP-001: 初始化Next.js 15项目
**前置条件：** 无（起点）
**执行：**
  1. `npx create-next-app@latest mixia-builder --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  2. 确认使用 Next.js 15 (App Router) + React 19 + TypeScript 5
  3. 删除模板默认页面内容，保留空壳
**验证：**
  - `npm run dev` 启动成功，localhost:3000 显示空白页面
  - `npm run build` 无错误
  - tsconfig.json 中 paths 包含 `@/*`
**产出：**
  - 完整的 Next.js 15 项目骨架
  - package.json、tsconfig.json、next.config.ts
**预估耗时：** 0.5小时
**可并行：** 否（后续所有步骤的基础）

---

### STEP-002: 安装核心前端依赖
**前置条件：** STEP-001完成
**执行：**
  1. `npm install @xyflow/react zustand @tanstack/react-query socket.io-client framer-motion react-resizable-panels`
  2. `npm install -D @types/node`
  3. 验证所有依赖版本兼容：ReactFlow v12、Zustand v5、TanStack Query v5
**验证：**
  - `npm ls` 无 peer dependency 警告
  - `npm run build` 无类型错误
**产出：**
  - 更新后的 package.json 和 package-lock.json
**预估耗时：** 0.5小时
**可并行：** 否（依赖 STEP-001）

---

### STEP-003: 安装shadcn/ui并配置主题
**前置条件：** STEP-002完成
**执行：**
  1. `npx shadcn@latest init` -- 选择 New York 风格、Zinc 基色、CSS variables
  2. 安装基础组件：`npx shadcn@latest add button input card dialog sheet tabs scroll-area badge tooltip separator dropdown-menu`
  3. 在 `src/lib/themes.ts` 定义亮色/暗色主题变量
  4. 配置 `tailwind.config.ts` 整合 shadcn 的 CSS 变量
**验证：**
  - 创建测试页面，渲染一个 Button 组件，样式正确
  - 暗色/亮色切换功能可用
**产出：**
  - `components/ui/` 目录下的 shadcn 组件
  - `src/lib/themes.ts` 主题配置
  - `src/lib/utils.ts`（shadcn 的 cn 工具函数）
**预估耗时：** 1小时
**可并行：** 否（依赖 STEP-002）

---

### STEP-004: 创建项目目录结构
**前置条件：** STEP-003完成
**执行：**
  1. 创建前端目录：
     ```
     src/
       app/                    # Next.js App Router 页面
         (auth)/               # 认证相关路由组
         (dashboard)/          # 主工作台路由组
         api/                  # API Routes
       components/
         ui/                   # shadcn/ui 组件（已有）
         conversation/         # 对话面板组件
         feature-map/          # 功能地图组件
         progress/             # 进度面板组件
         acceptance/           # 验收面板组件
         layout/               # 布局组件
       stores/                 # Zustand stores
       hooks/                  # 自定义 hooks
       lib/                    # 工具函数
       types/                  # TypeScript 类型定义
       services/               # API 调用封装
       prompts/                # Prompt 模板
     ```
  2. 创建后端目录：
     ```
     src/
       app/api/
         auth/                 # NextAuth.js 认证
         projects/             # 项目 CRUD
         dag/                  # DAG 节点/边操作
         pipeline/             # Pipeline 启动/停止/状态
         acceptance/           # 验收流程
         ai/                   # AI 调用代理入口
       server/
         services/             # 后端业务服务
         workers/              # BullMQ Worker 定义
         db/                   # 数据库 schema + migration
         queue/                # BullMQ 队列配置
         websocket/            # Socket.io 服务端
     ```
  3. 每个目录创建 `index.ts` 导出文件
**验证：**
  - 目录结构完整，所有 index.ts 存在
  - `npm run build` 无错误（空导出不影响构建）
**产出：**
  - 完整的前后端目录结构
  - 各模块的 index.ts 入口文件
**预估耗时：** 1小时
**可并行：** 否（依赖 STEP-003）

---

### STEP-005: 定义核心TypeScript类型（业务层）
**前置条件：** STEP-004完成
**执行：**
  1. `src/types/business-node.ts` -- 定义 BusinessNodeType（feature/page/flow/data/connect/rule/milestone）、BusinessNode 接口、BusinessStatus 状态机
  2. `src/types/business-edge.ts` -- 定义边类型（hard/soft/reference）、EdgeData
  3. `src/types/project.ts` -- 定义 Project、ProjectConfig、ProjectStatus
  4. `src/types/requirement.ts` -- 定义 RequirementDoc（结构化需求文档JSON格式）、QuestionOption、ConversationMessage
  5. `src/types/pipeline.ts` -- 定义 PipelineRun、PipelinePhase、PipelineStatus
  6. `src/types/acceptance.ts` -- 定义 AcceptanceRecord、AcceptanceStep、PMFeedback
  7. `src/types/index.ts` -- 统一导出
**验证：**
  - `tsc --noEmit` 类型检查通过
  - 所有 BusinessNodeType 枚举值与 product-spec 第13.4节一致
  - BusinessStatus 包含完整状态机（待规划/方案中/待确认/开发中/可预览/需修改/已确认/已上线）
**产出：**
  - `src/types/` 下 7 个类型定义文件
**预估耗时：** 2小时
**可并行：** 否（后续所有业务代码依赖这些类型）

---

### STEP-006: 定义核心TypeScript类型（技术层）
**前置条件：** STEP-005完成
**执行：**
  1. `src/types/ai-adapter.ts` -- 定义 AIProvider、AIRequest、AIResponse、AIModel 枚举
  2. `src/types/code-gen.ts` -- 定义 CodeGenResult、GeneratedFile、ContextPayload
  3. `src/types/quality-gate.ts` -- 定义 LintResult、TypeCheckResult、QualityGateStatus
  4. `src/types/deployment.ts` -- 定义 DeploymentResult、PreviewURL、ScreenshotResult
  5. `src/types/websocket-events.ts` -- 定义所有 WebSocket 事件类型（pipeline-progress、node-status-change、build-log 等）
  6. 更新 `src/types/index.ts`
**验证：**
  - `tsc --noEmit` 通过
  - AIAdapter 接口与第12章 12.2.2 的 AIProxy 接口一致
**产出：**
  - `src/types/` 下新增 5 个技术类型文件
**预估耗时：** 2小时
**可并行：** 与 STEP-005 串行（STEP-006 引用 STEP-005 的 BusinessNode 类型）

---

### STEP-007: 配置ESLint + Prettier
**前置条件：** STEP-001完成
**执行：**
  1. 安装 Prettier：`npm install -D prettier eslint-config-prettier`
  2. 创建 `.prettierrc` -- 配置 singleQuote、semi、tabWidth: 2、trailingComma: 'all'
  3. 创建 `.prettierignore` -- 排除 node_modules、.next、dist
  4. 更新 `.eslintrc.json` -- 添加 prettier 兼容配置、启用 React hooks rules
  5. 在 package.json 添加 scripts：`"lint": "next lint"`, `"format": "prettier --write ."`
  6. 运行 `npm run format` 格式化现有代码
**验证：**
  - `npm run lint` 零警告零错误
  - `npm run format -- --check` 所有文件格式一致
**产出：**
  - `.prettierrc`、`.prettierignore`
  - 更新后的 `.eslintrc.json` 和 `package.json`
**预估耗时：** 0.5小时
**可并行：** 是（可与 STEP-005、STEP-006 并行，只依赖 STEP-001）

---

### STEP-008: 配置数据库Schema（Prisma + PostgreSQL）
**前置条件：** STEP-006完成
**执行：**
  1. `npm install prisma @prisma/client`
  2. `npx prisma init --datasource-provider postgresql`
  3. 在 `prisma/schema.prisma` 定义 12 张核心表（对应第12章 12.2.3）：
     - users、projects、nodes、edges、node_executions、file_records
     - pipeline_runs、acceptance_records、dag_events、dag_snapshots
     - cost_entries、dependency_manifests
  4. 配置 `.env` 中的 DATABASE_URL（开发环境指向本地或 Supabase）
  5. 创建 `src/server/db/prisma.ts` -- Prisma Client 单例
**验证：**
  - `npx prisma validate` Schema 验证通过
  - `npx prisma generate` 生成 Prisma Client 成功
  - 所有表的字段与第12章 SQL 定义一致
**产出：**
  - `prisma/schema.prisma`
  - `src/server/db/prisma.ts` Prisma Client 单例
  - `.env` 数据库配置
**预估耗时：** 3小时
**可并行：** 否（依赖类型定义完成）

---

### STEP-009: 配置Redis连接和BullMQ基础
**前置条件：** STEP-004完成
**执行：**
  1. `npm install bullmq ioredis`
  2. 创建 `src/server/queue/redis.ts` -- Redis 连接配置（支持本地和云端 Redis）
  3. 创建 `src/server/queue/queues.ts` -- 定义 6 个 BullMQ 队列（pipeline、code-gen、ai-call、screenshot、deploy、quality-gate），配置 concurrency/timeout/attempts 参数（对应第12章 12.2.6）
  4. 创建 `src/server/queue/index.ts` -- 统一导出
  5. 在 `.env` 添加 REDIS_URL
**验证：**
  - TypeScript 编译通过
  - 队列定义与第12章参数一致（如 code-gen concurrency:3, timeout:300000）
**产出：**
  - `src/server/queue/` 下 3 个文件
  - `.env` 增加 Redis 配置
**预估耗时：** 1.5小时
**可并行：** 是（可与 STEP-005、STEP-006 并行，只依赖 STEP-004）

---

### STEP-010: 配置WebSocket服务（Socket.io）
**前置条件：** STEP-009完成
**执行：**
  1. `npm install socket.io`
  2. 创建 `src/server/websocket/server.ts` -- Socket.io Server 集成到 Next.js（自定义 server 或通过 API Route 的 upgrade 处理）
  3. 创建 `src/server/websocket/events.ts` -- 定义事件名常量和类型映射
  4. 创建 `src/server/websocket/rooms.ts` -- 按 projectId 管理房间（join/leave/broadcast）
  5. 创建 `src/hooks/useSocket.ts` -- 前端 Socket.io 连接 hook
**验证：**
  - 启动 dev server，前端 hook 可连接 WebSocket
  - 房间广播测试：发送消息到特定 projectId 房间
**产出：**
  - `src/server/websocket/` 下 3 个文件
  - `src/hooks/useSocket.ts`
**预估耗时：** 2小时
**可并行：** 否（依赖 Redis 连接用于房间管理）

---

### STEP-011: 配置Cloudflare R2对象存储
**前置条件：** STEP-004完成
**执行：**
  1. `npm install @aws-sdk/client-s3` -- R2 兼容 S3 API
  2. 创建 `src/server/services/storage.ts` -- R2 客户端封装
     - upload(key, data) / download(key) / delete(key) / getSignedUrl(key)
     - 目录结构遵循第12章 12.2.5：`/{projectId}/code/`、`/screenshots/`、`/snapshots/`、`/exports/`、`/prompts/`
  3. 在 `.env` 添加 R2_ACCOUNT_ID、R2_ACCESS_KEY、R2_SECRET_KEY、R2_BUCKET_NAME
**验证：**
  - TypeScript 编译通过
  - 单元测试（mock S3）：upload + download 往返一致
**产出：**
  - `src/server/services/storage.ts`
  - `.env` 增加 R2 配置
**预估耗时：** 1.5小时
**可并行：** 是（可与 STEP-009、STEP-010 并行，只依赖 STEP-004）

---

### STEP-012: 配置NextAuth.js认证
**前置条件：** STEP-008完成
**执行：**
  1. `npm install next-auth@beta @auth/prisma-adapter`
  2. 创建 `src/app/api/auth/[...nextauth]/route.ts` -- NextAuth v5 路由
  3. 创建 `src/lib/auth.ts` -- 配置 Prisma Adapter、GitHub/Google OAuth Provider（Phase 1 最少支持一种）
  4. 创建 `src/components/auth/sign-in-button.tsx` 和 `sign-out-button.tsx`
  5. 创建认证中间件 `src/middleware.ts` -- 保护 /dashboard 路由
  6. 在 `.env` 添加 AUTH_SECRET、GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET
**验证：**
  - 访问 /dashboard 未登录时跳转到登录页
  - OAuth 登录后用户信息写入 users 表
  - 登出后 session 清除
**产出：**
  - `src/app/api/auth/` 路由
  - `src/lib/auth.ts`、`src/middleware.ts`
  - 认证相关组件
**预估耗时：** 2小时
**可并行：** 否（依赖 Prisma Schema）

---

### STEP-013: 创建项目CRUD API
**前置条件：** STEP-008、STEP-012完成
**执行：**
  1. `src/app/api/projects/route.ts` -- GET（列表）、POST（创建）
  2. `src/app/api/projects/[projectId]/route.ts` -- GET（详情）、PATCH（更新）、DELETE（删除）
  3. `src/server/services/project-service.ts` -- 业务逻辑层
     - createProject(userId, config) -> Project
     - getProject(projectId) -> Project
     - listProjects(userId) -> Project[]
     - updateProject(projectId, data) -> Project
     - deleteProject(projectId) -> void
  4. 请求验证使用 zod schema
**验证：**
  - API 测试：创建项目 -> 列表包含该项目 -> 更新名称 -> 删除
  - 认证保护：未登录时 API 返回 401
  - zod 验证：无效输入返回 400 + 错误详情
**产出：**
  - `src/app/api/projects/` 下 2 个 route 文件
  - `src/server/services/project-service.ts`
**预估耗时：** 2小时
**可并行：** 否（依赖认证和数据库）

---

### STEP-014: 创建DAG节点/边CRUD API
**前置条件：** STEP-013完成
**执行：**
  1. `src/app/api/dag/nodes/route.ts` -- POST（批量创建节点）、GET（获取项目所有节点）
  2. `src/app/api/dag/nodes/[nodeId]/route.ts` -- PATCH（更新节点）、DELETE（删除节点）
  3. `src/app/api/dag/edges/route.ts` -- POST（创建边）、GET（获取所有边）、DELETE（删除边）
  4. `src/server/services/dag-service.ts` -- DAG 业务逻辑
     - addNode(projectId, nodeData) -> BusinessNode
     - updateNode(nodeId, data) -> BusinessNode
     - removeNode(nodeId) -> void
     - addEdge(projectId, source, target, type) -> Edge
     - removeEdge(edgeId) -> void
     - getDAG(projectId) -> { nodes: BusinessNode[], edges: Edge[] }
     - detectCycle(projectId, newEdge) -> boolean（环检测）
     - topologicalSort(projectId) -> BusinessNode[]（拓扑排序）
  5. 环检测算法：DFS based，添加边前检测
  6. 事件日志：每次 DAG 变更写入 dag_events 表
**验证：**
  - 创建 5 个节点 + 4 条边，获取 DAG 结构完整
  - 环检测：添加会形成环的边时返回 400
  - 拓扑排序：返回有效执行顺序
  - dag_events 表记录所有操作
**产出：**
  - `src/app/api/dag/` 下 4 个 route 文件
  - `src/server/services/dag-service.ts`
**预估耗时：** 3小时
**可并行：** 否（依赖项目 API）

---

### STEP-015: 数据库迁移 + 种子数据 + 冒烟测试
**前置条件：** STEP-014完成
**执行：**
  1. `npx prisma migrate dev --name init` -- 执行首次数据库迁移
  2. 创建 `prisma/seed.ts` -- 种子数据：一个测试用户 + 一个示例项目（"电商平台"） + 5 个业务节点 + 4 条边
  3. `npx prisma db seed` -- 填充种子数据
  4. 创建 `scripts/smoke-test.ts` -- 端到端冒烟测试脚本
     - 启动 dev server -> 调用项目 API -> 调用 DAG API -> 验证返回数据
**验证：**
  - 数据库迁移成功，12 张表全部创建
  - 种子数据填充成功
  - 冒烟测试通过：项目创建、节点创建、拓扑排序均返回正确结果
**产出：**
  - `prisma/migrations/` 首次迁移文件
  - `prisma/seed.ts`
  - `scripts/smoke-test.ts`
**预估耗时：** 2小时
**可并行：** 否（阶段一收尾，验证所有骨架组件协同工作）

---

## 阶段二：UI框架（STEP-016 ~ STEP-035）

三栏布局、对话面板、功能地图面板、进度面板、验收面板、状态管理。
对应里程碑 W3-4（对话引擎+功能地图）的前端部分，以及 F-1.7（PM工作台基础UI）。

---

### STEP-016: 创建Zustand Stores
**前置条件：** STEP-005、STEP-006完成
**执行：**
  1. `src/stores/project-store.ts` -- ProjectStore：当前项目配置、功能地图节点/边、选中节点
  2. `src/stores/pipeline-store.ts` -- PipelineStore：Pipeline 状态、各 Phase 进度、实时日志流
  3. `src/stores/ui-store.ts` -- UIStore：面板布局比例、当前视图（地图/看板）、缩放级别、暗色/亮色主题、localStorage 持久化
  4. `src/stores/acceptance-store.ts` -- AcceptanceStore：验收清单、PM 回答记录、截图列表
  5. `src/stores/conversation-store.ts` -- ConversationStore：对话消息列表、当前输入、AI 响应流
  6. `src/stores/index.ts` -- 统一导出
**验证：**
  - 每个 Store 可独立初始化、读写、重置
  - UIStore 的 localStorage 持久化：刷新后面板布局恢复
  - TypeScript 类型推断正确
**产出：**
  - `src/stores/` 下 6 个文件
**预估耗时：** 3小时
**可并行：** 是（可与 STEP-007 ~ STEP-015 中的后端工作并行）

---

### STEP-017: 配置TanStack Query
**前置条件：** STEP-016完成
**执行：**
  1. 创建 `src/lib/query-client.ts` -- 配置 QueryClient（staleTime、gcTime、retry）
  2. 创建 `src/app/providers.tsx` -- QueryClientProvider + 其他 Provider 集中管理
  3. 更新 `src/app/layout.tsx` -- 包裹 Providers
  4. 创建 `src/services/api-client.ts` -- 封装 fetch（baseURL、auth header、error handling）
  5. 创建 `src/services/project-api.ts` -- useProjects()、useProject(id)、useCreateProject()、useUpdateProject()、useDeleteProject()
  6. 创建 `src/services/dag-api.ts` -- useDAG(projectId)、useCreateNode()、useUpdateNode()、useCreateEdge() 等
**验证：**
  - useProjects() 返回项目列表
  - 缓存生效：连续两次 useProject(id) 只发一次请求
  - mutation 成功后自动 invalidate 相关 query
**产出：**
  - `src/lib/query-client.ts`
  - `src/app/providers.tsx`
  - `src/services/` 下 3 个文件
**预估耗时：** 2小时
**可并行：** 否（依赖 Stores）

---

### STEP-018: 实现三栏布局框架
**前置条件：** STEP-003、STEP-016完成
**执行：**
  1. 创建 `src/components/layout/workspace-layout.tsx` -- 使用 react-resizable-panels 实现三栏可拖拽布局
     - 左栏：对话面板（默认宽度 25%，最小 20%）
     - 中栏：功能地图面板（默认 50%，最小 30%）
     - 右栏：进度/验收面板（默认 25%，最小 15%）
  2. 创建 `src/components/layout/top-navbar.tsx` -- 顶部导航栏：项目名称、视图切换（功能地图/看板）、主题切换、用户菜单
  3. 创建 `src/components/layout/panel-header.tsx` -- 面板标题栏通用组件（标题 + 操作按钮区）
  4. 面板宽度变化时持久化到 UIStore（localStorage）
  5. 响应式：1280px 以下隐藏右栏，切换为 Tab 式
**验证：**
  - 三栏拖拽调整宽度，松手后宽度保持
  - 刷新后面板比例恢复
  - 1280px 以下正确降级为 Tab 布局
  - 暗色/亮色主题切换，所有面板跟随
**产出：**
  - `src/components/layout/` 下 3 个组件
**预估耗时：** 3小时
**可并行：** 否（后续面板组件的容器）

---

### STEP-019: 对话面板 -- 消息列表UI
**前置条件：** STEP-018完成
**执行：**
  1. 创建 `src/components/conversation/message-list.tsx` -- 消息列表，支持用户消息和 AI 消息两种样式
  2. 创建 `src/components/conversation/message-bubble.tsx` -- 单条消息气泡（头像、内容、时间戳）
  3. 创建 `src/components/conversation/ai-typing-indicator.tsx` -- AI 正在输入动画
  4. 使用 scroll-area（shadcn）实现滚动，新消息自动滚动到底部
  5. AI 消息支持流式渲染（逐字符显示）
**验证：**
  - 渲染 20 条混合消息，滚动流畅
  - 新消息添加时自动滚动到底部
  - AI 消息流式渲染效果正确
**产出：**
  - `src/components/conversation/` 下 3 个组件
**预估耗时：** 2小时
**可并行：** 否（依赖布局框架）

---

### STEP-020: 对话面板 -- 输入区域
**前置条件：** STEP-019完成
**执行：**
  1. 创建 `src/components/conversation/chat-input.tsx` -- 输入框（多行文本、自动扩展高度、Shift+Enter 换行、Enter 发送）
  2. 创建 `src/components/conversation/quick-options.tsx` -- AI 追问的选择题选项（2-4 个按钮 + "自由补充"入口）
  3. 创建 `src/components/conversation/skip-button.tsx` -- "差不多了" 跳过剩余追问按钮
  4. 整合到对话面板：输入 -> ConversationStore -> 消息列表更新
**验证：**
  - 输入文字，按 Enter 发送，消息出现在列表
  - 选择题选项点击后自动发送选择内容
  - "差不多了" 按钮发送跳过信号
**产出：**
  - `src/components/conversation/` 下新增 3 个组件
**预估耗时：** 2小时
**可并行：** 否（依赖消息列表）

---

### STEP-021: 对话面板 -- 完整集成
**前置条件：** STEP-020完成
**执行：**
  1. 创建 `src/components/conversation/conversation-panel.tsx` -- 组装消息列表 + 输入区域 + 选项区域
  2. 对接 ConversationStore：
     - 发送消息 -> store.addMessage() -> 触发 AI API 调用
     - AI 响应流 -> store.appendToLastMessage() -> 消息列表实时更新
  3. 对话阶段管理：
     - 需求描述阶段：自由输入
     - AI 追问阶段：显示选择题 + 自由补充
     - 功能地图修改阶段：自由输入指令
  4. 创建 `src/hooks/useConversation.ts` -- 封装对话逻辑（发送、接收、阶段切换）
**验证：**
  - 端到端流程：输入文字 -> 显示在消息列表 -> AI 回复（mock）出现
  - 阶段切换：从自由输入切换到选择题模式
**产出：**
  - `src/components/conversation/conversation-panel.tsx`
  - `src/hooks/useConversation.ts`
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-022: 功能地图面板 -- ReactFlow基础集成
**前置条件：** STEP-018完成
**执行：**
  1. 创建 `src/components/feature-map/feature-map-canvas.tsx` -- ReactFlow 画布容器
     - 配置：缩放控制、minimap、背景网格
     - 连接 ProjectStore 的 nodes/edges 数据
  2. 创建 `src/components/feature-map/controls-panel.tsx` -- 缩放控制按钮（放大、缩小、适配视图）
  3. 创建 ReactFlow 的 nodeTypes 和 edgeTypes 注册
  4. 画布支持拖拽平移和滚轮缩放
**验证：**
  - 渲染种子数据的 5 个节点 + 4 条边
  - 缩放平移流畅
  - minimap 实时反映画布状态
**产出：**
  - `src/components/feature-map/` 下 2 个组件
**预估耗时：** 2小时
**可并行：** 是（可与 STEP-019 ~ STEP-021 对话面板并行）

---

### STEP-023: 功能地图 -- 自定义业务节点组件
**前置条件：** STEP-022完成
**执行：**
  1. 创建 `src/components/feature-map/nodes/business-node.tsx` -- 自定义 ReactFlow 节点
     - 根据 BusinessNodeType 显示不同图标和颜色
     - feature: 蓝色拼图图标 / page: 绿色页面图标 / flow: 橙色流程图标 / data: 紫色数据库图标 / connect: 黄色连接图标 / rule: 红色规则图标 / milestone: 金色里程碑图标
     - 显示 PM 语言标签（非技术术语）
     - 显示当前业务状态（颜色编码 + 文字）
  2. 创建 `src/components/feature-map/nodes/node-status-badge.tsx` -- 状态徽章（待规划/方案中/开发中/可预览 等）
  3. Framer Motion 动画：节点状态变化时脉冲动画
**验证：**
  - 7 种节点类型各有不同图标和颜色
  - 状态变化时动画触发
  - 标签全部为 PM 语言
**产出：**
  - `src/components/feature-map/nodes/` 下 2 个组件
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-024: 功能地图 -- 节点Hover详情卡片
**前置条件：** STEP-023完成
**执行：**
  1. 创建 `src/components/feature-map/nodes/node-tooltip.tsx` -- Hover 弹出卡片
     - 功能描述
     - 预估开发时间（PM 语言，如"约15分钟"而非"3 nodes, ~90s each"）
     - 依赖说明（上游节点名称列表）
     - 当前状态详情
  2. 使用 shadcn Tooltip 或 Popover 组件，鼠标悬停 300ms 后显示
  3. 卡片位置自动避开画布边缘
**验证：**
  - Hover 节点 300ms 后显示详情卡片
  - 卡片内容完整：描述、时间、依赖、状态
  - 卡片不超出画布可视区域
**产出：**
  - `src/components/feature-map/nodes/node-tooltip.tsx`
**预估耗时：** 1.5小时
**可并行：** 否

---

### STEP-025: 功能地图 -- 自定义边组件
**前置条件：** STEP-022完成
**执行：**
  1. 创建 `src/components/feature-map/edges/dependency-edge.tsx` -- 自定义 ReactFlow 边
     - hard 依赖：实线 + 箭头
     - soft 依赖：虚线 + 箭头
     - reference：点线 + 无箭头
  2. 边上可选显示关系描述文字
  3. Hover 高亮整条依赖链（从源到目标所有路径上的边）
**验证：**
  - 三种边类型视觉区分明确
  - Hover 边时高亮依赖链
**产出：**
  - `src/components/feature-map/edges/dependency-edge.tsx`
**预估耗时：** 1.5小时
**可并行：** 是（可与 STEP-023、STEP-024 并行）

---

### STEP-026: 功能地图 -- 拖拽交互和自动布局
**前置条件：** STEP-023、STEP-025完成
**执行：**
  1. 实现节点拖拽位置调整 -> 保存新坐标到 ProjectStore -> 同步到服务端
  2. 集成 ELK.js 自动布局算法（`npm install elkjs`）：
     - 创建 `src/lib/auto-layout.ts` -- 调用 ELK.js 计算节点坐标
     - 支持多种布局方向：上到下（默认）、左到右
  3. 创建 "自动排列" 按钮，点击后重新计算布局
  4. 新节点添加时自动运行布局
**验证：**
  - 拖拽节点后位置保持
  - 自动布局：10 节点 + 依赖关系 -> 无重叠、边清晰
  - 布局计算时间 < 1秒
**产出：**
  - `src/lib/auto-layout.ts`
  - 更新 feature-map-canvas.tsx 添加拖拽和布局功能
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-027: 功能地图 -- 环检测和添加依赖交互
**前置条件：** STEP-026完成
**执行：**
  1. 实现 ReactFlow 的连接交互：从节点的 Handle 拖出连线到另一个节点
  2. 连接时实时调用 dag-service.detectCycle() -> 如果会形成环，高亮冲突边并阻止连接
  3. 连接成功后自动创建边（调用 DAG API）
  4. 右键边 -> 删除依赖确认弹窗
  5. 创建 `src/components/feature-map/connection-validation.tsx` -- 连接验证视觉反馈（绿色=可连接、红色=会形成环）
**验证：**
  - 拖拽创建依赖关系成功
  - 尝试创建环时：红色提示 + 连接失败
  - 删除边后 DAG 结构更新
**产出：**
  - `src/components/feature-map/connection-validation.tsx`
  - 更新 feature-map-canvas.tsx
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-028: 功能地图面板 -- 完整集成
**前置条件：** STEP-027完成
**执行：**
  1. 创建 `src/components/feature-map/feature-map-panel.tsx` -- 组装画布 + 控制面板 + 工具栏
  2. 工具栏：自动排列按钮、缩放控制、全屏切换
  3. 与 ProjectStore 完整连接：节点/边增删改 -> Store 更新 -> 画布重渲染
  4. 性能优化：50 个节点以下保持 60fps
  5. 快捷键：Delete 删除选中节点、Ctrl+Z 撤销（基于 dag_events）
**验证：**
  - 50 个节点渲染流畅（Chrome DevTools Performance 面板确认 60fps）
  - 增删改操作后画布正确更新
  - Ctrl+Z 撤销最近操作
**产出：**
  - `src/components/feature-map/feature-map-panel.tsx`
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-029: 进度面板 -- 实时日志流
**前置条件：** STEP-018、STEP-010完成
**执行：**
  1. 创建 `src/components/progress/progress-panel.tsx` -- 进度面板容器
  2. 创建 `src/components/progress/progress-entry.tsx` -- 单条进度日志
     - 图标（根据操作类型）+ 业务语言文本 + 时间戳
     - 例如："正在实现用户注册..."、"用户注册 完成"
  3. 创建 `src/components/progress/progress-timeline.tsx` -- 时间线视图，带节点完成进度条
  4. 通过 WebSocket 接收实时进度更新 -> PipelineStore -> 面板刷新
  5. 自动滚动到最新条目
**验证：**
  - WebSocket 推送一条进度消息 -> 面板即时显示
  - 进度条反映整体完成百分比
  - 所有文本为 PM 可理解的业务语言（无技术术语）
**产出：**
  - `src/components/progress/` 下 3 个组件
**预估耗时：** 2.5小时
**可并行：** 是（可与 STEP-019 ~ STEP-028 并行）

---

### STEP-030: 验收面板 -- 功能清单展示
**前置条件：** STEP-018完成
**执行：**
  1. 创建 `src/components/acceptance/acceptance-panel.tsx` -- 验收面板容器，分阶段展示
  2. 创建 `src/components/acceptance/feature-checklist.tsx` -- 阶段A：功能清单
     - 每个功能一行：图标 + 功能名 + 状态（待验收/已通过/需修改）
     - 点击功能进入该功能的详细验收
  3. 创建 `src/components/acceptance/acceptance-summary.tsx` -- 阶段D：验收总结报告
     - 所有功能的通过/未通过状态统计
     - "全部通过" 或 "N项需修改" 汇总
**验证：**
  - 功能清单正确显示所有功能节点
  - 点击功能切换到详细验收视图
  - 总结报告统计数据正确
**产出：**
  - `src/components/acceptance/` 下 3 个组件
**预估耗时：** 2小时
**可并行：** 是（可与 STEP-029 并行）

---

### STEP-031: 验收面板 -- 逐功能引导验收
**前置条件：** STEP-030完成
**执行：**
  1. 创建 `src/components/acceptance/guided-review.tsx` -- 阶段B：逐功能引导
     - 展示该功能的截图
     - 2-3 个是/否问题（例如："这个登录页面符合你的预期吗？"）
     - PM 点 "是" -> 通过 / 点 "否" -> 进入问题定位
  2. 创建 `src/components/acceptance/issue-locator.tsx` -- 阶段C：问题定位
     - 4 类问题选择题：布局问题 / 内容问题 / 功能缺失 / 视觉风格
     - 支持截图上传标注（Phase 1 简化版：文字描述）
     - AI 复述问题让 PM 确认后再修复
  3. 创建 `src/components/acceptance/screenshot-viewer.tsx` -- 截图查看器（放大、对比）
**验证：**
  - 引导流程完整：截图展示 -> 是/否 -> 问题定位
  - PM 选 "否" 后正确进入问题定位流程
  - 问题定位提供 4 类选项 + 文字补充
**产出：**
  - `src/components/acceptance/` 下新增 3 个组件
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-032: 验收面板 -- 反馈循环
**前置条件：** STEP-031完成
**执行：**
  1. 创建 `src/components/acceptance/fix-cycle-tracker.tsx` -- 修复循环跟踪
     - 显示当前是第几轮修复
     - 修复前/后截图对比
     - 3 轮修不好时显示 "升级处理" 提示
  2. 对接 AcceptanceStore：
     - PM 反馈 -> store.addFeedback() -> 调用 AI 修复 API
     - 修复完成 -> 重新截图 -> 更新 store -> PM 再验
  3. 创建 `src/hooks/useAcceptance.ts` -- 封装验收流程逻辑
**验证：**
  - 修复循环计数正确
  - 3 轮后自动升级提示
  - 截图对比功能可用
**产出：**
  - `src/components/acceptance/fix-cycle-tracker.tsx`
  - `src/hooks/useAcceptance.ts`
**预估耗时：** 2.5小时
**可并行：** 否

---

### STEP-033: 主工作台页面组装
**前置条件：** STEP-021、STEP-028、STEP-029、STEP-032完成
**执行：**
  1. 创建 `src/app/(dashboard)/projects/[projectId]/page.tsx` -- 项目工作台页面
     - 集成三栏布局 + 对话面板 + 功能地图面板 + 进度面板/验收面板
  2. 创建 `src/app/(dashboard)/projects/[projectId]/layout.tsx` -- 加载项目数据 + WebSocket 连接
  3. 右栏面板切换：进度面板 <-> 验收面板（进入验收阶段时自动切换）
  4. 全局键盘快捷键注册
  5. 页面加载状态：骨架屏（Skeleton）
**验证：**
  - 进入项目页面，三栏正确渲染
  - WebSocket 连接成功
  - 面板切换流畅
  - 首次加载时间 < 3秒
**产出：**
  - `src/app/(dashboard)/projects/[projectId]/` 下 2 个文件
**预估耗时：** 2小时
**可并行：** 否（集成步骤）

---

### STEP-034: 项目列表页和创建项目流程
**前置条件：** STEP-017完成
**执行：**
  1. 创建 `src/app/(dashboard)/projects/page.tsx` -- 项目列表页
     - 卡片网格展示所有项目（名称、状态、最后更新时间）
     - "新建项目" 按钮
  2. 创建 `src/components/project/create-project-dialog.tsx` -- 创建项目弹窗
     - 项目名称输入
     - 项目类型选择（电商/SaaS/内容站/工具/其他）
     - 创建后跳转到项目工作台
  3. 创建 `src/components/project/project-card.tsx` -- 项目卡片组件
**验证：**
  - 项目列表正确展示
  - 创建新项目后列表自动刷新
  - 点击项目卡片进入工作台
**产出：**
  - `src/app/(dashboard)/projects/page.tsx`
  - `src/components/project/` 下 2 个组件
**预估耗时：** 2小时
**可并行：** 是（可与 STEP-033 并行）

---

### STEP-035: UI框架端到端验证
**前置条件：** STEP-033、STEP-034完成
**执行：**
  1. 使用种子数据验证完整 UI 流程：
     - 登录 -> 项目列表 -> 进入项目 -> 三栏正确渲染
     - 对话面板可发送消息（mock AI 响应）
     - 功能地图显示种子数据节点 + 边
     - 进度面板显示 mock 进度条目
     - 验收面板显示功能清单
  2. 跨浏览器测试：Chrome + Firefox + Safari（最新版）
  3. 响应式测试：1920px / 1440px / 1280px
  4. 暗色/亮色主题全面检查
  5. 修复发现的视觉和交互 bug
**验证：**
  - 所有面板在三种分辨率下布局正确
  - 暗色/亮色主题无颜色异常
  - Chrome/Firefox/Safari 无功能差异
  - 交互响应 < 100ms（无明显延迟感）
**产出：**
  - Bug 修复 commits
  - UI 阶段完成确认
**预估耗时：** 3小时
**可并行：** 否（阶段二收尾验证）

---

## 阶段三：AI引擎（STEP-036 ~ STEP-055）

AI Adapter、需求对话引擎、功能地图生成、代码生成引擎、翻译层。
对应里程碑 W3-6 和 F-1.1 ~ F-1.3。

---

### STEP-036: AI Adapter -- 统一接口定义
**前置条件：** STEP-006完成
**执行：**
  1. 创建 `src/server/services/ai/adapter-interface.ts` -- 定义 AIAdapter 统一接口
     ```typescript
     interface AIAdapter {
       chat(request: AIChatRequest): Promise<AIChatResponse>;
       chatStream(request: AIChatRequest): AsyncGenerator<string>;
       estimateCost(request: AIChatRequest): CostEstimate;
     }
     ```
  2. 创建 `src/server/services/ai/types.ts` -- AIChatRequest、AIChatResponse、CostEstimate、ModelConfig
  3. 创建 `src/server/services/ai/prompt-template.ts` -- Prompt 模板引擎（变量替换 + 上下文注入）
**验证：**
  - 接口定义完整，TypeScript 编译通过
  - Prompt 模板引擎：变量替换正确
**产出：**
  - `src/server/services/ai/` 下 3 个文件
**预估耗时：** 2小时
**可并行：** 是（可与阶段二并行）

---

### STEP-037: AI Adapter -- Claude实现
**前置条件：** STEP-036完成
**执行：**
  1. `npm install @anthropic-ai/sdk`
  2. 创建 `src/server/services/ai/adapters/claude-adapter.ts`
     - 实现 AIAdapter 接口
     - 支持 Claude Sonnet 和 Haiku 模型
     - 流式输出实现（SSE -> AsyncGenerator）
     - 成本估算（基于模型价格和 token 数）
  3. Rate limit 处理：429 时指数退避重试
  4. 在 `.env` 添加 ANTHROPIC_API_KEY
**验证：**
  - 非流式调用返回正确响应
  - 流式调用逐 chunk 返回
  - 429 时自动重试（最多 3 次）
  - 成本估算与实际接近
**产出：**
  - `src/server/services/ai/adapters/claude-adapter.ts`
**预估耗时：** 2.5小时
**可并行：** 否

---

### STEP-038: AI Adapter -- DeepSeek实现
**前置条件：** STEP-036完成
**执行：**
  1. `npm install openai` -- DeepSeek 使用 OpenAI 兼容接口
  2. 创建 `src/server/services/ai/adapters/deepseek-adapter.ts`
     - 实现 AIAdapter 接口
     - 支持 DeepSeek V3 和 DeepSeek Coder
     - baseURL 指向 DeepSeek API endpoint
  3. 在 `.env` 添加 DEEPSEEK_API_KEY
**验证：**
  - DeepSeek V3 调用返回正确响应
  - 流式输出正常
**产出：**
  - `src/server/services/ai/adapters/deepseek-adapter.ts`
**预估耗时：** 1.5小时
**可并行：** 是（可与 STEP-037 并行）

---

### STEP-039: AI Adapter -- 路由和熔断器
**前置条件：** STEP-037、STEP-038完成
**执行：**
  1. 创建 `src/server/services/ai/router.ts` -- AI 模型智能路由
     - 根据任务类型选择模型（简单任务 -> 便宜模型，复杂任务 -> 强模型）
     - 根据平台配置选择默认 Provider
  2. 创建 `src/server/services/ai/circuit-breaker.ts` -- 熔断器实现
     - 连续 3 次失败 -> 触发熔断（open）
     - 冷却 5 分钟后半开（half-open）
     - 成功一次 -> 关闭（closed）
     - 状态存储在 Redis
  3. 创建 `src/server/services/ai/cost-tracker.ts` -- 成本追踪器
     - Redis INCRBYFLOAT 原子扣减
     - 超预算时拒绝调用
  4. 创建 `src/server/services/ai/index.ts` -- AIProxy 统一入口
**验证：**
  - Provider-A 超时 -> 自动降级到 Provider-B
  - 连续 3 次失败 -> 熔断器打开 -> 5 分钟内所有调用走降级路径
  - 成本超预算 -> 拒绝调用并返回错误
**产出：**
  - `src/server/services/ai/` 下 4 个文件
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-040: 需求对话引擎 -- Prompt设计
**前置条件：** STEP-039完成
**执行：**
  1. 创建 `src/prompts/requirement-analysis.ts` -- 需求分析系统 Prompt
     - 角色定义：你是一个专业的产品需求分析师
     - 输出格式要求：JSON 结构化需求文档
     - 追问策略：必问 4 维度（业务类型、用户角色、核心流程、数据实体）
     - 追问格式：每次给 2-4 个选项 + 自由补充
  2. 创建 `src/prompts/requirement-followup.ts` -- 追问生成 Prompt
     - 上下文：已有对话历史 + 已收集的信息
     - 目标：识别缺失的维度，生成下一个追问
     - 终止条件：4 个必问维度都已覆盖 且 PM 确认
  3. 创建 `src/prompts/requirement-summary.ts` -- 需求汇总 Prompt
     - 输入：完整对话历史
     - 输出：结构化需求文档（JSON）
**验证：**
  - 使用测试输入运行 Prompt，输出格式正确的 JSON
  - 追问覆盖 4 个必问维度
  - 每个追问提供 2-4 个选项
**产出：**
  - `src/prompts/` 下 3 个 Prompt 文件
**预估耗时：** 3小时
**可并行：** 是（Prompt 设计可与 STEP-037 ~ STEP-039 并行）

---

### STEP-041: 需求对话引擎 -- 后端服务
**前置条件：** STEP-039、STEP-040完成
**执行：**
  1. 创建 `src/server/services/requirement-engine.ts` -- 需求对话引擎
     - startConversation(projectId) -> 初始化对话，返回第一个追问
     - processMessage(projectId, message) -> 处理 PM 回复，返回下一个追问或汇总
     - skipRemaining(projectId) -> PM 说"差不多了"，直接生成汇总
     - getRequirementDoc(projectId) -> 返回结构化需求文档
  2. 对话状态管理：
     - 已收集维度追踪
     - 追问轮次计数（3-7 轮，平均 5 轮）
     - 自动判断何时结束追问
  3. 创建 `src/app/api/ai/conversation/route.ts` -- 对话 API（POST 发送消息，SSE 流式响应）
**验证：**
  - 发送初始需求描述 -> 10 秒内返回第一个追问
  - 追问覆盖 4 个必问维度
  - 5 轮追问后输出结构化需求文档
  - "差不多了" -> 立即生成汇总
**产出：**
  - `src/server/services/requirement-engine.ts`
  - `src/app/api/ai/conversation/route.ts`
**预估耗时：** 4小时
**可并行：** 否

---

### STEP-042: 需求对话引擎 -- 前后端集成
**前置条件：** STEP-021、STEP-041完成
**执行：**
  1. 更新 `src/hooks/useConversation.ts` -- 对接真实 API（替换 mock）
     - 发送消息 -> POST /api/ai/conversation -> SSE 流式接收
     - 解析 AI 响应中的选项列表 -> 渲染 quick-options
     - 检测对话结束信号 -> 切换到功能地图生成阶段
  2. 更新 `src/components/conversation/quick-options.tsx` -- 渲染真实追问选项
  3. 创建 `src/services/conversation-api.ts` -- 前端 API 封装
  4. 对话完成时自动触发功能地图生成（跳转到 STEP-044 的流程）
**验证：**
  - 端到端：输入"我要做一个电商平台" -> AI 追问 -> 选择选项 -> 追问完毕 -> 输出结构化需求文档
  - 流式输出在对话面板实时显示
  - 选择题交互正常
  - 全流程 < 3 分钟
**产出：**
  - 更新后的 hooks 和组件
  - `src/services/conversation-api.ts`
**预估耗时：** 2.5小时
**可并行：** 否

---

### STEP-043: 功能地图生成 -- Prompt设计
**前置条件：** STEP-040完成
**执行：**
  1. 创建 `src/prompts/feature-map-gen.ts` -- 功能地图生成 Prompt
     - 输入：结构化需求文档
     - 输出：JSON 格式的节点列表 + 边列表
     - 节点类型严格使用 BusinessNodeType 枚举
     - 标签严格使用 PM 需求原文短语
     - 自动推断依赖关系
     - 节点数控制在 5-20 个
  2. 创建 `src/prompts/feature-map-modify.ts` -- 功能地图修改 Prompt
     - 输入：当前功能地图 + PM 修改指令（如"把注册和登录分开"）
     - 输出：修改后的节点/边 diff（添加/删除/更新）
     - 保持未修改节点不变
**验证：**
  - 测试需求文档 -> 生成 10-15 个有意义的业务节点
  - 节点标签全部为 PM 语言
  - 依赖关系合理（如"支付"依赖"购物车"）
  - 修改指令正确执行
**产出：**
  - `src/prompts/` 下 2 个 Prompt 文件
**预估耗时：** 3小时
**可并行：** 是（可与 STEP-041 并行）

---

### STEP-044: 功能地图生成 -- 后端服务
**前置条件：** STEP-039、STEP-043完成
**执行：**
  1. 创建 `src/server/services/feature-map-engine.ts` -- 功能地图引擎
     - generateFromRequirement(projectId, requirementDoc) -> { nodes, edges }
     - modifyByInstruction(projectId, instruction) -> DAG diff
     - 生成后自动调用 auto-layout 计算坐标
     - 调用 DAG Service 写入数据库
  2. 创建 `src/app/api/ai/feature-map/route.ts` -- 功能地图 API
     - POST /api/ai/feature-map/generate -- 从需求文档生成
     - POST /api/ai/feature-map/modify -- 用自然语言修改
  3. AI 响应 JSON 解析 + 校验（确保节点类型合法、无重复 ID）
**验证：**
  - 从需求文档生成功能地图 < 60 秒
  - 节点数在 5-20 个范围内
  - 自动生成的依赖关系无环
  - PM 修改指令在 15 秒内响应
**产出：**
  - `src/server/services/feature-map-engine.ts`
  - `src/app/api/ai/feature-map/route.ts`
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-045: 功能地图生成 -- 前后端集成
**前置条件：** STEP-028、STEP-044完成
**执行：**
  1. 需求对话结束后自动调用功能地图生成 API
  2. 生成过程中：功能地图面板显示 "AI正在规划功能..."  loading 动画
  3. 生成完成后：节点渐入动画（Framer Motion stagger）出现在画布上
  4. 对话面板切换到 "功能地图修改" 模式：
     - PM 输入修改指令 -> 调用 modify API -> 画布实时更新
  5. PM 确认功能地图按钮："确认并开始生成" -> 锁定功能地图 -> 触发代码生成
**验证：**
  - 端到端：需求完成 -> 功能地图自动生成 -> 渲染在画布上
  - PM 自然语言修改 -> 画布节点增删改
  - 确认按钮触发代码生成流程
**产出：**
  - 更新后的对话面板和功能地图面板
  - 新增 "确认并开始生成" 按钮组件
**预估耗时：** 2.5小时
**可并行：** 否

---

### STEP-046: 代码生成引擎 -- Prompt设计
**前置条件：** STEP-040完成
**执行：**
  1. 创建 `src/prompts/code-gen-system.ts` -- 代码生成系统 Prompt
     - 技术栈声明：Next.js 15 + Supabase + Tailwind CSS
     - 编码规范：TypeScript strict、文件命名、组件结构
     - 项目术语表：业务节点标签 -> 代码中的命名映射
  2. 创建 `src/prompts/code-gen-node.ts` -- 单节点代码生成 Prompt
     - 输入：节点信息 + 直接前驱节点的完整输出 + 间接前驱的 AI 摘要 + 全局上下文
     - 输出：文件列表（路径 + 内容）
     - 不同节点类型的生成策略：
       - page: 生成 React 组件 + 路由文件
       - data: 生成 Supabase schema + API route
       - flow: 生成业务逻辑函数
       - connect: 生成第三方集成代码
  3. 创建 `src/prompts/code-gen-context.ts` -- 上下文摘要 Prompt（为间接前驱生成摘要）
**验证：**
  - Prompt 模板变量完整
  - 测试单节点生成输出格式正确
**产出：**
  - `src/prompts/` 下 3 个 Prompt 文件
**预估耗时：** 4小时
**可并行：** 是（可与 STEP-041 ~ STEP-045 并行）

---

### STEP-047: 代码生成引擎 -- 上下文管理器
**前置条件：** STEP-046、STEP-014完成
**执行：**
  1. 创建 `src/server/services/codegen/context-manager.ts` -- 上下文管理器
     - getDirectContext(nodeId) -> 直接前驱节点的完整输出
     - getIndirectContext(nodeId) -> 间接前驱的 AI 摘要
     - getGlobalContext(projectId) -> 技术栈 + 编码规范 + 术语表
     - buildPromptContext(nodeId) -> 组装完整的 Prompt 上下文
  2. AI 摘要生成：调用 AI Adapter 对间接前驱输出生成简短摘要
  3. 上下文大小控制：总 token 数不超过模型窗口限制
**验证：**
  - 直接前驱上下文包含完整代码
  - 间接前驱上下文是简短摘要
  - 总上下文 token 数在限制内
**产出：**
  - `src/server/services/codegen/context-manager.ts`
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-048: 代码生成引擎 -- BullMQ Worker
**前置条件：** STEP-047、STEP-009完成
**执行：**
  1. 创建 `src/server/workers/code-gen-worker.ts` -- 代码生成 Worker
     - 接收 Job：{ projectId, nodeId, context }
     - 调用 AI Adapter 生成代码
     - 解析 AI 输出：提取文件列表
     - 写入 R2 存储
     - 写入 file_records 和 node_executions 表
     - 更新节点状态（开发中 -> 可预览）
     - 通过 WebSocket 广播进度
  2. 重试逻辑：单节点失败最多 3 次重试
  3. 进度广播使用 PM 语言："正在实现用户注册..."
**验证：**
  - 提交一个节点的代码生成 Job -> Worker 处理 -> 文件写入 R2
  - node_executions 记录正确（token 数、耗时、状态）
  - WebSocket 广播被前端接收
  - 失败重试机制工作
**产出：**
  - `src/server/workers/code-gen-worker.ts`
**预估耗时：** 4小时
**可并行：** 否

---

### STEP-049: 代码生成引擎 -- 拓扑执行编排
**前置条件：** STEP-048完成
**执行：**
  1. 创建 `src/server/services/codegen/execution-orchestrator.ts` -- 执行编排器
     - startCodeGen(projectId) -> 启动整个代码生成流程
     - 调用 dag-service.topologicalSort() 获取执行顺序
     - 按拓扑序逐节点提交 Job 到 BullMQ
     - 无依赖关系的节点可并行生成（BullMQ Flow）
     - 追踪整体进度百分比
  2. 创建 `src/app/api/pipeline/start/route.ts` -- 启动 Pipeline API
  3. 失败处理：单节点失败不阻塞无关分支，仅暂停依赖该节点的后续节点
**验证：**
  - 5 节点 DAG -> 按拓扑序执行 -> 所有节点完成
  - 无依赖的节点并行执行（验证 Worker concurrency）
  - 单节点失败 -> 后续依赖节点暂停 -> 无关节点继续
  - 进度面板实时更新
**产出：**
  - `src/server/services/codegen/execution-orchestrator.ts`
  - `src/app/api/pipeline/start/route.ts`
**预估耗时：** 4小时
**可并行：** 否

---

### STEP-050: 代码生成引擎 -- 前端集成
**前置条件：** STEP-045、STEP-049完成
**执行：**
  1. PM 点 "确认并开始生成" -> 调用 POST /api/pipeline/start
  2. 功能地图节点实时变色：
     - 待处理：灰色
     - 生成中：蓝色脉冲动画
     - 完成：绿色
     - 失败：红色
  3. 进度面板实时显示业务语言进度："正在实现用户注册..."
  4. 完成时显示总耗时和成功率统计
  5. 创建 `src/hooks/usePipeline.ts` -- 封装 Pipeline 状态订阅
**验证：**
  - 端到端：确认功能地图 -> 节点逐个变色 -> 进度面板更新 -> 全部完成
  - 节点状态动画正确
  - 失败节点红色 + 进度面板显示错误信息（PM 语言）
**产出：**
  - `src/hooks/usePipeline.ts`
  - 更新后的功能地图和进度面板组件
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-051: 业务翻译层 -- 名称映射
**前置条件：** STEP-005完成
**执行：**
  1. 创建 `src/server/services/translation/name-mapper.ts` -- 技术名称到业务名称映射
     - 文件路径 -> 业务语义：`src/components/Login.tsx` -> "用户登录页面"
     - 技术状态 -> 业务状态：`lint-pass` -> "代码格式检查通过"
     - 错误类型 -> 业务描述：`TypeError: Cannot read property` -> "功能实现中遇到技术问题"
  2. 创建 `src/server/services/translation/mapping-table.ts` -- 静态映射表（覆盖 80% 场景）
  3. 映射表支持项目级自定义扩展
**验证：**
  - 10 个常见文件路径翻译正确
  - 10 个技术状态翻译为 PM 可读语言
  - 未命中映射表时返回通用描述（不暴露技术细节）
**产出：**
  - `src/server/services/translation/` 下 2 个文件
**预估耗时：** 2小时
**可并行：** 是（可与 STEP-036 ~ STEP-050 并行）

---

### STEP-052: 业务翻译层 -- 状态翻译器
**前置条件：** STEP-051完成
**执行：**
  1. 创建 `src/server/services/translation/status-translator.ts` -- 状态翻译器
     - Pipeline Phase -> PM 可见消息（例如："正在为您的项目编写代码..."）
     - 节点状态变化 -> 进度流条目
     - 错误场景的诚实翻译（不隐瞒失败，但用 PM 语言解释）
  2. 创建 `src/server/services/translation/progress-formatter.ts` -- 进度流格式化
     - 将技术事件格式化为进度面板条目
     - 图标选择、颜色编码、时间戳
  3. 翻译准确性规则：技术状态"测试全部失败" 不能翻译为"正在顺利进行"
**验证：**
  - 所有 Pipeline Phase 有对应的 PM 翻译
  - 错误场景翻译诚实但不恐慌
  - Mock 数据明确标注"模拟数据"
**产出：**
  - `src/server/services/translation/` 下 2 个文件
**预估耗时：** 2.5小时
**可并行：** 否

---

### STEP-053: 业务翻译层 -- AI辅助翻译
**前置条件：** STEP-052、STEP-039完成
**执行：**
  1. 创建 `src/server/services/translation/ai-translator.ts` -- AI 辅助翻译（覆盖映射表未命中的 20%）
     - 使用轻量模型（Haiku 或 DeepSeek V3）翻译技术概念
     - 输入：技术事件 + 项目上下文
     - 输出：PM 可理解的一句话描述
  2. 创建 `src/prompts/translation.ts` -- 翻译 Prompt
  3. 缓存常见翻译结果（Redis，TTL 24h），避免重复 AI 调用
  4. 翻译层自身出错时的降级：返回通用描述 "正在处理中..."
**验证：**
  - 映射表未命中的技术事件 -> AI 翻译 -> 返回 PM 可读文本
  - 缓存命中时不调用 AI
  - 翻译层出错时正确降级
**产出：**
  - `src/server/services/translation/ai-translator.ts`
  - `src/prompts/translation.ts`
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-054: 翻译层 -- 集成到Pipeline和进度面板
**前置条件：** STEP-053、STEP-050完成
**执行：**
  1. 更新 code-gen-worker.ts：所有 WebSocket 广播消息通过翻译层处理后再发送
  2. 更新 progress-panel.tsx：使用翻译后的消息渲染进度条目
  3. 更新节点状态变化通知：使用翻译后的状态文本
  4. 测试完整链路：代码生成中的所有技术事件 -> 翻译 -> 进度面板全部为 PM 语言
**验证：**
  - 整个代码生成过程中，进度面板没有出现任何技术术语
  - 错误消息使用 PM 语言
  - 翻译延迟 < 200ms（不影响实时性）
**产出：**
  - 更新后的 Worker 和进度面板组件
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-055: AI引擎端到端验证
**前置条件：** STEP-054完成
**执行：**
  1. 完整流程测试（电商平台场景）：
     - 输入 "我要做一个电商平台" -> AI 追问 5 轮 -> 输出需求文档
     - 自动生成功能地图（10-15 个节点）
     - PM 修改："把注册和登录分开" -> 功能地图更新
     - PM 确认 -> 代码生成启动 -> 逐节点生成
     - 全程进度面板使用 PM 语言
  2. 测量关键性能指标：
     - 第一个追问响应 < 10秒
     - 功能地图生成 < 60秒
     - 功能地图修改响应 < 15秒
     - 单节点代码生成 < 90秒
  3. 测试 AI 降级：模拟 Provider 不可用 -> 熔断 -> 降级到备用 Provider
  4. 测试成本追踪：验证 cost_entries 表记录准确
**验证：**
  - 端到端流程完整跑通
  - 所有性能指标达标
  - 降级机制正常工作
  - 成本追踪数据准确
**产出：**
  - 性能基线数据
  - 阶段三完成确认
**预估耗时：** 4小时
**可并行：** 否（阶段三收尾验证）

---

## 阶段四：Pipeline + 部署（STEP-056 ~ STEP-070）

质量关卡、构建部署、截图服务、预览URL管理。
对应里程碑 W7-8 和 F-1.4（质量关卡）+ F-1.5（预览部署）。

---

### STEP-056: 质量关卡 -- ESLint检查Worker
**前置条件：** STEP-048完成
**执行：**
  1. 创建 `src/server/workers/quality-gate-worker.ts` -- 质量关卡 Worker
  2. 实现 ESLint 检查步骤：
     - 从 R2 下载节点生成的代码文件
     - 运行 ESLint 检查
     - 收集所有 error 和 warning
  3. 创建 `.eslintrc.generated.json` -- 为生成代码定制的 ESLint 配置（比主项目宽松，但覆盖关键规则）
**验证：**
  - 有 lint 错误的代码 -> 检测到错误 -> 报告详情
  - 无错误的代码 -> 通过
**产出：**
  - `src/server/workers/quality-gate-worker.ts`（ESLint 部分）
  - `.eslintrc.generated.json`
**预估耗时：** 2小时
**可并行：** 是（可与阶段三后半部分并行）

---

### STEP-057: 质量关卡 -- TypeScript类型检查
**前置条件：** STEP-056完成
**执行：**
  1. 在 quality-gate-worker.ts 中添加 TypeScript 类型检查步骤
     - 运行 `tsc --noEmit` 检查所有生成的 .ts/.tsx 文件
     - 收集类型错误详情（文件、行号、错误描述）
  2. 创建 `tsconfig.generated.json` -- 为生成代码定制的 TypeScript 配置
  3. 类型检查失败时提取关键错误信息（过滤噪声）
**验证：**
  - 有类型错误的代码 -> 检测到 -> 报告错误位置和描述
  - 类型正确的代码 -> 通过
**产出：**
  - 更新后的 quality-gate-worker.ts
  - `tsconfig.generated.json`
**预估耗时：** 1.5小时
**可并行：** 否

---

### STEP-058: 质量关卡 -- AI自动修复
**前置条件：** STEP-057完成
**执行：**
  1. 创建 `src/server/services/quality/auto-fixer.ts` -- AI 自动修复器
     - 输入：错误信息 + 原始代码
     - 调用 AI 生成修复后的代码
     - 替换原文件，重新运行检查
     - 最多 3 次修复尝试
  2. 创建 `src/prompts/lint-fix.ts` -- Lint 修复 Prompt
  3. 创建 `src/prompts/type-fix.ts` -- TypeCheck 修复 Prompt
  4. 在 quality-gate-worker 中编排：检查 -> 失败 -> AI修复 -> 重新检查 -> 循环
  5. 3 次修复失败 -> 暂停 Pipeline -> 通知 PM "遇到技术问题，正在处理"
**验证：**
  - Lint 错误 -> AI 修复 -> 重新检查通过（成功率 > 80%）
  - TypeCheck 错误 -> AI 修复 -> 通过（成功率 > 60%）
  - 3 次失败 -> Pipeline 暂停 + PM 收到通知（PM 语言）
**产出：**
  - `src/server/services/quality/auto-fixer.ts`
  - `src/prompts/lint-fix.ts`、`src/prompts/type-fix.ts`
**预估耗时：** 4小时
**可并行：** 否

---

### STEP-059: 质量关卡 -- Pipeline集成
**前置条件：** STEP-058完成
**执行：**
  1. 更新 execution-orchestrator.ts：代码生成完成后自动触发质量关卡
  2. 质量关卡与代码生成在 BullMQ Flow 中串联：code-gen -> quality-gate
  3. 质量关卡进度通过翻译层广播到进度面板（但 PM 在正常流程中不会看到详情）
  4. 质量关卡结果写入 pipeline_runs 表的 phases_log
  5. 全部通过后自动进入预览部署阶段
**验证：**
  - 代码生成完成 -> 自动运行质量关卡 -> 结果记录到数据库
  - PM 在正常流程中看不到质量关卡细节
  - 质量关卡总耗时 < 5 分钟（含修复）
**产出：**
  - 更新后的 execution-orchestrator.ts
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-060: 预览部署 -- 项目构建服务
**前置条件：** STEP-059完成
**执行：**
  1. 创建 `src/server/services/deploy/build-service.ts` -- 项目构建服务
     - 从 R2 下载所有代码文件 -> 组装完整 Next.js 项目
     - 生成 package.json（动态依赖列表）
     - 执行 `npm install` + `npm run build`
     - 构建产物打包
  2. 创建 `src/server/workers/deploy-worker.ts` -- 部署 Worker
     - 处理构建 + 部署的完整流程
  3. 构建失败时：AI 分析错误 -> 修复 -> 重新构建（最多 3 次）
**验证：**
  - 从 R2 代码 -> 构建成功 -> 产出 .next 产物
  - 构建失败 -> AI 修复 -> 重新构建成功
**产出：**
  - `src/server/services/deploy/build-service.ts`
  - `src/server/workers/deploy-worker.ts`
**预估耗时：** 4小时
**可并行：** 否

---

### STEP-061: 预览部署 -- Cloudflare Pages集成
**前置条件：** STEP-060完成
**执行：**
  1. `npm install wrangler` -- Cloudflare CLI
  2. 创建 `src/server/services/deploy/cloudflare-deployer.ts` -- Cloudflare Pages 部署
     - 上传构建产物到 Cloudflare Pages
     - 生成预览 URL：`preview-{hash}.projects.ourplatform.com`
     - 部署状态轮询（等待 Cloudflare 完成部署）
  3. 在 `.env` 添加 CLOUDFLARE_ACCOUNT_ID、CLOUDFLARE_API_TOKEN
  4. 部署成功后更新项目状态为 'preview'
  5. 预览 URL 写入 projects 表
**验证：**
  - 构建产物 -> 上传 Cloudflare Pages -> 预览 URL 可访问
  - 部署耗时 < 3 分钟
**产出：**
  - `src/server/services/deploy/cloudflare-deployer.ts`
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-062: 截图服务 -- Playwright集成
**前置条件：** STEP-061完成
**执行：**
  1. `npm install playwright`
  2. 创建 `src/server/services/screenshot/screenshot-service.ts` -- 截图服务
     - 浏览器池管理（最少 2 实例、最大 10 实例）
     - capture(url, options) -> 截图并上传到 R2
     - 支持 viewport 配置（默认 1280x720）
     - 支持全页面截图和元素截图
     - 等待策略：networkidle（页面完全加载后截图）
  3. 创建 `src/server/workers/screenshot-worker.ts` -- 截图 Worker
     - 接收 Job：{ url, pages, viewport }
     - 批量截取所有页面级节点对应的页面
     - 截图上传到 R2 的 /{projectId}/screenshots/ 目录
**验证：**
  - 给定 URL -> 截图成功 -> 图片清晰
  - 多页面批量截图 -> 全部成功
  - 截图文件正确存储在 R2
**产出：**
  - `src/server/services/screenshot/screenshot-service.ts`
  - `src/server/workers/screenshot-worker.ts`
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-063: 截图服务 -- 冒烟测试
**前置条件：** STEP-062完成
**执行：**
  1. 创建 `src/server/services/screenshot/smoke-test.ts` -- 冒烟测试
     - 验证首页可访问（HTTP 200）
     - 验证所有页面级路由可达
     - 检查是否有控制台错误
     - 检查是否有 404 资源
  2. 在 deploy-worker 中编排：部署完成 -> 截图 -> 冒烟测试
  3. 冒烟测试失败 -> 通知 PM（翻译后的语言）
**验证：**
  - 正常部署 -> 冒烟测试通过
  - 故意破坏一个路由 -> 冒烟测试捕获失败
**产出：**
  - `src/server/services/screenshot/smoke-test.ts`
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-064: 预览部署 -- 完整Pipeline编排
**前置条件：** STEP-063完成
**执行：**
  1. 更新 execution-orchestrator.ts：质量关卡通过后自动触发构建 -> 部署 -> 截图 -> 冒烟测试
  2. BullMQ Flow 完整编排：
     ```
     code-gen -> quality-gate -> build -> deploy -> screenshot -> smoke-test
     ```
  3. 每个阶段完成后更新 pipeline_runs 的 phases_log
  4. 进度面板显示："正在准备预览..." -> "正在部署..." -> "正在生成截图..." -> "预览就绪！"
  5. 部署成功后在 UI 显示预览 URL 按钮（新标签页打开）
**验证：**
  - 端到端：代码生成 -> 质量关卡 -> 构建 -> 部署 -> 截图 -> 冒烟测试 全自动
  - 每阶段进度实时更新
  - 预览 URL 可访问
  - 截图正确显示
**产出：**
  - 更新后的 execution-orchestrator.ts 和相关组件
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-065: 构建失败的AI自动修复
**前置条件：** STEP-064完成
**执行：**
  1. 创建 `src/server/services/deploy/build-fixer.ts` -- 构建失败修复器
     - 解析 `npm run build` 错误输出
     - 分类错误类型（依赖缺失、类型错误、模块找不到等）
     - 调用 AI 生成修复方案
     - 应用修复 -> 重新构建
     - 最多 3 次
  2. 创建 `src/prompts/build-fix.ts` -- 构建修复 Prompt
  3. 修复失败后将完整错误信息存储到 R2（供调试）
**验证：**
  - 常见构建错误（缺少依赖、import 路径错误） -> AI 修复成功
  - 修复成功率 > 70%
  - 3 次失败 -> 暂停 + 通知 PM
**产出：**
  - `src/server/services/deploy/build-fixer.ts`
  - `src/prompts/build-fix.ts`
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-066: Pipeline状态API和管理
**前置条件：** STEP-064完成
**执行：**
  1. 创建 `src/app/api/pipeline/[pipelineId]/route.ts` -- Pipeline 状态查询
     - GET：返回 Pipeline 当前状态、各 Phase 进度、日志
  2. 创建 `src/app/api/pipeline/[pipelineId]/pause/route.ts` -- 暂停 Pipeline
  3. 创建 `src/app/api/pipeline/[pipelineId]/resume/route.ts` -- 恢复 Pipeline
  4. 创建 `src/app/api/pipeline/[pipelineId]/cancel/route.ts` -- 取消 Pipeline
  5. 更新 PipelineStore 对接这些 API
**验证：**
  - 查询 Pipeline 状态返回完整信息
  - 暂停/恢复/取消操作正确影响 Worker 执行
**产出：**
  - `src/app/api/pipeline/` 下 4 个 route 文件
**预估耗时：** 2小时
**可并行：** 是（可与 STEP-065 并行）

---

### STEP-067: Pipeline检查点和恢复
**前置条件：** STEP-064完成
**执行：**
  1. 创建 `src/server/services/pipeline/checkpoint-manager.ts` -- 检查点管理器
     - 每个 Phase 完成后创建快照到 R2
     - 快照内容：DAG 状态、生成的文件清单、Pipeline 进度
     - Pipeline 中断后可从任意 Phase 快照恢复
  2. 创建 `src/app/api/pipeline/[pipelineId]/recover/route.ts` -- 恢复 API
     - 从指定 Phase 恢复执行
  3. 快照写入 dag_snapshots 表
**验证：**
  - 每个 Phase 完成后快照存在于 R2
  - 中断 Pipeline -> 从上次快照恢复 -> 继续执行
**产出：**
  - `src/server/services/pipeline/checkpoint-manager.ts`
  - `src/app/api/pipeline/[pipelineId]/recover/route.ts`
**预估耗时：** 3小时
**可并行：** 是（可与 STEP-065、STEP-066 并行）

---

### STEP-068: 预览URL管理和项目导出
**前置条件：** STEP-064完成
**执行：**
  1. 创建 `src/server/services/deploy/preview-manager.ts` -- 预览 URL 管理
     - 生成、查询、失效预览 URL
     - 预览环境自动清理：30 天不活跃则删除
  2. 创建 `src/server/services/deploy/project-exporter.ts` -- 项目导出
     - 从 R2 下载所有代码文件 -> 打包 ZIP
     - ZIP 中包含完整的 Next.js 项目（可独立运行）
     - 自动剥离敏感信息（API Key、.env 内容）
  3. 创建 `src/app/api/projects/[projectId]/export/route.ts` -- 导出 API
**验证：**
  - 预览 URL 正确映射到部署
  - 导出的 ZIP 解压后 `npm install && npm run dev` 可运行
  - ZIP 中无 API Key 或 .env 泄露
**产出：**
  - `src/server/services/deploy/` 下 2 个文件
  - `src/app/api/projects/[projectId]/export/route.ts`
**预估耗时：** 3小时
**可并行：** 是（可与 STEP-065 ~ STEP-067 并行）

---

### STEP-069: 依赖管理
**前置条件：** STEP-060完成
**执行：**
  1. 创建 `src/server/services/deploy/dependency-manager.ts` -- 依赖管理
     - 从生成的代码中提取 import/require 语句
     - 解析所需的 npm 包
     - 验证包存在于 npm registry
     - 去重并生成最终依赖列表
     - 写入 dependency_manifests 表
  2. 在构建前自动安装所有依赖
  3. 检测已知的安全漏洞包（基础版，详细版在 Phase 2）
**验证：**
  - 代码中 import 的包 -> 自动加入依赖列表
  - 不存在的包 -> 标记警告
  - 安装后构建成功
**产出：**
  - `src/server/services/deploy/dependency-manager.ts`
**预估耗时：** 2.5小时
**可并行：** 是（可与 STEP-061 ~ STEP-068 并行）

---

### STEP-070: Pipeline + 部署端到端验证
**前置条件：** STEP-065、STEP-066、STEP-067、STEP-068、STEP-069完成
**执行：**
  1. 完整 Pipeline 测试（电商平台场景）：
     - 需求对话 -> 功能地图 -> 代码生成 -> 质量关卡 -> 构建 -> 部署 -> 截图 -> 冒烟测试
  2. 验证关键指标：
     - 质量关卡自动通过率 > 70%（首次生成即通过）
     - 构建+部署总耗时 < 3 分钟
     - 预览 URL 可在公网访问
     - 自动截图覆盖所有页面级节点
     - AI 构建修复成功率 > 70%
  3. 测试检查点恢复：中途中断 Pipeline -> 从快照恢复 -> 继续完成
  4. 测试项目导出：下载 ZIP -> 本地运行
**验证：**
  - 全流程自动完成，PM 无需干预技术细节
  - 所有指标达标
  - 检查点恢复正确
  - 导出的项目可独立运行
**产出：**
  - 阶段四完成确认
  - 性能指标记录
**预估耗时：** 4小时
**可并行：** 否（阶段四收尾验证）

---

## 阶段五：验收 + 集成（STEP-071 ~ STEP-085）

引导式验收、反馈循环、修复循环、端到端集成测试。
对应里程碑 W9-10 和 F-1.6（引导式验收）。

---

### STEP-071: 验收引擎 -- 问题生成
**前置条件：** STEP-062完成
**执行：**
  1. 创建 `src/server/services/acceptance/question-generator.ts` -- 验收问题生成器
     - 输入：功能节点信息 + 截图 URL
     - 为每个功能生成 2-3 个是/否问题
     - 问题使用 PM 语言（"这个登录页面的布局符合您的预期吗？"）
     - 问题覆盖：布局、内容、交互逻辑三个维度
  2. 创建 `src/prompts/acceptance-questions.ts` -- 问题生成 Prompt
  3. 问题写入 acceptance_records 表
**验证：**
  - 10 个不同类型的功能节点 -> 每个生成 2-3 个有意义的问题
  - 问题全部为 PM 可理解的语言
  - 问题不重复
**产出：**
  - `src/server/services/acceptance/question-generator.ts`
  - `src/prompts/acceptance-questions.ts`
**预估耗时：** 2.5小时
**可并行：** 是（可与阶段四后半部分并行）

---

### STEP-072: 验收引擎 -- 问题定位
**前置条件：** STEP-071完成
**执行：**
  1. 创建 `src/server/services/acceptance/issue-classifier.ts` -- 问题分类器
     - PM 说"否"时，提供 4 类问题选项：
       1. 布局/样式问题（位置、颜色、字体大小）
       2. 内容问题（文字错误、数据缺失）
       3. 功能缺失（按钮不能点、页面缺少元素）
       4. 不符合预期（整体效果与想象不同）
     - 每类问题下有细分选项
  2. 创建 `src/server/services/acceptance/feedback-interpreter.ts` -- PM 反馈解释器
     - 将 PM 的选择 + 文字描述 -> 结构化的修复需求
     - AI 复述问题让 PM 确认（"您是说注册按钮应该在页面中央，而不是右上角，对吗？"）
**验证：**
  - PM 选择"布局问题" -> 看到细分选项
  - PM 描述问题 -> AI 复述 -> PM 确认 -> 生成结构化修复需求
**产出：**
  - `src/server/services/acceptance/` 下 2 个文件
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-073: 修复引擎 -- AI修复生成
**前置条件：** STEP-072完成
**执行：**
  1. 创建 `src/server/services/acceptance/fix-engine.ts` -- 修复引擎
     - 输入：结构化修复需求 + 原始代码 + 截图
     - AI 分析问题 -> 生成修复后的代码
     - 修复代码替换原文件 -> 重新通过质量关卡
  2. 创建 `src/prompts/acceptance-fix.ts` -- 修复 Prompt
  3. 修复后自动触发：重新构建 -> 重新部署 -> 重新截图
  4. 修复循环计数器：每个功能最多 3 轮
  5. 3 轮未解决 -> 升级处理（建议 PM 截图标注或标记"需要技术支持"）
**验证：**
  - PM 反馈 -> AI 修复 -> 重新部署 -> 新截图
  - 修复循环最多 3 轮
  - 升级处理机制工作
**产出：**
  - `src/server/services/acceptance/fix-engine.ts`
  - `src/prompts/acceptance-fix.ts`
**预估耗时：** 4小时
**可并行：** 否

---

### STEP-074: 验收引擎 -- API层
**前置条件：** STEP-073完成
**执行：**
  1. 创建 `src/app/api/acceptance/[projectId]/start/route.ts` -- 启动验收
  2. 创建 `src/app/api/acceptance/[projectId]/answer/route.ts` -- PM 回答问题
  3. 创建 `src/app/api/acceptance/[projectId]/feedback/route.ts` -- PM 提交反馈
  4. 创建 `src/app/api/acceptance/[projectId]/status/route.ts` -- 验收状态查询
  5. 创建 `src/app/api/acceptance/[projectId]/summary/route.ts` -- 验收总结报告
  6. 所有接口使用 zod 验证
**验证：**
  - 启动验收 -> 返回第一个功能的问题 + 截图
  - 回答问题 -> 返回下一个问题或问题定位
  - 提交反馈 -> 触发修复流程
  - 总结报告包含所有功能的通过/未通过状态
**产出：**
  - `src/app/api/acceptance/` 下 5 个 route 文件
**预估耗时：** 2.5小时
**可并行：** 否

---

### STEP-075: 验收面板 -- 对接真实API
**前置条件：** STEP-074、STEP-032完成
**执行：**
  1. 创建 `src/services/acceptance-api.ts` -- 前端 API 封装
  2. 更新 `useAcceptance.ts` hook -- 对接真实 API（替换 mock）
  3. 更新验收面板组件：
     - 功能清单展示从 API 获取真实数据
     - 引导验收从 API 获取问题和截图
     - PM 回答通过 API 提交
     - 修复进度通过 WebSocket 实时更新
  4. 验收总结报告从 API 获取
**验证：**
  - 端到端：截图显示 -> PM 回答 -> 问题定位 -> AI 修复 -> 新截图 -> PM 再验
  - 所有数据从后端 API 获取
  - 修复进度实时更新
**产出：**
  - `src/services/acceptance-api.ts`
  - 更新后的验收面板组件和 hooks
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-076: 验收完成后的状态更新
**前置条件：** STEP-075完成
**执行：**
  1. 验收全部通过 -> 项目状态更新为 'preview'
  2. 功能地图节点状态更新：已确认
  3. 进度面板显示验收总结
  4. UI 显示选项：
     - "查看预览" 按钮（打开预览 URL）
     - "导出项目" 按钮（下载 ZIP）
     - "修改需求" 按钮（返回对话面板开始新一轮迭代）
  5. Pipeline 最终状态写入 pipeline_runs 表
**验证：**
  - 验收通过 -> 项目状态正确更新
  - 三个操作按钮均可用
  - pipeline_runs 记录完整
**产出：**
  - 更新后的工作台页面和相关组件
**预估耗时：** 1.5小时
**可并行：** 否

---

### STEP-077: 端到端集成测试 -- 电商平台场景
**前置条件：** STEP-076完成
**执行：**
  1. 完整测试场景（电商平台）：
     - 输入："我要做一个小型电商平台，卖手工艺品"
     - AI 追问 5 轮 -> 需求文档
     - 功能地图生成（~12 节点：首页、商品列表、商品详情、购物车、结算、订单、用户中心等）
     - PM 修改："加一个商品搜索功能"
     - 确认 -> 代码生成 -> 质量关卡 -> 部署 -> 截图 -> 验收
     - 验收中故意说"否"一次 -> 问题定位 -> AI 修复 -> 重新验收
  2. 记录完整流程耗时
  3. 记录每个 Phase 的成功率
  4. 检查预览 URL 可访问性
**验证：**
  - 全流程跑通，无需人工干预技术问题
  - 总耗时 < 60 分钟（20 页面/50 API 级别）
  - 预览 URL 可正常访问
  - 修复循环正确触发和完成
**产出：**
  - 电商平台测试报告
**预估耗时：** 4小时
**可并行：** 否

---

### STEP-078: 端到端集成测试 -- SaaS工具场景
**前置条件：** STEP-076完成
**执行：**
  1. 完整测试场景（SaaS项目管理工具）：
     - 输入："我要做一个简单的项目管理工具，类似Trello"
     - AI 追问 -> 功能地图（~10 节点：看板、任务卡、拖拽、成员管理等）
     - 完整 Pipeline -> 验收
  2. 重点关注不同类型项目的 Prompt 适应性
  3. 记录指标
**验证：**
  - 全流程跑通
  - 功能地图节点类型正确（SaaS 特有的节点）
  - 代码生成质量可接受
**产出：**
  - SaaS 工具测试报告
**预估耗时：** 3小时
**可并行：** 是（可与 STEP-077 并行，使用不同测试账号）

---

### STEP-079: 端到端集成测试 -- 内容站场景
**前置条件：** STEP-076完成
**执行：**
  1. 完整测试场景（内容博客站）：
     - 输入："我要做一个个人博客，支持文章发布和分类"
     - AI 追问 -> 功能地图（~8 节点：首页、文章列表、文章详情、分类、关于页等）
     - 完整 Pipeline -> 验收
  2. 重点关注简单项目的生成效率
  3. 记录指标
**验证：**
  - 全流程跑通
  - 较小项目（8 节点）总耗时更短
  - 内容类节点生成质量良好
**产出：**
  - 内容站测试报告
**预估耗时：** 2.5小时
**可并行：** 是（可与 STEP-077、STEP-078 并行）

---

### STEP-080: 性能优化 -- 代码生成速度
**前置条件：** STEP-077完成
**执行：**
  1. 分析代码生成瓶颈：
     - AI API 响应时间
     - 上下文构建时间
     - 文件写入 R2 时间
  2. 优化措施：
     - 无依赖节点并行生成（确认 BullMQ concurrency 生效）
     - AI 响应缓存（相同 Prompt 不重复调用）
     - R2 批量上传
  3. 目标：20 节点完整生成时间 < 30 分钟
**验证：**
  - 20 节点项目生成时间 < 30 分钟
  - 并行节点确实同时执行
  - 缓存命中率 > 15%
**产出：**
  - 性能优化 commits
  - 优化后的基线数据
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-081: 性能优化 -- 前端加载速度
**前置条件：** STEP-035完成
**执行：**
  1. 分析前端性能：
     - Next.js Bundle Analyzer：`npm install @next/bundle-analyzer`
     - 找出过大的 chunks
  2. 优化措施：
     - ReactFlow 懒加载（动态 import）
     - 图片/截图懒加载
     - Zustand 的选择性订阅（避免不必要的重渲染）
     - TanStack Query 预取关键数据
  3. 目标：页面首次加载 < 3 秒
**验证：**
  - Lighthouse Performance 分数 > 70
  - 首次内容绘制（FCP）< 1.5秒
  - 总加载时间 < 3 秒
**产出：**
  - 性能优化 commits
  - Lighthouse 报告
**预估耗时：** 3小时
**可并行：** 是（可与 STEP-080 并行）

---

### STEP-082: 错误处理和边界情况
**前置条件：** STEP-077完成
**执行：**
  1. 系统性检查所有错误路径：
     - AI API 完全不可用 -> 全局错误提示
     - 数据库连接断开 -> 重试 + 降级
     - R2 上传失败 -> 重试
     - WebSocket 断线 -> 自动重连 + 补发缺失事件
     - 浏览器标签页隐藏后恢复 -> 状态同步
  2. 添加全局错误边界（React Error Boundary）
  3. 创建 `src/components/error/error-boundary.tsx`
  4. 创建 `src/components/error/error-fallback.tsx` -- 友好的错误页面
  5. 所有 async 操作添加 timeout
**验证：**
  - 模拟每种错误场景 -> 用户看到友好提示
  - WebSocket 断线 -> 5秒内自动重连
  - 标签页恢复 -> 状态正确同步
**产出：**
  - `src/components/error/` 下 2 个组件
  - 更新后的各服务错误处理
**预估耗时：** 4小时
**可并行：** 是（可与 STEP-080、STEP-081 并行）

---

### STEP-083: 日志和监控基础
**前置条件：** STEP-064完成
**执行：**
  1. `npm install pino` -- 结构化日志
  2. 创建 `src/lib/logger.ts` -- Pino logger 配置
     - 开发环境：pretty print
     - 生产环境：JSON 格式
     - 日志级别配置
  3. 为所有 Worker 添加结构化日志
  4. 为所有 API Route 添加请求/响应日志
  5. Pipeline 执行日志（每步开始/结束/耗时/状态）
  6. AI 调用日志（模型、token 数、耗时、成本）
**验证：**
  - 完整 Pipeline 运行后日志完整
  - 日志格式一致、可搜索
  - AI 调用有完整的成本日志
**产出：**
  - `src/lib/logger.ts`
  - 更新后的 Workers 和 API Routes
**预估耗时：** 2.5小时
**可并行：** 是（可与 STEP-077 ~ STEP-082 并行）

---

### STEP-084: 成本追踪面板
**前置条件：** STEP-083完成
**执行：**
  1. 创建 `src/app/api/projects/[projectId]/cost/route.ts` -- 成本查询 API
     - 按 Provider 汇总
     - 按 Phase 汇总
     - 按节点汇总
  2. 创建 `src/components/project/cost-summary.tsx` -- 成本汇总组件
     - 总花费（USD）
     - 按阶段分布饼图
     - 按 AI 模型分布
  3. 在项目工作台增加 "成本" 标签页
**验证：**
  - 运行完一个项目后查看成本 -> 数据准确
  - 按 Provider/Phase/节点 汇总正确
**产出：**
  - `src/app/api/projects/[projectId]/cost/route.ts`
  - `src/components/project/cost-summary.tsx`
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-085: 验收 + 集成阶段收尾验证
**前置条件：** STEP-077 ~ STEP-084全部完成
**执行：**
  1. Phase 1 出口标准逐项验证：
     - [ ] 端到端流程可用（PM输入需求 -> 确认功能地图 -> AI生成代码 -> 质量关卡 -> 部署预览 -> 验收）
     - [ ] 3 种场景（电商/SaaS/内容站）成功走完全流程
     - [ ] 单项目从需求到预览 < 60 分钟
     - [ ] 质量关卡自动通过率 > 70%
     - [ ] 预览部署成功率 > 90%
  2. 整理所有测试报告和性能数据
  3. 列出已知问题和限制
**验证：**
  - 所有出口标准勾选通过
  - 性能数据满足要求
**产出：**
  - Phase 1 验证报告
  - 已知问题列表
**预估耗时：** 2小时
**可并行：** 否（阶段五收尾）

---

## 阶段六：收尾（STEP-086 ~ STEP-095）

Onboarding教程、示例项目、文档、部署到生产。
对应里程碑 W11-12。

---

### STEP-086: Onboarding教程 -- 首次使用引导
**前置条件：** STEP-085完成
**执行：**
  1. 创建 `src/components/onboarding/onboarding-flow.tsx` -- 首次使用引导流程
     - 步骤 1：欢迎页（产品简介 + "开始"按钮）
     - 步骤 2：创建第一个项目（引导填写项目名）
     - 步骤 3：输入需求提示（提供示例需求一键填入）
     - 步骤 4：功能地图确认提示（高亮确认按钮）
     - 步骤 5：等待生成 + 验收提示
  2. 使用 tooltip 高亮和遮罩层引导用户注意力
  3. 引导流程完成后标记用户已完成 onboarding（不再显示）
**验证：**
  - 新用户首次登录 -> 自动启动引导
  - 完成引导后 -> 不再显示
  - 引导步骤清晰，PM 无需技术背景即可跟随
**产出：**
  - `src/components/onboarding/onboarding-flow.tsx`
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-087: 示例项目模板
**前置条件：** STEP-077、STEP-078、STEP-079完成
**执行：**
  1. 将三个测试场景的需求文档固化为模板：
     - `src/data/templates/ecommerce.json` -- 电商平台模板
     - `src/data/templates/saas-tool.json` -- SaaS 工具模板
     - `src/data/templates/content-site.json` -- 内容站模板
  2. 每个模板包含：预设需求文档 + 功能地图节点/边
  3. 创建 `src/components/project/template-picker.tsx` -- 模板选择器
     - 创建项目时可选择"从模板开始"
     - 选择模板后自动填充需求和功能地图
     - PM 可在此基础上修改
  4. 在创建项目弹窗中集成模板选择
**验证：**
  - 选择电商模板 -> 功能地图自动填充 -> PM 可修改后确认
  - 三个模板各自包含合理的节点和依赖关系
**产出：**
  - `src/data/templates/` 下 3 个 JSON 文件
  - `src/components/project/template-picker.tsx`
**预估耗时：** 2.5小时
**可并行：** 否

---

### STEP-088: Landing Page
**前置条件：** STEP-003完成
**执行：**
  1. 创建 `src/app/page.tsx` -- Landing Page
     - Hero 区域：产品价值主张 + CTA 按钮
     - 功能介绍（3-4 个卖点块）
     - 工作流程展示（需求 -> 功能地图 -> 代码 -> 预览 的流程图）
     - 社会证明区域（预留，Phase 1 可放内测反馈）
     - 底部 CTA
  2. SEO 基础：meta tags、OpenGraph
  3. SSR 渲染（首屏加载快）
**验证：**
  - Landing Page 在移动端和桌面端渲染正确
  - Lighthouse SEO 分数 > 80
  - 首屏加载 < 2 秒
**产出：**
  - `src/app/page.tsx`
**预估耗时：** 3小时
**可并行：** 是（可与 STEP-086、STEP-087 并行）

---

### STEP-089: CI/CD Pipeline配置
**前置条件：** STEP-007完成
**执行：**
  1. 创建 `.github/workflows/ci.yml` -- CI 配置
     - 触发条件：push 到 main、PR 到 main
     - 步骤：lint -> type-check -> build
     - Node.js 版本矩阵：20.x
  2. 创建 `.github/workflows/deploy.yml` -- CD 配置
     - 触发条件：push 到 main（CI 通过后）
     - 部署到 Cloudflare Pages（平台自身，非用户项目）
  3. 添加必要的 GitHub Secrets 配置说明
**验证：**
  - Push 到 main -> CI 自动运行 -> lint/type-check/build 全部通过
  - CI 通过后 -> 自动部署平台自身
**产出：**
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy.yml`
**预估耗时：** 2小时
**可并行：** 是（可与 STEP-086 ~ STEP-088 并行）

---

### STEP-090: 环境变量和配置管理
**前置条件：** STEP-015完成
**执行：**
  1. 创建 `.env.example` -- 列出所有需要的环境变量（无真实值）
  2. 创建 `src/lib/config.ts` -- 集中管理所有环境变量
     - zod 验证（启动时检查所有必要的环境变量）
     - 分组：database、redis、ai、cloudflare、auth
  3. 创建 `.env.development` -- 开发环境默认配置
  4. 创建 `.env.production` -- 生产环境配置模板
  5. 确保 `.gitignore` 包含 `.env*`（除 `.env.example`）
**验证：**
  - 缺少必要环境变量时启动报错（明确提示缺哪个）
  - 所有服务使用 config.ts 获取配置（不直接读 process.env）
**产出：**
  - `.env.example`、`.env.development`
  - `src/lib/config.ts`
**预估耗时：** 1.5小时
**可并行：** 是（可与其他收尾步骤并行）

---

### STEP-091: Docker配置
**前置条件：** STEP-090完成
**执行：**
  1. 创建 `Dockerfile` -- 多阶段构建
     - Stage 1: 安装依赖
     - Stage 2: 构建
     - Stage 3: 运行（精简镜像）
     - 包含 Playwright 和 Chrome（截图服务需要）
  2. 创建 `docker-compose.yml` -- 本地开发完整环境
     - services: app、postgres、redis
     - volumes: 数据持久化
     - 健康检查配置
  3. 创建 `docker-compose.prod.yml` -- 生产环境配置
  4. 创建 `.dockerignore`
**验证：**
  - `docker-compose up` -> 完整环境启动
  - 应用可在 Docker 环境中正常工作
  - Playwright 截图在 Docker 中可用
**产出：**
  - `Dockerfile`、`docker-compose.yml`、`docker-compose.prod.yml`、`.dockerignore`
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-092: 生产环境部署
**前置条件：** STEP-091、STEP-089完成
**执行：**
  1. Cloudflare Pages 部署平台前端
  2. Railway 或 Fly.io 部署后端（包含 BullMQ Workers）
  3. Supabase/Neon 配置生产数据库
  4. Upstash 或 Redis Cloud 配置生产 Redis
  5. 配置域名 DNS
  6. HTTPS 证书（Cloudflare 自动处理）
  7. 运行数据库迁移
**验证：**
  - 生产域名可访问
  - HTTPS 证书有效
  - 所有服务健康（API 可达、WebSocket 可连、数据库可读写）
**产出：**
  - 生产环境部署
  - 基础设施配置文档
**预估耗时：** 4小时
**可并行：** 否

---

### STEP-093: 安全基线检查
**前置条件：** STEP-092完成
**执行：**
  1. 依赖审计：`npm audit` 无 high/critical
  2. 环境变量检查：生产环境无硬编码密钥
  3. CORS 配置：仅允许生产域名
  4. Rate limit：API 端点有请求频率限制
  5. 认证检查：所有 API 端点（除 public）需要认证
  6. SQL 注入防护：使用 Prisma 参数化查询
  7. XSS 防护：React 默认转义 + CSP header
  8. 敏感日志检查：日志中不包含 API Key/密码
**验证：**
  - `npm audit` 无 high/critical
  - 所有安全检查项通过
  - 尝试未认证访问 API -> 401
**产出：**
  - 安全检查报告
  - 修复安全问题的 commits
**预估耗时：** 3小时
**可并行：** 否

---

### STEP-094: 内测准备
**前置条件：** STEP-093完成
**执行：**
  1. 创建 5-10 个测试用户账号
  2. 准备内测反馈表单（Google Form 或内嵌表单）
  3. 编写内测指引：
     - 3 个测试任务（电商、SaaS、内容站各一个）
     - 每个任务的操作步骤
     - 反馈重点（易用性、生成质量、响应速度）
  4. 在平台中添加 "反馈" 入口按钮
  5. 邀请内测 PM 用户
**验证：**
  - 测试账号可正常登录
  - 反馈表单可提交
  - 内测指引清晰完整
**产出：**
  - 内测用户账号
  - 内测指引文档
  - 反馈收集机制
**预估耗时：** 2小时
**可并行：** 否

---

### STEP-095: Phase 1最终验收
**前置条件：** STEP-094完成
**执行：**
  1. 逐项确认 Phase 1 出口标准（引用 15.2.4）：
     - [ ] 端到端流程可用：PM输入需求 -> 确认功能地图 -> AI生成代码 -> 质量关卡 -> 部署预览 -> 引导式验收
     - [ ] 3 个不同类型项目成功走完全流程（电商、SaaS 工具、内容站）
     - [ ] 单项目从需求到预览 < 60 分钟（20 页面/50 API 级别）
     - [ ] 质量关卡自动通过率 > 70%（首次生成即通过）
     - [ ] 预览部署成功率 > 90%
     - [ ] 5-10 个内测 PM 用户完成测试并收集反馈
  2. 整理 Phase 1 成果清单
  3. 整理已知问题和技术债
  4. 制定 Phase 2 衔接计划
**验证：**
  - 所有出口标准全部满足
  - 成果清单完整
  - 技术债清单已记录
**产出：**
  - Phase 1 最终验收报告
  - 已知问题/技术债清单
  - Phase 2 衔接建议
**预估耗时：** 2小时
**可并行：** 否（Phase 1 终点）

---

## 附录A：步骤依赖关系图

```
阶段一（骨架）：
STEP-001 → STEP-002 → STEP-003 → STEP-004 → STEP-005 → STEP-006 → STEP-008 → STEP-012 → STEP-013 → STEP-014 → STEP-015
                                                    │                                          ↑
                                  STEP-001 → STEP-007（可并行）                               │
                                  STEP-004 → STEP-009 → STEP-010                              │
                                  STEP-004 → STEP-011（可并行）                                │
                                                                                               │
阶段二（UI）：                                                                                 │
STEP-005/006 → STEP-016 → STEP-017 → STEP-034                                                │
                    │                                                                          │
                    ├→ STEP-018 → STEP-019 → STEP-020 → STEP-021 ─┐                          │
                    │       │                                       │                          │
                    │       ├→ STEP-022 → STEP-023 → STEP-024 ─┐   │                          │
                    │       │       │                            │   │                          │
                    │       │       └→ STEP-025（可并行）       │   │                          │
                    │       │                                    │   │                          │
                    │       │   STEP-023+025 → STEP-026 → STEP-027 → STEP-028                 │
                    │       │                                                │                  │
                    │       ├→ STEP-029（需WebSocket，可并行）              │                  │
                    │       │                                                │                  │
                    │       └→ STEP-030 → STEP-031 → STEP-032              │                  │
                    │                                          │            │                  │
                    │                                          └── STEP-033 ┘→ STEP-035       │
                    │                                                                          │
阶段三（AI引擎）：                                                                             │
STEP-006 → STEP-036 → STEP-037（可与038并行）                                                 │
                    → STEP-038（可并行）                                                       │
           STEP-037+038 → STEP-039                                                             │
                    │                                                                          │
STEP-040（可并行） → STEP-041 → STEP-042                                                     │
STEP-040 → STEP-043 → STEP-044 → STEP-045                                                    │
STEP-040 → STEP-046（可并行）→ STEP-047 → STEP-048 → STEP-049 → STEP-050                    │
STEP-005 → STEP-051 → STEP-052 → STEP-053 → STEP-054                                        │
                                                    │                                          │
                                          STEP-055（AI引擎验证）                              │
                                                                                               │
阶段四（Pipeline+部署）：                                                                      │
STEP-048 → STEP-056 → STEP-057 → STEP-058 → STEP-059                                        │
STEP-059 → STEP-060 → STEP-061 → STEP-062 → STEP-063 → STEP-064                             │
STEP-064 → STEP-065                                                                           │
STEP-064 → STEP-066（可并行）                                                                 │
STEP-064 → STEP-067（可并行）                                                                 │
STEP-064 → STEP-068（可并行）                                                                 │
STEP-060 → STEP-069（可并行）                                                                 │
           STEP-065+066+067+068+069 → STEP-070                                                │
                                                                                               │
阶段五（验收+集成）：                                                                          │
STEP-062 → STEP-071 → STEP-072 → STEP-073 → STEP-074 → STEP-075 → STEP-076                 │
STEP-076 → STEP-077 / STEP-078（可并行） / STEP-079（可并行）                                │
STEP-077 → STEP-080                                                                           │
STEP-035 → STEP-081（可并行）                                                                 │
STEP-077 → STEP-082（可并行）                                                                 │
STEP-064 → STEP-083 → STEP-084                                                               │
STEP-077~084 → STEP-085                                                                       │
                                                                                               │
阶段六（收尾）：                                                                               │
STEP-085 → STEP-086 → STEP-087                                                               │
STEP-003 → STEP-088（可并行）                                                                 │
STEP-007 → STEP-089（可并行）                                                                 │
STEP-015 → STEP-090 → STEP-091 → STEP-092 → STEP-093 → STEP-094 → STEP-095               │
```

## 附录B：可并行步骤汇总

| 并行组 | 步骤 | 说明 |
|--------|------|------|
| P-1 | STEP-007, STEP-009, STEP-011 | 配置文件和基础设施（与类型定义并行） |
| P-2 | STEP-016（前端Stores）与 STEP-008~015（后端） | 前后端基础并行 |
| P-3 | STEP-019~021（对话面板）与 STEP-022~028（功能地图） | 两个面板并行开发 |
| P-4 | STEP-025（边组件）与 STEP-023~024（节点组件） | 功能地图子组件并行 |
| P-5 | STEP-029（进度面板）与 STEP-030~032（验收面板） | 右侧面板并行 |
| P-6 | STEP-036~039（AI Adapter）与 STEP-040、STEP-043、STEP-046（Prompt设计） | Adapter实现与Prompt设计并行 |
| P-7 | STEP-037（Claude）与 STEP-038（DeepSeek） | 两个Adapter并行实现 |
| P-8 | STEP-051~053（翻译层）与 STEP-036~050（AI引擎主线） | 翻译层独立开发 |
| P-9 | STEP-065, STEP-066, STEP-067, STEP-068, STEP-069 | 部署阶段的多个独立子系统 |
| P-10 | STEP-077, STEP-078, STEP-079 | 三个场景的E2E测试并行 |
| P-11 | STEP-080, STEP-081, STEP-082 | 三个方向的优化/修复并行 |
| P-12 | STEP-086, STEP-088, STEP-089, STEP-090 | 收尾阶段多项独立工作并行 |

## 附录C：关键里程碑检查点

| 检查点 | 对应步骤 | 验证内容 |
|--------|---------|---------|
| M-1: 项目骨架完成 | STEP-015 | 数据库 + API + 种子数据全部工作 |
| M-2: UI框架完成 | STEP-035 | 三栏布局 + 所有面板渲染正确 |
| M-3: 需求对话可用 | STEP-042 | PM输入需求 -> AI追问 -> 需求文档 |
| M-4: 功能地图可用 | STEP-045 | 需求 -> 功能地图生成 + 修改 |
| M-5: 代码生成可用 | STEP-050 | 功能地图 -> 逐节点生成代码 |
| M-6: 质量关卡可用 | STEP-059 | 代码 -> 自动检查 + 修复 |
| M-7: 预览部署可用 | STEP-064 | 代码 -> 构建 -> 部署 -> 预览URL |
| M-8: 验收可用 | STEP-076 | 截图 + 问题 + 反馈 + 修复循环 |
| M-9: E2E验证通过 | STEP-085 | 3种场景全流程跑通 |
| M-10: Phase 1交付 | STEP-095 | 生产部署 + 内测 + 最终验收 |
