# PM Builder -- 第12-13章：技术架构与成本模型

> **文档版本：** v0.4-draft
> **创建日期：** 2026-04-07
> **依赖文档：** product-spec-dag-builder.md v0.3（第13章 PM-Centric Pivot）
> **范围：** 纯Web版技术架构（替代v0.1的Electron架构）+ 修正版成本模型

---

## 第12章：技术架构（纯Web版）

### 12.1 五层架构总览

v0.3将产品形态从Electron桌面应用转为纯Web应用。架构从三层（GUI/Engine/Storage）扩展为五层，新增业务翻译层和Pipeline编排层，同时后端从"无服务器端"变为完整的服务端架构。

```
┌─────────────────────────────────────────────────────────────────────┐
│  Layer 1: PM GUI                                                     │
│  Next.js 15 (App Router) + React 19 + ReactFlow                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ │
│  │ 功能地图   │ │ 看板视图   │ │ 对话面板   │ │ 验收面板+实时预览   │ │
│  │(ReactFlow) │ │(Kanban)   │ │(NL Chat)  │ │(截图+是否题)        │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 2: Business Translation Layer (翻译层)                        │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ │
│  │ 技术→业务  │ │ 状态翻译器 │ │ 进度流    │ │ 验收引擎            │ │
│  │ 名称映射   │ │(状态机转换)│ │(实时日志) │ │(清单+引导+反馈)     │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 3: Pipeline Orchestrator (流水线编排)                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ │
│  │ 质量关卡   │ │ 测试引擎   │ │ 自动修复器 │ │ 部署引擎+截图生成   │ │
│  │(lint/type) │ │(三层防线)  │ │(AI修代码) │ │(CF Pages+Playwright)│ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 4: Core Engine (核心引擎)                                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ │
│  │ DAG引擎    │ │ 执行引擎   │ │ 上下文    │ │ 版本管理+影响分析   │ │
│  │(拓扑/状态) │ │(调度/并发) │ │ 管理器    │ │(事件溯源)           │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 5: AI Adapter Layer (AI适配层)                                │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────────┐  │
│  │ Claude   │ │ DeepSeek │ │ 通义千问  │ │ Prompt Template Engine│  │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ (语义→模型格式)       │  │
│  └─────────┘ └──────────┘ └──────────┘ └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

  ↕ WebSocket / REST / SSE

┌─────────────────────────────────────────────────────────────────────┐
│  Infrastructure Layer (基础设施)                                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ │
│  │ PostgreSQL │ │ Redis     │ │ Cloudflare│ │ BullMQ              │ │
│  │ (主数据库) │ │ (缓存)    │ │ R2 (对象) │ │ (任务队列)          │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**层间通信协议：**

| 通信路径 | 协议 | 原因 |
|---------|------|------|
| PM GUI <-> API Server | REST + WebSocket | REST用于CRUD，WebSocket用于Pipeline实时状态推送 |
| API Server <-> Pipeline执行器 | BullMQ (Redis) | 长时间运行任务需要异步解耦 |
| Pipeline执行器 <-> AI Adapter | HTTP/SSE | AI Provider API调用，SSE用于流式输出 |
| Pipeline执行器 <-> Playwright服务 | HTTP内部RPC | 截图请求/响应 |
| 前端实时更新 | WebSocket + Server-Sent Events | Pipeline进度、节点状态变更 |

### 12.2 纯Web架构设计

#### 12.2.1 前端技术栈

```
Next.js 15 (App Router)
├── React 19 (Server Components + Client Components混合)
├── ReactFlow (xyflow) v12 — 功能地图/DAG编辑器
├── Zustand v5 — 客户端状态管理
├── TanStack Query v5 — 服务端状态管理/缓存
├── Tailwind CSS v4 + shadcn/ui — 样式和组件
├── Framer Motion — 节点状态动画（脉冲、旋转等）
└── Socket.io Client — 实时通信
```

**前端关键设计决策：**

| 决策 | 选择 | 理由 |
|------|------|------|
| 渲染策略 | SSR首屏 + CSR交互 | 功能地图等重交互页面CSR；Landing/Dashboard SSR |
| 状态管理 | Zustand(本地) + TanStack Query(远程) | 分离关注点，避免单Store膨胀 |
| 图编辑器 | ReactFlow v12 | React原生、节点可嵌自定义组件、社区最大 |
| 实时通信 | Socket.io | 自动降级(WebSocket→SSE→长轮询)、房间机制(per-project) |
| CSS方案 | Tailwind + shadcn/ui | PM面向的界面需要精细UI，shadcn提供可定制基础组件 |
| 代码编辑器 | **不需要** | PM不看代码。仅在"高级模式"中提供CodeMirror 6只读预览 |

**前端Zustand Store设计（4个独立Store）：**

| Store | 内容 | 持久化 |
|-------|------|--------|
| ProjectStore | 当前项目配置、功能地图节点/边 | 服务端(PostgreSQL) |
| PipelineStore | Pipeline状态、各Phase进度、实时日志流 | 服务端(Redis + PG) |
| UIStore | 面板布局、当前视图(地图/看板/旅程)、缩放级别 | localStorage |
| AcceptanceStore | 验收清单、PM回答记录、截图列表 | 服务端(PostgreSQL) |

#### 12.2.2 后端服务架构

纯Web版需要完整的后端服务集群。这是与v0.1 Electron版最大的架构差异。

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx / Cloudflare CDN                 │
│                    (反向代理 + 静态资源)                   │
└───────────┬─────────────────┬───────────────────────────┘
            │                 │
     ┌──────▼──────┐   ┌─────▼──────────────────┐
     │  Next.js    │   │  WebSocket Gateway      │
     │  API Routes │   │  (Socket.io Server)     │
     │  (主API)    │   │  (实时推送)              │
     └──────┬──────┘   └─────┬──────────────────┘
            │                 │
     ┌──────▼─────────────────▼──────────────────┐
     │          Shared Service Layer               │
     │  ┌─────────┐ ┌──────────┐ ┌────────────┐  │
     │  │ AuthSvc │ │ProjectSvc│ │ BillingSvc │  │
     │  └─────────┘ └──────────┘ └────────────┘  │
     └──────┬─────────────────┬──────────────────┘
            │                 │
     ┌──────▼──────┐   ┌─────▼──────────────────┐
     │  BullMQ     │   │  Pipeline Workers       │
     │  Queue      │   │  (长时间运行任务)        │
     │  (Redis)    │   │  - CodeGenWorker        │
     └─────────────┘   │  - QualityGateWorker    │
                        │  - TestWorker           │
                        │  - DeployWorker         │
                        │  - ScreenshotWorker     │
                        └─────┬──────────────────┘
                              │
                 ┌────────────▼────────────────┐
                 │     External Services        │
                 │  ┌────────┐ ┌────────────┐  │
                 │  │AI APIs │ │Playwright  │  │
                 │  │(Claude │ │(Headless   │  │
                 │  │DSeek..)│ │Chrome Pool)│  │
                 │  └────────┘ └────────────┘  │
                 └─────────────────────────────┘
```

**四个后端服务详细设计：**

##### 服务1: API服务器（Next.js API Routes）

```typescript
// 技术选择：Next.js 15 API Routes (App Router)
// 不使用独立Express——减少部署单元，利用Next.js的SSR/API统一部署

// 路由结构
/api/
  /auth/          — 认证 (NextAuth.js v5)
  /projects/      — 项目CRUD
  /dag/           — DAG节点/边操作
  /pipeline/      — Pipeline启动/停止/状态查询
  /acceptance/    — 验收流程API
  /ai/            — AI调用代理入口
  /billing/       — 计费和用量统计
  /webhooks/      — 外部回调(Cloudflare Pages部署完成等)
```

**API Server职责边界：**
- 处理所有同步请求（CRUD、查询、认证）
- 将长时间任务（Pipeline执行、AI调用）推入BullMQ队列
- 不直接调用AI API（通过队列委派给Worker）
- 负责WebSocket连接管理和消息广播

##### 服务2: Pipeline执行器（BullMQ Workers）

```typescript
// 每个Worker是独立进程，可水平扩展
// 使用BullMQ的Flow机制编排多步Pipeline

interface PipelineJob {
  projectId: string;
  triggeredBy: 'user_start' | 'auto_fix' | 'acceptance_retry';
  phases: PipelinePhase[];
  currentPhase: number;
  checkpoint: {
    phaseId: string;
    snapshotId: string;  // Cloudflare R2中的快照key
  };
}

// Worker类型和并发配置
const workers = {
  'code-gen':       { concurrency: 3,  timeout: 300_000 },  // 5分钟/节点
  'quality-gate':   { concurrency: 5,  timeout: 60_000 },   // 1分钟/步
  'test-runner':    { concurrency: 2,  timeout: 180_000 },  // 3分钟/套件
  'deploy':         { concurrency: 1,  timeout: 120_000 },  // 2分钟
  'screenshot':     { concurrency: 3,  timeout: 30_000 },   // 30秒/页
  'ai-call':        { concurrency: 5,  timeout: 90_000 },   // 90秒/调用
};
```

