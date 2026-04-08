# Phase 1 执行方案：预览部署 + 引导式验收

> **文档版本：** v0.1
> **对应Feature：** F-1.5（预览部署）、F-1.6（引导式验收）
> **依赖文档：** pm-builder-chapters-9-11.md（第9章部署、第10章安全）、pm-builder-chapters-12-13.md（第12章架构）
> **预估总代码量：** ~1000行

---

## 文件清单

| # | 文件路径 | 职责 | 预估行数 |
|---|---------|------|---------|
| 1 | `lib/deploy/project-builder.ts` | npm run build 自动化（含错误检测和AI修复） | ~80 |
| 2 | `lib/deploy/cloudflare-deployer.ts` | Cloudflare Pages Direct Upload 部署 | ~90 |
| 3 | `lib/deploy/preview-manager.ts` | 预览URL管理（创建/查询/删除） | ~70 |
| 4 | `lib/deploy/supabase-provisioner.ts` | 为PM项目创建Supabase项目或Schema | ~80 |
| 5 | `lib/screenshot/playwright-pool.ts` | Playwright浏览器池管理（预启动3实例） | ~80 |
| 6 | `lib/screenshot/page-capturer.ts` | 按页面列表自动截图 | ~60 |
| 7 | `lib/screenshot/screenshot-storage.ts` | 截图存储到R2 | ~50 |
| 8 | `app/api/screenshot/capture/route.ts` | 截图API路由 | ~40 |
| 9 | `lib/acceptance/acceptance-engine.ts` | 四阶段验收状态机 | ~90 |
| 10 | `lib/acceptance/checklist-generator.ts` | 从功能地图自动生成验收清单 | ~60 |
| 11 | `lib/acceptance/question-generator.ts` | 为每个功能生成是/否问题+截图 | ~50 |
| 12 | `lib/acceptance/feedback-parser.ts` | PM反馈解析（选择题转技术指令） | ~50 |
| 13 | `lib/acceptance/fix-loop.ts` | 修复循环（AI修复->重新部署->重新截图->PM再验） | ~70 |
| 14 | `app/api/acceptance/start/route.ts` | 验收启动API | ~35 |
| 15 | `app/api/acceptance/feedback/route.ts` | 验收反馈提交API | ~35 |
| 16 | `app/api/acceptance/status/route.ts` | 验收状态查询API | ~25 |
| 17 | `lib/security/semgrep-scanner.ts` | Semgrep扫描集成 | ~60 |
| 18 | `lib/security/dependency-checker.ts` | npm audit检查 | ~50 |
| 19 | `lib/security/secret-scanner.ts` | 硬编码密钥检测 | ~50 |
| 20 | `.semgrep.yml` | Semgrep规则配置 | ~40 |
| 21 | `lib/websocket/progress-server.ts` | Pipeline进度推送 | ~60 |
| 22 | `lib/websocket/acceptance-server.ts` | 验收状态推送 | ~50 |
| 23 | `app/api/ws/route.ts` | WebSocket升级端点 | ~30 |
| 24 | `docker-compose.yml` | 本地开发环境 | ~40 |
| 25 | `Dockerfile.dev` | 开发镜像 | ~20 |
| 26 | `scripts/dev-setup.sh` | 一键启动脚本 | ~30 |

---

## 1. 预览部署（F-1.5）

### 1.1 `lib/deploy/project-builder.ts`

```typescript
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

export interface BuildResult {
  success: boolean;
  distPath: string;
  errors: string[];
  warnings: string[];
  durationMs: number;
}

export interface BuildOptions {
  projectDir: string;
  env: "preview" | "production";
  envVars?: Record<string, string>;
  maxRetries?: number;
}

/**
 * 执行 npm run build，检测错误并返回结构化结果。
 * 如果构建失败，将错误信息返回给调用方以便 AI 修复循环使用。
 */
export async function buildProject(opts: BuildOptions): Promise<BuildResult> {
  const { projectDir, env, envVars = {}, maxRetries = 2 } = opts;
  const distPath = path.join(projectDir, "dist");
  const startTime = Date.now();

  // 注入环境变量
  const buildEnv: Record<string, string> = {
    ...process.env as Record<string, string>,
    NODE_ENV: env === "production" ? "production" : "development",
    NEXT_PUBLIC_ENV: env,
    ...envVars,
  };

  // 确保依赖已安装
  const lockfilePath = path.join(projectDir, "package-lock.json");
  const hasLockfile = await fs.access(lockfilePath).then(() => true).catch(() => false);
  const installCmd = hasLockfile ? "npm ci --ignore-scripts" : "npm install --ignore-scripts";

  try {
    await execAsync(installCmd, { cwd: projectDir, env: buildEnv, timeout: 120_000 });
  } catch (e: any) {
    return {
      success: false,
      distPath,
      errors: [`npm install failed: ${e.stderr || e.message}`],
      warnings: [],
      durationMs: Date.now() - startTime,
    };
  }

  // 执行构建，最多重试 maxRetries 次
  let lastErrors: string[] = [];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { stdout, stderr } = await execAsync("npm run build", {
        cwd: projectDir,
        env: buildEnv,
        timeout: 300_000, // 5分钟超时
      });

      const warnings = extractWarnings(stderr + stdout);
      return {
        success: true,
        distPath,
        errors: [],
        warnings,
        durationMs: Date.now() - startTime,
      };
    } catch (e: any) {
      lastErrors = extractBuildErrors(e.stderr || e.stdout || e.message);
      // 最后一次重试后不再继续
      if (attempt === maxRetries) break;
      // 非最后一次：等待短暂时间后重试
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return {
    success: false,
    distPath,
    errors: lastErrors,
    warnings: [],
    durationMs: Date.now() - startTime,
  };
}

function extractBuildErrors(output: string): string[] {
  const lines = output.split("\n");
  const errors: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.toLowerCase().includes("error") &&
      !trimmed.toLowerCase().includes("0 errors")
    ) {
      errors.push(trimmed);
    }
  }
  return errors.length > 0 ? errors : [output.slice(0, 2000)];
}

function extractWarnings(output: string): string[] {
  return output
    .split("\n")
    .filter((l) => l.toLowerCase().includes("warning") || l.toLowerCase().includes("warn"))
    .map((l) => l.trim())
    .slice(0, 20);
}
```

### 1.2 `lib/deploy/cloudflare-deployer.ts`

```typescript
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export interface DeployResult {
  success: boolean;
  previewUrl: string;
  deploymentId: string;
  r2Prefix: string;
  error?: string;
}

export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  r2BucketName: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  kvNamespaceId: string;
  platformDomain: string; // e.g. "pmbuilder.com"
}

/**
 * Direct Upload 模式部署到 Cloudflare R2 + KV，
 * 不消耗 Pages 构建配额。
 */
export class CloudflareDeployer {
  private config: CloudflareConfig;

  constructor(config: CloudflareConfig) {
    this.config = config;
  }

  /**
   * 将 dist 目录上传到 R2 并写入 KV 路由映射，返回预览 URL。
   */
  async deployPreview(tenantId: string, distPath: string): Promise<DeployResult> {
    const hash = crypto.randomBytes(8).toString("hex");
    const r2Prefix = `tenants/${tenantId}/preview/${hash}/`;
    const deploymentId = `deploy-${hash}`;

    try {
      // 1. 上传 dist 产物到 R2
      const files = await this.collectFiles(distPath);
      await this.uploadToR2(r2Prefix, files);

      // 2. 写入 KV 路由映射
      await this.putKV(`preview:${tenantId}:${hash}`, {
        r2Prefix,
        deploymentId,
        createdAt: new Date().toISOString(),
        ttl: 7 * 24 * 3600, // 7天过期
      });

      const previewUrl = `https://preview-${hash}.${tenantId}.${this.config.platformDomain}`;

      return { success: true, previewUrl, deploymentId, r2Prefix };
    } catch (e: any) {
      return {
        success: false,
        previewUrl: "",
        deploymentId,
        r2Prefix,
        error: e.message,
      };
    }
  }

  /**
   * 将预览版本提升为生产版本，仅切换 KV 指针。
   */
  async promoteToProduction(tenantId: string, previewHash: string): Promise<DeployResult> {
    const previewRoute = await this.getKV(`preview:${tenantId}:${previewHash}`);
    if (!previewRoute) {
      return { success: false, previewUrl: "", deploymentId: "", r2Prefix: "", error: "Preview not found" };
    }

    // 备份当前 production 版本用于回滚
    const currentProd = await this.getKV(`production:${tenantId}`);
    if (currentProd) {
      const rollbackKey = `rollback:${tenantId}:${Date.now()}`;
      await this.putKV(rollbackKey, currentProd);
    }

    // 切换 production 指针到 preview 的 R2 路径
    await this.putKV(`production:${tenantId}`, {
      r2Prefix: previewRoute.r2Prefix,
      deploymentId: previewRoute.deploymentId,
      promotedAt: new Date().toISOString(),
    });

    const prodUrl = `https://${tenantId}.${this.config.platformDomain}`;
    return { success: true, previewUrl: prodUrl, deploymentId: previewRoute.deploymentId, r2Prefix: previewRoute.r2Prefix };
  }

  private async collectFiles(dir: string): Promise<{ relativePath: string; content: Buffer }[]> {
    const results: { relativePath: string; content: Buffer }[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(entry.parentPath || dir, entry.name);
      const relativePath = path.relative(dir, fullPath).replace(/\\/g, "/");
      const content = await fs.readFile(fullPath);
      results.push({ relativePath, content });
    }
    return results;
  }

  private async uploadToR2(prefix: string, files: { relativePath: string; content: Buffer }[]): Promise<void> {
    const endpoint = `https://${this.config.accountId}.r2.cloudflarestorage.com`;
    for (const file of files) {
      const key = `${prefix}${file.relativePath}`;
      const res = await fetch(`${endpoint}/${this.config.r2BucketName}/${key}`, {
        method: "PUT",
        headers: {
          "X-Custom-Auth-Key": this.config.r2AccessKeyId,
          "Content-Type": getMimeType(file.relativePath),
        },
        body: file.content,
      });
      if (!res.ok) throw new Error(`R2 upload failed for ${key}: ${res.status}`);
    }
  }

  private async putKV(key: string, value: unknown): Promise<void> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces/${this.config.kvNamespaceId}/values/${key}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${this.config.apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error(`KV put failed: ${res.status}`);
  }

  private async getKV(key: string): Promise<any | null> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces/${this.config.kvNamespaceId}/values/${key}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.config.apiToken}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`KV get failed: ${res.status}`);
    return res.json();
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
    ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
    ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2",
    ".woff": "font/woff", ".ttf": "font/ttf", ".map": "application/json",
  };
  return map[ext] || "application/octet-stream";
}
```

### 1.3 `lib/deploy/preview-manager.ts`

```typescript
export interface PreviewRecord {
  tenantId: string;
  hash: string;
  previewUrl: string;
  deploymentId: string;
  r2Prefix: string;
  createdAt: string;
  status: "active" | "expired" | "promoted";
}

