# FIX-BEFORE-START: 执行前必须应用的修复清单

> **版本：** v1.0
> **创建日期：** 2026-04-07
> **定位：** AI agent 在开始 STEP-001 之前，必须先逐条执行本文件中的修复。
> **修复数量：** 24 项（致命/高危）
> **总预估代码量：** ~1500 行修正

---

## 执行规则

1. 按 FIX-001 到 FIX-024 **顺序执行**（部分修复有依赖关系）
2. 每条修复包含：**问题描述**、**影响的文件和行号**、**修复后的精确代码或命令**
3. 修复完成后，在对应的执行方案文件中标注 `<!-- FIXED by FIX-XXX -->`

---

## FIX-001: 统一技术栈版本决策

**问题：** `01-ui-framework.md` 第4行声明 "Next.js 14"，与其他文件（MASTER-SEQUENCE, 00-project-init）的 "Next.js 15" 矛盾。`00-project-init.md` 第39行声明 `tailwindcss (4.x)` + 第40行 `@tailwindcss/postcss`，但 shadcn/ui 最新稳定版和 `tailwind.config.ts` 配置语法均基于 Tailwind CSS v3。

**决策：** Next.js 15 + Tailwind CSS 3.4（非v4）+ @xyflow/react v12 + Supabase JS Client（非 Prisma）

### 修复 1a: `01-ui-framework.md` 第4行

```
// 原文
> **技术栈：** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand + ReactFlow + react-resizable-panels

// 改为
> **技术栈：** Next.js 15 (App Router) + TypeScript + Tailwind CSS 3.4 + Zustand + @xyflow/react v12 + react-resizable-panels
```

### 修复 1b: `00-project-init.md` 第39-40行

```
// 原文
- tailwindcss (4.x)
- @tailwindcss/postcss

// 改为
- tailwindcss (^3.4.17)
```

删除 `@tailwindcss/postcss` 这一行。

### 修复 1c: `00-project-init.md` 安装命令（第122行区域）

在生产依赖安装命令中，确保 tailwindcss 版本锁定为 v3：

```bash
cd C:/Projects/mixia-builder

# 如果 create-next-app 安装了 tailwindcss v4，先降级：
npm install tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20

# 其余生产依赖（合并为一条完整命令）
npm install \
  @xyflow/react@^12.6.0 \
  zustand@^5.0.3 \
  @tanstack/react-query@^5.75.0 \
  class-variance-authority@^0.7.1 \
  clsx@^2.1.1 \
  tailwind-merge@^3.0.2 \
  lucide-react@^0.487.0 \
  @radix-ui/react-dialog@^1.1.7 \
  @radix-ui/react-dropdown-menu@^2.1.7 \
  @radix-ui/react-tooltip@^1.1.8 \
  @radix-ui/react-tabs@^1.1.3 \
  @radix-ui/react-select@^2.1.7 \
  @radix-ui/react-popover@^1.1.7 \
  @radix-ui/react-avatar@^1.1.3 \
  @radix-ui/react-separator@^1.1.2 \
  @radix-ui/react-slot@^1.1.2 \
  @radix-ui/react-switch@^1.1.3 \
  @radix-ui/react-label@^2.1.2 \
  @radix-ui/react-scroll-area@^1.2.4 \
  @radix-ui/react-toast@^1.2.7 \
  @radix-ui/react-progress@^1.1.2 \
  react-resizable-panels@^2.1.7 \
  framer-motion@^12.6.0 \
  socket.io-client@^4.8.1 \
  socket.io@^4.8.1 \
  @supabase/supabase-js@^2.49.4 \
  @supabase/ssr@^0.6.1 \
  next-auth@^5.0.0-beta.25 \
  @anthropic-ai/sdk@^0.39.0 \
  ai@^4.3.0 \
  @ai-sdk/anthropic@^1.2.0 \
  bullmq@^5.34.8 \
  ioredis@^5.4.2 \
  elkjs@^0.9.3 \
  web-worker@^1.3.0 \
  uuid@^11.1.0 \
  zod@^3.24.3 \
  date-fns@^4.1.0 \
  nanoid@^5.1.3 \
  lodash-es@^4.17.21 \
  geist@^1.3.1 \
  next-themes@^0.4.4 \
  @aws-sdk/client-s3@^3.750.0 \
  pg-format@^1.0.4

# 开发依赖
npm install -D \
  @types/uuid@^10.0.0 \
  @types/lodash-es@^4.17.12 \
  @types/pg-format@^1.0.6 \
  prettier@^3.5.3 \
  prettier-plugin-tailwindcss@^0.6.11 \
  eslint-config-prettier@^10.1.0
```

---

## FIX-002: ReactFlow 包名全局替换

**问题：** `01-ui-framework.md` 中所有 ReactFlow import 使用旧包名 `reactflow`（v11语法），但项目实际安装的是 `@xyflow/react` v12（命名导出，泛型语法不同）。

### 需要修改的位置和修正后代码

**文件：`01-ui-framework.md`**

**位置1: FeatureMapPanel.tsx（约第523-534行）**
```tsx
// 原文
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type NodeTypes,
  type EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';

// 改为
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type NodeTypes,
  type EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
```

**位置2: BusinessNode.tsx（约第634行）**
```tsx
// 原文
import { Handle, Position, type NodeProps } from 'reactflow';

// 改为
import { Handle, Position, type NodeProps } from '@xyflow/react';
```

注意：v12 的 `NodeProps` 泛型语法变化。第708行：
```tsx
// 原文
function BusinessNodeComponent({ id, data }: NodeProps<BusinessNodeData>) {

// 改为（v12中NodeProps已内置泛型支持，此写法仍兼容，无需改动签名）
function BusinessNodeComponent({ id, data }: NodeProps<BusinessNodeData>) {
```

**位置3: BusinessEdge.tsx（约第818-823行）**
```tsx
// 原文
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from 'reactflow';

// 改为
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
```

**位置4: MiniMap.tsx（约第905行）**
```tsx
// 原文
import { MiniMap as ReactFlowMiniMap } from 'reactflow';

// 改为
import { MiniMap as ReactFlowMiniMap } from '@xyflow/react';
```

**位置5: dag-store.ts（约第2017-2022行）**
```ts
// 原文
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

// 改为
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
```

**全局规则：** 在 01-ui-framework.md 中执行全文替换：
- `from 'reactflow'` --> `from '@xyflow/react'`
- `import 'reactflow/dist/style.css'` --> `import '@xyflow/react/dist/style.css'`

---

## FIX-003: 统一文件路径体系

**问题：** 四份文档中文件路径前缀不一致——`01-ui-framework.md` 用 `components/xxx`（无 `src/` 前缀），`02-ai-engine.md` 用 `lib/ai/xxx`（无 `src/` 前缀），`03-deploy-preview.md` 用 `lib/deploy/xxx`（无 `src/` 前缀），而 `00-project-init.md` 和 `MASTER-SEQUENCE.md` 统一使用 `src/` 前缀。

**决策：** 统一使用 `src/` 前缀。修正后的完整目录树：