**Pipeline执行器的关键设计：**

1. **检查点机制：** 每个Phase完成后自动创建快照到R2，Pipeline中断后可从任意Phase恢复
2. **熔断器：** 单步3次失败 -> 暂停Pipeline -> 通知PM -> 等待决策或自动降级
3. **进度广播：** 每个操作完成后通过Redis Pub/Sub推送到WebSocket Gateway，前端实时更新
4. **资源隔离：** 每个项目的Pipeline在独立的BullMQ Flow中运行，互不影响

##### 服务3: Playwright截图服务

```typescript
// 独立的Headless Chrome服务池
// 职责：为验收环节生成页面截图、执行E2E测试

interface ScreenshotService {
  // 浏览器池配置
  pool: {
    minInstances: 2;       // 最少保持2个预热的浏览器
    maxInstances: 10;      // 峰值10个并行浏览器
    idleTimeout: 300_000;  // 5分钟无请求释放实例
    pageTimeout: 15_000;   // 单页面加载超时15秒
  };

  // 截图API
  capture(url: string, options: {
    viewport: { width: 1280, height: 720 };
    fullPage: boolean;
    waitFor: 'networkidle' | 'domcontentloaded';
    elements?: string[];   // CSS选择器，截取特定元素
  }): Promise<{
    screenshotUrl: string; // R2存储URL
    metrics: { loadTime: number; firstPaint: number };
  }>;

  // E2E测试执行
  runE2ETest(testScript: string, baseUrl: string): Promise<{
    passed: boolean;
    trace: string;         // Playwright Trace文件URL
    screenshots: string[]; // 各步骤截图
  }>;
}
```

**截图服务部署方案：**
- 小规模（<50项目）：与主服务同机部署，Playwright as library
- 中规模（50-200项目）：独立容器，Docker + Chrome预装镜像
- 大规模（200+项目）：Browserless.io或自建Playwright Grid

##### 服务4: AI调用代理

```typescript
// 统一管理所有AI Provider的调用
// 关键功能：rate limit、故障转移、成本追踪、缓存

interface AIProxy {
  // Provider注册
  providers: Map<string, {
    adapter: AIAdapter;         // LiteLLM风格的统一接口
    rateLimit: {
      rpm: number;              // 每分钟请求数
      tpm: number;              // 每分钟token数
      concurrent: number;       // 最大并发
    };
    circuitBreaker: {
      failureThreshold: 3;      // 连续3次失败触发熔断
      cooldownMs: 300_000;      // 熔断冷却5分钟
      halfOpenAfter: 60_000;    // 1分钟后尝试半开
    };
    costPerMToken: {
      input: number;            // 输入每百万token价格(USD)
      output: number;           // 输出每百万token价格(USD)
    };
  }>;

  // 调用入口（统一接口）
  call(request: {
    projectId: string;
    nodeId: string;
    model: string;              // "claude-sonnet-4" | "deepseek-v3" | ...
    messages: Message[];
    maxTokens: number;
    stream: boolean;
    budget: {                   // 预算控制
      remainingUsd: number;
      maxCostForThisCall: number;
    };
    idempotencyKey: string;     // 幂等性键
  }): Promise<AIResponse>;

  // 成本追踪
  getCostReport(projectId: string): {
    totalUsd: number;
    byProvider: Record<string, number>;
    byPhase: Record<string, number>;
    byNode: Record<string, number>;
  };
}
```

**AI代理的关键设计：**

1. **令牌桶限流：** 每个Provider独立的令牌桶，防止超限被ban
2. **智能路由：** 简单任务（lint修复）自动路由到便宜模型，复杂任务（架构设计）路由到强模型
3. **响应缓存：** 基于`(prompt_hash, model)`缓存AI响应到Redis，TTL 24小时，避免重复调用
4. **成本原子计数器：** Redis INCRBYFLOAT实现原子成本扣减，解决并行执行的TOCTOU问题
5. **幂等性：** 支持Anthropic Idempotency-Key，OpenAI用自建缓存层实现

#### 12.2.3 数据库设计（PostgreSQL）

**从SQLite迁移到PostgreSQL的原因：**

| 维度 | SQLite (v0.1 Electron) | PostgreSQL (v0.3 Web) |
|------|----------------------|---------------------|
| 多租户 | 不支持（每用户一个文件） | 原生Row-Level Security |
| 并发写入 | WAL模式单写入者 | MVCC高并发 |
| 全文搜索 | 有但弱 | pg_trgm + GIN索引 |
| JSON查询 | json_extract | jsonb + GIN索引 |
| 连接池 | 不需要 | PgBouncer |
| 托管 | 用户本地 | Supabase/Neon/自托管 |

**核心表设计（12张）：**

```sql
-- 1. 用户和租户
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  plan        TEXT DEFAULT 'free',  -- free/pro/team/enterprise
  api_keys    JSONB DEFAULT '{}',   -- 加密存储的用户API Key
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. 项目
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT,
  config      JSONB NOT NULL,       -- ProjectConfig (技术栈、AI配置等)
  status      TEXT DEFAULT 'draft', -- draft/building/preview/live
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. DAG节点（业务节点 + 底层技术节点）
CREATE TABLE nodes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,       -- feature/page/flow/data/connect/rule/milestone
  label         TEXT NOT NULL,       -- PM语言的标签
  description   TEXT,
  status        TEXT DEFAULT 'pending',
  assigned_model TEXT,
  group_id      UUID,                -- 所属NodeGroup
  position      JSONB,               -- {x, y} 画布坐标
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  INDEX idx_nodes_project (project_id),
  INDEX idx_nodes_status (project_id, status)
);

-- 4. DAG边
CREATE TABLE edges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_node   UUID REFERENCES nodes(id) ON DELETE CASCADE,
  target_node   UUID REFERENCES nodes(id) ON DELETE CASCADE,
  type          TEXT DEFAULT 'hard', -- hard/soft/reference
  transform     JSONB,               -- ContextTransform配置
  INDEX idx_edges_project (project_id)
);

-- 5. 节点执行记录（不可变日志）
CREATE TABLE node_executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         UUID REFERENCES nodes(id) ON DELETE CASCADE,
  triggered_by    TEXT NOT NULL,
  ai_model        TEXT NOT NULL,
  prompt_hash     TEXT NOT NULL,
  tokens_in       INTEGER NOT NULL,
  tokens_out      INTEGER NOT NULL,
  cost_usd        NUMERIC(10,6) NOT NULL,
  duration_ms     INTEGER NOT NULL,
  status          TEXT NOT NULL,      -- success/error/partial
  error_message   TEXT,
  output_snapshot JSONB,              -- 输出摘要（完整输出在R2）
  created_at      TIMESTAMPTZ DEFAULT now(),
  INDEX idx_executions_node (node_id, created_at DESC)
);

-- 6. 生成的文件记录
CREATE TABLE file_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES projects(id) ON DELETE CASCADE,
  path              TEXT NOT NULL,
  source_node_id    UUID REFERENCES nodes(id),
  source_execution  UUID REFERENCES node_executions(id),
  content_hash      TEXT NOT NULL,
  size_bytes        INTEGER,
  r2_key            TEXT NOT NULL,    -- Cloudflare R2中的存储key
  user_modified     BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, path)
);

-- 7. Pipeline执行记录
CREATE TABLE pipeline_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id),
  status        TEXT DEFAULT 'running', -- running/paused/completed/failed/cancelled
  current_phase TEXT,
  phases_log    JSONB DEFAULT '[]',     -- 每个Phase的开始/结束/状态
  total_cost    NUMERIC(10,4) DEFAULT 0,
  total_tokens  BIGINT DEFAULT 0,
  started_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  INDEX idx_pipeline_project (project_id, started_at DESC)
);

-- 8. 验收记录
CREATE TABLE acceptance_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES projects(id),
  pipeline_run   UUID REFERENCES pipeline_runs(id),
  feature_name   TEXT NOT NULL,
  step_index     INTEGER NOT NULL,
  question       TEXT NOT NULL,
  pm_answer      TEXT,                -- yes/no/null(未回答)
  screenshot_url TEXT,
  pm_feedback    TEXT,                -- PM说"不对"时的详细反馈
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 9. DAG事件日志（事件溯源）
CREATE TABLE dag_events (
  id          BIGSERIAL PRIMARY KEY,  -- 单调递增序列号
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  payload     JSONB NOT NULL,
  inverse     JSONB NOT NULL,         -- 撤销数据
  author      TEXT NOT NULL,          -- user/ai
  created_at  TIMESTAMPTZ DEFAULT now(),
  INDEX idx_events_project (project_id, id)
);

-- 10. DAG快照
CREATE TABLE dag_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  snapshot_data   JSONB NOT NULL,     -- 完整DAG快照
  event_id_at     BIGINT,            -- 对应的最后一个event id
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, version)
);

-- 11. 成本追踪
CREATE TABLE cost_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id),
  user_id       UUID REFERENCES users(id),
  pipeline_run  UUID REFERENCES pipeline_runs(id),
  phase         TEXT NOT NULL,
  provider      TEXT NOT NULL,
  model         TEXT NOT NULL,
  tokens_in     INTEGER NOT NULL,
  tokens_out    INTEGER NOT NULL,
  cost_usd      NUMERIC(10,6) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  INDEX idx_cost_project (project_id, created_at),
  INDEX idx_cost_user (user_id, created_at)
);

-- 12. 依赖清单
CREATE TABLE dependency_manifests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  package_name  TEXT NOT NULL,
  version       TEXT,
  added_by_node UUID REFERENCES nodes(id),
  registry      TEXT,                 -- npm/pypi/go
  verified      BOOLEAN DEFAULT false,
  UNIQUE(project_id, package_name)
);
```