export interface PreviewManagerDeps {
  db: {
    query: (sql: string, params: unknown[]) => Promise<{ rows: any[] }>;
  };
  deployer: {
    deployPreview: (tenantId: string, distPath: string) => Promise<{ success: boolean; previewUrl: string; deploymentId: string; r2Prefix: string; error?: string }>;
  };
}

/**
 * 管理预览部署的生命周期：创建、查询、删除、过期清理。
 * 每个 tenant 最多保留 5 个 preview，超出自动清理最老的。
 */
export class PreviewManager {
  private deps: PreviewManagerDeps;
  private maxPreviewsPerTenant = 5;

  constructor(deps: PreviewManagerDeps) {
    this.deps = deps;
  }

  async create(tenantId: string, distPath: string): Promise<PreviewRecord> {
    const result = await this.deps.deployer.deployPreview(tenantId, distPath);
    if (!result.success) {
      throw new Error(`Deploy failed: ${result.error}`);
    }

    const record: PreviewRecord = {
      tenantId,
      hash: result.deploymentId.replace("deploy-", ""),
      previewUrl: result.previewUrl,
      deploymentId: result.deploymentId,
      r2Prefix: result.r2Prefix,
      createdAt: new Date().toISOString(),
      status: "active",
    };

    await this.deps.db.query(
      `INSERT INTO preview_deployments (tenant_id, hash, preview_url, deployment_id, r2_prefix, created_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [record.tenantId, record.hash, record.previewUrl, record.deploymentId, record.r2Prefix, record.createdAt, record.status]
    );

    // 超出上限时清理最老的
    await this.enforceLimit(tenantId);

    return record;
  }

  async getByTenant(tenantId: string): Promise<PreviewRecord[]> {
    const { rows } = await this.deps.db.query(
      `SELECT tenant_id, hash, preview_url, deployment_id, r2_prefix, created_at, status
       FROM preview_deployments
       WHERE tenant_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [tenantId]
    );
    return rows.map(toPreviewRecord);
  }

  async getLatest(tenantId: string): Promise<PreviewRecord | null> {
    const records = await this.getByTenant(tenantId);
    return records[0] || null;
  }

  async markExpired(tenantId: string, hash: string): Promise<void> {
    await this.deps.db.query(
      `UPDATE preview_deployments SET status = 'expired' WHERE tenant_id = $1 AND hash = $2`,
      [tenantId, hash]
    );
  }

  async markPromoted(tenantId: string, hash: string): Promise<void> {
    await this.deps.db.query(
      `UPDATE preview_deployments SET status = 'promoted' WHERE tenant_id = $1 AND hash = $2`,
      [tenantId, hash]
    );
  }

  /**
   * 清理超过 7 天的过期预览。由定时任务调用。
   */
  async cleanupExpired(): Promise<number> {
    const { rows } = await this.deps.db.query(
      `UPDATE preview_deployments SET status = 'expired'
       WHERE status = 'active' AND created_at < NOW() - INTERVAL '7 days'
       RETURNING id`,
      []
    );
    return rows.length;
  }

  private async enforceLimit(tenantId: string): Promise<void> {
    const all = await this.getByTenant(tenantId);
    if (all.length <= this.maxPreviewsPerTenant) return;
    const toRemove = all.slice(this.maxPreviewsPerTenant);
    for (const record of toRemove) {
      await this.markExpired(record.tenantId, record.hash);
    }
  }
}

function toPreviewRecord(row: any): PreviewRecord {
  return {
    tenantId: row.tenant_id,
    hash: row.hash,
    previewUrl: row.preview_url,
    deploymentId: row.deployment_id,
    r2Prefix: row.r2_prefix,
    createdAt: row.created_at,
    status: row.status,
  };
}
```

### 1.4 `lib/deploy/supabase-provisioner.ts`

```typescript
export interface SchemaInfo {
  tenantId: string;
  schemaName: string;
  roleName: string;
  connectionString: string;
  createdAt: string;
}

export interface ProvisionerDeps {
  db: {
    query: (sql: string, params: unknown[]) => Promise<{ rows: any[] }>;
  };
  platformDbUrl: string;
}

/**
 * 为每个 PM 项目在共享 PostgreSQL 中创建独立 Schema。
 * 使用 Schema 级隔离 + 独立 Role，配合 RLS 双保险。
 * 对应文档 9.4.2：自托管 PG + 多 Schema 隔离方案。
 */
export class SupabaseProvisioner {
  private deps: ProvisionerDeps;

  constructor(deps: ProvisionerDeps) {
    this.deps = deps;
  }

  /**
   * 创建租户 Schema、专用 Role、设置 search_path 隔离。
   */
  async provision(tenantId: string): Promise<SchemaInfo> {
    const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
    const roleName = `role_${schemaName}`;

    // 幂等检查：是否已存在
    const existing = await this.getSchema(tenantId);
    if (existing) return existing;

    // 创建 Schema
    await this.deps.db.query(`SELECT platform.create_tenant_schema($1, $2)`, [tenantId, schemaName]);

    // 记录到 platform.tenants
    await this.deps.db.query(
      `INSERT INTO platform.tenants (id, slug, owner_id, schema_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [tenantId, tenantId, tenantId, schemaName]
    );

    const info: SchemaInfo = {
      tenantId,
      schemaName,
      roleName,
      connectionString: this.buildConnectionString(schemaName),
      createdAt: new Date().toISOString(),
    };

    return info;
  }

  async getSchema(tenantId: string): Promise<SchemaInfo | null> {
    const { rows } = await this.deps.db.query(
      `SELECT id, schema_name, created_at FROM platform.tenants WHERE id = $1`,
      [tenantId]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      tenantId: row.id,
      schemaName: row.schema_name,
      roleName: `role_${row.schema_name}`,
      connectionString: this.buildConnectionString(row.schema_name),
      createdAt: row.created_at,
    };
  }

  /**
   * 在租户 Schema 中执行 AI 生成的 migration SQL。
   * 强制 search_path 限定在租户 Schema 内，防止跨 Schema 访问。
   */
  async runMigration(tenantId: string, migrationSql: string): Promise<void> {
    const info = await this.getSchema(tenantId);
    if (!info) throw new Error(`Schema not found for tenant ${tenantId}`);

    // 设置 search_path 后再执行 migration
    await this.deps.db.query(`SET search_path TO ${info.schemaName}, public`, []);
    try {
      await this.deps.db.query(migrationSql, []);
    } finally {
      // 恢复默认 search_path
      await this.deps.db.query(`SET search_path TO public`, []);
    }
  }

  /**
   * 删除租户 Schema（不可逆）。仅在租户显式删除项目时调用。
   */
  async deprovision(tenantId: string): Promise<void> {
    const info = await this.getSchema(tenantId);
    if (!info) return;

    await this.deps.db.query(`DROP SCHEMA IF EXISTS ${info.schemaName} CASCADE`, []);
    await this.deps.db.query(`DROP ROLE IF EXISTS ${info.roleName}`, []);
    await this.deps.db.query(`DELETE FROM platform.tenants WHERE id = $1`, [tenantId]);
  }

  /**
   * 返回注入到租户项目的环境变量集合。
   */
  getEnvVars(info: SchemaInfo): Record<string, string> {
    return {
      DATABASE_URL: info.connectionString,
      DB_SCHEMA: info.schemaName,
      PGSCHEMA: info.schemaName,
    };
  }

  private buildConnectionString(schemaName: string): string {
    const base = this.deps.platformDbUrl;
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}schema=${schemaName}`;
  }
}
```

---

## 2. 截图服务

### 2.1 `lib/screenshot/playwright-pool.ts`

```typescript
import type { Browser, BrowserContext, Page } from "playwright";

export interface PoolConfig {
  minInstances: number;   // 预启动的浏览器数量（默认 3）
  maxInstances: number;   // 最大并发浏览器数（默认 10）
  idleTimeoutMs: number;  // 空闲超时后释放实例（默认 5分钟）
  pageTimeoutMs: number;  // 单页面加载超时（默认 15秒）
}

interface PooledBrowser {
  browser: Browser;
  inUse: boolean;
  lastUsedAt: number;
}

const DEFAULT_CONFIG: PoolConfig = {
  minInstances: 3,
  maxInstances: 10,
  idleTimeoutMs: 300_000,
  pageTimeoutMs: 15_000,
};

/**
 * Playwright 浏览器池。
 * 预启动 minInstances 个 Chromium 实例，按需扩展到 maxInstances。
 * 空闲超时后自动回收超出 minInstances 的实例。
 */
export class PlaywrightPool {
  private config: PoolConfig;
  private pool: PooledBrowser[] = [];
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private chromium: typeof import("playwright").chromium | null = null;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    const pw = await import("playwright");
    this.chromium = pw.chromium;

