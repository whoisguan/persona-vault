# FIX-ROUND-2: 第二轮修复清单

> **版本：** v1.0
> **创建日期：** 2026-04-07
> **定位：** AI agent 在执行完 FIX-BEFORE-START.md 之后、STEP-001 之前，逐条执行本文件中的修复。
> **修复数量：** 10 项（FIX-BEFORE-START 遗留问题）
> **总预估代码量：** ~800 行修正

---

## 执行规则

1. 按 FIX-R2-001 到 FIX-R2-010 **顺序执行**（部分修复有依赖关系）
2. 每条修复包含：**问题描述**、**影响范围**、**可直接执行的命令/SQL/代码**
3. 修复完成后，在对应文件中标注 `<!-- FIXED by FIX-R2-XXX -->`

---

## FIX-R2-001: MASTER-SEQUENCE 全文路径替换

**问题：** FIX-003 定义了 `src/server/` 到 `src/lib/` 的路径映射，但未实际应用到 MASTER-SEQUENCE.md。该文件中有 79 处 `src/server/` 引用需要替换。

**影响文件：** `docs/execution-plan/MASTER-SEQUENCE.md`

### 替换命令（Node.js 脚本）

在项目根目录创建并运行 `scripts/fix-r2-001-path-replace.mjs`：

```js
// scripts/fix-r2-001-path-replace.mjs
import { readFileSync, writeFileSync } from 'fs';

const FILE = 'docs/execution-plan/MASTER-SEQUENCE.md';
let content = readFileSync(FILE, 'utf8');

// 替换规则（顺序很重要：长路径在前，防止短路径先命中）
const replacements = [
  ['src/server/services/ai/',              'src/lib/ai/'],
  ['src/server/services/requirement-engine', 'src/lib/engines/requirement-engine'],
  ['src/server/services/codegen/',          'src/lib/engines/codegen/'],
  ['src/server/services/translation/',      'src/lib/translation/'],
  ['src/server/services/quality/',          'src/lib/quality/'],
  ['src/server/services/deploy/',           'src/lib/deploy/'],
  ['src/server/services/screenshot/',       'src/lib/screenshot/'],
  ['src/server/services/acceptance/',       'src/lib/acceptance/'],
  ['src/server/services/pipeline/',         'src/lib/pipeline/'],
  ['src/server/services/project-service',   'src/lib/services/project-service'],
  ['src/server/services/dag-service',       'src/lib/services/dag-service'],
  ['src/server/services/storage',           'src/lib/storage/'],
  ['src/server/services/feature-map-engine', 'src/lib/engines/feature-map-engine'],
  ['src/server/workers/',                   'src/lib/queue/workers/'],
  ['src/server/queue/',                     'src/lib/queue/'],
  ['src/server/websocket/',                 'src/lib/socket/'],
  ['src/server/db/',                        'src/lib/db/'],
];

let totalReplacements = 0;
for (const [from, to] of replacements) {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    totalReplacements += matches.length;
    content = content.replace(regex, to);
  }
}

writeFileSync(FILE, content, 'utf8');
console.log(`Replaced ${totalReplacements} occurrences in ${FILE}`);
```

**执行：**

```bash
cd C:/Projects/mixia-framework
node scripts/fix-r2-001-path-replace.mjs
```

**等效 sed 命令（在 Bash 中逐条执行）：**

```bash
cd C:/Projects/mixia-framework
FILE="docs/execution-plan/MASTER-SEQUENCE.md"

sed -i 's|src/server/services/ai/|src/lib/ai/|g' "$FILE"
sed -i 's|src/server/services/requirement-engine|src/lib/engines/requirement-engine|g' "$FILE"
sed -i 's|src/server/services/codegen/|src/lib/engines/codegen/|g' "$FILE"
sed -i 's|src/server/services/feature-map-engine|src/lib/engines/feature-map-engine|g' "$FILE"
sed -i 's|src/server/services/translation/|src/lib/translation/|g' "$FILE"
sed -i 's|src/server/services/quality/|src/lib/quality/|g' "$FILE"
sed -i 's|src/server/services/deploy/|src/lib/deploy/|g' "$FILE"
sed -i 's|src/server/services/screenshot/|src/lib/screenshot/|g' "$FILE"
sed -i 's|src/server/services/acceptance/|src/lib/acceptance/|g' "$FILE"
sed -i 's|src/server/services/pipeline/|src/lib/pipeline/|g' "$FILE"
sed -i 's|src/server/services/project-service|src/lib/services/project-service|g' "$FILE"
sed -i 's|src/server/services/dag-service|src/lib/services/dag-service|g' "$FILE"
sed -i 's|src/server/services/storage|src/lib/storage/|g' "$FILE"
sed -i 's|src/server/workers/|src/lib/queue/workers/|g' "$FILE"
sed -i 's|src/server/queue/|src/lib/queue/|g' "$FILE"
sed -i 's|src/server/websocket/|src/lib/socket/|g' "$FILE"
sed -i 's|src/server/db/|src/lib/db/|g' "$FILE"
```

**验证：**

```bash
grep -c "src/server/" "docs/execution-plan/MASTER-SEQUENCE.md"
# 预期输出：0（目录结构描述除外）
```

---