#### 12.2.4 缓存策略（Redis）

```
Redis用途分布：

1. Pipeline状态 (Hash)
   key: pipeline:{projectId}:state
   fields: currentPhase, progress, lastUpdate
   TTL: 无（Pipeline完成后清理）

2. AI响应缓存 (String)
   key: ai-cache:{promptHash}:{model}
   value: 压缩的AI响应JSON
   TTL: 86400 (24小时)
   命中率预估: 15-25%（重试、修复循环场景）

3. Rate Limit计数器 (Sorted Set)
   key: ratelimit:{provider}:{minute}
   members: 请求时间戳
   用途: 滑动窗口限流

4. 成本原子计数器 (String)
   key: budget:{projectId}:remaining
   操作: INCRBYFLOAT（原子扣减）
   用途: 解决并行执行的TOCTOU问题

5. WebSocket房间管理 (Set)
   key: ws:room:{projectId}
   members: socketId列表
   用途: 按项目广播Pipeline进度

6. 熔断器状态 (Hash)
   key: circuit:{provider}
   fields: state(closed/open/half-open), failures, lastFailure
   TTL: 900 (15分钟)
```

**Redis内存预估：**

| 数据类型 | 单项目大小 | 100项目总计 |
|---------|----------|-----------|
| Pipeline状态 | ~2KB | ~200KB |
| AI缓存（100条/项目） | ~500KB | ~50MB |
| Rate Limit | ~10KB | ~1MB |
| 成本计数 | ~100B | ~10KB |
| WebSocket房间 | ~1KB | ~100KB |
| **总计** | — | **~52MB** |

结论：128MB Redis实例足够支撑200个并发项目。

#### 12.2.5 对象存储（Cloudflare R2）

```
R2存储结构：

/{project_id}/
  /code/                          -- 生成的代码文件
    /{node_id}/{execution_id}/    -- 按执行版本归档
      src/components/Login.tsx
      src/api/auth.ts
      ...
  /screenshots/                   -- Playwright截图
    /{pipeline_run_id}/
      login-page-1280x720.png
      dashboard-full.png
      ...
  /snapshots/                     -- Pipeline检查点快照
    /phase-2-checkpoint.json
    /phase-4-checkpoint.json
  /exports/                       -- 项目导出ZIP
    /export-2026-04-07.zip
  /prompts/                       -- 完整prompt记录（调试用）
    /{execution_id}.txt
```

**R2存储成本预估：**

| 项目规模 | 存储量/项目 | R2成本/月 |
|---------|-----------|----------|
| 小项目（10节点） | ~5MB | $0.00 (免费额度内) |
| 中项目（50节点） | ~50MB | $0.00 |
| 大项目（125节点） | ~200MB | $0.003 |
| 100个中项目总计 | ~5GB | $0.075 |

R2的免费额度（10GB存储 + 1000万次读取）在500项目以下基本免费。

#### 12.2.6 消息队列（BullMQ）

```typescript
// BullMQ队列设计——基于Redis的任务调度

// 队列定义
const queues = {
  // 主Pipeline队列——编排7个Phase的顺序执行
  'pipeline': {
    defaultJobOptions: {
      attempts: 1,            // Pipeline级不重试，由内部Phase处理
      backoff: { type: 'fixed', delay: 0 },
      removeOnComplete: 100,  // 保留最近100条完成记录
      removeOnFail: 200,      // 保留最近200条失败记录
    }
  },

  // 代码生成队列——每个节点一个Job
  'code-gen': {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },  // 2s, 4s, 8s
      timeout: 300_000,       // 5分钟超时
    },
    concurrency: 3,           // 最多3个节点同时生成
  },

  // AI调用队列——所有AI调用统一入队
  'ai-call': {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      timeout: 90_000,
    },
    concurrency: 5,           // 5个并发AI调用
    rateLimiter: {
      max: 60,                // 每分钟最多60次
      duration: 60_000,
    }
  },

  // 截图队列
  'screenshot': {
    defaultJobOptions: {
      attempts: 2,
      timeout: 30_000,
    },
    concurrency: 3,
  },

  // 部署队列
  'deploy': {
    defaultJobOptions: {
      attempts: 2,
      timeout: 120_000,
    },
    concurrency: 1,           // 单项目串行部署
  },
};
```

**BullMQ Flow编排示例（一次完整Pipeline）：**

```typescript
// Phase 2-7的Flow定义
const pipelineFlow = {
  name: 'pipeline',
  data: { projectId, pipelineRunId },
  children: [
    {
      name: 'phase-2-codegen',
      queueName: 'code-gen',
      data: { projectId, nodes: topologicalOrder },
      children: [{
        name: 'phase-3-quality',
        queueName: 'quality-gate',
        data: { projectId },
        children: [{
          name: 'phase-4-testing',
          queueName: 'test-runner',
          data: { projectId, layers: [1, 2, 3] },
          children: [{
            name: 'phase-5-deploy-preview',
            queueName: 'deploy',
            data: { projectId, env: 'preview' },
            children: [{
              name: 'phase-5-screenshots',
              queueName: 'screenshot',
              data: { projectId, pages: allPages },
              // Phase 6(验收)和Phase 7(上线)需要PM交互
              // 不在Flow中自动执行，由API Server控制
            }]
          }]
        }]
      }]
    }
  ]
};
```

### 12.3 存储策略（云端版）

#### 12.3.1 数据分层存储

| 数据类型 | 存储位置 | 访问模式 | 备份策略 |
|---------|---------|---------|---------|
| 项目元数据(DAG/配置) | PostgreSQL | 高频读写 | 每日自动备份 |
| 节点执行历史 | PostgreSQL | 写入追加，偶尔查询 | 随PG备份 |
| Pipeline实时状态 | Redis | 极高频读写，短生命周期 | 不备份（可重建） |
| AI响应缓存 | Redis | 高频读，24小时过期 | 不备份 |
| 代码文件内容 | Cloudflare R2 | 低频读写，按需加载 | R2自带冗余 |
| 截图/资源 | Cloudflare R2 | 验收时读取 | R2自带冗余 |
| 项目导出ZIP | Cloudflare R2 | 用户下载时读取 | 30天后自动清理 |
| Prompt完整记录 | Cloudflare R2 | 调试时按需读取 | 90天后归档 |

#### 12.3.2 数据生命周期

```
项目创建 ──→ 活跃开发期 ──→ 上线运维期 ──→ 归档期 ──→ 删除

活跃期（默认30天）：
  - 所有数据实时可访问
  - AI缓存保持热态
  - Pipeline状态实时

上线后（90天内）：
  - 代码文件保留在R2
  - 执行历史保留在PG
  - AI缓存过期清理
  - 截图保留（可用于后续迭代对比）

归档期（90天-1年）：
  - PG中仅保留项目元数据和最终DAG快照
  - 历史执行记录迁移到R2冷存储
  - 截图清理

删除（1年后或用户主动删除）：
  - 所有数据物理删除（GDPR合规）
  - R2对象删除
  - PG记录删除
```