    for (let i = 0; i < this.config.minInstances; i++) {
      const browser = await this.chromium.launch({ headless: true });
      this.pool.push({ browser, inUse: false, lastUsedAt: Date.now() });
    }

    // 定期清理空闲实例
    this.cleanupTimer = setInterval(() => this.cleanupIdle(), 60_000);
  }

  async acquire(): Promise<{ browser: Browser; release: () => void }> {
    // 尝试获取空闲实例
    const idle = this.pool.find((p) => !p.inUse);
    if (idle) {
      idle.inUse = true;
      idle.lastUsedAt = Date.now();
      return { browser: idle.browser, release: () => { idle.inUse = false; idle.lastUsedAt = Date.now(); } };
    }

    // 池未满则新建
    if (this.pool.length < this.config.maxInstances && this.chromium) {
      const browser = await this.chromium.launch({ headless: true });
      const entry: PooledBrowser = { browser, inUse: true, lastUsedAt: Date.now() };
      this.pool.push(entry);
      return { browser, release: () => { entry.inUse = false; entry.lastUsedAt = Date.now(); } };
    }

    // 池已满，等待释放（简易自旋等待，最多 30 秒）
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
      const freed = this.pool.find((p) => !p.inUse);
      if (freed) {
        freed.inUse = true;
        freed.lastUsedAt = Date.now();
        return { browser: freed.browser, release: () => { freed.inUse = false; freed.lastUsedAt = Date.now(); } };
      }
    }
    throw new Error("PlaywrightPool: acquire timeout, all instances busy");
  }

  async createPage(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(this.config.pageTimeoutMs);
    return { context, page };
  }

  private cleanupIdle(): void {
    const now = Date.now();
    const candidates = this.pool.filter(
      (p) => !p.inUse && now - p.lastUsedAt > this.config.idleTimeoutMs
    );
    // 保留 minInstances 个
    const toRemove = candidates.slice(0, Math.max(0, this.pool.length - this.config.minInstances));
    for (const entry of toRemove) {
      entry.browser.close().catch(() => {});
      this.pool = this.pool.filter((p) => p !== entry);
    }
  }

  async shutdown(): Promise<void> {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    for (const entry of this.pool) {
      await entry.browser.close().catch(() => {});
    }
    this.pool = [];
  }

  get stats() {
    return {
      total: this.pool.length,
      inUse: this.pool.filter((p) => p.inUse).length,
      idle: this.pool.filter((p) => !p.inUse).length,
    };
  }
}
```

### 2.2 `lib/screenshot/page-capturer.ts`

```typescript
import type { PlaywrightPool } from "./playwright-pool";
import type { ScreenshotStorage } from "./screenshot-storage";

export interface CaptureRequest {
  url: string;
  pageName: string;
  fullPage?: boolean;
  waitFor?: "networkidle" | "domcontentloaded" | "load";
  elements?: string[]; // 额外截取特定 CSS 选择器元素
}

export interface CaptureResult {
  pageName: string;
  screenshotUrl: string;
  loadTimeMs: number;
  elementScreenshots: { selector: string; url: string }[];
  error?: string;
}

/**
 * 按页面列表自动截图。
 * 为每个 URL 打开页面、等待加载完成、截取全屏+指定元素截图。
 */
export class PageCapturer {
  constructor(
    private pool: PlaywrightPool,
    private storage: ScreenshotStorage
  ) {}

  async capturePages(
    projectId: string,
    pipelineRunId: string,
    requests: CaptureRequest[]
  ): Promise<CaptureResult[]> {
    const results: CaptureResult[] = [];

    for (const req of requests) {
      const result = await this.captureSingle(projectId, pipelineRunId, req);
      results.push(result);
    }

    return results;
  }

  private async captureSingle(
    projectId: string,
    pipelineRunId: string,
    req: CaptureRequest
  ): Promise<CaptureResult> {
    const { browser, release } = await this.pool.acquire();
    try {
      const { context, page } = await this.pool.createPage(browser);
      const startTime = Date.now();

      try {
        await page.goto(req.url, { waitUntil: req.waitFor || "networkidle" });
      } catch {
        await context.close();
        return { pageName: req.pageName, screenshotUrl: "", loadTimeMs: 0, elementScreenshots: [], error: `Page load failed: ${req.url}` };
      }

      const loadTimeMs = Date.now() - startTime;

      // 全页截图
      const fullScreenshot = await page.screenshot({ fullPage: req.fullPage ?? false });
      const key = `${projectId}/${pipelineRunId}/${req.pageName}-1280x720.png`;
      const screenshotUrl = await this.storage.upload(key, fullScreenshot);

      // 元素截图
      const elementScreenshots: { selector: string; url: string }[] = [];
      for (const selector of req.elements || []) {
        try {
          const el = page.locator(selector).first();
          const elBuffer = await el.screenshot();
          const elKey = `${projectId}/${pipelineRunId}/${req.pageName}-${selectorToFileName(selector)}.png`;
          const elUrl = await this.storage.upload(elKey, elBuffer);
          elementScreenshots.push({ selector, url: elUrl });
        } catch {
          // 元素未找到或截图失败，跳过
        }
      }

      await context.close();
      return { pageName: req.pageName, screenshotUrl, loadTimeMs, elementScreenshots };
    } finally {
      release();
    }
  }
}

function selectorToFileName(selector: string): string {
  return selector.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40);
}
```

### 2.3 `lib/screenshot/screenshot-storage.ts`

```typescript
export interface StorageConfig {
  accountId: string;
  r2BucketName: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  publicUrlBase: string; // e.g. "https://screenshots.pmbuilder.com"
}

/**
 * 截图存储到 Cloudflare R2。
 * 对应文档 12.2.5 R2 存储结构中的 /screenshots/ 目录。
 */
export class ScreenshotStorage {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async upload(key: string, buffer: Buffer): Promise<string> {
    const fullKey = `screenshots/${key}`;
    const endpoint = `https://${this.config.accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${this.config.r2BucketName}/${fullKey}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "X-Custom-Auth-Key": this.config.r2AccessKeyId,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
      body: buffer,
    });

    if (!res.ok) {
      throw new Error(`R2 screenshot upload failed: ${res.status} ${await res.text()}`);
    }

    return `${this.config.publicUrlBase}/${fullKey}`;
  }

  async delete(key: string): Promise<void> {
    const fullKey = `screenshots/${key}`;
    const endpoint = `https://${this.config.accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${this.config.r2BucketName}/${fullKey}`;

    await fetch(url, {
      method: "DELETE",
      headers: { "X-Custom-Auth-Key": this.config.r2AccessKeyId },
    });
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = `screenshots/${key}`;
    const endpoint = `https://${this.config.accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${this.config.r2BucketName}/${fullKey}`;