```
src/
├── app/                                    # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx
│   │   │       ├── map/page.tsx
│   │   │       ├── kanban/page.tsx
│   │   │       ├── journey/page.tsx
│   │   │       ├── acceptance/page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       └── layout.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── projects/
│   │   │   ├── route.ts
│   │   │   └── [projectId]/
│   │   │       ├── route.ts
│   │   │       └── export/route.ts
│   │   ├── dag/
│   │   │   ├── nodes/route.ts
│   │   │   ├── nodes/[nodeId]/route.ts
│   │   │   └── edges/route.ts
│   │   ├── pipeline/
│   │   │   ├── start/route.ts
│   │   │   └── [pipelineId]/
│   │   │       ├── route.ts
│   │   │       ├── pause/route.ts
│   │   │       ├── resume/route.ts
│   │   │       ├── cancel/route.ts
│   │   │       └── recover/route.ts
│   │   ├── acceptance/
│   │   │   ├── start/route.ts
│   │   │   ├── feedback/route.ts
│   │   │   └── status/route.ts
│   │   ├── ai/
│   │   │   ├── conversation/route.ts
│   │   │   └── feature-map/route.ts
│   │   ├── screenshot/capture/route.ts
│   │   └── webhooks/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                                 # shadcn/ui
│   ├── dag/                                # 功能地图
│   │   ├── business-node.tsx
│   │   ├── business-edge.tsx
│   │   ├── feature-map-panel.tsx
│   │   ├── minimap.tsx
│   │   └── dag-toolbar.tsx
│   ├── chat/                               # 对话面板
│   │   ├── conversation-panel.tsx
│   │   ├── message-bubble.tsx
│   │   ├── streaming-message.tsx
│   │   ├── chat-input.tsx
│   │   └── choice-selector.tsx
│   ├── acceptance/                         # 验收面板
│   │   ├── acceptance-panel.tsx
│   │   ├── feature-checklist.tsx
│   │   ├── guided-review.tsx
│   │   ├── problem-locator.tsx
│   │   ├── acceptance-summary.tsx
│   │   ├── screenshot-viewer.tsx
│   │   └── fix-cycle-tracker.tsx
│   ├── pipeline/                           # 进度面板
│   │   ├── progress-panel.tsx
│   │   └── progress-item.tsx
│   ├── layout/                             # 布局
│   │   ├── workbench-layout.tsx
│   │   ├── topbar.tsx
│   │   └── theme-toggle.tsx
│   ├── providers/
│   │   └── theme-provider.tsx
│   └── shared/
│       ├── loading-spinner.tsx
│       └── error-boundary.tsx
│
├── lib/                                    # 核心逻辑（服务端+共享）
│   ├── ai/
│   │   ├── adapter.ts
│   │   ├── providers/
│   │   │   ├── claude.ts
│   │   │   └── deepseek.ts
│   │   ├── rate-limiter.ts
│   │   ├── response-parser.ts
│   │   ├── router.ts
│   │   ├── circuit-breaker.ts
│   │   └── cost-tracker.ts
│   ├── engines/
│   │   ├── requirement-engine.ts
│   │   ├── feature-map-engine.ts
│   │   └── codegen/
│   │       ├── context-manager.ts
│   │       └── execution-orchestrator.ts
│   ├── deploy/
│   │   ├── project-builder.ts
│   │   ├── cloudflare-deployer.ts
│   │   ├── preview-manager.ts
│   │   ├── supabase-provisioner.ts
│   │   ├── build-fixer.ts
│   │   ├── dependency-manager.ts
│   │   └── project-exporter.ts
│   ├── screenshot/
│   │   ├── playwright-pool.ts
│   │   ├── page-capturer.ts
│   │   └── screenshot-storage.ts
│   ├── acceptance/
│   │   ├── acceptance-engine.ts
│   │   ├── checklist-generator.ts
│   │   ├── question-generator.ts
│   │   ├── feedback-parser.ts
│   │   └── fix-loop.ts
│   ├── security/
│   │   ├── semgrep-scanner.ts
│   │   ├── dependency-checker.ts
│   │   └── secret-scanner.ts
│   ├── translation/
│   │   ├── status-translator.ts
│   │   ├── name-mapper.ts
│   │   ├── progress-formatter.ts
│   │   ├── ai-translator.ts
│   │   └── derive-business-status.ts
│   ├── pipeline/
│   │   ├── orchestrator.ts
│   │   ├── phase-runner.ts
│   │   └── checkpoint-manager.ts
│   ├── queue/
│   │   ├── redis.ts
│   │   ├── queues.ts
│   │   └── workers/
│   │       ├── code-gen-worker.ts
│   │       ├── quality-gate-worker.ts
│   │       ├── deploy-worker.ts
│   │       └── screenshot-worker.ts
│   ├── socket/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   ├── events.ts
│   │   └── rooms.ts
│   ├── db/
│   │   ├── client.ts                       # Supabase client singleton
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql
│   │   └── queries/
│   │       ├── projects.ts
│   │       ├── nodes.ts
│   │       └── pipeline.ts
│   ├── auth.ts
│   ├── utils.ts                            # cn() helper
│   └── themes.ts
│
├── stores/
│   ├── conversation-store.ts
│   ├── dag-store.ts
│   ├── pipeline-store.ts
│   ├── ui-store.ts
│   ├── acceptance-store.ts
│   └── index.ts
│
├── hooks/
│   ├── use-socket.ts
│   ├── use-conversation.ts
│   ├── use-pipeline.ts
│   ├── use-acceptance.ts
│   └── use-dag.ts
│
├── types/
│   ├── business-node.ts
│   ├── business-edge.ts
│   ├── project.ts
│   ├── requirement.ts
│   ├── pipeline.ts
│   ├── acceptance.ts
│   ├── ai-adapter.ts
│   ├── code-gen.ts
│   ├── quality-gate.ts
│   ├── deployment.ts
│   ├── websocket-events.ts
│   └── index.ts
│
├── prompts/
│   ├── requirement-clarification.ts
│   ├── requirement-summary.ts
│   ├── feature-map-gen.ts
│   ├── feature-map-modify.ts
│   ├── code-gen-system.ts
│   ├── code-gen-node.ts
│   ├── code-gen-context.ts
│   ├── acceptance-questions.ts
│   ├── translation.ts
│   ├── lint-fix.ts
│   ├── type-fix.ts
│   └── build-fix.ts
│
├── config/
│   ├── site.ts
│   └── ai-models.ts
│
├── services/                               # 前端 API 封装（TanStack Query）
│   ├── api-client.ts
│   ├── project-api.ts
│   ├── dag-api.ts
│   └── conversation-api.ts
│
├── styles/
│   └── globals.css
│
└── middleware.ts
```

**路径修正规则（应用到所有四份文档）：**
- `01-ui-framework.md` 中 `app/layout.tsx` --> `src/app/layout.tsx`
- `01-ui-framework.md` 中 `components/xxx` --> `src/components/xxx`
- `01-ui-framework.md` 中 `stores/xxx` --> `src/stores/xxx`
- `01-ui-framework.md` 中 `lib/utils.ts` --> `src/lib/utils.ts`
- `02-ai-engine.md` 中 `lib/ai/xxx` --> `src/lib/ai/xxx`
- `02-ai-engine.md` 中 `lib/engines/xxx` --> `src/lib/engines/xxx`
- `02-ai-engine.md` 中 `lib/prompts/xxx` --> `src/prompts/xxx`
- `03-deploy-preview.md` 中 `lib/deploy/xxx` --> `src/lib/deploy/xxx`
- `03-deploy-preview.md` 中 `lib/screenshot/xxx` --> `src/lib/screenshot/xxx`
- `03-deploy-preview.md` 中 `lib/acceptance/xxx` --> `src/lib/acceptance/xxx`
- `03-deploy-preview.md` 中 `lib/security/xxx` --> `src/lib/security/xxx`
- `03-deploy-preview.md` 中 `lib/websocket/xxx` --> `src/lib/socket/xxx`
- `03-deploy-preview.md` 中 `app/api/xxx` --> `src/app/api/xxx`

**注意：** `MASTER-SEQUENCE.md` 中 `src/server/services/` 和 `src/server/workers/` 路径也需要统一。决策：去掉 `server/` 层级——
- `src/server/services/ai/` --> `src/lib/ai/`
- `src/server/services/codegen/` --> `src/lib/engines/codegen/`
- `src/server/services/translation/` --> `src/lib/translation/`
- `src/server/services/deploy/` --> `src/lib/deploy/`
- `src/server/services/screenshot/` --> `src/lib/screenshot/`
- `src/server/services/acceptance/` --> `src/lib/acceptance/`
- `src/server/services/pipeline/` --> `src/lib/pipeline/`
- `src/server/workers/` --> `src/lib/queue/workers/`
- `src/server/queue/` --> `src/lib/queue/`
- `src/server/websocket/` --> `src/lib/socket/`
- `src/server/db/` --> `src/lib/db/`