### 12.4 WebContainer的能力边界

v0.3使用WebContainer（StackBlitz WebContainer API）作为浏览器内实时预览的运行时。需要清楚其能力边界。

#### 12.4.1 WebContainer能做什么

| 能力 | 状态 | 说明 |
|------|------|------|
| Node.js运行时 | 完全支持 | 浏览器内运行完整Node.js |
| npm install | 完全支持 | 安装npm包（有限缓存） |
| 前端开发服务器 | 完全支持 | Vite/Next.js dev server |
| HTTP服务器 | 完全支持 | Express/Fastify等 |
| 文件系统 | 虚拟FS | 内存中的虚拟文件系统 |
| 子进程 | 有限支持 | 支持spawn但有限制 |
| WebSocket | 支持 | 浏览器内WebSocket |

#### 12.4.2 WebContainer不能做什么

| 限制 | 影响 | 应对方案 |
|------|------|---------|
| **无原生二进制执行** | 不能跑Python、Go、Rust | Docker沙箱（见12.5） |
| **无真实网络IO** | 不能连外部数据库/API | Mock数据 + Service Worker拦截 |
| **无C++ addon** | bcrypt、sharp等不可用 | 纯JS替代（bcryptjs、sharp-wasm） |
| **内存限制~2GB** | 大型项目可能OOM | 限制同时预览的页面数 |
| **无持久存储** | 刷新页面数据丢失 | 所有状态同步到服务端 |
| **仅支持Chrome/Edge** | Safari/Firefox兼容性差 | 展示浏览器要求提示 |
| **WASM文件大（~30MB）** | 首次加载慢 | CDN缓存 + Service Worker预缓存 |

#### 12.4.3 WebContainer在PM Builder中的使用场景

```
PM Builder中WebContainer的角色 = 实时预览层，不是执行层

Pipeline执行在服务端（BullMQ Workers + Docker）
WebContainer仅用于：
  1. 前端页面预览（PM看截图前的实时渲染）
  2. 简单API测试（Mock数据下的前后端联调）
  3. 交互式验收（PM直接在浏览器内操作预览版本）

不用WebContainer做：
  1. 代码生成——由服务端AI Worker执行
  2. 测试运行——由服务端Docker沙箱执行
  3. 正式部署——由Cloudflare Pages/Railway执行
  4. 非Node.js项目预览——由Docker沙箱执行
```

### 12.5 多语言支持方案

#### 12.5.1 语言支持矩阵

| 语言/框架 | 代码生成 | 实时预览 | 测试执行 | 部署 |
|----------|---------|---------|---------|------|
| **Node.js (Next/React/Vue)** | 服务端AI | WebContainer | 服务端Docker | Cloudflare Pages |
| **Python (FastAPI/Django)** | 服务端AI | Docker沙箱 | 服务端Docker | Railway |
| **Go (Gin/Echo)** | 服务端AI | Docker沙箱 | 服务端Docker | Railway |
| **静态HTML/CSS** | 服务端AI | WebContainer | 不需要 | Cloudflare Pages |

#### 12.5.2 Docker沙箱设计（非Node.js语言）

```typescript
// 预构建的语言基础镜像
const languageImages = {
  'python-fastapi': {
    image: 'pmbuilder/python-sandbox:3.12',
    preinstalled: ['fastapi', 'uvicorn', 'pytest', 'ruff'],
    memoryLimit: '512m',
    cpuLimit: '1.0',
    networkMode: 'none',        // 默认无网络（安全）
    timeout: 300_000,           // 5分钟
  },
  'go-gin': {
    image: 'pmbuilder/go-sandbox:1.22',
    preinstalled: ['gin', 'gorm'],
    memoryLimit: '512m',
    cpuLimit: '1.0',
    networkMode: 'none',
    timeout: 300_000,
  },
};

// 沙箱执行流程
// 1. 从R2拉取项目代码文件
// 2. 挂载到Docker容器的/workspace
// 3. 执行命令（测试/构建/预览）
// 4. 收集输出（stdout/stderr/生成文件）
// 5. 销毁容器

// 资源限制（安全硬限）
const sandboxLimits = {
  maxContainers: 20,            // 平台级同时最多20个沙箱
  perProject: 2,                // 单项目最多2个沙箱
  diskQuota: '100m',            // 100MB磁盘
  pidsLimit: 50,                // 最多50个进程
  readOnlyRootfs: true,         // 根文件系统只读
  noNewPrivileges: true,        // 不允许提权
};
```

#### 12.5.3 预览方案选择逻辑

```
用户创建项目时选择技术栈
    ↓
if (技术栈 === 'Node.js系') {
    预览方式 = WebContainer (浏览器内，秒级启动)
    PM看到: 内嵌iframe实时预览
} else if (技术栈 === 'Python/Go') {
    预览方式 = Docker沙箱 (服务端，10-30秒启动)
    PM看到: 内嵌iframe指向临时URL
} else if (纯静态) {
    预览方式 = WebContainer (最快)
    PM看到: 内嵌iframe
}

所有方式对PM表现一致——iframe内嵌预览 + 自动截图
PM不需要知道底层是WebContainer还是Docker
```

### 12.6 安全架构

#### 12.6.1 认证与授权

```
认证: NextAuth.js v5
  - 邮箱+密码 (Argon2哈希)
  - OAuth: GitHub / Google / 微信
  - Session: JWT (HttpOnly Cookie)

授权: 基于角色的行级安全
  - Owner: 完全控制
  - Editor: 编辑DAG、触发Pipeline
  - Viewer: 只读
  - PostgreSQL RLS策略强制执行
```

#### 12.6.2 API Key安全

```
PM的AI API Key处理：

方案1: Pass-through模式（PM自带Key）
  - Key在前端输入后，AES-256-GCM加密存储到PG
  - 解密仅在AI Proxy Worker中进行
  - Key永远不出现在日志、快照、导出文件中
  - 前端展示时用****遮罩
  - 定期提醒PM检查Key有效性

方案2: AI代理模式（PM不需要Key）
  - 平台统一使用平台API Key调用
  - 费用由平台承担，转嫁到订阅价格中
  - PM完全无感知
  - 详见第13章定价方案对比
```

#### 12.6.3 代码沙箱安全

```
AI生成的代码运行在沙箱中，安全措施：
1. 网络隔离: Docker networkMode=none（默认）
2. 文件系统隔离: readOnlyRootfs + 限定挂载目录
3. 资源限制: CPU 1核、内存512MB、磁盘100MB、进程50个
4. 路径穿越防护: 所有文件路径jail check
5. 安全扫描: Semgrep静态分析在代码生成后、运行前执行
6. 超时强杀: 硬超时后SIGKILL容器
```

### 12.7 部署架构

#### 12.7.1 自托管部署（Docker Compose）

```yaml
# docker-compose.yml — 完整的自托管方案
version: '3.8'

services:
  # 主Web应用（Next.js）
  web:
    image: pmbuilder/web:latest
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://redis:6379
      R2_ENDPOINT: ...
    depends_on: [postgres, redis]

  # Pipeline Workers
  workers:
    image: pmbuilder/workers:latest
    environment:
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://redis:6379
    deploy:
      replicas: 2  # 可按需扩展

  # Playwright截图服务
  screenshots:
    image: pmbuilder/screenshots:latest
    environment:
      CHROME_PATH: /usr/bin/chromium
    deploy:
      resources:
        limits:
          memory: 2G

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: pmbuilder

  # Redis
  redis:
    image: redis:7-alpine
    volumes: ["redisdata:/data"]

volumes:
  pgdata:
  redisdata:
```

#### 12.7.2 云部署方案（推荐）

| 组件 | 服务 | 月成本预估 |
|------|------|----------|
| Web + API | Vercel (Next.js) 或 Railway | $0-20 |
| Workers | Railway (Container) | $5-25 |
| PostgreSQL | Supabase Pro 或 Neon | $0-25 |
| Redis | Upstash Serverless | $0-10 |
| R2 | Cloudflare R2 | $0-1 |
| Playwright | Railway Container | $5-15 |
| **总计** | — | **$10-96** |

#### 12.7.3 扩展策略

```
阶段1 (1-50用户): 单机 Docker Compose
  - 1台4C8G服务器 ($20-40/月)
  - PG + Redis + Workers同机
  - 够用

阶段2 (50-500用户): 服务分离
  - Web: Vercel自动扩展
  - Workers: 2-4 Railway容器
  - PG: Supabase Pro ($25/月)
  - Redis: Upstash
  - Playwright: 独立容器

阶段3 (500-5000用户): 水平扩展
  - Workers: Kubernetes + HPA
  - PG: 读写分离 + 连接池
  - Redis Cluster
  - Playwright Grid (自建)
  - CDN: Cloudflare Pro
```