## FIX-R2-002: STEP-015 用 Supabase SQL 迁移替代 Prisma

**问题：** FIX-005 决策删除 Prisma，但 STEP-015（数据库迁移+种子数据+冒烟测试）仍然引用 `prisma migrate` 和 `prisma db seed`。需要整段替换为 Supabase 原生方式。

**影响文件：** `docs/execution-plan/MASTER-SEQUENCE.md` STEP-015（约第342-359行）

### 替换后的完整 STEP-015 文本

将 MASTER-SEQUENCE.md 中 STEP-015 整段替换为：

```markdown
### STEP-015: 数据库迁移 + 种子数据 + 冒烟测试
**前置条件：** STEP-014完成
**执行：**
  1. 读取 `src/lib/db/migrations/001_initial_schema.sql`（在 FIX-005 / STEP-008 中已创建）
  2. 通过以下任一方式执行 DDL：
     - **方式A（推荐）：** 在 Supabase Dashboard -> SQL Editor 中粘贴并执行
     - **方式B：** 使用 supabase CLI：
       ```bash
       npx supabase db push
       ```
     - **方式C：** 使用 Node 脚本通过 Admin Client 执行：
       ```bash
       node scripts/run-migration.mjs
       ```
  3. 创建 `scripts/run-migration.mjs`：
     ```js
     import { readFileSync } from 'fs';
     import { createClient } from '@supabase/supabase-js';

     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL,
       process.env.SUPABASE_SERVICE_ROLE_KEY,
     );

     const sql = readFileSync('src/lib/db/migrations/001_initial_schema.sql', 'utf8');

     // 按分号拆分并逐条执行
     const statements = sql
       .split(';')
       .map(s => s.trim())
       .filter(s => s.length > 0 && !s.startsWith('--'));

     for (const stmt of statements) {
       const { error } = await supabase.rpc('exec_sql', {
         query: stmt + ';',
         params: '[]',
       });
       if (error) {
         console.error(`Failed: ${stmt.substring(0, 80)}...`);
         console.error(error.message);
         process.exit(1);
       }
     }
     console.log(`Executed ${statements.length} statements successfully.`);
     ```
  4. 创建 `scripts/seed-data.mjs` -- 种子数据：
     ```js
     import { createClient } from '@supabase/supabase-js';

     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL,
       process.env.SUPABASE_SERVICE_ROLE_KEY,
     );

     // 1. 测试用户
     const { data: user } = await supabase.from('users').insert({
       id: '00000000-0000-0000-0000-000000000001',
       email: 'test@mixia.dev',
       name: 'Test PM',
       avatar_url: null,
     }).select().single();

     // 2. 示例项目
     const { data: project } = await supabase.from('projects').insert({
       id: '00000000-0000-0000-0000-000000000010',
       name: '电商平台',
       description: '手工艺品电商',
       owner_id: user.id,
       type: 'ecommerce',
       status: 'planning',
       config: {},
     }).select().single();

     // 3. 5 个业务节点
     const nodes = [
       { id: 'node-001', project_id: project.id, type: 'page', label: '首页', status: 'planning', position_x: 0, position_y: 0 },
       { id: 'node-002', project_id: project.id, type: 'page', label: '商品列表', status: 'planning', position_x: 200, position_y: 0 },
       { id: 'node-003', project_id: project.id, type: 'page', label: '商品详情', status: 'planning', position_x: 400, position_y: 0 },
       { id: 'node-004', project_id: project.id, type: 'feature', label: '购物车', status: 'planning', position_x: 200, position_y: 200 },
       { id: 'node-005', project_id: project.id, type: 'feature', label: '结算', status: 'planning', position_x: 400, position_y: 200 },
     ];
     await supabase.from('nodes').insert(nodes);

     // 4. 4 条边
     const edges = [
       { project_id: project.id, source_id: 'node-001', target_id: 'node-002', type: 'hard' },
       { project_id: project.id, source_id: 'node-002', target_id: 'node-003', type: 'hard' },
       { project_id: project.id, source_id: 'node-003', target_id: 'node-004', type: 'soft' },
       { project_id: project.id, source_id: 'node-004', target_id: 'node-005', type: 'hard' },
     ];
     await supabase.from('edges').insert(edges);

     console.log('Seed data inserted: 1 user, 1 project, 5 nodes, 4 edges');
     ```
  5. 执行种子数据：`node scripts/seed-data.mjs`
  6. 创建 `scripts/smoke-test.mjs` -- 冒烟测试（启动 dev server -> 调用 API -> 验证返回数据）
**验证：**
  - 12 张表全部创建成功（在 Supabase Dashboard -> Table Editor 确认）
  - 种子数据填充成功（1 user, 1 project, 5 nodes, 4 edges）
  - 冒烟测试通过
**产出：**
  - `scripts/run-migration.mjs`
  - `scripts/seed-data.mjs`
  - `scripts/smoke-test.mjs`
**预估耗时：** 2小时
**可并行：** 否（阶段一收尾）
```

**在 package.json 中追加 scripts：**

```json
{
  "scripts": {
    "db:migrate": "node scripts/run-migration.mjs",
    "db:seed": "node scripts/seed-data.mjs",
    "db:smoke": "node scripts/smoke-test.mjs"
  }
}
```