    const res = await fetch(url, {
      method: "HEAD",
      headers: { "X-Custom-Auth-Key": this.config.r2AccessKeyId },
    });
    return res.ok;
  }
}
```

### 2.4 `app/api/screenshot/capture/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PlaywrightPool } from "@/lib/screenshot/playwright-pool";
import { PageCapturer, type CaptureRequest } from "@/lib/screenshot/page-capturer";
import { ScreenshotStorage } from "@/lib/screenshot/screenshot-storage";

// 全局单例池（在服务端进程生命周期内复用）
let pool: PlaywrightPool | null = null;

async function getPool(): Promise<PlaywrightPool> {
  if (!pool) {
    pool = new PlaywrightPool({ minInstances: 2, maxInstances: 5 });
    await pool.initialize();
  }
  return pool;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, pipelineRunId, pages } = body as {
    projectId: string;
    pipelineRunId: string;
    pages: CaptureRequest[];
  };

  if (!projectId || !pipelineRunId || !Array.isArray(pages) || pages.length === 0) {
    return NextResponse.json({ error: "Missing projectId, pipelineRunId, or pages" }, { status: 400 });
  }

  if (pages.length > 20) {
    return NextResponse.json({ error: "Max 20 pages per request" }, { status: 400 });
  }

  const storage = new ScreenshotStorage({
    accountId: process.env.CF_ACCOUNT_ID!,
    r2BucketName: process.env.R2_BUCKET_NAME!,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID!,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    publicUrlBase: process.env.SCREENSHOT_PUBLIC_URL!,
  });

  const browserPool = await getPool();
  const capturer = new PageCapturer(browserPool, storage);

  const results = await capturer.capturePages(projectId, pipelineRunId, pages);

  return NextResponse.json({ results, stats: browserPool.stats });
}
```

---

## 3. 引导式验收（F-1.6）

### 3.1 `lib/acceptance/acceptance-engine.ts`

```typescript
/**
 * 四阶段验收状态机：
 *   PENDING -> IN_PROGRESS -> WAITING_FIX -> COMPLETED
 *
 * PM 在每个功能上回答 是/否 问题。
 * "否"的功能进入修复循环（AI修复 -> 重新部署 -> 重新截图 -> PM再验）。
 * 全部通过则进入 COMPLETED。
 */

export type AcceptancePhase = "PENDING" | "IN_PROGRESS" | "WAITING_FIX" | "COMPLETED";

export interface AcceptanceItem {
  featureName: string;
  stepIndex: number;
  question: string;
  screenshotUrl: string;
  pmAnswer: "yes" | "no" | null;
  pmFeedback: string | null;
  fixAttempt: number;
}

export interface AcceptanceState {
  projectId: string;
  pipelineRunId: string;
  phase: AcceptancePhase;
  items: AcceptanceItem[];
  currentItemIndex: number;
  totalFixAttempts: number;
  maxFixAttempts: number;
  startedAt: string;
  completedAt: string | null;
}

export interface AcceptanceEngineDeps {
  db: {
    query: (sql: string, params: unknown[]) => Promise<{ rows: any[] }>;
  };
  onPhaseChange?: (state: AcceptanceState) => void;
}

export class AcceptanceEngine {
  private deps: AcceptanceEngineDeps;

  constructor(deps: AcceptanceEngineDeps) {
    this.deps = deps;
  }

  /**
   * 初始化验收流程：根据清单条目列表创建状态。
   */
  async start(projectId: string, pipelineRunId: string, items: Omit<AcceptanceItem, "pmAnswer" | "pmFeedback" | "fixAttempt">[]): Promise<AcceptanceState> {
    const state: AcceptanceState = {
      projectId,
      pipelineRunId,
      phase: "IN_PROGRESS",
      items: items.map((item) => ({ ...item, pmAnswer: null, pmFeedback: null, fixAttempt: 0 })),
      currentItemIndex: 0,
      totalFixAttempts: 0,
      maxFixAttempts: 3,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    await this.persistState(state);
    this.deps.onPhaseChange?.(state);
    return state;
  }

  /**
   * PM 提交一个验收条目的回答。
   */
  async submitAnswer(
    projectId: string,
    pipelineRunId: string,
    stepIndex: number,
    answer: "yes" | "no",
    feedback?: string
  ): Promise<AcceptanceState> {
    const state = await this.loadState(projectId, pipelineRunId);
    if (!state) throw new Error("Acceptance session not found");
    if (state.phase === "COMPLETED") throw new Error("Acceptance already completed");

    const item = state.items.find((i) => i.stepIndex === stepIndex);
    if (!item) throw new Error(`Step ${stepIndex} not found`);

    item.pmAnswer = answer;
    item.pmFeedback = feedback || null;

    // 写入 acceptance_records 表
    await this.deps.db.query(
      `INSERT INTO acceptance_records (project_id, pipeline_run, feature_name, step_index, question, pm_answer, screenshot_url, pm_feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (project_id, pipeline_run, step_index)
       DO UPDATE SET pm_answer = $6, pm_feedback = $8`,
      [projectId, pipelineRunId, item.featureName, stepIndex, item.question, answer, item.screenshotUrl, item.pmFeedback]
    );

    // 推进状态
    this.advanceState(state);
    await this.persistState(state);
    this.deps.onPhaseChange?.(state);

    return state;
  }

  async getState(projectId: string, pipelineRunId: string): Promise<AcceptanceState | null> {
    return this.loadState(projectId, pipelineRunId);
  }

  /**
   * 修复循环完成后调用：更新截图URL，重置该条目的回答，让 PM 再次验收。
   */
  async retryAfterFix(
    projectId: string,
    pipelineRunId: string,
    stepIndex: number,
    newScreenshotUrl: string
  ): Promise<AcceptanceState> {
    const state = await this.loadState(projectId, pipelineRunId);
    if (!state) throw new Error("Acceptance session not found");

    const item = state.items.find((i) => i.stepIndex === stepIndex);
    if (!item) throw new Error(`Step ${stepIndex} not found`);

    item.pmAnswer = null;
    item.pmFeedback = null;
    item.screenshotUrl = newScreenshotUrl;
    item.fixAttempt += 1;
    state.totalFixAttempts += 1;
    state.phase = "IN_PROGRESS";

    await this.persistState(state);
    this.deps.onPhaseChange?.(state);
    return state;
  }

  private advanceState(state: AcceptanceState): void {
    const unanswered = state.items.filter((i) => i.pmAnswer === null);
    const rejected = state.items.filter((i) => i.pmAnswer === "no");

    if (unanswered.length > 0) {
      // 还有未回答的条目
      state.currentItemIndex = state.items.indexOf(unanswered[0]);
      state.phase = "IN_PROGRESS";
    } else if (rejected.length > 0 && state.totalFixAttempts < state.maxFixAttempts) {
      // 有不通过的条目且还有修复机会
      state.phase = "WAITING_FIX";
    } else {
      // 全部回答完毕（或修复次数用尽）
      state.phase = "COMPLETED";
      state.completedAt = new Date().toISOString();
    }
  }

  private async persistState(state: AcceptanceState): Promise<void> {
    await this.deps.db.query(
      `INSERT INTO acceptance_sessions (project_id, pipeline_run_id, state_json, phase)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, pipeline_run_id)
       DO UPDATE SET state_json = $3, phase = $4`,
      [state.projectId, state.pipelineRunId, JSON.stringify(state), state.phase]
    );
  }

  private async loadState(projectId: string, pipelineRunId: string): Promise<AcceptanceState | null> {
    const { rows } = await this.deps.db.query(
      `SELECT state_json FROM acceptance_sessions WHERE project_id = $1 AND pipeline_run_id = $2`,
      [projectId, pipelineRunId]
    );
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].state_json);
  }
}
```

### 3.2 `lib/acceptance/checklist-generator.ts`

```typescript
/**
 * 从功能地图（DAG 节点）自动生成验收清单。
 * 每个 type=feature 或 type=page 的节点生成一组验收条目。
 */

export interface DagNode {
  id: string;
  type: string; // feature | page | flow | data | connect | rule | milestone
  label: string;
  description: string | null;
  metadata: Record<string, unknown>;
}

export interface ChecklistItem {
  featureName: string;
  stepIndex: number;
  description: string;
  expectedBehavior: string;
  pageUrl: string | null; // 对应的预览页面 URL（page 节点有，feature 节点可能无）
  screenshotNeeded: boolean;
}

/**
 * 为项目的所有用户可见节点生成验收清单。
 * - page 节点：截图 + "此页面看起来正确吗？"
 * - feature 节点：功能描述 + "此功能符合预期吗？"
 * - flow 节点：操作步骤描述 + "流程可以正常走通吗？"
 */