---

## 第13章：成本模型（修正版）

### 13.1 AI调用成本精确计算

#### 13.1.1 基础假设

基于v0.3 PM版的完整Pipeline（7个Phase），以中等项目为基准进行精确计算。

**中等项目定义：**
- 20个页面 + 50个API端点
- DAG: 约125个底层技术节点（PM视角约20-25个业务节点）
- 技术栈: Next.js + FastAPI + PostgreSQL

**每节点平均Token消耗（实测基准）：**

根据第12.6节的Token预算分析（每节点约15,570 token），对125个节点进行精确计算：

```
每节点Token构成：
  固定开销 (system + config + glossary + rules)     = 1,850 tokens
  直接前驱full output (平均2.5个 × 2,000)           = 5,000 tokens
  间接前驱摘要 (平均3个 × 500)                       = 1,500 tokens
  远程前驱metadata (平均5个 × 50)                    = 250 tokens
  已生成文件路径列表                                  = 400 tokens
  ────────────────────────────────────────────────────
  输入小计                                           = 9,000 tokens
  预留输出 (1-3文件, 100-300行)                       = 4,500 tokens
  ────────────────────────────────────────────────────
  单节点总计（输入+输出）                             ≈ 13,500 tokens

  靠前节点（少量前驱）                                ≈ 8,000 tokens
  靠后节点（多层前驱）                                ≈ 18,000 tokens
  加权平均                                           ≈ 13,500 tokens
```

**注意：** 原规格书中估算的15,570 tokens是"第15-20个节点"的典型值。对125节点项目取加权平均后，略低于该值，因为前20%的节点上下文较少。

#### 13.1.2 逐环节Token消耗

| 环节 | 节点/调用数 | 平均Token/次 | 总Token | 计算过程 |
|------|-----------|------------|---------|---------|
| **Phase 1: 需求分析** | | | | |
| - 需求澄清对话 | 5轮 | 4,000 | 20,000 | 5轮×(2K输入+2K输出) |
| - DAG架构生成 | 1次 | 50,000 | 50,000 | 完整需求→125节点DAG |
| **Phase 2: 代码生成** | | | | |
| - 逐节点代码生成 | 125节点 | 13,500 | 1,687,500 | 125×13,500 |
| **Phase 3: 质量关卡** | | | | |
| - AI自动修复(lint/type) | ~30次修复 | 6,000 | 180,000 | 约25%节点需修复×6K |
| **Phase 4: 测试** | | | | |
| - Layer 1同源自测 | 125节点 | 5,000 | 625,000 | 每节点生成测试(3K)+执行分析(2K) |
| - Layer 2交叉验证 | 30关键节点 | 8,000 | 240,000 | 关键路径节点的独立测试 |
| - 测试修复循环 | ~40次 | 8,000 | 320,000 | 约30%测试首次失败，平均修2轮 |
| **Phase 5: 部署** | | | | |
| - 构建配置生成 | 3次 | 5,000 | 15,000 | Dockerfile+CI+部署脚本 |
| **Phase 6: 验收** | | | | |
| - 翻译层摘要 | 25业务节点 | 2,000 | 50,000 | 技术→业务翻译 |
| - 修复循环(PM反馈) | ~5次 | 12,000 | 60,000 | PM说"不对"后的定位+修复 |
| **Phase 7: 上线** | | | | |
| - 部署检查+健康验证 | 3次 | 3,000 | 9,000 | 部署清单生成+验证 |
| **────────** | **────** | **────** | **────────** | |
| **总计** | | | **3,256,500** | ≈ **3.26M tokens** |

**与原规格书对比：** 原13.13节估算为1.8M tokens，修正后为3.26M。差异来源：
1. 原文按50 API估算代码生成，实际125个底层节点消耗更高（+900K）
2. 测试修复循环被低估（原500K → 实际960K总测试相关）
3. 翻译层和验收修复未充分计入（+110K）

#### 13.1.3 P50/P95/P99三档分布

基于上述基准值，考虑实际运行的方差：

| 分位 | 总Token消耗 | 倍数 | 说明 |
|------|-----------|------|------|
| **P50（中位数）** | 3.26M | 1.0x | 大多数项目的正常消耗 |
| **P95** | 5.54M | 1.7x | 高修复率项目（测试失败率50%+，PM 3轮修改） |
| **P99** | 8.14M | 2.5x | 极端情况（架构返工+大规模测试重写+多轮验收） |

**P95的额外消耗来源：**
```
测试修复循环加倍:                +320K (40次→80次)
Phase 3修复加倍:                 +180K (30次→60次)
PM验收修复增加:                  +120K (5次→15次)
上下文膨胀(后期节点更长):         +540K (平均+30%)
AI输出冗余(偶尔输出无关内容):     +120K
────────────────────────────
P95额外:                        +1,280K → 总计4.54M
再加安全边际×1.2:                5.54M
```

**P99的额外消耗来源：**
```
P95基础上:                       5.54M
架构级返工(重新生成30%节点):     +1,000K
Layer 2交叉测试扩展到80%节点:    +400K
反复验收(5轮PM确认):             +200K
模型降级重试(主模型超时切备用):   +300K
────────────────────────────
P99:                             ≈ 7.44M
再加安全边际×1.1:                8.14M
```

#### 13.1.4 不同AI Provider价格对比

按2026年4月主流模型定价（每百万token价格，USD）：

| 模型 | 输入价格 | 输出价格 | P50成本 | P95成本 | P99成本 |
|------|---------|---------|---------|---------|---------|
| **Claude Sonnet 4** | $3.00 | $15.00 | $36.36 | $61.82 | $90.84 |
| **Claude Haiku 3.5** | $0.80 | $4.00 | $9.70 | $16.49 | $24.23 |
| **GPT-4o** | $2.50 | $10.00 | $26.10 | $44.37 | $65.20 |
| **GPT-4o-mini** | $0.15 | $0.60 | $1.57 | $2.67 | $3.92 |
| **DeepSeek V3** | $0.27 | $1.10 | $2.85 | $4.85 | $7.13 |
| **通义千问-Plus** | $0.57 | $1.70 | $4.74 | $8.06 | $11.85 |
| **DeepSeek R1** | $0.55 | $2.19 | $5.73 | $9.74 | $14.32 |
| **Claude Opus 4** | $15.00 | $75.00 | $181.80 | $309.06 | $454.20 |

**计算公式：**
```
成本 = (输入token × 输入价格 + 输出token × 输出价格) / 1,000,000

其中：
  输入token ≈ 总token × 0.65 (65%是上下文输入)
  输出token ≈ 总token × 0.35 (35%是AI生成输出)

示例（Claude Sonnet 4, P50）:
  输入: 3,260,000 × 0.65 = 2,119,000 tokens → $3.00 × 2.119 = $6.36
  输出: 3,260,000 × 0.35 = 1,141,000 tokens → $15.00 × 1.141 = $17.12
  总计: $6.36 + $17.12 ≈ $23.47
  
  实际修正（Phase 4测试输出比例更高 → 输出占比约42%）:
  输入: 3,260,000 × 0.58 = 1,890,800 → $5.67
  输出: 3,260,000 × 0.42 = 1,369,200 → $20.54
  修正总计: $26.21

  再加重试/降级冗余(×1.15): $30.14
  四舍五入: ≈ $30 (表中取$36是更保守估计，含buffer)
```

**推荐模型分配策略（成本优化）：**

| 任务类型 | 推荐模型 | 原因 |
|---------|---------|------|
| 需求理解+架构设计(Phase 1) | Claude Sonnet 4 | 需要最强理解和规划能力 |
| 代码生成(Phase 2) | DeepSeek V3 | 代码能力强+价格低 |
| 质量修复(Phase 3) | DeepSeek V3 | 简单修复不需要强模型 |
| 测试生成(Phase 4 Layer 1) | DeepSeek V3 | 批量生成，价格敏感 |
| 交叉验证(Phase 4 Layer 2) | Claude Haiku 3.5 | 需要不同模型打破同源闭环 |
| 翻译层(Phase 6) | GPT-4o-mini | 简单文本翻译 |
| 修复循环(所有Phase) | 原生成模型 | 保持上下文一致性 |

**混合模型的P50成本估算：**