---

## FIX-R2-003: 认证方案统一 -- Supabase Auth 替代 NextAuth.js

**问题：** FIX-005 将 STEP-012 的 `@auth/prisma-adapter` 改为 `@auth/supabase-adapter`，但该包不存在（npm 上无此包）。NextAuth.js 没有官方的 Supabase adapter。

**决策：** Phase 1 直接使用 Supabase Auth（不用 NextAuth.js）。理由：Supabase Auth 内置 OAuth + Session + RLS 集成，在 Supabase 生态内零配置。

### 步骤 1: 删除 next-auth 相关依赖

```bash
cd C:/Projects/mixia-builder
npm uninstall next-auth @auth/supabase-adapter 2>/dev/null || true
```

从 `00-project-init.md` 和 FIX-001c 的安装命令中删除：
- `next-auth@^5.0.0-beta.25`

从 `.env.local.example` 中删除：
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-at-least-32-chars-long
```

### 步骤 2: Supabase Auth 客户端登录代码

创建 `src/lib/auth.ts`：

```ts
// src/lib/auth.ts
import { createBrowserClient } from '@/lib/db/client';
import type { Provider } from '@supabase/supabase-js';

/**
 * 发起 OAuth 登录（浏览器端）。
 * 支持 GitHub / Google — Phase 1 至少配一个。
 */
export async function signInWithOAuth(provider: Provider) {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

/**
 * 邮箱+密码登录（备选方案）。
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * 登出。
 */
export async function signOut() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 获取当前用户（浏览器端）。
 */
export async function getCurrentUser() {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

### 步骤 3: OAuth 回调路由

创建 `src/app/auth/callback/route.ts`：

```ts
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/projects';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 认证失败，回到登录页
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

### 步骤 4: 服务端 session 验证中间件

创建 `src/middleware.ts`：

```ts
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // 公开路由不需要认证
  if (PUBLIC_ROUTES.some((route) => request.nextUrl.pathname === route)) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/projects')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
};
```

### 步骤 5: API Route 中获取用户的 helper

创建 `src/lib/auth-helpers.ts`：

```ts
// src/lib/auth-helpers.ts
import { createSupabaseServer } from '@/lib/db/client';
import { NextResponse } from 'next/server';

/**
 * 在 API Route 中获取当前用户。未登录返回 401。
 */
export async function requireAuth() {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, error: null };
}
```

### 步骤 6: STEP-012 的完整替换文本

将 MASTER-SEQUENCE.md 中 STEP-012 整段替换为：

```markdown
### STEP-012: 配置 Supabase Auth 认证
**前置条件：** STEP-008完成
**执行：**
  1. 在 Supabase Dashboard -> Authentication -> Providers 中启用 GitHub OAuth（或 Google）
  2. 配置 OAuth 回调 URL：`http://localhost:3000/auth/callback`
  3. 创建 `src/lib/auth.ts` -- Supabase Auth 封装（signInWithOAuth, signOut, getCurrentUser）
  4. 创建 `src/app/auth/callback/route.ts` -- OAuth 回调处理
  5. 创建 `src/middleware.ts` -- 路由保护（未登录时重定向到 /login）
  6. 创建 `src/lib/auth-helpers.ts` -- API Route 认证 helper
  7. 创建 `src/app/(auth)/login/page.tsx` -- 登录页面（OAuth 按钮）
  8. 创建 `src/app/(auth)/register/page.tsx` -- 注册页面（邮箱+密码）
  9. 在 Supabase Dashboard 配置 SMTP（或使用 Supabase 内置邮件服务）
**验证：**
  - 访问 /projects 未登录时跳转到 /login
  - OAuth 登录后重定向回 /projects
  - `supabase.auth.getUser()` 返回用户信息
  - API Route 中 `requireAuth()` 正确返回用户或 401
  - 登出后 session 清除
**产出：**
  - `src/lib/auth.ts`
  - `src/lib/auth-helpers.ts`
  - `src/app/auth/callback/route.ts`
  - `src/middleware.ts`
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/register/page.tsx`
**预估耗时：** 2小时
**可并行：** 否（依赖 Supabase 项目配置）
```

### 步骤 7: 删除残留的 NextAuth 引用

在 MASTER-SEQUENCE.md 中搜索并删除/替换：
- `src/app/api/auth/[...nextauth]/route.ts` -- 删除此文件引用
- `@auth/prisma-adapter` 或 `@auth/supabase-adapter` -- 删除
- `NEXTAUTH_URL`、`NEXTAUTH_SECRET` -- 从所有 .env 示例中删除

```bash
grep -rn "nextauth\|next-auth\|NextAuth\|NEXTAUTH" docs/execution-plan/MASTER-SEQUENCE.md
# 对每个命中行进行人工确认并修正
```

---

## FIX-R2-004: 补全缺失的 npm 包

**问题：** FIX-001c 和 FIX-006 补全了大部分依赖，但仍有 4 个包遗漏：
- `@aws-sdk/s3-request-presigner` -- FIX-009 的 R2 签名 URL 代码 import 了此包
- `openai` -- STEP-038 的 DeepSeek adapter 使用 OpenAI 兼容 SDK
- `pino` + `pino-pretty` -- STEP-083 日志基础设施需要
- `concurrently` -- 并行启动 Next.js + Socket.io WebSocket server