export function generateChecklist(
  nodes: DagNode[],
  previewBaseUrl: string
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let stepIndex = 0;

  // 按类型分优先级：page > feature > flow，其他类型不进入验收
  const acceptableTypes = ["page", "feature", "flow"];
  const acceptableNodes = nodes
    .filter((n) => acceptableTypes.includes(n.type))
    .sort((a, b) => acceptableTypes.indexOf(a.type) - acceptableTypes.indexOf(b.type));

  for (const node of acceptableNodes) {
    stepIndex++;

    if (node.type === "page") {
      const pagePath = (node.metadata.route as string) || `/${slugify(node.label)}`;
      items.push({
        featureName: node.label,
        stepIndex,
        description: node.description || `页面：${node.label}`,
        expectedBehavior: `页面正确显示，布局和内容符合预期`,
        pageUrl: `${previewBaseUrl}${pagePath}`,
        screenshotNeeded: true,
      });
    } else if (node.type === "feature") {
      items.push({
        featureName: node.label,
        stepIndex,
        description: node.description || `功能：${node.label}`,
        expectedBehavior: `功能正常运作，操作结果符合预期`,
        pageUrl: null,
        screenshotNeeded: false,
      });
    } else if (node.type === "flow") {
      items.push({
        featureName: node.label,
        stepIndex,
        description: node.description || `流程：${node.label}`,
        expectedBehavior: `流程可以正常从头走到尾`,
        pageUrl: null,
        screenshotNeeded: false,
      });
    }
  }

  return items;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

### 3.3 `lib/acceptance/question-generator.ts`

```typescript
import type { ChecklistItem } from "./checklist-generator";
import type { AcceptanceItem } from "./acceptance-engine";

/**
 * 将验收清单条目转换为 PM 可直接回答的 是/否 问题 + 截图。
 * PM 不需要理解任何技术术语。
 */
export function generateQuestions(
  checklistItems: ChecklistItem[],
  screenshotUrls: Map<string, string> // pageName -> screenshotUrl
): Omit<AcceptanceItem, "pmAnswer" | "pmFeedback" | "fixAttempt">[] {
  return checklistItems.map((item) => {
    const screenshotUrl = screenshotUrls.get(item.featureName) || "";

    const question = buildQuestion(item);

    return {
      featureName: item.featureName,
      stepIndex: item.stepIndex,
      question,
      screenshotUrl,
    };
  });
}

function buildQuestion(item: ChecklistItem): string {
  switch (true) {
    case item.screenshotNeeded:
      // 有截图的页面类问题
      return `请看上面的截图。"${item.featureName}"页面看起来正确吗？布局、文字、图片是否符合您的预期？`;

    case item.description.includes("流程"):
      // 流程类问题
      return `"${item.featureName}"的操作流程符合您的设计吗？如果不符合，请描述哪里需要修改。`;

    default:
      // 通用功能问题
      return `"${item.featureName}"功能是否符合您的预期？`;
  }
}
```

### 3.4 `lib/acceptance/feedback-parser.ts`

```typescript
/**
 * 将 PM 的验收反馈（自然语言）解析为结构化的技术修复指令。
 * PM 说"这个按钮颜色不对"，转换为 { type: "style_fix", target: "button", detail: "颜色不对" }。
 */

export type FixType = "style_fix" | "layout_fix" | "content_fix" | "logic_fix" | "missing_feature" | "remove_element" | "unknown";

export interface ParsedFeedback {
  stepIndex: number;
  featureName: string;
  fixType: FixType;
  target: string;
  detail: string;
  originalFeedback: string;
  confidence: number; // 0-1，解析置信度
}

/**
 * 基于关键词规则的轻量解析。
 * Phase 1 不依赖 AI 解析反馈，用关键词匹配实现最小可用版本。
 * 后续 Phase 可升级为 AI 语义解析。
 */
export function parseFeedback(
  stepIndex: number,
  featureName: string,
  feedback: string
): ParsedFeedback {
  const lower = feedback.toLowerCase();
  const original = feedback;

  // 样式类
  if (matchesAny(lower, ["颜色", "色", "color", "字体", "font", "大小", "size", "粗", "bold", "斜", "italic"])) {
    return { stepIndex, featureName, fixType: "style_fix", target: extractTarget(feedback), detail: feedback, originalFeedback: original, confidence: 0.8 };
  }

  // 布局类
  if (matchesAny(lower, ["位置", "对齐", "居中", "靠左", "靠右", "间距", "spacing", "margin", "padding", "布局", "layout"])) {
    return { stepIndex, featureName, fixType: "layout_fix", target: extractTarget(feedback), detail: feedback, originalFeedback: original, confidence: 0.8 };
  }

  // 内容类
  if (matchesAny(lower, ["文字", "文本", "text", "标题", "title", "描述", "错字", "typo", "内容"])) {
    return { stepIndex, featureName, fixType: "content_fix", target: extractTarget(feedback), detail: feedback, originalFeedback: original, confidence: 0.7 };
  }

  // 逻辑类
  if (matchesAny(lower, ["不工作", "报错", "error", "bug", "点击没反应", "不能", "无法", "失败", "逻辑"])) {
    return { stepIndex, featureName, fixType: "logic_fix", target: extractTarget(feedback), detail: feedback, originalFeedback: original, confidence: 0.6 };
  }

  // 缺失功能
  if (matchesAny(lower, ["没有", "缺少", "missing", "需要加", "应该有", "加一个"])) {
    return { stepIndex, featureName, fixType: "missing_feature", target: extractTarget(feedback), detail: feedback, originalFeedback: original, confidence: 0.6 };
  }

  // 删除元素
  if (matchesAny(lower, ["删掉", "去掉", "不要", "remove", "多余", "不需要"])) {
    return { stepIndex, featureName, fixType: "remove_element", target: extractTarget(feedback), detail: feedback, originalFeedback: original, confidence: 0.6 };
  }

  // 无法识别
  return { stepIndex, featureName, fixType: "unknown", target: "", detail: feedback, originalFeedback: original, confidence: 0.3 };
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

function extractTarget(feedback: string): string {
  // 简易目标提取：引号内的内容 或 "按钮/表格/图片" 等名词
  const quoted = feedback.match(/["""](.+?)["""]/);
  if (quoted) return quoted[1];

  const uiElements = ["按钮", "表格", "图片", "菜单", "导航", "表单", "输入框", "下拉", "弹窗", "卡片", "列表", "头部", "底部", "侧栏"];
  for (const el of uiElements) {
    if (feedback.includes(el)) return el;
  }

  return feedback.slice(0, 20);
}
```

### 3.5 `lib/acceptance/fix-loop.ts`

```typescript
import type { AcceptanceEngine, AcceptanceState, AcceptanceItem } from "./acceptance-engine";
import type { ParsedFeedback } from "./feedback-parser";
import { parseFeedback } from "./feedback-parser";
import type { PageCapturer, CaptureRequest } from "../screenshot/page-capturer";

export interface FixLoopDeps {
  acceptanceEngine: AcceptanceEngine;
  pageCapturer: PageCapturer;
  /** 调用 AI 修复代码。返回修复是否成功。 */
  aiFixCode: (projectId: string, instruction: string) => Promise<boolean>;
  /** 重新构建并部署预览。返回新的预览 URL。 */
  rebuildAndDeploy: (projectId: string) => Promise<string>;
  /** 通过 WebSocket 通知 PM 修复进度。 */
  notifyProgress: (projectId: string, message: string) => void;
}

/**
 * 修复循环：
 * 1. 解析 PM 的 "否" 反馈为技术指令
 * 2. 调用 AI 修复代码
 * 3. 重新构建部署
 * 4. 重新截图
 * 5. 更新验收状态让 PM 再次验证
 *
 * 最多循环 3 次，超过后标记为需要人工介入。
 */
export class FixLoop {
  private deps: FixLoopDeps;

  constructor(deps: FixLoopDeps) {
    this.deps = deps;
  }

  /**
   * 对所有被 PM 拒绝的条目执行修复循环。
   */
  async runFixCycle(projectId: string, pipelineRunId: string): Promise<{
    fixedCount: number;
    failedCount: number;
    updatedState: AcceptanceState;
  }> {
    const state = await this.deps.acceptanceEngine.getState(projectId, pipelineRunId);
    if (!state) throw new Error("Acceptance session not found");

    const rejected = state.items.filter((i) => i.pmAnswer === "no");
    if (rejected.length === 0) {
      return { fixedCount: 0, failedCount: 0, updatedState: state };
    }

    this.deps.notifyProgress(projectId, `开始修复 ${rejected.length} 个问题...`);

    let fixedCount = 0;
    let failedCount = 0;

    // 逐条修复
    for (const item of rejected) {
      const parsed = parseFeedback(item.stepIndex, item.featureName, item.pmFeedback || "需要修复");

      this.deps.notifyProgress(projectId, `正在修复: ${item.featureName} (${parsed.fixType})`);

      const instruction = buildFixInstruction(parsed);
      const fixSuccess = await this.deps.aiFixCode(projectId, instruction);

      if (fixSuccess) {
        fixedCount++;
      } else {
        failedCount++;
      }
    }

    // 如果有修复成功的，重新构建部署
    if (fixedCount > 0) {
      this.deps.notifyProgress(projectId, "重新构建部署中...");
      const newPreviewUrl = await this.deps.rebuildAndDeploy(projectId);

      // 重新截图
      this.deps.notifyProgress(projectId, "重新截图中...");
      const pageRequests = buildRecaptureRequests(rejected, newPreviewUrl);
      const newScreenshots = await this.deps.pageCapturer.capturePages(projectId, pipelineRunId, pageRequests);

      // 更新验收状态
      for (const item of rejected) {
        const newShot = newScreenshots.find((s) => s.pageName === item.featureName);
        if (newShot?.screenshotUrl) {
          await this.deps.acceptanceEngine.retryAfterFix(
            projectId,
            pipelineRunId,
            item.stepIndex,
            newShot.screenshotUrl
          );
        }
      }

      this.deps.notifyProgress(projectId, `修复完成，请重新检查 ${fixedCount} 个已修复的功能`);
    }

    const updatedState = await this.deps.acceptanceEngine.getState(projectId, pipelineRunId);
    return { fixedCount, failedCount, updatedState: updatedState! };
  }
}

function buildFixInstruction(parsed: ParsedFeedback): string {
  const typeLabels: Record<string, string> = {
    style_fix: "样式修复",
    layout_fix: "布局修复",
    content_fix: "内容修复",
    logic_fix: "逻辑修复",
    missing_feature: "缺失功能补充",
    remove_element: "移除元素",
    unknown: "修复",
  };

  return [
    `## ${typeLabels[parsed.fixType] || "修复"}任务`,
    `功能名称: ${parsed.featureName}`,
    `修改目标: ${parsed.target}`,
    `PM反馈: ${parsed.detail}`,
    ``,
    `请根据 PM 反馈修复对应代码。只修改必要的部分，不要改动其他功能。`,
  ].join("\n");
}