| 环节 | Token | 模型 | 成本 |
|------|-------|------|------|
| Phase 1 | 70K | Sonnet 4 | $0.76 |
| Phase 2 | 1,688K | DeepSeek V3 | $4.78 |
| Phase 3 | 180K | DeepSeek V3 | $0.51 |
| Phase 4 L1 | 625K | DeepSeek V3 | $1.77 |
| Phase 4 L2 | 240K | Haiku 3.5 | $0.71 |
| Phase 4修复 | 320K | DeepSeek V3 | $0.91 |
| Phase 5 | 15K | DeepSeek V3 | $0.04 |
| Phase 6 | 110K | 4o-mini | $0.07 |
| Phase 7 | 9K | DeepSeek V3 | $0.03 |
| **总计** | **3,257K** | **混合** | **$9.58** |

**结论：** 混合模型策略将P50成本从$36（纯Sonnet）或$30（纯DeepSeek V3单价但Sonnet能力）降低到约$10，降幅73%。这是定价策略的关键输入。

### 13.2 部署托管成本

#### 13.2.1 平台侧基础设施成本

平台需要承担的固定和可变成本（不含AI调用）：

**固定基础设施成本：**

| 服务 | 方案 | 月成本 | 说明 |
|------|------|--------|------|
| Web托管(Next.js) | Vercel Pro | $20 | 含自定义域名+分析 |
| Worker进程(×2) | Railway | $10 | 2个容器，每个512MB |
| PostgreSQL | Supabase Pro | $25 | 8GB数据库，自动备份 |
| Redis | Upstash Pro | $10 | 256MB，10K cmd/day |
| Cloudflare R2 | Pay-as-go | $0-5 | 10GB免费额度 |
| Playwright容器 | Railway | $10 | 1个2GB容器 |
| 域名+CDN | Cloudflare Free | $0 | |
| 监控(Sentry) | Developer | $0 | |
| **月固定总计** | | **$75-80** | |

**按用户规模的边际成本：**

| 规模段 | 月活项目数 | 基础设施月成本 | 每项目边际成本 | 说明 |
|--------|----------|-------------|-------------|------|
| **种子期 (1-5项目)** | 1-5 | $80 | $16-80 | 固定成本摊不薄 |
| **早期 (10-50项目)** | 10-50 | $120 | $2.40-12 | Worker扩到3个(+$5), PG够用 |
| **成长期 (50-200项目)** | 50-200 | $250 | $1.25-5 | PG升级($50), Redis升级($20), Worker×4($20) |
| **规模期 (200-500项目)** | 200-500 | $500 | $1-2.50 | 全面升级，Playwright Grid |
| **成熟期 (500+项目)** | 500+ | $1,200+ | $1-2.40 | K8s集群，读写分离PG |

#### 13.2.2 自托管PostgreSQL vs Supabase成本对比

| 维度 | 自托管PG (VPS上Docker) | Supabase Pro | Supabase Team |
|------|---------------------|-------------|--------------|
| 月成本 | VPS $5-20 (含PG) | $25 | $599 |
| 存储 | VPS磁盘空间 | 8GB | 100GB |
| 备份 | 自行配置pg_dump | 每日自动 | 每日+时间点恢复 |
| 连接数 | 无限制 | 50直连 + Pooler | 200直连 + Pooler |
| RLS | 自行配置 | 内置UI | 内置UI |
| Auth | 自建 | 内置Supabase Auth | 内置 |
| 监控 | 自行配置 | 仪表盘 | 仪表盘+告警 |
| 运维负担 | 高（升级/调优/安全补丁） | 零 | 零 |
| **推荐场景** | **成本敏感的早期阶段** | **50-500项目** | **500+或企业** |

**决策建议：**
- 0-50项目（种子/早期）：自托管PG（$5 VPS），省$20/月
- 50-500项目（成长/规模期）：Supabase Pro，运维成本 > $25
- 500+或企业：Supabase Team或AWS RDS

#### 13.2.3 用户侧项目托管成本（每个PM项目部署后的运行成本）

PM的项目部署后产生的持续托管成本：

| 服务 | 免费额度 | 超出后价格 | 说明 |
|------|---------|----------|------|
| Cloudflare Pages (前端) | 无限带宽 | $0 | 静态站点免费 |
| Railway (后端API) | $5免费额度 | $0.005/小时 | 最小容器约$5/月 |
| Supabase (数据库) | 500MB + 50K MAU | $25/月起 | Free tier够demo/内部工具 |
| **低流量项目/月** | | **$0-5** | 全部在免费额度内 |
| **中流量项目/月** | | **$7-15** | Railway + Supabase Free |
| **高流量项目/月** | | **$25-50** | Railway Pro + Supabase Pro |

#### 13.2.4 规模化后的边际成本优化方案

```
优化1: AI响应缓存 (节省15-25%的AI调用)
  - 相似项目的相同类型节点(如"用户登录")命中缓存
  - 修复循环中的重试命中缓存
  - 预估节省: 100个项目/月 × $10/项目 × 20% = $200/月

优化2: 模板预生成 (节省30-50%的Phase 2成本)
  - 高频模板(CRUD应用、电商基础版)预先生成代码骨架
  - PM选择模板后只需要AI填充业务逻辑，减少70%节点的AI调用
  - 预估节省: $3-5/项目 → 100项目节省$300-500/月

优化3: 批量AI调用折扣
  - 年付API额度（Anthropic/OpenAI批量折扣通常15-25%）
  - DeepSeek/通义的企业协议价通常更低
  - 预估节省: 10-20%总AI成本

优化4: 智能模型降级
  - 对简单节点(config/style)使用最便宜的模型
  - 对重复性修复(lint fix)使用本地规则引擎而非AI
  - 估计20%的AI调用可以替换为规则引擎，节省$2/项目

优化5: Playwright截图共享
  - 相似页面布局的截图可以复用（仅diff区域重新截取）
  - 减少60%的截图调用，节省Playwright计算资源
```

### 13.3 定价策略（三个方案对比）

#### 13.3.1 方案A：平台费 + 托管费分离

```
用户付费结构:
  1. 平台订阅费 = 功能使用权
  2. 托管费 = 项目部署后的运行费用
  3. AI费用 = 用户自带API Key (Pass-through)

定价表:
┌──────────┬─────────┬────────────────┬──────────────────┐
│ 层级     │ 月费    │ 包含内容        │ 限制              │
├──────────┼─────────┼────────────────┼──────────────────┤
│ Free     │ $0      │ 1项目, 15节点   │ 仅预览,不能部署   │
│ Pro      │ $19/月  │ 5项目, 无限节点  │ 自带API Key       │
│ Team     │ $49/人月│ Pro + 协作      │ 5人起             │
│ Enterprise│ 定制    │ 私有化部署      │ 年付              │
└──────────┴─────────┴────────────────┴──────────────────┘

托管费（可选，部署后才收）:
  - 每项目: $0(CF Pages免费) + $5-7(Railway后端)
  - 平台代收托管费并加10%管理费
  - 或用户自行配置托管（高级用户）

用户总费用示例（Pro + 1个中等项目）:
  平台费: $19
  AI费用: ~$10 (自带Key, DeepSeek混合模型)
  托管费: ~$7 (Railway)
  ──────────
  总计: ~$36/月
```

**优点：**
- 平台不承担AI成本波动风险
- 定价透明，用户理解每部分费用
- 利润可预测（平台费是纯利润）

**缺点：**
- PM需要理解API Key、托管等技术概念
- 获客门槛高（Free tier不能完整体验）
- 3个费用来源让PM困惑

#### 13.3.2 方案B：AI代收 + 托管费

```
用户付费结构:
  1. 平台订阅费 = 功能使用权 + AI调用额度
  2. 托管费 = 项目部署后的运行费用
  3. AI超额 = 超出额度后按量付费

定价表:
┌──────────┬──────────┬──────────────────┬──────────────────┐
│ 层级     │ 月费      │ AI额度           │ 超额价格          │
├──────────┼──────────┼──────────────────┼──────────────────┤
│ Free     │ $0       │ $2 AI额度(1次)    │ 不可超额          │
│ Starter  │ $29/月   │ $15 AI额度(1-2项) │ $0.015/1K token   │
│ Pro      │ $79/月   │ $50 AI额度(5项)   │ $0.012/1K token   │
│ Team     │ $149/人月│ $100 AI额度/人    │ $0.010/1K token   │
│ Enterprise│ 定制     │ 定制              │ 定制              │
└──────────┴──────────┴──────────────────┴──────────────────┘

AI额度换算（混合模型P50）:
  $15额度 ≈ 1.5个中等项目 (每项目~$10)
  $50额度 ≈ 5个中等项目
  $100额度 ≈ 10个中等项目

用户总费用示例（Pro + 3个中等项目/月）:
  平台费(含$50 AI额度): $79
  超额AI: $0 (3×$10=$30 < $50额度)
  托管费: ~$15 (3个项目)
  ──────────
  总计: ~$94/月

加价率:
  平台采购AI成本: ~$30 (混合模型)
  向用户收取: $50额度
  AI部分毛利: 40%
```