---

## FIX-004: 统一环境变量名

**问题：** 环境变量名在不同文件中不一致：
- `02-ai-engine.md` 第14行和第187-188行用 `CLAUDE_API_KEY`，但 `00-project-init.md` 第690行和 `MASTER-SEQUENCE.md` 第834行用 `ANTHROPIC_API_KEY`
- `03-deploy-preview.md` 第912行用 `CF_ACCOUNT_ID`，但 `00-project-init.md` 第710行用 `CLOUDFLARE_ACCOUNT_ID`

**修正后的完整 `.env.local.example`：**

```bash
# ============================
# Supabase (必须)
# ============================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key

# ============================
# NextAuth.js (必须)
# ============================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-at-least-32-chars-long

# ============================
# AI Provider: Anthropic / Claude (至少配一个)
# ============================
ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key

# ============================
# AI Provider: DeepSeek (可选)
# ============================
# DEEPSEEK_API_KEY=sk-...your-deepseek-key

# ============================
# Redis / BullMQ (必须)
# ============================
REDIS_URL=redis://localhost:6379

# ============================
# Cloudflare (预览部署)
# ============================
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_R2_BUCKET=mixia-builder-storage
CLOUDFLARE_KV_NAMESPACE_ID=your-kv-namespace-id
CLOUDFLARE_PLATFORM_DOMAIN=pmbuilder.com

# ============================
# 截图服务
# ============================
SCREENSHOT_PUBLIC_URL=https://screenshots.pmbuilder.com

# ============================
# 应用配置
# ============================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3001
NODE_ENV=development
```

**需要修正的代码引用：**

`02-ai-engine.md` ClaudeProvider（约第187-188行）：
```ts
// 原文
this.apiKey = process.env.CLAUDE_API_KEY ?? '';
if (!this.apiKey) throw new Error('CLAUDE_API_KEY not set');

// 改为
this.apiKey = process.env.ANTHROPIC_API_KEY ?? '';
if (!this.apiKey) throw new Error('ANTHROPIC_API_KEY not set');
```

`03-deploy-preview.md` 截图API路由（约第912行）：
```ts
// 原文
accountId: process.env.CF_ACCOUNT_ID!,

// 改为
accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
```

同文件（约第913-915行）：
```ts
// 原文
r2BucketName: process.env.R2_BUCKET_NAME!,
r2AccessKeyId: process.env.R2_ACCESS_KEY_ID!,
r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,

// 改为
r2BucketName: process.env.CLOUDFLARE_R2_BUCKET!,
r2AccessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
r2SecretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
```

---

## FIX-005: 统一数据库访问方式

**问题：** `MASTER-SEQUENCE.md` STEP-008（第185-205行）使用 Prisma，STEP-012（第269行）安装 `@auth/prisma-adapter`，但 `00-project-init.md` 依赖列表已改为 Supabase JS Client。`03-deploy-preview.md` 中 `PreviewManager` 和 `SupabaseProvisioner` 使用 raw SQL `db.query()`。

**决策：** Supabase JS Client 用于所有数据库操作。不安装 Prisma。

### 修复 5a: 删除所有 Prisma 引用

`MASTER-SEQUENCE.md` STEP-008（第185-205行）整段替换为：

```
### STEP-008: 配置数据库Schema（Supabase + PostgreSQL）
**前置条件：** STEP-006完成
**执行：**
  1. 在 Supabase Dashboard 创建项目，获取连接信息
  2. 创建 `src/lib/db/client.ts` -- Supabase Client 单例
  3. 创建 `src/lib/db/migrations/001_initial_schema.sql` -- 12 张核心表的 SQL DDL
  4. 在 Supabase SQL Editor 执行初始 migration
  5. 配置 `.env.local` 中的 NEXT_PUBLIC_SUPABASE_URL 和密钥
**验证：**
  - Supabase Client 可连接数据库
  - 所有 12 张表创建成功
  - 基本 CRUD 操作可用
**产出：**
  - `src/lib/db/client.ts`
  - `src/lib/db/migrations/001_initial_schema.sql`
  - `.env.local` 数据库配置
**预估耗时：** 3小时
**可并行：** 否
```

`MASTER-SEQUENCE.md` STEP-012 第269行：
```
// 删除
npm install next-auth@beta @auth/prisma-adapter

// 改为
npm install next-auth@beta @auth/supabase-adapter
```

### 修复 5b: 统一的 Supabase Client 初始化代码

创建 `src/lib/db/client.ts`：

```ts
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ---- 客户端（浏览器 / Client Components）----

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ---- 服务端（Server Components / API Routes / Server Actions）----

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot set cookies
          }
        },
      },
    },
  );
}

// ---- Admin Client（Service Role, 绕过 RLS）----

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

### 修复 5c: `03-deploy-preview.md` 中的 raw SQL 改为 Supabase client 调用

`PreviewManager` 的 `deps.db.query()` 签名改为：

```ts
export interface PreviewManagerDeps {
  supabase: ReturnType<typeof createAdminClient>;
  deployer: { /* ... */ };
}

// 示例：create 方法中
await this.deps.supabase
  .from('preview_deployments')
  .insert({
    tenant_id: record.tenantId,
    hash: record.hash,
    preview_url: record.previewUrl,
    deployment_id: record.deploymentId,
    r2_prefix: record.r2Prefix,
    created_at: record.createdAt,
    status: record.status,
  });

// 示例：getByTenant 方法中
const { data } = await this.deps.supabase
  .from('preview_deployments')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

---

## FIX-006: 补全缺少的依赖包

**问题：** 代码中 import 了以下包但未在 `00-project-init.md` 依赖列表中声明。

**追加安装的包（已合并到 FIX-001c 的安装命令中）：**

| 包名 | 用途 | 引用位置 |
|------|------|---------|
| `geist` | Geist 字体 | `01-ui-framework.md` 第15-16行 |
| `next-themes` | 暗色/亮色切换 | `01-ui-framework.md` 第57行 |
| `@aws-sdk/client-s3` | R2 对象存储 | `MASTER-SEQUENCE.md` STEP-011 第250行 |
| `pg-format` | SQL 标识符转义 | FIX-010 |

验证命令：
```bash
npm ls geist next-themes @aws-sdk/client-s3 pg-format
```

---

## FIX-007: 统一 Tailwind 颜色名

**问题：** `01-ui-framework.md` 组件代码中使用的 Tailwind class 名与 `00-project-init.md` 的 `tailwind.config.ts` 定义不匹配：
- 代码中用 `bg-status-pending-confirm`，配置中定义的是 `status-pending`
- 代码中用 `bg-status-needs-fix`，配置中定义的是 `status-needsfix`
- 代码中用 `bg-surface`，配置中未定义 `surface` 颜色

**修正后的 `tailwind.config.ts` 的 colors 部分：**

```ts
colors: {
  // 业务状态颜色（对应 8 种 BusinessStatus，与 dag-store 的 key 对齐）
  "status-planning": "#9CA3AF",
  "status-designing": "#60A5FA",
  "status-pending-confirm": "#FB923C",    // 修正：与代码 class 名一致
  "status-developing": "#3B82F6",
  "status-previewable": "#A78BFA",
  "status-needs-fix": "#EF4444",          // 修正：与代码 class 名一致
  "status-confirmed": "#22C55E",
  "status-live": "#15803D",

  // 表面色（组件中大量使用 bg-surface）
  surface: "hsl(var(--surface))",

  // 品牌色
  brand: { /* 同原定义不变 */ },

  // shadcn/ui semantic tokens（同原定义不变）
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
  secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
  destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
  muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
  accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
  popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
  card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
},
```