function buildRecaptureRequests(items: AcceptanceItem[], previewUrl: string): CaptureRequest[] {
  return items.map((item) => ({
    url: previewUrl, // 简化：Phase 1 全截首页，后续可按页面路由精确截图
    pageName: item.featureName,
    fullPage: false,
    waitFor: "networkidle" as const,
  }));
}
```

### 3.6 `app/api/acceptance/start/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { AcceptanceEngine } from "@/lib/acceptance/acceptance-engine";
import { generateChecklist, type DagNode } from "@/lib/acceptance/checklist-generator";
import { generateQuestions } from "@/lib/acceptance/question-generator";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, pipelineRunId, previewUrl } = body as {
    projectId: string;
    pipelineRunId: string;
    previewUrl: string;
  };

  if (!projectId || !pipelineRunId || !previewUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();

  // 1. 从 DB 加载项目的 DAG 节点
  const { rows: nodes } = await db.query(
    `SELECT id, type, label, description, metadata FROM nodes WHERE project_id = $1`,
    [projectId]
  );

  // 2. 生成验收清单
  const checklist = generateChecklist(nodes as DagNode[], previewUrl);
  if (checklist.length === 0) {
    return NextResponse.json({ error: "No verifiable features found in project" }, { status: 400 });
  }

  // 3. 查找已有截图（由 Pipeline Phase 5 阶段截取）
  const { rows: screenshots } = await db.query(
    `SELECT feature_name, screenshot_url FROM acceptance_records
     WHERE project_id = $1 AND pipeline_run = $2`,
    [projectId, pipelineRunId]
  );
  const screenshotMap = new Map(screenshots.map((s: any) => [s.feature_name, s.screenshot_url]));

  // 4. 生成问题列表
  const questions = generateQuestions(checklist, screenshotMap);

  // 5. 启动验收引擎
  const engine = new AcceptanceEngine({ db });
  const state = await engine.start(projectId, pipelineRunId, questions);

  return NextResponse.json({ state });
}
```

### 3.7 `app/api/acceptance/feedback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { AcceptanceEngine } from "@/lib/acceptance/acceptance-engine";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, pipelineRunId, stepIndex, answer, feedback } = body as {
    projectId: string;
    pipelineRunId: string;
    stepIndex: number;
    answer: "yes" | "no";
    feedback?: string;
  };

  if (!projectId || !pipelineRunId || stepIndex == null || !answer) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (answer !== "yes" && answer !== "no") {
    return NextResponse.json({ error: "Answer must be 'yes' or 'no'" }, { status: 400 });
  }

  if (answer === "no" && !feedback) {
    return NextResponse.json({ error: "Feedback is required when answer is 'no'" }, { status: 400 });
  }

  const db = getDb();
  const engine = new AcceptanceEngine({ db });

  const state = await engine.submitAnswer(projectId, pipelineRunId, stepIndex, answer, feedback);

  return NextResponse.json({ state });
}
```

### 3.8 `app/api/acceptance/status/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { AcceptanceEngine } from "@/lib/acceptance/acceptance-engine";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const pipelineRunId = searchParams.get("pipelineRunId");

  if (!projectId || !pipelineRunId) {
    return NextResponse.json({ error: "Missing projectId or pipelineRunId" }, { status: 400 });
  }

  const db = getDb();
  const engine = new AcceptanceEngine({ db });

  const state = await engine.getState(projectId, pipelineRunId);
  if (!state) {
    return NextResponse.json({ error: "Acceptance session not found" }, { status: 404 });
  }

  const summary = {
    phase: state.phase,
    total: state.items.length,
    answered: state.items.filter((i) => i.pmAnswer !== null).length,
    passed: state.items.filter((i) => i.pmAnswer === "yes").length,
    failed: state.items.filter((i) => i.pmAnswer === "no").length,
    pending: state.items.filter((i) => i.pmAnswer === null).length,
    fixAttempts: state.totalFixAttempts,
    maxFixAttempts: state.maxFixAttempts,
  };

  return NextResponse.json({ state, summary });
}
```

---

## 4. 安全基线（Phase 1 最小安全集）

### 4.1 `lib/security/semgrep-scanner.ts`

```typescript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type Severity = "ERROR" | "WARNING" | "INFO";

export interface ScanFinding {
  ruleId: string;
  severity: Severity;
  message: string;
  path: string;
  startLine: number;
  endLine: number;
  snippet: string;
}

export interface ScanResult {
  findings: ScanFinding[];
  criticalCount: number;
  highCount: number;
  scanDurationMs: number;
  blocked: boolean;
}

/**
 * Semgrep 扫描集成。
 * 后台运行，Phase 1 只阻塞 Critical 级别漏洞。
 * 对应文档 10.3.1 Semgrep 规则集配置。
 */
export class SemgrepScanner {
  private configPath: string;

  constructor(configPath: string = ".semgrep.yml") {
    this.configPath = configPath;
  }

  async scan(targetDir: string): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      // 运行 semgrep，输出 JSON 格式
      const { stdout } = await execAsync(
        `semgrep --config ${this.configPath} --json --timeout 60 ${targetDir}`,
        { timeout: 120_000, maxBuffer: 10 * 1024 * 1024 }
      );

      const raw = JSON.parse(stdout);
      const findings = this.parseFindings(raw);
      const criticalCount = findings.filter((f) => f.severity === "ERROR").length;
      const highCount = findings.filter((f) => f.severity === "WARNING").length;

      return {
        findings,
        criticalCount,
        highCount,
        scanDurationMs: Date.now() - startTime,
        blocked: criticalCount > 0, // Phase 1: 仅 ERROR 级别阻塞
      };
    } catch (e: any) {
      // semgrep 未安装或执行错误时，返回空结果而非阻塞 Pipeline
      return {
        findings: [],
        criticalCount: 0,
        highCount: 0,
        scanDurationMs: Date.now() - startTime,
        blocked: false,
      };
    }
  }

  /**
   * 返回可供 AI 修复的指令文本。
   */
  formatForAiFix(findings: ScanFinding[]): string {
    if (findings.length === 0) return "";

    const lines = findings
      .filter((f) => f.severity === "ERROR")
      .map((f) => `- [${f.ruleId}] ${f.path}:${f.startLine} — ${f.message}\n  代码: ${f.snippet}`)
      .join("\n");

    return `## 安全扫描发现以下 Critical 问题，请修复：\n\n${lines}`;
  }

  private parseFindings(raw: any): ScanFinding[] {
    if (!raw?.results) return [];

    return raw.results.map((r: any) => ({
      ruleId: r.check_id || "unknown",
      severity: this.mapSeverity(r.extra?.severity),
      message: r.extra?.message || r.check_id,
      path: r.path,
      startLine: r.start?.line || 0,
      endLine: r.end?.line || 0,
      snippet: r.extra?.lines || "",
    }));
  }

  private mapSeverity(s: string | undefined): Severity {
    if (s === "ERROR" || s === "error") return "ERROR";
    if (s === "WARNING" || s === "warning") return "WARNING";
    return "INFO";
  }
}
```

### 4.2 `lib/security/dependency-checker.ts`

```typescript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface AuditVulnerability {
  name: string;
  severity: "critical" | "high" | "moderate" | "low";
  title: string;
  url: string;
  fixAvailable: boolean;
}