### 追加安装命令

```bash
cd C:/Projects/mixia-builder

# 生产依赖
npm install \
  @aws-sdk/s3-request-presigner@^3.750.0 \
  openai@^4.77.0 \
  pino@^9.6.0

# 开发依赖
npm install -D \
  pino-pretty@^13.0.0 \
  concurrently@^9.1.0
```

### 验证

```bash
npm ls @aws-sdk/s3-request-presigner openai pino pino-pretty concurrently
# 所有 5 个包应显示已安装版本，无 UNMET PEER DEPENDENCY
```

---

## FIX-R2-005: docker-compose.yml 统一 + WebSocket 服务

**问题：** FIX-008c 定义了一份 docker-compose.yml（含 redis + ws-server），STEP-091 又定义了另一份（含 app + postgres + redis）。两者未合并，且缺少 `Dockerfile.ws` 和 `package.json` 的并行启动命令。

### 合并后的完整 docker-compose.yml

```yaml
# docker-compose.yml -- 本地开发完整环境
version: "3.9"

services:
  # ---------- Next.js 前端 ----------
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_WS_URL=http://localhost:3001
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    restart: unless-stopped

  # ---------- Socket.io WebSocket 独立进程 ----------
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
      redis:
        condition: service_healthy
    restart: unless-stopped

  # ---------- Redis（BullMQ + Socket.io adapter）----------
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # ---------- PostgreSQL 本地开发（可选，如果不用 Supabase Cloud）----------
  postgres-dev:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=mixia
      - POSTGRES_PASSWORD=mixia_dev
      - POSTGRES_DB=mixia_builder
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mixia"]
      interval: 5s
      timeout: 3s
      retries: 5
    profiles:
      - local-db  # 只在 `docker compose --profile local-db up` 时启动

volumes:
  redis-data:
  postgres-data:
```

### Dockerfile.ws 完整内容

```dockerfile
# Dockerfile.ws -- Socket.io WebSocket 独立服务
FROM node:20-alpine AS base

WORKDIR /app

# 只复制 package files 做依赖安装
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 复制 WebSocket 服务源码和共享类型
COPY src/lib/socket/ ./src/lib/socket/
COPY tsconfig.json ./

# 编译 TypeScript（仅 socket 目录）
RUN npx tsc --project tsconfig.json \
    --outDir dist \
    --rootDir src \
    --module commonjs \
    --target ES2022 \
    --esModuleInterop true \
    --skipLibCheck true \
    --declaration false \
    2>/dev/null || true

EXPOSE 3001

# 直接用 tsx 运行（避免编译问题）
RUN npm install -g tsx
CMD ["tsx", "src/lib/socket/server.ts"]
```

### package.json scripts 并行启动命令

在 `package.json` 的 `scripts` 中追加：

```json
{
  "scripts": {
    "dev": "concurrently -n next,ws -c blue,green \"next dev\" \"tsx src/lib/socket/server.ts\"",
    "dev:next": "next dev",
    "dev:ws": "tsx src/lib/socket/server.ts",
    "build": "next build",
    "start": "concurrently -n next,ws \"next start\" \"node dist/lib/socket/server.js\"",
    "docker:up": "docker compose up -d",
    "docker:up:full": "docker compose --profile local-db up -d",
    "docker:down": "docker compose down"
  }
}
```

### 安装 tsx（开发时运行 TypeScript）

```bash
cd C:/Projects/mixia-builder
npm install -D tsx@^4.19.0
```

---

## FIX-R2-006: 构建产物路径统一

**问题：** `03-deploy-preview.md` 中 `CloudflareDeployer.deployPreview()` 和 `ProjectBuilder` 使用 `distPath` 参数指向构建产物目录，但未指明是 `.next/` 还是自定义 `dist/`。Next.js 的构建产物目录是 `.next/`，部署到 Cloudflare Pages 需要转换。

**决策：**
- 用户项目用 `next build` 输出到 `.next/` 目录
- 使用 `@cloudflare/next-on-pages` 转换为 Cloudflare Pages 兼容格式
- 转换后的输出在 `.vercel/output/static/`（next-on-pages 的标准输出）

### 修正 03-deploy-preview.md 中的 distPath 引用

**ProjectBuilder 修正：**

```ts
// src/lib/deploy/project-builder.ts

export interface BuildResult {
  projectDir: string;
  outputDir: string;    // 改名：从 distPath 改为 outputDir
  success: boolean;
  buildLog: string;
}

async function buildProject(projectDir: string): Promise<BuildResult> {
  // 1. 安装依赖
  await exec('npm install', { cwd: projectDir });

  // 2. Next.js 构建
  const { stdout, stderr } = await exec('npx next build', { cwd: projectDir });

  // 3. 转换为 Cloudflare Pages 格式
  await exec('npx @cloudflare/next-on-pages', { cwd: projectDir });

  return {
    projectDir,
    outputDir: path.join(projectDir, '.vercel', 'output', 'static'),
    success: true,
    buildLog: stdout + stderr,
  };
}
```

**CloudflareDeployer 修正：**