**优点：**
- PM不需要理解API Key（平台代管）
- 一站式体验，减少摩擦
- Free tier可以完整体验1次（$2够试1个小项目）
- AI加价带来额外利润

**缺点：**
- 平台承担AI成本波动风险（模型涨价/汇率变化）
- 需要更大的启动资金（垫付AI费用）
- 超额计费增加计费系统复杂度

#### 13.3.3 方案C：按项目计费（无月费）

```
用户付费结构:
  1. 按项目一次性付费 = 创建+构建+部署一个项目
  2. 托管费 = 项目上线后持续运行（月付）
  3. 无月费，无订阅

定价表:
┌──────────────┬──────────┬────────────────┬──────────────────┐
│ 项目规模     │ 一次性费用 │ 包含内容        │ 每次迭代费用      │
├──────────────┼──────────┼────────────────┼──────────────────┤
│ 小 (<10节点) │ $9       │ 全流程构建1次   │ $3/次             │
│ 中 (10-50)   │ $29      │ 全流程构建1次   │ $9/次             │
│ 大 (50-125)  │ $69      │ 全流程构建1次   │ $19/次            │
│ 超大 (125+)  │ $149     │ 全流程构建1次   │ $39/次            │
└──────────────┴──────────┴────────────────┴──────────────────┘

迭代 = PM对已构建项目提出修改→AI重新执行受影响的Pipeline阶段

用户总费用示例（1个中等项目 + 3次迭代 + 3个月托管）:
  项目费: $29
  迭代费: $9 × 3 = $27
  托管费: $7 × 3 = $21
  ──────────
  总计: $77（3个月内）

平台利润:
  收入: $29 + $27 = $56 (不含托管费)
  AI成本: $10(首次) + $5×3(迭代，约50%节点重做) = $25
  毛利: $56 - $25 = $31 (毛利率55%)
```

**优点：**
- 对PM最直观："这个项目花多少钱"
- 无订阅压力，适合低频使用（一年做2-3个项目的PM）
- 与"AI项目外包"直接对标（$29 vs $5000）
- 获客成本最低（免试用门槛）

**缺点：**
- 收入不可预测（无订阅基础）
- 高频用户（月做5+项目）成本高于订阅制
- "按项目"难以精确定义（节点数是人为阈值）
- 迭代定价争议（用户觉得"小改动为什么这么贵"）

#### 13.3.4 三方案对比矩阵

| 维度 | 方案A (分离) | 方案B (AI代收) | 方案C (按项目) |
|------|-------------|---------------|---------------|
| PM理解难度 | 高（3个费用来源） | 中（2个费用来源） | 低（1个费用） |
| 需要API Key | 是 | 否 | 否 |
| 获客门槛 | 高 | 中 | 最低 |
| 平台AI风险 | 无 | 有 | 有 |
| 收入可预测性 | 高（订阅） | 高（订阅） | 低（按需） |
| 高频用户体验 | 好（固定月费） | 好（有额度） | 差（累计高） |
| 低频用户体验 | 差（闲置月也收费） | 差（同左） | 最好（不用不付） |
| 竞品对标 | SaaS标准 | Lovable模式 | AI外包替代 |
| 适合阶段 | 成长期 | 种子/早期 | 验证期 |
| **推荐得分** | 6/10 | **8/10** | 7/10 |

**推荐策略：** 方案B(AI代收)作为主力定价，同时提供方案C(按项目)作为补充入口。

理由：
1. 目标用户是PM，不应该接触API Key
2. 方案B的$29 Starter定价让PM可以"花$29试一个项目"
3. 方案C作为Landing Page的CTA——"$29做一个完整项目"
4. 用户从方案C转化到方案B订阅（当月做2个项目时订阅更划算）

### 13.4 盈亏分析

#### 13.4.1 方案A盈亏计算

**平台费是纯利润（AI费用由用户自担）：**

| 指标 | 10用户 | 50用户 | 200用户 | 500用户 |
|------|--------|--------|---------|---------|
| 月收入（$19×Pro占比70%） | $133 | $665 | $2,660 | $6,650 |
| 月收入（$49×Team占比20%） | $98 | $490 | $1,960 | $4,900 |
| 月收入（Enterprise占比10%） | $50 | $250 | $1,000 | $2,500 |
| **月总收入** | **$281** | **$1,405** | **$5,620** | **$14,050** |
| 基础设施成本 | $80 | $120 | $250 | $500 |
| **月利润** | **$201** | **$1,285** | **$5,370** | **$13,550** |
| **利润率** | **71%** | **91%** | **96%** | **96%** |
| **盈亏平衡点** | **5个Pro用户** | — | — | — |

方案A盈亏平衡非常快（5个Pro用户即可覆盖$80基础设施），但获客难度高。

#### 13.4.2 方案B盈亏计算

**需要覆盖AI成本 + 基础设施成本：**

假设用户构成：Free 50% / Starter 30% / Pro 15% / Team 5%

| 指标 | 10用户 | 50用户 | 200用户 | 500用户 |
|------|--------|--------|---------|---------|
| **收入** | | | | |
| Free (0%) | $0 | $0 | $0 | $0 |
| Starter ($29 × 30%) | $87 | $435 | $1,740 | $4,350 |
| Pro ($79 × 15%) | $119 | $593 | $2,370 | $5,925 |
| Team ($149 × 5%) | $75 | $373 | $1,490 | $3,725 |
| **月总收入** | **$281** | **$1,401** | **$5,600** | **$14,000** |
| **支出** | | | | |
| 基础设施 | $80 | $120 | $250 | $500 |
| AI成本(付费用户×$8平均) | $40 | $200 | $800 | $2,000 |
| Free用户AI成本($2×50%) | $10 | $50 | $200 | $500 |
| **月总支出** | **$130** | **$370** | **$1,250** | **$3,000** |
| **月利润** | **$151** | **$1,031** | **$4,350** | **$11,000** |
| **利润率** | **54%** | **74%** | **78%** | **79%** |
| **盈亏平衡点** | **6个付费用户** | — | — | — |

**关键假设：**
- 混合模型策略下，平均AI成本$8/付费用户/月（低于$10的P50，因为不是所有用户都做中等项目）
- Free用户的$2额度实际AI成本约$1.5（小项目）
- Free→付费转化率按15%计算
- 30%的AI额度不会被用完（用户做完项目就不再调用）

**AI额度利用率对利润的影响：**

| AI额度利用率 | 平台实际AI支出/用户 | 利润率变化 |
|------------|-------------------|----------|
| 40%（低活跃） | $3.2 | +12% (利润率91%) |
| 60%（正常） | $4.8 | +6% (利润率85%) |
| 80%（高活跃） | $6.4 | 基准 (79%) |
| 100%（全额使用） | $8.0 | -5% (74%) |
| 120%（超额使用） | $9.6 | -9% (70%) |

结论：AI额度利用率在60-80%之间是健康区间。如果长期>90%需要调价或调整额度。

#### 13.4.3 方案C盈亏计算

**按项目计费，收入不稳定：**

假设每月项目数分布：小30% / 中50% / 大15% / 超大5%

| 指标 | 月20项目 | 月100项目 | 月500项目 | 月2000项目 |
|------|---------|----------|----------|-----------|
| **收入** | | | | |
| 小项目 ($9 × 30%) | $54 | $270 | $1,350 | $5,400 |
| 中项目 ($29 × 50%) | $290 | $1,450 | $7,250 | $29,000 |
| 大项目 ($69 × 15%) | $207 | $1,035 | $5,175 | $20,700 |
| 超大项目 ($149 × 5%) | $149 | $745 | $3,725 | $14,900 |
| 迭代费(平均2次/项目) | $180 | $900 | $4,500 | $18,000 |
| **月总收入** | **$880** | **$4,400** | **$22,000** | **$88,000** |
| **支出** | | | | |
| 基础设施 | $80 | $200 | $600 | $1,500 |
| AI成本($7/项目平均) | $140 | $700 | $3,500 | $14,000 |
| AI成本(迭代$4/次) | $160 | $800 | $4,000 | $16,000 |
| **月总支出** | **$380** | **$1,700** | **$8,100** | **$31,500** |
| **月利润** | **$500** | **$2,700** | **$13,900** | **$56,500** |
| **利润率** | **57%** | **61%** | **63%** | **64%** |
| **盈亏平衡点** | **月12个中等项目** | — | — | — |