export interface AuditResult {
  vulnerabilities: AuditVulnerability[];
  criticalCount: number;
  highCount: number;
  blocked: boolean;
  autoFixApplied: boolean;
  durationMs: number;
}

/**
 * npm audit 检查。
 * 对应文档 10.3.2 npm audit 集成。
 * Phase 1: critical/high 阻塞，moderate 尝试自动修复。
 */
export class DependencyChecker {
  async check(projectDir: string): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      // 执行 npm audit --json
      const { stdout } = await execAsync("npm audit --json", {
        cwd: projectDir,
        timeout: 60_000,
      }).catch((e) => ({ stdout: e.stdout || "{}" })); // npm audit 有漏洞时 exit code 非0

      const raw = JSON.parse(stdout);
      const vulnerabilities = this.parseVulnerabilities(raw);
      const criticalCount = vulnerabilities.filter((v) => v.severity === "critical").length;
      const highCount = vulnerabilities.filter((v) => v.severity === "high").length;

      let autoFixApplied = false;

      // 尝试自动修复 moderate 级别
      const moderateFixable = vulnerabilities.filter((v) => v.severity === "moderate" && v.fixAvailable);
      if (moderateFixable.length > 0) {
        try {
          await execAsync("npm audit fix", { cwd: projectDir, timeout: 60_000 });
          autoFixApplied = true;
        } catch {
          // 自动修复失败不阻塞
        }
      }

      return {
        vulnerabilities,
        criticalCount,
        highCount,
        blocked: criticalCount > 0 || highCount > 0,
        autoFixApplied,
        durationMs: Date.now() - startTime,
      };
    } catch {
      // 无法执行 npm audit（如无 package-lock.json），不阻塞
      return {
        vulnerabilities: [],
        criticalCount: 0,
        highCount: 0,
        blocked: false,
        autoFixApplied: false,
        durationMs: Date.now() - startTime,
      };
    }
  }

  private parseVulnerabilities(raw: any): AuditVulnerability[] {
    if (!raw?.vulnerabilities) return [];

    return Object.entries(raw.vulnerabilities).map(([name, v]: [string, any]) => ({
      name,
      severity: v.severity || "low",
      title: v.title || v.via?.[0]?.title || name,
      url: v.url || v.via?.[0]?.url || "",
      fixAvailable: !!v.fixAvailable,
    }));
  }
}
```

### 4.3 `lib/security/secret-scanner.ts`

```typescript
import fs from "fs/promises";
import path from "path";

export interface SecretFinding {
  file: string;
  line: number;
  patternId: string;
  match: string; // 部分脱敏后的匹配内容
}

export interface SecretScanResult {
  findings: SecretFinding[];
  blocked: boolean;
  scannedFiles: number;
}

// 硬编码密钥检测正则
const SECRET_PATTERNS: { id: string; regex: RegExp }[] = [
  { id: "aws-access-key", regex: /AKIA[0-9A-Z]{16}/g },
  { id: "anthropic-api-key", regex: /sk-ant-[a-zA-Z0-9\-_]{20,}/g },
  { id: "openai-api-key", regex: /sk-[a-zA-Z0-9]{20,}/g },
  { id: "github-token", regex: /gh[ps]_[a-zA-Z0-9]{36,}/g },
  { id: "supabase-key", regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g },
  { id: "generic-secret-assign", regex: /(?:password|secret|api_key|apikey|token)\s*[:=]\s*["'][^"']{8,}["']/gi },
  { id: "private-key-header", regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { id: "stripe-key", regex: /sk_live_[a-zA-Z0-9]{20,}/g },
];

// 白名单：允许出现的安全模式（如环境变量引用）
const WHITELIST_PATTERNS = [
  /process\.env\.\w+/,
  /import\.meta\.env\.\w+/,
  /os\.environ/,
  /\$\{?\w+_SECRET\}?/, // shell变量引用
];

/**
 * 硬编码密钥检测。
 * 对应文档 10.3.3 gitleaks 秘密检测。
 * Phase 1 用内置正则实现（无需安装 gitleaks 二进制），后续可替换为 gitleaks。
 */
export class SecretScanner {
  async scan(targetDir: string): Promise<SecretScanResult> {
    const files = await this.collectFiles(targetDir);
    const findings: SecretFinding[] = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        if (this.isWhitelisted(line)) continue;

        for (const pattern of SECRET_PATTERNS) {
          pattern.regex.lastIndex = 0;
          const match = pattern.regex.exec(line);
          if (match) {
            findings.push({
              file: path.relative(targetDir, filePath),
              line: lineNum + 1,
              patternId: pattern.id,
              match: this.redact(match[0]),
            });
          }
        }
      }
    }

    return {
      findings,
      blocked: findings.length > 0,
      scannedFiles: files.length,
    };
  }

  /**
   * 自动将硬编码密钥替换为环境变量引用。
   */
  async autoRedact(targetDir: string, findings: SecretFinding[]): Promise<number> {
    let redactedCount = 0;

    for (const finding of findings) {
      const filePath = path.join(targetDir, finding.file);
      const content = await fs.readFile(filePath, "utf-8");

      const envVarName = this.suggestEnvVarName(finding.patternId);
      // 将密钥值替换为 process.env.XXX
      const replaced = content.replace(
        new RegExp(`["']${escapeRegex(finding.match)}["']`, "g"),
        `process.env.${envVarName}`
      );

      if (replaced !== content) {
        await fs.writeFile(filePath, replaced);
        redactedCount++;
      }
    }

    return redactedCount;
  }

  private isWhitelisted(line: string): boolean {
    return WHITELIST_PATTERNS.some((p) => p.test(line));
  }

  private redact(value: string): string {
    if (value.length <= 8) return "***";
    return value.slice(0, 4) + "***" + value.slice(-4);
  }

  private suggestEnvVarName(patternId: string): string {
    const map: Record<string, string> = {
      "aws-access-key": "AWS_ACCESS_KEY_ID",
      "anthropic-api-key": "ANTHROPIC_API_KEY",
      "openai-api-key": "OPENAI_API_KEY",
      "github-token": "GITHUB_TOKEN",
      "supabase-key": "SUPABASE_KEY",
      "generic-secret-assign": "APP_SECRET",
      "private-key-header": "PRIVATE_KEY",
      "stripe-key": "STRIPE_SECRET_KEY",
    };
    return map[patternId] || "SECRET_VALUE";
  }

  private async collectFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(entry.parentPath || dir, entry.name);
      // 跳过 node_modules、.git、binary 文件
      if (fullPath.includes("node_modules") || fullPath.includes(".git/")) continue;
      const ext = path.extname(fullPath).toLowerCase();
      if ([".ts", ".tsx", ".js", ".jsx", ".json", ".env", ".yaml", ".yml", ".toml", ".cfg", ".conf"].includes(ext)) {
        results.push(fullPath);
      }
    }
    return results;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

### 4.4 `.semgrep.yml`

```yaml
rules:
  - id: no-eval-user-input
    pattern: eval($X)
    message: "禁止使用 eval()。AI 生成代码不应包含 eval 调用。"
    severity: ERROR
    languages: [javascript, typescript]

  - id: no-env-leak-response
    patterns:
      - pattern: res.json({..., $KEY: process.env.$VAR, ...})
    message: "禁止将环境变量内容发送到客户端。"
    severity: ERROR
    languages: [javascript, typescript]

  - id: no-env-leak-log
    patterns:
      - pattern: console.log(process.env)
      - pattern: JSON.stringify(process.env)
    message: "禁止将完整 process.env 写入日志或序列化。"
    severity: ERROR
    languages: [javascript, typescript]

  - id: sql-injection-string-concat
    patterns:
      - pattern: $DB.query(`... ${$VAR} ...`)
      - pattern: $DB.query("..." + $VAR + "...")
    message: "SQL 查询必须使用参数化查询 ($1, $2)，禁止字符串拼接。"
    severity: ERROR
    languages: [javascript, typescript]

  - id: no-arbitrary-file-read
    patterns:
      - pattern: fs.readFileSync($PATH)
      - pattern: fs.readFile($PATH, ...)
    message: "文件读取路径必须使用 path.join(__dirname, ...) 限定在项目目录内。"
    severity: WARNING
    languages: [javascript, typescript]

  - id: no-unrestricted-cors
    pattern: |
      "Access-Control-Allow-Origin": "*"
    message: "CORS 不允许使用通配符 *。必须明确指定允许的 origin。"
    severity: WARNING
    languages: [javascript, typescript]

  - id: no-infinite-loop
    pattern: |
      while (true) { ... }
    message: "禁止无终止条件的无限循环。必须有 break 条件或最大迭代次数。"
    severity: ERROR
    languages: [javascript, typescript]

  - id: no-innerhtml-variable
    pattern: |
      $EL.innerHTML = $VAR
    message: "禁止将变量直接赋值给 innerHTML（XSS 风险）。使用 textContent 或框架内置转义。"
    severity: ERROR
    languages: [javascript, typescript]
```