并在 `globals.css` 中添加 `--surface` CSS 变量：

```css
@layer base {
  :root {
    /* ...existing variables... */
    --surface: 0 0% 100%;    /* 亮色模式：白色 */
  }
  .dark {
    /* ...existing variables... */
    --surface: 240 6% 10%;   /* 暗色模式：深灰 */
  }
}
```

同时需要为 Tailwind ring 工具类支持状态颜色。`01-ui-framework.md` BusinessNode 中使用了 `ring-status-planning` 等 class。Tailwind v3 默认支持 `ring-{color}` 只要 `colors` 中定义了对应 key，无需额外配置。

---

## FIX-008: WebSocket 方案修正

**问题：** `MASTER-SEQUENCE.md` STEP-010 和 `03-deploy-preview.md` 试图在 Next.js API Route 中运行 Socket.io Server，但 Next.js App Router 的 API Routes 是无状态的 serverless 函数，不支持 WebSocket upgrade。

**决策：** Socket.io 运行在独立的 Node.js 进程（端口 3001），Next.js 只作为客户端连接。

### 修复 8a: 修正后的服务端代码 `src/lib/socket/server.ts`

```ts
/**
 * 独立的 Socket.io 服务器（不在 Next.js 进程中运行）。
 * 启动方式：node src/lib/socket/server.ts 或通过 docker-compose。
 */
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import type { WsServerToClientEvents, WsClientToServerEvents } from './events';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PORT = parseInt(process.env.WS_PORT || '3001', 10);

async function startWsServer() {
  const io = new Server<WsClientToServerEvents, WsServerToClientEvents>({
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  // Redis adapter for horizontal scaling
  const pubClient = createClient({ url: REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.on('join-project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`[WS] ${socket.id} joined project:${projectId}`);
    });

    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[WS] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  io.listen(PORT);
  console.log(`[WS] Socket.io server listening on port ${PORT}`);

  return io;
}

startWsServer().catch(console.error);

export type { Server };
```

### 修复 8b: 修正后的客户端连接代码 `src/lib/socket/client.ts`

```ts
'use client';

import { io, type Socket } from 'socket.io-client';
import type { WsServerToClientEvents, WsClientToServerEvents } from './events';

let socket: Socket<WsServerToClientEvents, WsClientToServerEvents> | null = null;

export function getSocket(): Socket<WsServerToClientEvents, WsClientToServerEvents> {
  if (!socket) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    socket = io(wsUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

### 修复 8c: docker-compose.yml 增加 ws-server 服务

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  ws-server:
    build:
      context: .
      dockerfile: Dockerfile.ws
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
      - WS_PORT=3001
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis-data:
```

### 修复 8d: 删除 `03-deploy-preview.md` 中的 `app/api/ws/route.ts`

文件清单第23项 `app/api/ws/route.ts`（"WebSocket升级端点"）应删除。WebSocket 不经过 Next.js API Routes。

---

## FIX-009: R2 上传认证修正

**问题：** `03-deploy-preview.md` 中 R2 上传使用自定义 header `X-Custom-Auth-Key`，但 Cloudflare R2 使用 S3 兼容 API，需要 AWS Signature V4 认证。

**修正后的 R2 上传代码（使用 @aws-sdk/client-s3）：**

```ts
// src/lib/deploy/r2-client.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const client = createR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  const client = createR2Client();
  const result = await client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  const chunks: Uint8Array[] = [];
  for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = createR2Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key }),
  );
}

export async function getSignedR2Url(key: string, expiresIn = 3600): Promise<string> {
  const client = createR2Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn },
  );
}
```

`03-deploy-preview.md` 中 `CloudflareDeployer.uploadToR2()` 和 `ScreenshotStorage.upload()` 都需要改用此 R2 client。

---

## FIX-010: SQL 注入修复

**问题：** `03-deploy-preview.md` 的 `SupabaseProvisioner` 中，Schema 名称直接拼接到 SQL 字符串中（第540行 `SET search_path TO ${info.schemaName}`，第556-558行 `DROP SCHEMA IF EXISTS ${info.schemaName} CASCADE`），存在 SQL 注入风险。

**修正：使用 pg-format 转义标识符**

```ts
import format from 'pg-format';

// 第540行
// 原文
await this.deps.db.query(`SET search_path TO ${info.schemaName}, public`, []);

// 改为（使用 %I 转义标识符）
await this.deps.db.query(format('SET search_path TO %I, public', info.schemaName), []);

// 第556行
// 原文
await this.deps.db.query(`DROP SCHEMA IF EXISTS ${info.schemaName} CASCADE`, []);

// 改为
await this.deps.db.query(format('DROP SCHEMA IF EXISTS %I CASCADE', info.schemaName), []);

// 第557行
// 原文
await this.deps.db.query(`DROP ROLE IF EXISTS ${info.roleName}`, []);

// 改为
await this.deps.db.query(format('DROP ROLE IF EXISTS %I', info.roleName), []);
```

---

## FIX-011: 补全 Store 定义

**问题：** 执行方案中引用了 5 个 Store（conversation-store, dag-store, pipeline-store, ui-store, acceptance-store），但 `00-project-init.md` 只列出 4 个（缺少 conversation-store），且各 Store 的接口定义分散在不同文件中，命名不一致。

**统一 Store 清单：**

| Store 文件 | export 名 | 引用来源 |
|-----------|-----------|---------|
| `src/stores/conversation-store.ts` | `useConversationStore` | 01-ui-framework 6.1 |
| `src/stores/dag-store.ts` | `useDagStore` | 01-ui-framework 6.2 |
| `src/stores/pipeline-store.ts` | `usePipelineStore` | 01-ui-framework 6.3 |
| `src/stores/ui-store.ts` | `useUIStore` | 01-ui-framework 6.4 |
| `src/stores/acceptance-store.ts` | `useAcceptanceStore` | 需补充（01-ui-framework 未给出完整定义） |

### 修复 11a: `00-project-init.md` 补充 conversation-store

在目录树和骨架文件列表中添加：
```
touch src/stores/conversation-store.ts
```

### 修复 11b: acceptance-store 完整接口定义

```ts
// src/stores/acceptance-store.ts
import { create } from 'zustand';

export type AcceptanceStep = 'A' | 'B' | 'C' | 'D';

export interface AcceptanceItem {
  id: string;
  featureName: string;
  featureNodeId: string;
  screenshotUrl: string;
  questions: {
    id: string;
    question: string;
    answer: 'yes' | 'no' | null;
  }[];
  status: 'pending' | 'passed' | 'failed' | 'fixing';
  fixAttempts: number;
  pmFeedback: string | null;
}

interface AcceptanceState {
  step: AcceptanceStep;
  items: AcceptanceItem[];
  currentItemIndex: number;
  isLoading: boolean;
  maxFixAttempts: number;
}

interface AcceptanceActions {
  setStep: (step: AcceptanceStep) => void;
  setItems: (items: AcceptanceItem[]) => void;
  setCurrentItemIndex: (index: number) => void;
  answerQuestion: (itemId: string, questionId: string, answer: 'yes' | 'no') => void;
  submitFeedback: (itemId: string, feedback: string) => void;
  markItemStatus: (itemId: string, status: AcceptanceItem['status']) => void;
  incrementFixAttempt: (itemId: string) => void;
  reset: () => void;
}

export const useAcceptanceStore = create<AcceptanceState & AcceptanceActions>(
  (set) => ({
    step: 'A',
    items: [],
    currentItemIndex: 0,
    isLoading: false,
    maxFixAttempts: 3,

    setStep: (step) => set({ step }),
    setItems: (items) => set({ items }),
    setCurrentItemIndex: (index) => set({ currentItemIndex: index }),

    answerQuestion: (itemId, questionId, answer) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                questions: item.questions.map((q) =>
                  q.id === questionId ? { ...q, answer } : q,
                ),
              }
            : item,
        ),
      })),

    submitFeedback: (itemId, feedback) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, pmFeedback: feedback } : item,
        ),
      })),

    markItemStatus: (itemId, status) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, status } : item,
        ),
      })),

    incrementFixAttempt: (itemId) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId
            ? { ...item, fixAttempts: item.fixAttempts + 1 }
            : item,
        ),
      })),

    reset: () =>
      set({ step: 'A', items: [], currentItemIndex: 0, isLoading: false }),
  }),
);
```