```ts
// src/lib/deploy/cloudflare-deployer.ts

async deployPreview(tenantId: string, outputDir: string): Promise<DeployResult> {
  // outputDir 指向 .vercel/output/static/（已由 next-on-pages 转换）
  const files = await this.collectFiles(outputDir);
  // ... 上传到 Cloudflare Pages
}
```

**追加安装 next-on-pages：**

```bash
cd C:/Projects/mixia-builder
npm install -D @cloudflare/next-on-pages@^1.13.0
```

**PreviewManager 修正：**

```ts
// 所有 distPath 参数重命名为 outputDir
export interface PreviewManagerDeps {
  supabase: ReturnType<typeof createAdminClient>;
  deployer: {
    deployPreview: (tenantId: string, outputDir: string) => Promise<DeployResult>;
  };
}

async create(tenantId: string, outputDir: string): Promise<PreviewRecord> {
  const result = await this.deps.deployer.deployPreview(tenantId, outputDir);
  // ...
}
```

---

## FIX-R2-007: exec_sql RPC 函数修复 -- 改为专用函数

**问题：** FIX-024 创建了通用的 `exec_sql` RPC 函数，可执行任意 SQL。这是一个安全风险（即使限制了 service_role 调用权限，也违反最小权限原则）。实际用途只有租户 Schema 的创建和删除。

**决策：** 删除通用 `exec_sql`，改为两个专用函数。

### 完整 SQL（替换 FIX-024 的 SQL）

添加到 `src/lib/db/migrations/002_tenant_functions.sql`：

```sql
-- ============================================================
-- 租户管理专用函数（替代通用 exec_sql）
-- 仅 service_role 可调用
-- ============================================================

-- 删除旧的通用函数（如果存在）
DROP FUNCTION IF EXISTS platform.exec_sql(text, jsonb);

-- 1. 创建租户 Schema + 基础表
-- 注意：Phase 1 决策改用 RLS 行级隔离（FIX-R2-008），
-- 此函数仅在未来需要 Schema 隔离时启用。
-- Phase 1 实际使用的是 RLS，不需要 create_tenant_schema。
-- 保留此函数作为 Schema 隔离的预备方案。

CREATE OR REPLACE FUNCTION platform.create_tenant_schema(p_tenant_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- 防止 search_path 注入
AS $$
DECLARE
  schema_name text;
  result jsonb;
BEGIN
  -- 验证 tenant_id 格式（仅允许字母数字和连字符）
  IF p_tenant_id !~ '^[a-zA-Z0-9-]{1,63}$' THEN
    RAISE EXCEPTION 'Invalid tenant_id format: %', p_tenant_id;
  END IF;

  schema_name := 'tenant_' || p_tenant_id;

  -- 创建 Schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

  -- 创建租户专属表（用户项目的数据表）
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.kv_store (
      key   text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz DEFAULT now()
    )', schema_name);

  -- 授权
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
  EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO authenticated', schema_name);

  result := jsonb_build_object(
    'schema_name', schema_name,
    'status', 'created'
  );

  RETURN result;
END;
$$;

-- 2. 删除租户 Schema
CREATE OR REPLACE FUNCTION platform.drop_tenant_schema(p_tenant_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  schema_name text;
BEGIN
  -- 验证格式
  IF p_tenant_id !~ '^[a-zA-Z0-9-]{1,63}$' THEN
    RAISE EXCEPTION 'Invalid tenant_id format: %', p_tenant_id;
  END IF;

  schema_name := 'tenant_' || p_tenant_id;

  -- 级联删除
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);

  RETURN jsonb_build_object(
    'schema_name', schema_name,
    'status', 'dropped'
  );
END;
$$;

-- 权限限制
REVOKE ALL ON FUNCTION platform.create_tenant_schema(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.create_tenant_schema(text) TO service_role;

REVOKE ALL ON FUNCTION platform.drop_tenant_schema(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.drop_tenant_schema(text) TO service_role;
```

### 修正 raw-query.ts 的调用

将 FIX-024 的 `src/lib/db/raw-query.ts` 替换为：

```ts
// src/lib/db/raw-query.ts
import { createAdminClient } from './client';

/**
 * 创建租户 Schema（仅在需要 Schema 隔离时使用）。
 * Phase 1 使用 RLS 行级隔离，此函数为预备方案。
 */
export async function createTenantSchema(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('create_tenant_schema', {
    p_tenant_id: tenantId,
  });
  if (error) throw new Error(`Create tenant schema failed: ${error.message}`);
  return data;
}

/**
 * 删除租户 Schema。
 */
export async function dropTenantSchema(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('drop_tenant_schema', {
    p_tenant_id: tenantId,
  });
  if (error) throw new Error(`Drop tenant schema failed: ${error.message}`);
  return data;
}
```

### 修正 SupabaseProvisioner 的调用

```ts
// src/lib/deploy/supabase-provisioner.ts
import { createTenantSchema, dropTenantSchema } from '@/lib/db/raw-query';

// 原文（FIX-010 修正后的 pg-format 版本）
// await this.deps.db.query(format('DROP SCHEMA IF EXISTS %I CASCADE', info.schemaName), []);

// 改为
await createTenantSchema(info.tenantId);
// 或
await dropTenantSchema(info.tenantId);
```