---

## 5. WebSocket 实时通信

### 5.1 `lib/websocket/progress-server.ts`

```typescript
import { Server as IOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";

export interface PipelineProgressEvent {
  projectId: string;
  pipelineRunId: string;
  phase: string;
  progress: number; // 0-100
  message: string;
  timestamp: string;
}

/**
 * Pipeline 进度推送服务。
 * 每个项目一个 Socket.io room，前端加入 room 后接收实时进度。
 * 对应文档 12.2.2 WebSocket Gateway 设计。
 */
export class ProgressServer {
  private io: IOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new IOServer(httpServer, {
      cors: { origin: process.env.NEXT_PUBLIC_APP_URL || "*", methods: ["GET", "POST"] },
      path: "/ws/progress",
      transports: ["websocket", "polling"],
    });

    this.io.on("connection", (socket: Socket) => {
      socket.on("join-project", (projectId: string) => {
        socket.join(`project:${projectId}`);
      });

      socket.on("leave-project", (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      socket.on("disconnect", () => {
        // 自动清理 room 成员
      });
    });
  }

  /**
   * 广播 Pipeline 进度到项目 room。由 Pipeline Worker 调用。
   */
  emitProgress(event: PipelineProgressEvent): void {
    this.io.to(`project:${event.projectId}`).emit("pipeline:progress", event);
  }

  /**
   * 广播 Pipeline 阶段变更。
   */
  emitPhaseChange(projectId: string, phase: string, status: "started" | "completed" | "failed"): void {
    this.io.to(`project:${projectId}`).emit("pipeline:phase", {
      projectId,
      phase,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 广播构建日志行。
   */
  emitLog(projectId: string, line: string, level: "info" | "warn" | "error" = "info"): void {
    this.io.to(`project:${projectId}`).emit("pipeline:log", {
      projectId,
      line,
      level,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedCount(projectId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`project:${projectId}`);
    return room?.size || 0;
  }

  shutdown(): void {
    this.io.close();
  }
}
```

### 5.2 `lib/websocket/acceptance-server.ts`

```typescript
import { Server as IOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { AcceptanceState } from "../acceptance/acceptance-engine";

export interface AcceptanceEvent {
  type: "state_change" | "fix_progress" | "question_ready" | "completed";
  projectId: string;
  pipelineRunId: string;
  data: unknown;
  timestamp: string;
}

/**
 * 验收状态推送服务。
 * PM 打开验收面板后加入对应 room，实时接收验收进度和修复状态。
 */
export class AcceptanceServer {
  private io: IOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new IOServer(httpServer, {
      cors: { origin: process.env.NEXT_PUBLIC_APP_URL || "*", methods: ["GET", "POST"] },
      path: "/ws/acceptance",
      transports: ["websocket", "polling"],
    });

    this.io.on("connection", (socket: Socket) => {
      socket.on("join-acceptance", (data: { projectId: string; pipelineRunId: string }) => {
        socket.join(`acceptance:${data.projectId}:${data.pipelineRunId}`);
      });

      socket.on("leave-acceptance", (data: { projectId: string; pipelineRunId: string }) => {
        socket.leave(`acceptance:${data.projectId}:${data.pipelineRunId}`);
      });
    });
  }

  /**
   * 推送验收状态变更（每次 PM 提交回答后）。
   */
  emitStateChange(projectId: string, pipelineRunId: string, state: AcceptanceState): void {
    this.emit(projectId, pipelineRunId, {
      type: "state_change",
      projectId,
      pipelineRunId,
      data: state,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 推送修复进度（AI修复循环中的进度更新）。
   */
  emitFixProgress(projectId: string, pipelineRunId: string, message: string, progress: number): void {
    this.emit(projectId, pipelineRunId, {
      type: "fix_progress",
      projectId,
      pipelineRunId,
      data: { message, progress },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 推送新的验收问题就绪（修复循环完成后，新截图已准备好）。
   */
  emitQuestionReady(projectId: string, pipelineRunId: string, stepIndex: number, screenshotUrl: string): void {
    this.emit(projectId, pipelineRunId, {
      type: "question_ready",
      projectId,
      pipelineRunId,
      data: { stepIndex, screenshotUrl },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 推送验收完成。
   */
  emitCompleted(projectId: string, pipelineRunId: string, passRate: number): void {
    this.emit(projectId, pipelineRunId, {
      type: "completed",
      projectId,
      pipelineRunId,
      data: { passRate },
      timestamp: new Date().toISOString(),
    });
  }

  private emit(projectId: string, pipelineRunId: string, event: AcceptanceEvent): void {
    this.io.to(`acceptance:${projectId}:${pipelineRunId}`).emit("acceptance:event", event);
  }

  shutdown(): void {
    this.io.close();
  }
}
```

### 5.3 `app/api/ws/route.ts`

```typescript
import { NextRequest } from "next/server";

/**
 * WebSocket 升级端点。
 * Next.js App Router 不原生支持 WebSocket，
 * 此路由仅做健康检查和文档指引。
 * 实际 WebSocket 由独立的 Socket.io 服务处理（同进程不同端口，或通过 Nginx 路由）。
 *
 * 生产环境推荐：
 * - Nginx 将 /ws/* 路径代理到 Socket.io 服务端口
 * - 或使用 Next.js custom server (server.ts) 同进程挂载 Socket.io
 */
export async function GET(req: NextRequest) {
  const upgradeHeader = req.headers.get("upgrade");

  if (upgradeHeader === "websocket") {
    // Next.js App Router 不支持原生 WebSocket 升级
    // 返回指引信息
    return new Response(
      JSON.stringify({
        error: "WebSocket connections should be made to the Socket.io endpoint",
        endpoints: {
          progress: `${process.env.WS_BASE_URL || "ws://localhost:3001"}/ws/progress`,
          acceptance: `${process.env.WS_BASE_URL || "ws://localhost:3001"}/ws/acceptance`,
        },
        transports: ["websocket", "polling"],
      }),
      { status: 426, headers: { "Content-Type": "application/json" } }
    );
  }

  // 非 WebSocket 请求：返回端点状态
  return new Response(
    JSON.stringify({
      status: "ok",
      endpoints: {
        progress: "/ws/progress",
        acceptance: "/ws/acceptance",
      },
      note: "Connect via Socket.io client to the appropriate namespace",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
```

---

## 6. Docker 开发环境

### 6.1 `docker-compose.yml`

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: pmbuilder-postgres
    environment:
      POSTGRES_USER: pmbuilder
      POSTGRES_PASSWORD: pmbuilder_dev
      POSTGRES_DB: pmbuilder
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pmbuilder"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: pmbuilder-redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  playwright:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: pmbuilder-playwright
    environment:
      - PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
    ports:
      - "3002:3002"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./:/app
      - /app/node_modules
    command: >
      sh -c "npx playwright install chromium && node scripts/playwright-service.js"

volumes:
  pgdata:
  redisdata:
```

### 6.2 `Dockerfile.dev`

```dockerfile
FROM node:22-slim

RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 \
    libatspi2.0-0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

EXPOSE 3000 3001 3002
```

### 6.3 `scripts/dev-setup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== PM Builder Dev Environment Setup ==="

# 检查 Docker
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed. Please install Docker Desktop first."
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "ERROR: Docker daemon is not running. Please start Docker Desktop."
  exit 1
fi

# 检查 docker compose
if ! docker compose version &> /dev/null; then
  echo "ERROR: docker compose plugin not found."
  exit 1
fi

echo "[1/4] Starting infrastructure services (PostgreSQL + Redis + Playwright)..."
docker compose up -d

echo "[2/4] Waiting for services to be healthy..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
  pg_ready=$(docker compose ps --format json | grep -c '"Health":"healthy"' || true)
  if [ "$pg_ready" -ge 2 ]; then
    echo "  All services healthy."
    break
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
  echo "WARNING: Services did not become healthy within ${timeout}s. Check: docker compose ps"
fi

echo "[3/4] Installing Node.js dependencies..."
npm ci --ignore-scripts

echo "[4/4] Setting up environment variables..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local 2>/dev/null || cat > .env.local << 'ENVEOF'
DATABASE_URL=postgresql://pmbuilder:pmbuilder_dev@localhost:5432/pmbuilder
REDIS_URL=redis://localhost:6379
CF_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=pmbuilder-dev
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
SCREENSHOT_PUBLIC_URL=http://localhost:3002/screenshots
WS_BASE_URL=ws://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVEOF
  echo "  Created .env.local with default values. Edit before running."
else
  echo "  .env.local already exists, skipping."
fi

echo ""
echo "=== Setup Complete ==="
echo "Run 'npm run dev' to start the development server."
echo "Services: PostgreSQL(:5432) Redis(:6379) Playwright(:3002)"
```