---

## FIX-012: 补全缺失的 API 端点

**问题：** MASTER-SEQUENCE 中引用了多个 API 端点但在 `00-project-init.md` 文件清单中只列出了顶级 `route.ts`，缺少子路由。

**完整 API 端点清单（修正版）：**

| 方法 | 路径 | 请求体 | 响应体 | 对应 STEP |
|------|------|--------|--------|----------|
| POST | `/api/auth/[...nextauth]` | NextAuth 处理 | NextAuth 处理 | STEP-012 |
| GET | `/api/projects` | - | `Project[]` | STEP-013 |
| POST | `/api/projects` | `{ name, type, config }` | `Project` | STEP-013 |
| GET | `/api/projects/[projectId]` | - | `Project` | STEP-013 |
| PATCH | `/api/projects/[projectId]` | `Partial<Project>` | `Project` | STEP-013 |
| DELETE | `/api/projects/[projectId]` | - | `{ success: true }` | STEP-013 |
| GET | `/api/projects/[projectId]/export` | - | ZIP binary | STEP-068 |
| GET | `/api/dag/nodes?projectId=X` | - | `BusinessNode[]` | STEP-014 |
| POST | `/api/dag/nodes` | `{ projectId, nodes: NodeData[] }` | `BusinessNode[]` | STEP-014 |
| PATCH | `/api/dag/nodes/[nodeId]` | `Partial<NodeData>` | `BusinessNode` | STEP-014 |
| DELETE | `/api/dag/nodes/[nodeId]` | - | `{ success: true }` | STEP-014 |
| GET | `/api/dag/edges?projectId=X` | - | `Edge[]` | STEP-014 |
| POST | `/api/dag/edges` | `{ projectId, source, target, type }` | `Edge` | STEP-014 |
| DELETE | `/api/dag/edges/[edgeId]` | - | `{ success: true }` | STEP-014 |
| POST | `/api/pipeline/start` | `{ projectId }` | `{ pipelineRunId }` | STEP-049 |
| GET | `/api/pipeline/[pipelineId]` | - | `PipelineRun` | STEP-066 |
| POST | `/api/pipeline/[pipelineId]/pause` | - | `{ success: true }` | STEP-066 |
| POST | `/api/pipeline/[pipelineId]/resume` | - | `{ success: true }` | STEP-066 |
| POST | `/api/pipeline/[pipelineId]/cancel` | - | `{ success: true }` | STEP-066 |
| POST | `/api/pipeline/[pipelineId]/recover` | `{ fromPhase }` | `{ success: true }` | STEP-067 |
| POST | `/api/ai/conversation` | `{ projectId, message }` | SSE stream | STEP-041 |
| POST | `/api/ai/feature-map/generate` | `{ projectId, requirementDoc }` | `{ nodes, edges }` | STEP-044 |
| POST | `/api/ai/feature-map/modify` | `{ projectId, instruction }` | `{ diff }` | STEP-044 |
| POST | `/api/acceptance/start` | `{ projectId, pipelineRunId }` | `AcceptanceState` | STEP-071 |
| POST | `/api/acceptance/feedback` | `{ projectId, itemId, answer, feedback }` | `AcceptanceState` | STEP-072 |
| GET | `/api/acceptance/status?projectId=X` | - | `AcceptanceState` | STEP-071 |
| POST | `/api/screenshot/capture` | `{ projectId, pipelineRunId, pages }` | `CaptureResult[]` | 03-deploy |

---

## FIX-013: 需求到功能地图数据格式桥接

**问题：** `02-ai-engine.md` 的 RequirementEngine 产出 `RequirementSummary` 对象，但 FeatureMapEngine 的输入格式未在任何文档中定义。两者之间缺少映射逻辑。

**修正：添加 RequirementSummary 到功能地图生成 Prompt 输入的完整映射函数**

```ts
// src/lib/engines/requirement-to-dag-bridge.ts

import type { RequirementSummary } from '@/prompts/requirement-summary';

export interface FeatureMapPromptInput {
  projectName: string;
  projectType: string;
  userRoles: string[];
  coreFlows: { name: string; steps: string[] }[];
  dataEntities: { name: string; fields: string[] }[];
  thirdPartyIntegrations: string[];
  uiStyle: string;
  scaleExpectation: string;
  rawFeatures: { name: string; description: string; priority: 'must' | 'should' | 'could' }[];
}

/**
 * 将 RequirementSummary 转化为功能地图生成 Prompt 的结构化输入。
 * 这是需求引擎（I1 完成时）和功能地图生成引擎之间的唯一桥接点。
 */
export function bridgeRequirementToFeatureMapInput(
  summary: RequirementSummary,
): FeatureMapPromptInput {
  return {
    projectName: summary.projectName,
    projectType: summary.projectType,
    userRoles: summary.userRoles.map((r) => r.name),
    coreFlows: summary.coreFlows.map((f) => ({
      name: f.name,
      steps: f.steps,
    })),
    dataEntities: summary.dataEntities.map((e) => ({
      name: e.name,
      fields: e.fields.map((f) => f.name),
    })),
    thirdPartyIntegrations: summary.thirdPartyIntegrations ?? [],
    uiStyle: summary.uiPreferences?.style ?? 'modern',
    scaleExpectation: summary.scaleExpectation ?? 'small',
    rawFeatures: summary.features.map((f) => ({
      name: f.name,
      description: f.description,
      priority: f.priority ?? 'must',
    })),
  };
}

/**
 * 将 FeatureMapPromptInput 序列化为 Prompt 文本段。
 */
export function formatForPrompt(input: FeatureMapPromptInput): string {
  const sections: string[] = [];

  sections.push(`项目名称: ${input.projectName}`);
  sections.push(`项目类型: ${input.projectType}`);
  sections.push(`用户角色: ${input.userRoles.join(', ')}`);

  sections.push(`\n核心流程:`);
  for (const flow of input.coreFlows) {
    sections.push(`  - ${flow.name}: ${flow.steps.join(' -> ')}`);
  }

  sections.push(`\n数据实体:`);
  for (const entity of input.dataEntities) {
    sections.push(`  - ${entity.name} (${entity.fields.join(', ')})`);
  }

  if (input.thirdPartyIntegrations.length > 0) {
    sections.push(`\n第三方集成: ${input.thirdPartyIntegrations.join(', ')}`);
  }

  sections.push(`\n功能列表:`);
  for (const f of input.rawFeatures) {
    sections.push(`  - [${f.priority}] ${f.name}: ${f.description}`);
  }

  sections.push(`\nUI风格: ${input.uiStyle}`);
  sections.push(`规模预期: ${input.scaleExpectation}`);

  return sections.join('\n');
}
```

---

## FIX-014: 代码产物到构建的项目组装逻辑

**问题：** `MASTER-SEQUENCE.md` STEP-060 提到"从 R2 下载所有代码文件 -> 组装完整 Next.js 项目"，但 `ProjectAssembler` 的实现在所有文档中缺失。

**补全 `src/lib/deploy/project-assembler.ts`：**