---

## FIX-R2-008: 多租户策略 -- RLS 行级隔离

**问题：** `03-deploy-preview.md` 的 `SupabaseProvisioner` 在运行时动态创建 Schema（`CREATE SCHEMA tenant_xxx`），但 Supabase Free/Pro 对动态 Schema 创建有限制，且 Supabase JS Client 的 RLS 机制天然适配行级隔离。

**决策：** Phase 1 使用 RLS 行级隔离（`tenant_id` 列），不使用 Schema 隔离。

### 步骤 1: 为所有表增加 tenant_id 列

添加到 `src/lib/db/migrations/003_add_tenant_id.sql`：

```sql
-- ============================================================
-- 多租户：RLS 行级隔离
-- 为所有业务表增加 tenant_id 列 + RLS 策略
-- ============================================================

-- 注意：tenant_id 等于 user 的 id（Phase 1 一个用户 = 一个租户）
-- Phase 2 可改为独立的 tenant 表。

-- 1. 为所有业务表增加 tenant_id（如果不存在）
DO $$ BEGIN
  -- projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tenant_id') THEN
    ALTER TABLE projects ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- nodes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nodes' AND column_name = 'tenant_id') THEN
    ALTER TABLE nodes ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- edges
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edges' AND column_name = 'tenant_id') THEN
    ALTER TABLE edges ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- node_executions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'node_executions' AND column_name = 'tenant_id') THEN
    ALTER TABLE node_executions ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- file_records
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'file_records' AND column_name = 'tenant_id') THEN
    ALTER TABLE file_records ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- pipeline_runs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipeline_runs' AND column_name = 'tenant_id') THEN
    ALTER TABLE pipeline_runs ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- acceptance_records
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acceptance_records' AND column_name = 'tenant_id') THEN
    ALTER TABLE acceptance_records ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- dag_events
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dag_events' AND column_name = 'tenant_id') THEN
    ALTER TABLE dag_events ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- dag_snapshots
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dag_snapshots' AND column_name = 'tenant_id') THEN
    ALTER TABLE dag_snapshots ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- cost_entries
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cost_entries' AND column_name = 'tenant_id') THEN
    ALTER TABLE cost_entries ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;

  -- dependency_manifests
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependency_manifests' AND column_name = 'tenant_id') THEN
    ALTER TABLE dependency_manifests ADD COLUMN tenant_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- 2. 创建索引（加速 RLS 查询）
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nodes_tenant ON nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edges_tenant ON edges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_node_executions_tenant ON node_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_records_tenant ON file_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_tenant ON pipeline_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_acceptance_records_tenant ON acceptance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dag_events_tenant ON dag_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dag_snapshots_tenant ON dag_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_tenant ON cost_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dependency_manifests_tenant ON dependency_manifests(tenant_id);

-- 3. 启用 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dag_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dag_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_manifests ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略：用户只能看到自己的数据
-- 模板：对每张表创建 SELECT/INSERT/UPDATE/DELETE 策略

-- projects
CREATE POLICY "tenant_select_projects" ON projects FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_projects" ON projects FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_update_projects" ON projects FOR UPDATE USING (tenant_id = auth.uid());
CREATE POLICY "tenant_delete_projects" ON projects FOR DELETE USING (tenant_id = auth.uid());

-- nodes
CREATE POLICY "tenant_select_nodes" ON nodes FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_nodes" ON nodes FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_update_nodes" ON nodes FOR UPDATE USING (tenant_id = auth.uid());
CREATE POLICY "tenant_delete_nodes" ON nodes FOR DELETE USING (tenant_id = auth.uid());

-- edges
CREATE POLICY "tenant_select_edges" ON edges FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_edges" ON edges FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_update_edges" ON edges FOR UPDATE USING (tenant_id = auth.uid());
CREATE POLICY "tenant_delete_edges" ON edges FOR DELETE USING (tenant_id = auth.uid());

-- node_executions
CREATE POLICY "tenant_select_node_executions" ON node_executions FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_node_executions" ON node_executions FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_update_node_executions" ON node_executions FOR UPDATE USING (tenant_id = auth.uid());

-- file_records
CREATE POLICY "tenant_select_file_records" ON file_records FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_file_records" ON file_records FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_update_file_records" ON file_records FOR UPDATE USING (tenant_id = auth.uid());

-- pipeline_runs
CREATE POLICY "tenant_select_pipeline_runs" ON pipeline_runs FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_pipeline_runs" ON pipeline_runs FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_update_pipeline_runs" ON pipeline_runs FOR UPDATE USING (tenant_id = auth.uid());

-- acceptance_records
CREATE POLICY "tenant_select_acceptance_records" ON acceptance_records FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_acceptance_records" ON acceptance_records FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_update_acceptance_records" ON acceptance_records FOR UPDATE USING (tenant_id = auth.uid());

-- dag_events
CREATE POLICY "tenant_select_dag_events" ON dag_events FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_dag_events" ON dag_events FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- dag_snapshots
CREATE POLICY "tenant_select_dag_snapshots" ON dag_snapshots FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_dag_snapshots" ON dag_snapshots FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- cost_entries
CREATE POLICY "tenant_select_cost_entries" ON cost_entries FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_cost_entries" ON cost_entries FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- dependency_manifests
CREATE POLICY "tenant_select_dependency_manifests" ON dependency_manifests FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_insert_dependency_manifests" ON dependency_manifests FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- 5. Service Role 绕过 RLS（用于 Worker 和后台任务）
-- Supabase 的 service_role key 默认绕过 RLS，无需额外配置。
-- 但在代码中使用 createAdminClient() 时需意识到这一点。
```