方案C的利润率天花板较低（约64%），因为每一单都有AI边际成本。但获客容易。

#### 13.4.4 三方案盈亏对比图（200付费用户/月200项目）

```
                   方案A        方案B        方案C
月收入:            $5,620       $5,600       $4,400
月支出:            $250         $1,250       $1,700
月利润:            $5,370       $4,350       $2,700
利润率:            96%          78%          61%
盈亏平衡:          5人          6人          12项目/月
获客难度:          高            中            低

年化利润:          $64,440      $52,200      $32,400
```

### 13.5 Pass-through vs AI代理模式详细对比

#### 13.5.1 问题定义

核心问题：**PM不会（也不想）去获取AI API Key。**

获取Claude API Key的步骤：
1. 访问console.anthropic.com（可能被墙）
2. 注册账户
3. 绑定信用卡
4. 创建API Key
5. 理解什么是API Key、怎么保存

对开发者：5分钟。对PM：可能放弃。

#### 13.5.2 两种模式详细对比

| 维度 | Pass-through (用户自带Key) | AI代理 (平台Key) |
|------|--------------------------|-----------------|
| **用户体验** | | |
| PM操作 | 需要获取+输入API Key | 零操作 |
| 获客摩擦 | 高（Key是注册墙） | 低（注册即用） |
| 费用透明度 | 高（直接看Provider账单） | 中（包含在订阅中） |
| 模型自由度 | 完全（用户选择任意模型） | 受限（平台预配模型） |
| **平台侧** | | |
| AI成本风险 | 零（用户承担） | 有（平台承担） |
| 定价复杂度 | 低（只收平台费） | 高（需要预估+缓冲） |
| 利润率 | 极高（95%+） | 中高（75-80%） |
| 现金流 | 好（先收费后服务） | 差（先垫付AI，后收回） |
| 启动资金 | 低 | 中（需要预付AI额度） |
| **运营** | | |
| 客服负担 | 高（"Key无效"/"被封"/"余额不够"） | 低（用户不接触Key） |
| Key安全 | 有风险（存储用户Key） | 无风险（只有平台Key） |
| 模型切换灵活性 | 低（用户可能只有1家Key） | 高（平台可自由路由） |
| 中国用户 | 难（需要海外信用卡） | 易（平台统一处理） |

#### 13.5.3 混合方案（推荐）

```
默认: AI代理模式
  - 新用户注册即获得AI额度
  - 平台统一管理Provider和Key
  - PM完全无感知
  - 成本已包含在订阅价格中

可选: Pass-through模式（高级设置中）
  - 用户输入自己的API Key
  - 该Key的调用不扣减AI额度
  - 用户获得100%模型自由度
  - 适合有技术背景的PM或开发者用户

切换条件:
  - 用户在"设置→AI配置"中手动开启
  - 输入Key后验证有效性
  - 系统标记该用户的AI调用走Pass-through
  - 用户可以随时切回代理模式

经济模型:
  AI代理用户: 平台收$29-79/月，AI成本$8，净利$21-71
  Pass-through用户: 平台只收$19/月（功能费），净利$19（无AI成本）
  混合占比预估: 80% AI代理 + 20% Pass-through
```

#### 13.5.4 AI代理模式的成本控制

```
风险1: 用户滥用AI额度
  控制: 硬限制——超出额度后暂停，需购买额外额度或升级
  实现: Redis原子计数器实时扣减

风险2: AI模型涨价
  控制: 定价中预留20%缓冲——$50额度的实际AI成本上限$40
  实现: 每季度review定价，必要时调整额度量

风险3: 用户做超大项目吃掉过多额度
  控制: 项目节点数上限（Free 15, Starter 50, Pro 125, Team 200）
  实现: 创建节点时检查额度

风险4: 汇率波动（AI按美元计费，中国用户按人民币付费）
  控制: 中国区定价按6.5汇率锁定 + 季度调整
  实现: 分区定价

风险5: 某个Provider突然下线
  控制: 至少配置2个fallback Provider
  实现: AI Proxy的故障转移链
```

#### 13.5.5 中国市场特殊处理

```
问题: 中国PM更加不可能获取海外AI API Key

解决方案:
1. AI代理模式为中国用户默认且唯一模式
2. 平台AI调用优先路由到国产模型（DeepSeek/通义）
3. 仅在需要强模型时调用Claude（如架构设计Phase 1）
4. 中国区AI成本更低（国产模型价格约为海外的1/5-1/3）

中国区定价:
  Starter: 199元/月 (≈$27)，AI额度等效$15但实际成本仅$4（用国产模型）
  Pro: 499元/月 (≈$68)，AI额度等效$50但实际成本仅$12
  利润率: 比国际版更高（国产模型便宜）

支付方式:
  - 支付宝/微信支付（必须）
  - 对公转账+发票（企业版必须）
  - Apple Pay / 支付宝国际版（海外华人用户）
```

### 13.6 成本模型汇总

#### 13.6.1 单项目全生命周期成本（PM视角）

以方案B(AI代理) + 中等项目(125节点)为例：

```
阶段1: 项目构建
  AI调用 (P50): ~$10 (混合模型)
  时间: ~60-90分钟（含PM参与30-60分钟）
  PM支付: 包含在$79 Pro月费的$50 AI额度中

阶段2: 迭代修改（假设3次）
  每次AI调用: ~$5 (约50%节点受影响)
  3次迭代总计: ~$15
  PM支付: 包含在AI额度中 (累计$25 < $50额度)

阶段3: 持续运行（假设6个月）
  托管费: ~$7/月 × 6 = $42
  PM支付: $42（托管费另计）

────────────────────
PM总支付（6个月）:
  Pro订阅: $79 × 6 = $474 (包含所有AI费用)
  托管费: $42
  总计: $516

对比传统开发:
  外包开发: $5,000 - $20,000
  雇开发者: $4,000 - $8,000/月
  PM Builder: $516 (节省90-97%)
```

#### 13.6.2 平台全年财务预测（方案B，目标200付费用户）

```
年收入:
  Starter (60人 × $29 × 12)     = $20,880
  Pro (30人 × $79 × 12)          = $28,440
  Team (10人 × $149 × 12)        = $17,880
  ──────────────────────────
  年总收入                        = $67,200

年支出:
  基础设施 ($250 × 12)           = $3,000
  AI成本 (100付费 × $8 × 12)     = $9,600
  Free用户AI ($100 × $1.5 × 12)  = $1,800
  ──────────────────────────
  年总支出                        = $14,400

年利润: $52,800
年利润率: 79%

注: 不含人力成本、市场推广、法务等运营费用。
    含这些费用后的盈亏平衡点约在300-400付费用户。
```

---

## 附录D: 成本计算器速查表

### D.1 AI成本速算

```
快速估算公式:

  项目AI成本(USD) ≈ 节点数 × 每节点Token × 模型单价

  其中:
    每节点Token ≈ 13,500 (中等项目加权平均)
    Pipeline额外开销 ≈ 节点数 × 7,000 (测试+修复+翻译)
    总Token ≈ 节点数 × 20,500

  示例:
    50节点 × 20,500 × $0.0027/1K(DeepSeek混合) ≈ $2.77
    125节点 × 20,500 × $0.0027/1K ≈ $6.92
    加安全边际 ×1.4: $9.69 ≈ $10

速算表:
  10节点:  ~$1.5 (DeepSeek混合) | ~$5 (Sonnet 4)
  50节点:  ~$3   | ~$15
  125节点: ~$10  | ~$36
  200节点: ~$15  | ~$55
```

### D.2 托管成本速算

```
前端(Cloudflare Pages): $0 (几乎所有规模)
后端(Railway最小容器): $5/月
数据库(Supabase Free): $0 (<500MB)
数据库(Supabase Pro): $25/月 (>500MB)

速算:
  Demo/内部工具: $0-5/月
  中流量SaaS: $5-15/月
  高流量SaaS: $30-50/月
```

### D.3 定价决策树

```
PM问: "做一个项目多少钱?"

→ 如果PM只做1个项目:
    推荐方案C: $29(中等项目) + $7/月托管 = $36首月

→ 如果PM每月做2+个项目:
    推荐方案B Starter: $29/月(含AI额度给2个小项目)

→ 如果PM每月做5+个项目:
    推荐方案B Pro: $79/月(含AI额度给5个中等项目)

→ 如果是团队(3+人):
    推荐方案B Team: $149/人/月

→ 如果PM有技术背景且想控制成本:
    推荐方案A Pro: $19/月 + 自带DeepSeek Key(~$3/项目)
```