```ts
import fs from 'fs/promises';
import path from 'path';
import { downloadFromR2 } from './r2-client';

export interface AssemblyResult {
  projectDir: string;
  fileCount: number;
  totalBytes: number;
  packageJson: Record<string, unknown>;
}

export interface GeneratedFileRecord {
  r2Key: string;
  localPath: string;     // 相对于项目根目录的路径
  nodeId: string;
}

/**
 * 从 R2 下载所有生成的代码文件，组装为完整的 Next.js 项目。
 *
 * 组装步骤：
 * 1. 创建临时目录
 * 2. 写入项目骨架（package.json, tsconfig.json, next.config.ts, tailwind.config.ts）
 * 3. 从 R2 下载所有生成的文件到对应路径
 * 4. 合并 dependency_manifests 生成最终 package.json dependencies
 */
export class ProjectAssembler {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async assemble(
    projectId: string,
    files: GeneratedFileRecord[],
    dependencies: Record<string, string>,
    projectConfig: { name: string; description: string },
  ): Promise<AssemblyResult> {
    const projectDir = path.join(this.baseDir, `build-${projectId}-${Date.now()}`);
    await fs.mkdir(projectDir, { recursive: true });

    // 1. 写入项目骨架
    const packageJson = this.buildPackageJson(projectConfig, dependencies);
    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2),
    );
    await this.writeBoilerplate(projectDir);

    // 2. 下载所有生成的文件
    let totalBytes = 0;
    for (const file of files) {
      const content = await downloadFromR2(file.r2Key);
      const filePath = path.join(projectDir, file.localPath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
      totalBytes += content.length;
    }

    return {
      projectDir,
      fileCount: files.length,
      totalBytes,
      packageJson,
    };
  }

  private buildPackageJson(
    config: { name: string; description: string },
    dependencies: Record<string, string>,
  ): Record<string, unknown> {
    return {
      name: config.name.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      description: config.description,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        ...dependencies,
      },
      devDependencies: {
        '@types/node': '^22.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        typescript: '^5.0.0',
      },
    };
  }

  private async writeBoilerplate(projectDir: string): Promise<void> {
    // tsconfig.json
    await fs.writeFile(
      path.join(projectDir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2017',
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            plugins: [{ name: 'next' }],
            paths: { '@/*': ['./src/*'] },
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
          exclude: ['node_modules'],
        },
        null,
        2,
      ),
    );

    // next.config.ts (minimal)
    await fs.writeFile(
      path.join(projectDir, 'next.config.ts'),
      `import type { NextConfig } from "next";\nconst config: NextConfig = {};\nexport default config;\n`,
    );
  }

  async cleanup(projectDir: string): Promise<void> {
    await fs.rm(projectDir, { recursive: true, force: true });
  }
}
```

---

## FIX-015: 截图 URL 到验收面板的传递路径

**问题：** Pipeline 中截图完成后，截图 URL 如何传递到验收面板没有在任何文档中定义。

**修正：在 Pipeline Orchestrator 中添加截图到验收的编排逻辑**

```ts
// 在 execution-orchestrator.ts 的 runScreenshotPhase 完成后添加：

/**
 * 截图完成后，将截图 URL 写入对应的 BusinessNode.data.screenshots，
 * 同时通过 WebSocket 通知前端更新 dag-store。
 */
async function bridgeScreenshotsToAcceptance(
  projectId: string,
  pipelineRunId: string,
  captureResults: CaptureResult[],
  supabase: SupabaseClient,
  io: Server,
): Promise<void> {
  for (const result of captureResults) {
    if (!result.screenshotUrl) continue;

    // 1. 更新 nodes 表的 screenshots 字段
    await supabase
      .from('nodes')
      .update({
        screenshots: supabase.sql`
          COALESCE(screenshots, '[]'::jsonb) || ${JSON.stringify([{
            url: result.screenshotUrl,
            pageTitle: result.pageName,
            capturedAt: new Date().toISOString(),
            pipelineRunId,
          }])}::jsonb
        `,
      })
      .eq('project_id', projectId)
      .eq('label', result.pageName);

    // 2. 通过 WebSocket 通知前端
    io.to(`project:${projectId}`).emit('screenshot-ready', {
      pageName: result.pageName,
      screenshotUrl: result.screenshotUrl,
      pipelineRunId,
    });
  }

  // 3. 通知前端可以开始验收
  io.to(`project:${projectId}`).emit('acceptance-ready', {
    pipelineRunId,
    totalScreenshots: captureResults.filter((r) => r.screenshotUrl).length,
  });
}
```

---

## FIX-016: 补全 Phase 4 测试步骤（插入 STEP-059.1 ~ 059.15）

**问题：** MASTER-SEQUENCE 从 STEP-059（质量关卡集成）直接跳到 STEP-060（构建部署），缺少测试步骤。需要在 STEP-059 和 STEP-060 之间插入三层测试防线。

**在 MASTER-SEQUENCE.md 的 STEP-059 之后、STEP-060 之前，插入以下 15 个步骤：**

```markdown
### STEP-059.1: 单元测试基础设施
**前置条件：** STEP-007 完成
**执行：**
  1. `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  2. 创建 `vitest.config.ts`
  3. 创建 `src/test/setup.ts` -- 全局 test setup
  4. 在 package.json 添加 `"test": "vitest"`, `"test:ci": "vitest run"`
**验证：** `npm run test -- --run` 无报错（0 tests 也行）
**预估耗时：** 0.5h

### STEP-059.2: AI Adapter 单元测试
**前置条件：** STEP-059.1, STEP-039 完成
**执行：**
  1. 创建 `src/lib/ai/__tests__/adapter.test.ts`
  2. Mock fetch，测试：正常完成、流式输出、fallback chain、rate limiter
**验证：** 4+ test cases 全部通过
**预估耗时：** 1.5h

### STEP-059.3: Response Parser 单元测试
**前置条件：** STEP-059.1 完成
**执行：**
  1. 创建 `src/lib/ai/__tests__/response-parser.test.ts`
  2. 测试 4 级解析：直接JSON / 代码块JSON / regex提取 / 结构修复
**验证：** 8+ test cases 全部通过
**预估耗时：** 1h

### STEP-059.4: DAG 算法单元测试
**前置条件：** STEP-059.1, STEP-014 完成
**执行：**
  1. 创建 `src/lib/engines/__tests__/dag-algorithms.test.ts`
  2. 测试：拓扑排序、环检测（有环/无环）、影响分析
**验证：** 6+ test cases 全部通过
**预估耗时：** 1h

### STEP-059.5: Zustand Stores 单元测试
**前置条件：** STEP-059.1, STEP-016 完成
**执行：**
  1. 为每个 Store 创建测试文件
  2. 测试：初始状态、action 触发后状态变化、selector 返回值
**验证：** 每个 Store 至少 3 个 test cases
**预估耗时：** 2h

### STEP-059.6: 业务翻译层单元测试
**前置条件：** STEP-059.1, STEP-052 完成
**执行：**
  1. 创建 `src/lib/translation/__tests__/translator.test.ts`
  2. 测试：映射表命中、未命中降级、错误消息翻译不粉饰
**验证：** 5+ test cases 全部通过
**预估耗时：** 1h

### STEP-059.7: 组件测试基础设施
**前置条件：** STEP-059.1 完成
**执行：**
  1. 配置 @testing-library/react 与 Next.js App Router 兼容
  2. 创建 `src/test/render-helpers.tsx` -- 带 Provider 的 render wrapper
**验证：** 简单组件 render + snapshot 通过
**预估耗时：** 0.5h

### STEP-059.8: 对话面板组件测试
**前置条件：** STEP-059.7, STEP-021 完成
**执行：**
  1. 测试：发送消息、流式渲染、选择题交互
**验证：** 3+ test cases 全部通过
**预估耗时：** 1.5h

### STEP-059.9: 功能地图面板组件测试
**前置条件：** STEP-059.7, STEP-028 完成
**执行：**
  1. 测试：节点渲染（7种类型）、边渲染、状态颜色
**验证：** 3+ test cases 全部通过
**预估耗时：** 1.5h

### STEP-059.10: 验收面板组件测试
**前置条件：** STEP-059.7, STEP-032 完成
**执行：**
  1. 测试：阶段切换、是/否问题交互、反馈提交