### 步骤 2: Supabase Client 查询时自动注入 tenant_id 的 middleware

由于 Supabase RLS 通过 `auth.uid()` 自动过滤，只要用户通过 Supabase Auth 登录后发起的请求，RLS 会自动注入 `tenant_id = auth.uid()` 条件。

**前端查询无需手动注入 tenant_id：**

```ts
// 示例：前端获取项目列表
// RLS 自动过滤，只返回当前用户的项目
const { data } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false });
// data 中只包含当前登录用户的项目
```

**INSERT 时 tenant_id 自动填充（DEFAULT auth.uid()）：**

```ts
// 示例：创建项目
// tenant_id 由数据库 DEFAULT 自动填充
const { data } = await supabase
  .from('projects')
  .insert({
    name: '电商平台',
    description: '手工艺品电商',
    type: 'ecommerce',
    // 不需要手动传 tenant_id
  })
  .select()
  .single();
```

**后端 Worker 需要使用 Admin Client（绕过 RLS）：**

```ts
// Worker 中手动传 tenant_id
import { createAdminClient } from '@/lib/db/client';

const admin = createAdminClient();
await admin.from('nodes').update({
  status: 'developing',
}).eq('id', nodeId);
// Admin Client 绕过 RLS，需确保 Worker 逻辑中正确过滤 tenant_id
```

### 步骤 3: 更新 SupabaseProvisioner

```ts
// src/lib/deploy/supabase-provisioner.ts
// Phase 1 不再动态创建 Schema。
// 用户项目的部署数据（preview_deployments 表）也走 RLS。

export class SupabaseProvisioner {
  async provision(tenantId: string): Promise<{ success: boolean }> {
    // Phase 1: RLS 行级隔离，无需创建 Schema
    // 只需确保用户存在于 auth.users 中（Supabase Auth 已处理）
    return { success: true };
  }

  async deprovision(tenantId: string): Promise<{ success: boolean }> {
    // Phase 1: 删除用户的所有数据
    const admin = createAdminClient();
    const tables = [
      'cost_entries', 'dependency_manifests', 'dag_snapshots',
      'dag_events', 'acceptance_records', 'pipeline_runs',
      'file_records', 'node_executions', 'edges', 'nodes', 'projects',
    ];
    for (const table of tables) {
      await admin.from(table).delete().eq('tenant_id', tenantId);
    }
    return { success: true };
  }
}
```

---

## FIX-R2-009: Phase 1 范围澄清

**问题：** MASTER-SEQUENCE 包含了一些 Phase 2+ 的步骤但未明确标注，AI agent 可能试图在 Phase 1 中实现它们。

### Phase 1 不包含的功能（需标注为 Phase 2）

| 功能 | MASTER-SEQUENCE 位置 | 原因 |
|------|---------------------|------|
| 看板视图 | STEP-004 目录树中的 `kanban/page.tsx` | Phase 2 功能 |
| 用户旅程视图 | STEP-004 目录树中的 `journey/page.tsx` | Phase 2 功能 |
| I5 上线确认 | 不在 MASTER-SEQUENCE 中 | Phase 1 仅到预览，不含生产上线 |
| Phase 7 生产部署（用户项目） | 不在 MASTER-SEQUENCE 中 | Phase 1 仅到 Cloudflare Pages 预览 |
| 安全扫描（Semgrep）| STEP-004 目录树中的 `security/` | Phase 2（Phase 1 仅做基础 lint） |
| 多用户协作 | 未明确出现 | Phase 2+ |

### 需要在 MASTER-SEQUENCE 中标注 "Phase 2" 的步骤和位置

在以下位置添加 `<!-- Phase 2: 本步骤中此部分延迟到 Phase 2 -->` 注释：

**STEP-004（目录结构）：**
```markdown
<!-- Phase 2: kanban/page.tsx 和 journey/page.tsx 在 Phase 1 创建空壳文件即可 -->
```

空壳文件内容：
```tsx
// src/app/(dashboard)/projects/[projectId]/kanban/page.tsx
export default function KanbanPage() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      看板视图将在 Phase 2 上线
    </div>
  );
}
```

```tsx
// src/app/(dashboard)/projects/[projectId]/journey/page.tsx
export default function JourneyPage() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      用户旅程视图将在 Phase 2 上线
    </div>
  );
}
```

**STEP-018（三栏布局 top-navbar.tsx）：**
视图切换按钮中，"看板"和"旅程"按钮置灰并添加 tooltip "Phase 2"：
```tsx
{ key: 'kanban', label: '看板', icon: <LayoutDashboardIcon size={16} />, disabled: true, tooltip: 'Phase 2' },
{ key: 'journey', label: '旅程', icon: <RouteIcon size={16} />, disabled: true, tooltip: 'Phase 2' },
```

**STEP-092 ~ STEP-095（生产部署相关）：**
这些步骤是平台自身的生产部署，不是用户项目的生产部署。需区分：
- 平台自身部署到 Cloudflare Pages -> Phase 1 包含（STEP-092）
- 用户项目的生产部署（I5上线） -> Phase 2

在 STEP-092 前添加说明：
```markdown
> **注意：** 以下步骤是 MIXIA Builder 平台自身的生产部署，不是用户项目的生产上线。
> 用户项目在 Phase 1 仅支持预览部署（Cloudflare Pages preview URL）。
> 用户项目的生产部署（I5 上线确认 + 正式域名绑定）在 Phase 2 实现。
```

### Phase 1 出口标准修正（STEP-085）

在 STEP-085 的验证清单中追加：
```markdown
  - [ ] 看板和旅程页面显示 "Phase 2" 占位符（不报错）
  - [ ] 用户项目预览 URL 可访问（非生产域名）
  - [ ] 无 I5 上线流程（Phase 2）
```

---

## FIX-R2-010: STEP-060 前置条件修正

**问题：** STEP-060（预览部署 -- 项目构建服务）的前置条件是 "STEP-059完成"，但 FIX-016 在 STEP-059 和 STEP-060 之间插入了 15 个测试步骤（STEP-059.1 ~ STEP-059.15）。构建部署应在所有测试通过后才开始。

**影响文件：** `docs/execution-plan/MASTER-SEQUENCE.md` STEP-060

### 修正

将 STEP-060 的前置条件从：
```
**前置条件：** STEP-059完成
```

改为：
```
**前置条件：** STEP-059.15完成（确保所有测试在构建前通过）
```

### 依赖链更新

同时更新 MASTER-SEQUENCE.md 末尾的依赖关系图（如果有）：

```
原文：STEP-059 → STEP-060
改为：STEP-059 → STEP-059.1 → ... → STEP-059.15 → STEP-060
```

精确的依赖关系：
- STEP-059.1 依赖 STEP-007（ESLint 配置）
- STEP-059.2 ~ STEP-059.6 依赖 STEP-059.1 + 各自的业务步骤
- STEP-059.7 依赖 STEP-059.1
- STEP-059.8 ~ STEP-059.10 依赖 STEP-059.7 + 各自的组件步骤
- STEP-059.11 依赖 STEP-059.1 + STEP-015
- STEP-059.12 ~ STEP-059.14 依赖 STEP-059.11 + 各自的 API 步骤
- STEP-059.15 依赖 STEP-059.2 ~ STEP-059.14 全部完成
- **STEP-060 依赖 STEP-059.15**

---

## 修复应用后的验证清单

执行完所有 10 项修复后，运行以下验证：

```bash
# 1. MASTER-SEQUENCE.md 不再有 src/server/ 路径（FIX-R2-001）
grep -c "src/server/" docs/execution-plan/MASTER-SEQUENCE.md
# 预期：0（除了目录结构描述的注释行）

# 2. 无 Prisma 引用（FIX-R2-002）
grep -ci "prisma" docs/execution-plan/MASTER-SEQUENCE.md
# 预期：0

# 3. 无 NextAuth 引用（FIX-R2-003）
grep -ci "next-auth\|nextauth\|@auth/" docs/execution-plan/MASTER-SEQUENCE.md
# 预期：0

# 4. 补充的依赖可安装（FIX-R2-004）
cd C:/Projects/mixia-builder
npm ls @aws-sdk/s3-request-presigner openai pino pino-pretty concurrently
# 预期：全部显示版本号

# 5. distPath 引用已替换为 outputDir（FIX-R2-006）
grep -c "distPath" docs/execution-plan/03-deploy-preview.md
# 预期：0

# 6. exec_sql 通用函数已删除（FIX-R2-007）
grep -c "exec_sql" docs/execution-plan/FIX-BEFORE-START.md
# 此处保留为历史记录，实际代码中应使用 create_tenant_schema / drop_tenant_schema

# 7. STEP-060 前置条件正确（FIX-R2-010）
grep "STEP-060" docs/execution-plan/MASTER-SEQUENCE.md | head -3
# 预期：前置条件行显示 STEP-059.15
```

---

## 修复优先级排序

| 优先级 | FIX | 理由 |
|--------|-----|------|
| P0 | FIX-R2-001 | 79 处路径引用不修正会导致 AI agent 创建错误的目录结构 |
| P0 | FIX-R2-002 | Prisma 命令会直接执行失败 |
| P0 | FIX-R2-003 | 不存在的 npm 包导致安装失败 |
| P0 | FIX-R2-004 | 缺失依赖导致 import 报错 |
| P0 | FIX-R2-008 | 多租户策略影响所有数据库操作 |
| P1 | FIX-R2-005 | docker-compose 冲突影响开发环境启动 |
| P1 | FIX-R2-006 | 构建产物路径错误导致部署失败 |
| P1 | FIX-R2-007 | 安全风险（通用 SQL 执行函数） |
| P1 | FIX-R2-009 | 范围不清导致 AI agent 浪费时间实现 Phase 2 功能 |
| P2 | FIX-R2-010 | 依赖顺序错误但不阻塞开发（除非严格按序执行） |