**验证：** 3+ test cases 全部通过
**预估耗时：** 1.5h

### STEP-059.11: API 集成测试基础设施
**前置条件：** STEP-059.1, STEP-015 完成
**执行：**
  1. 创建 `src/test/api-helpers.ts` -- API 测试 helper（create test client, seed data, cleanup）
  2. 配置测试数据库（Supabase test schema 或 local PG）
**验证：** 测试 helper 可创建/清理测试数据
**预估耗时：** 1h

### STEP-059.12: 项目 CRUD API 集成测试
**前置条件：** STEP-059.11, STEP-013 完成
**执行：**
  1. 测试完整 CRUD：create -> read -> update -> delete
  2. 测试认证保护：未登录返回 401
  3. 测试 Zod 验证：无效输入返回 400
**验证：** 5+ test cases 全部通过
**预估耗时：** 1.5h

### STEP-059.13: DAG API 集成测试
**前置条件：** STEP-059.11, STEP-014 完成
**执行：**
  1. 测试节点 CRUD + 边 CRUD
  2. 测试环检测：添加会形成环的边返回 400
  3. 测试拓扑排序
**验证：** 5+ test cases 全部通过
**预估耗时：** 1.5h

### STEP-059.14: Pipeline API 集成测试
**前置条件：** STEP-059.11, STEP-049 完成
**执行：**
  1. 测试 Pipeline 启动/暂停/恢复/取消
  2. Mock AI 调用，验证状态转换
**验证：** 4+ test cases 全部通过
**预估耗时：** 2h

### STEP-059.15: 测试覆盖率报告 + CI 脚本
**前置条件：** STEP-059.2 ~ STEP-059.14 全部完成
**执行：**
  1. 配置 vitest coverage（v8 provider）
  2. 创建 `scripts/test-all.sh`：运行 unit + component + integration
  3. 设置覆盖率阈值：statements > 60%, branches > 50%
**验证：** `npm run test:ci` 全部通过，覆盖率达标
**预估耗时：** 1h
```

---

## FIX-017: 补全 I3（UI 审美确认）步骤

**问题：** 产品规格书定义了 I3 交互（PM 确认 UI 审美），但 MASTER-SEQUENCE 中缺少对应 STEP。

**在 STEP-045 之后插入：**

```markdown
### STEP-045.1: I3 UI审美确认交互
**前置条件：** STEP-045 完成
**执行：**
  1. 功能地图生成后，对话面板自动切换到 I3 模式
  2. AI 展示 3 个 UI 风格方案（基于需求文档的 uiStyle 字段）：
     - 方案A：简洁现代（shadcn/ui 默认）
     - 方案B：品牌色强调（使用 brand 调色板）
     - 方案C：深色优先（dark mode default）
  3. 每个方案展示：配色卡 + 字体示例 + 按钮/卡片组件预览截图
  4. PM 选择一个方案（或说"都不喜欢"进入自由描述）
  5. 选择结果写入 project 配置的 uiTheme 字段
**验证：**
  - 3 个方案在对话面板中正确展示
  - PM 选择后 project 配置更新
  - 后续代码生成使用选定的 UI 主题
**产出：**
  - `src/components/chat/ui-style-selector.tsx`
  - 更新 conversation-store 支持 I3 状态
**预估耗时：** 2h
```

---

## FIX-018: AcceptancePhase 类型统一

**问题：** 前端 `01-ui-framework.md` AcceptancePanel 定义 `type AcceptancePhase = 'A' | 'B' | 'C' | 'D'`（第1119行），后端 `03-deploy-preview.md` AcceptanceEngine 定义 `type AcceptancePhase = "PENDING" | "IN_PROGRESS" | "WAITING_FIX" | "COMPLETED"`（第944行）。同名不同义。

**修正：前端使用 `AcceptanceStep`，后端保持 `AcceptancePhase`**

前端 `01-ui-framework.md` AcceptancePanel（第1119行）：
```tsx
// 原文
export type AcceptancePhase = 'A' | 'B' | 'C' | 'D';

// 改为
export type AcceptanceStep = 'A' | 'B' | 'C' | 'D';
```

并在 `01-ui-framework.md` 全文中将前端侧的 `AcceptancePhase` 替换为 `AcceptanceStep`。

添加映射函数 `src/lib/acceptance/phase-mapper.ts`：
```ts
import type { AcceptanceStep } from '@/components/acceptance/acceptance-panel';

// 后端 AcceptancePhase -> 前端 AcceptanceStep 映射
export type BackendAcceptancePhase = 'PENDING' | 'IN_PROGRESS' | 'WAITING_FIX' | 'COMPLETED';

export function mapPhaseToStep(phase: BackendAcceptancePhase): AcceptanceStep {
  switch (phase) {
    case 'PENDING': return 'A';
    case 'IN_PROGRESS': return 'B';
    case 'WAITING_FIX': return 'C';
    case 'COMPLETED': return 'D';
  }
}

export function mapStepToPhase(step: AcceptanceStep): BackendAcceptancePhase {
  switch (step) {
    case 'A': return 'PENDING';
    case 'B': return 'IN_PROGRESS';
    case 'C': return 'WAITING_FIX';
    case 'D': return 'COMPLETED';
  }
}
```

---

## FIX-019: WebSocket 事件类型统一

**问题：** WebSocket 事件类型在 `MASTER-SEQUENCE.md` STEP-006 中提到要定义 `src/types/websocket-events.ts`，但实际的事件名和 payload 类型分散在多个文件中，没有统一的 type-safe 定义。

**创建 `src/lib/socket/events.ts`（统一事件类型定义）：**

```ts
// src/lib/socket/events.ts

/** Pipeline 进度事件 payload */
export interface PipelineProgressEvent {
  pipelineRunId: string;
  nodeId: string;
  nodeLabel: string;
  phase: 'code-gen' | 'quality-gate' | 'build' | 'deploy' | 'screenshot' | 'acceptance';
  status: 'running' | 'completed' | 'error';
  pmMessage: string;           // 翻译后的 PM 语言消息
  progress: number;            // 0-100
  timestamp: string;
}

/** 节点状态变化事件 payload */
export interface NodeStatusChangeEvent {
  nodeId: string;
  oldStatus: string;
  newStatus: string;
  pmMessage: string;
}

/** 构建日志事件 payload */
export interface BuildLogEvent {
  pipelineRunId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

/** 截图就绪事件 payload */
export interface ScreenshotReadyEvent {
  pageName: string;
  screenshotUrl: string;
  pipelineRunId: string;
}

/** 验收就绪事件 payload */
export interface AcceptanceReadyEvent {
  pipelineRunId: string;
  totalScreenshots: number;
}

/** 验收状态更新事件 payload */
export interface AcceptanceUpdateEvent {
  itemId: string;
  status: 'passed' | 'failed' | 'fixing';
  fixAttempt?: number;
}

// ---- Server -> Client 事件 ----
export interface WsServerToClientEvents {
  'pipeline-progress': (data: PipelineProgressEvent) => void;
  'node-status-change': (data: NodeStatusChangeEvent) => void;
  'build-log': (data: BuildLogEvent) => void;
  'screenshot-ready': (data: ScreenshotReadyEvent) => void;
  'acceptance-ready': (data: AcceptanceReadyEvent) => void;
  'acceptance-update': (data: AcceptanceUpdateEvent) => void;
}

// ---- Client -> Server 事件 ----
export interface WsClientToServerEvents {
  'join-project': (projectId: string) => void;
  'leave-project': (projectId: string) => void;
}
```

---

## FIX-020: next-themes 导入路径修正

**问题：** `01-ui-framework.md` 第58行：
```tsx
import type { ThemeProviderProps } from 'next-themes/dist/types';
```
`next-themes` v0.4+ 不再从 `dist/types` 导出类型。

**修正：**
```tsx
// 原文
import type { ThemeProviderProps } from 'next-themes/dist/types';

// 改为
import type { ThemeProviderProps } from 'next-themes';
```

---

## FIX-021: KanbanIcon 替换

**问题：** `01-ui-framework.md` 第178行引用 `KanbanIcon`，但 `lucide-react` 没有名为 `KanbanIcon` 的图标。

**修正：**
```tsx
// 原文
import {
  GitBranchIcon,
  KanbanIcon,
  RouteIcon,
  PlayIcon,
  MoonIcon,
  SunIcon,
  EyeIcon,
} from 'lucide-react';

// 改为
import {
  GitBranchIcon,
  LayoutDashboardIcon,
  RouteIcon,
  PlayIcon,
  MoonIcon,
  SunIcon,
  EyeIcon,
} from 'lucide-react';
```

同文件第190行：
```tsx
// 原文
{ key: 'kanban', label: '看板', icon: <KanbanIcon size={16} /> },

// 改为
{ key: 'kanban', label: '看板', icon: <LayoutDashboardIcon size={16} /> },
```

---

## FIX-022: onChoiceSelect 从 Store state 移出

**问题：** `01-ui-framework.md` 第1917行 `Message` 类型中包含 `onChoiceSelect?: (choice: string) => void`，这是一个函数引用，存储在 Zustand state 中。函数不应存储在 Store 中（不可序列化、无法持久化、导致不必要的重渲染）。

**修正：将 `onChoiceSelect` 从 Message 类型中移出，改为通过 Store action 处理**

```ts
// conversation-store.ts

// Message 类型修正
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  choices?: string[];
  // 删除 onChoiceSelect
}

// 新增 action
interface ConversationActions {
  // ...existing actions...
  handleChoiceSelect: (messageId: string, choice: string) => void;
}

// action 实现
handleChoiceSelect: (messageId, choice) => {
  // 将选择作为用户消息发送
  get().sendMessage(choice);
  // 清除该消息的 choices（防止重复选择）
  set((state) => ({
    messages: state.messages.map((m) =>
      m.id === messageId ? { ...m, choices: undefined } : m,
    ),
  }));
},
```

组件侧修正（`MessageBubble.tsx` 约第455行）：
```tsx
// 原文
onClick={() => message.onChoiceSelect?.(choice)}

// 改为
onClick={() => useConversationStore.getState().handleChoiceSelect(message.id, choice)}
```

---

## FIX-023: 流式 AI 调用的 fallback 机制

**问题：** `02-ai-engine.md` AIAdapter.stream() 方法注释说"No automatic fallback during streaming"（第143行），但流式调用失败时前端会卡住，没有降级处理。

**修正：在 stream() 中添加连接阶段的 fallback**

```ts
// adapter.ts -- stream() 方法修正

async *stream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
  const validated = AIRequestSchema.parse({ ...req, stream: true });
  await this.rateLimiter.acquire(validated.model);

  const chain = [validated.model, ...(FALLBACK_CHAIN[validated.model] ?? [])];

  for (const model of chain) {
    const provider = this.providers.get(model);
    if (!provider) continue;

    try {
      // 尝试建立流式连接（如果连接失败则 fallback）
      let hasYielded = false;
      for await (const chunk of provider.stream({ ...validated, model })) {
        if (chunk.type === 'error' && !hasYielded) {
          // 连接阶段错误，尝试下一个 provider
          console.warn(`[AIAdapter] ${model} stream error, trying next`, chunk.error);
          break;
        }
        hasYielded = true;
        yield chunk;
      }
      if (hasYielded) return; // 成功产出了 chunks，结束
    } catch (err) {
      console.warn(`[AIAdapter] ${model} stream failed, trying next`, err);
      if (model === chain[chain.length - 1]) {
        yield { type: 'error', error: `All models in fallback chain exhausted` };
        yield { type: 'done' };
        return;
      }
    }
  }

  yield { type: 'error', error: 'No available model for streaming' };
  yield { type: 'done' };
}
```

---

## FIX-024: getDb() 函数定义

**问题：** `03-deploy-preview.md` 中多个类的构造函数接收 `deps.db` 对象（含 `query` 方法），但此 `db` 对象从未在任何文档中定义如何创建。FIX-005 已决策使用 Supabase Client，但对于需要 raw SQL 的场景（如 `SupabaseProvisioner` 的 DDL 操作），Supabase JS Client 的 `.rpc()` 或 SQL Editor 是正确路径。

**修正：为需要 raw SQL 的场景提供包装函数**

```ts
// src/lib/db/raw-query.ts

import { createAdminClient } from './client';

/**
 * 执行 raw SQL 查询（仅用于 DDL/管理操作如 schema provisioning）。
 * 普通 CRUD 应使用 Supabase Client 的 .from().select() 等方法。
 */
export async function rawQuery(
  sql: string,
  params: unknown[] = [],
): Promise<{ rows: Record<string, unknown>[] }> {
  const supabase = createAdminClient();

  // 使用 Supabase 的 rpc 调用自定义 SQL 执行函数
  // 需要先在 Supabase 中创建此函数（见 migration）
  const { data, error } = await supabase.rpc('exec_sql', {
    query: sql,
    params: JSON.stringify(params),
  });

  if (error) throw new Error(`Raw query failed: ${error.message}`);
  return { rows: data ?? [] };
}
```

对应的 Supabase migration SQL（添加到 `001_initial_schema.sql`）：

```sql
-- 平台管理专用：执行动态 SQL（仅 service_role 可调用）
CREATE OR REPLACE FUNCTION platform.exec_sql(query text, params jsonb DEFAULT '[]')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 限制只有 service_role 可以调用
REVOKE ALL ON FUNCTION platform.exec_sql FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.exec_sql TO service_role;
```

---

## 修复应用后的验证清单

执行完所有 24 项修复后，运行以下验证：

```bash
# 1. 依赖安装无冲突
cd C:/Projects/mixia-builder
npm install
npm ls --depth=0  # 无 UNMET PEER DEPENDENCY

# 2. TypeScript 编译通过
npx tsc --noEmit

# 3. ESLint 无错误
npm run lint

# 4. 搜索残留的旧引用
grep -r "from 'reactflow'" src/          # 应返回 0 结果
grep -r "CLAUDE_API_KEY" src/            # 应返回 0 结果
grep -r "CF_ACCOUNT_ID" src/             # 应返回 0 结果
grep -r "prisma" src/ --include="*.ts"   # 应返回 0 结果
grep -r "@tailwindcss/postcss" .         # 应返回 0 结果

# 5. 环境变量完整性
# 对比 .env.local.example 中的变量名与代码中 process.env.XXX 引用是否一致

# 6. 目录结构一致性
# 确认所有代码文件路径都以 src/ 开头
```

---

## 修复优先级排序

| 优先级 | FIX | 理由 |
|--------|-----|------|
| P0 | FIX-001, 002, 003 | 技术栈/包名/路径不一致会导致编译失败 |
| P0 | FIX-004, 005 | 环境变量和数据库方案冲突会导致运行时错误 |
| P0 | FIX-008 | WebSocket 架构错误会导致实时通信完全不可用 |
| P0 | FIX-009 | R2 认证错误会导致存储功能完全不可用 |
| P0 | FIX-010 | SQL 注入是安全漏洞 |
| P1 | FIX-006, 007 | 缺失依赖和颜色不匹配会导致编译或渲染错误 |
| P1 | FIX-011, 012 | Store 和 API 不完整会阻塞后续开发 |
| P1 | FIX-013, 014, 015 | 数据流断裂会导致端到端流程跑不通 |
| P1 | FIX-016 | 缺少测试会导致质量失控 |
| P1 | FIX-018, 019 | 类型不一致会导致前后端通信错误 |
| P2 | FIX-017 | I3 交互缺失影响产品完整性但不阻塞核心流程 |
| P2 | FIX-020, 021, 022, 023, 024 | 局部代码修正，不阻塞架构 |
