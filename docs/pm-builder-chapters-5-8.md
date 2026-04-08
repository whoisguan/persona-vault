# MIXIA Builder — 第5-8章：数据模型、翻译层、测试防线、验收流程

> **文档版本：** v1.0
> **创建日期：** 2026-04-08
> **最后更新：** 2026-04-08
> **作者：** GUAN + Coco（MIXIA共同体协作）
> **状态：** 产品定义阶段
>
> **本文档定位：** product-spec-pm-builder.md 第5-8章的完整内容。第1-4章见主文档，第9-11章见 pm-builder-chapters-9-11.md。

---

## 目录

5. [数据模型（双层架构）](#5-数据模型双层架构)
   - 5.1 双层架构总论
   - 5.2 技术层（Truth Source）
   - 5.3 业务层（PM投影）
   - 5.4 状态派生规则
   - 5.5 事件溯源（双层事件）
   - 5.6 快照策略
6. [业务翻译层](#6-业务翻译层)
   - 6.1 三层翻译架构
   - 6.2 错误场景的翻译规范
   - 6.3 反向翻译（PM反馈 → 技术修改指令）
7. [AI测试三层防线](#7-ai测试三层防线)
   - 7.1 Layer 1: 同源自测
   - 7.2 Layer 2: 交叉验证
   - 7.3 Layer 3: PM引导验收
   - 7.4 Validate-Before-Propagate原则
8. [引导式验收流程](#8-引导式验收流程)
   - 8.1 四阶段验收
   - 8.2 业务逻辑走查模式
   - 8.3 反馈迭代循环

---

## 5. 数据模型（双层架构）

### 5.1 双层架构总论

MIXIA Builder的数据模型采用**双层叠加架构**，而非替换关系：

```
┌───────────────────────────────────────────────────────┐
│                  业务层（PM投影）                        │
│  BusinessNode / BusinessEdge / BusinessStatus          │
│  PM看到的功能地图、看板、用户旅程都读取这一层             │
│  数据由技术层派生，不可直接修改底层数据                    │
├───────────────────────────────────────────────────────┤
│                  映射引擎（Projection）                  │
│  deriveBusinessStatus() / projectBusinessGraph()       │
│  技术层事件 → 自动重新投影 → 业务层更新                   │
├───────────────────────────────────────────────────────┤
│                  技术层（Truth Source）                  │
│  TechNode / Edge / Port / ContextTransform             │
│  执行引擎、AI编排、版本管理都操作这一层                   │
│  所有写操作只发生在技术层                                │
└───────────────────────────────────────────────────────┘
```

**关键原则：技术层是唯一的写入目标（truth source），业务层是只读投影（read projection）。**

- 所有AI代码生成、测试、部署操作写入技术层
- PM在功能地图上看到的一切由映射引擎从技术层实时派生
- PM的操作（确认方案、验收通过等）先转换为技术层指令，再触发投影更新
- 两层数据始终保持一致——因为业务层的数据来源就是技术层

这是"叠加"而非"替换"：旧文档（product-spec-dag-builder.md）第4章定义的技术层完整保留，业务层是在其之上新增的投影层。

### 5.2 技术层（Truth Source）

技术层沿用旧文档第4章的完整定义，新增 `validated` 状态和 `layer` 字段。

#### 5.2.1 技术节点类型（8种，不变）

```typescript
type TechNodeType =
  | 'decision'       // 技术选型/方案决策，输出决策文本
  | 'code_gen'       // 代码生成，输出文件列表
  | 'schema_design'  // 数据库/API Schema，输出DDL/OpenAPI
  | 'config'         // 配置文件生成
  | 'test'           // 测试代码生成
  | 'integration'    // 集成/组装节点
  | 'manual'         // 人工操作节点（需要用户手动完成）
  | 'checkpoint'     // 审查关卡（需要人类确认才能继续）
```

#### 5.2.2 技术节点接口（扩展版）

```typescript
interface TechNode {
  id: string;                       // UUID v7（时间有序）
  type: TechNodeType;               // 枚举类型，强制约束
  label: string;                    // 人类可读标签
  description: string;              // 节点功能描述
  inputs: PortDef[];                // 输入端口定义
  outputs: PortDef[];               // 输出端口定义
  status: TechNodeStatus;           // 当前状态（含新增的validated）
  assigned_model?: string;          // 指定AI模型
  business_node_id?: string;        // 新增：所属的业务节点ID（反向引用）
  metadata: {
    created_by: 'user' | 'ai' | string;
    created_at: string;             // ISO 8601
    last_modified_by: string;
    last_modified_at: string;
    estimated_tokens: number;
    group_id?: string;              // 所属NodeGroup（简化视图中的大节点）
  };
}

// 端口定义（不变）
interface PortDef {
  port_id: string;
  name: string;
  schema?: JSONSchema;
}
```

#### 5.2.3 技术状态机（新增 `validated`）

```typescript
// 新增 validated 状态，位于 completed 和 approved 之间
type TechNodeStatus =
  | 'pending'        // 等待上游完成
  | 'ready'          // 所有hard依赖完成，可以执行
  | 'generating'     // AI正在生成
  | 'completed'      // 生成完成（但尚未验证）
  | 'validated'      // ★ 新增：通过自动验证（语法+lint+依赖+schema+安全扫描）
  | 'approved'       // 用户审查通过
  | 'error'          // 生成失败
  | 'partial'        // 生成了一部分就中断了
  | 'stale'          // 上游被修改，输出已过时
  | 'skipped'        // 用户主动跳过
  | 'reviewing'      // checkpoint节点等待人类审查
```

**状态转换图（含 `validated`）：**

```
pending → ready → generating → completed → validated → approved
                                  ↓            ↓
                                error        error
                                  ↓            ↓
                               retrying     retrying
                                               ↓
                                           stale（上游被修改时）
```

**`validated` 状态的含义：**

- `completed`：AI生成完毕，输出已写入，但未经自动验证
- `validated`：通过了全部自动验证（语法检查、lint、依赖解析、schema validation、安全扫描）
- 只有 `validated` 的节点才能将输出传递给下游节点（Validate-Before-Propagate原则）
- `completed` → `validated` 的转换由验证引擎自动触发，不需要人工参与

**`validated` 转换条件：**

```typescript
interface ValidationGate {
  // completed → validated 需要通过的全部检查
  checks: [
    { name: 'syntax';    tool: 'tsc / python -m py_compile'; required: true },
    { name: 'lint';      tool: 'eslint / ruff';              required: true },
    { name: 'deps';      tool: 'npm ls / pip check';         required: true },
    { name: 'schema';    tool: 'ajv / json-schema-validator'; required: true },
    { name: 'security';  tool: 'semgrep / npm audit';        required: true },
  ];
  // 全部required=true的检查通过 → validated
  // 任一失败 → error（进入修复循环，最多3次）
  max_fix_attempts: 3;
}
```

#### 5.2.4 技术层边（Edge）（不变）

```typescript
interface Edge {
  id: string;
  source_node: string;              // 源节点ID
  source_port: string;              // 源节点的输出端口ID
  target_node: string;              // 目标节点ID
  target_port: string;              // 目标节点的输入端口ID
  type: 'hard' | 'soft' | 'reference';
  transform?: ContextTransform;
}

interface ContextTransform {
  strategy: 'full' | 'summary' | 'extract' | 'template' | 'metadata_only';
  extract_pattern?: string;         // JSONPath或正则
  template?: string;                // 注入目标prompt的模板
  max_tokens?: number;              // 传递的最大token数
}
```

#### 5.2.5 双层视图映射（NodeGroup）（不变）

```typescript
interface NodeGroup {
  group_id: string;
  label: string;
  description: string;
  member_node_ids: string[];
  entry_ports: PortRef[];
  exit_ports: PortRef[];
  collapsed: boolean;
}

interface PortRef {
  group_port_id: string;
  member_node_id: string;
  member_port_id: string;
}
```

#### 5.2.6 节点执行记录（不变）

```typescript
interface NodeExecution {
  execution_id: string;
  node_id: string;
  triggered_by: 'initial' | 'user_edit' | 'upstream_change' | 'manual_rerun';
  input_snapshot: Record<string, string>;
  output: Record<string, string>;
  ai_model: string;
  prompt_hash: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  timestamp: string;                // ISO 8601
  duration_ms: number;
  status: 'success' | 'error' | 'partial';
  error_message?: string;
}
```

### 5.3 业务层（PM投影）

业务层是技术层的只读投影，供PM在功能地图、看板、用户旅程三个视图中使用。

#### 5.3.1 业务节点类型（7种）

```typescript
type BusinessNodeType =
  | 'feature'       // 功能——用户可感知的功能点
  | 'page'          // 页面——具体的UI页面
  | 'flow'          // 流程——跨页面的用户操作路径
  | 'data'          // 数据——业务数据实体
  | 'connect'       // 对接——外部系统/服务接入
  | 'rule'          // 规则——业务逻辑规则
  | 'milestone'     // 里程碑——PM设定的交付检查点
```

#### 5.3.2 业务节点接口

```typescript
interface BusinessNode {
  id: string;                       // UUID v7
  type: BusinessNodeType;
  label: string;                    // PM需求原文短语（如"用户注册"，禁止技术术语）
  description: string;              // 一句话说明这个功能做什么
  status: BusinessStatus;           // 由技术层派生，不可直接设置
  icon: BusinessNodeIcon;           // 节点图标（拼图块/窗口/箭头环/表格/插头/天平/旗帜）

  // 与技术层的映射关系
  tech_node_ids: string[];          // 映射到的技术节点ID列表
  tech_group_id?: string;           // 对应的NodeGroup ID（如果有）

  // PM可见的元数据
  pm_metadata: {
    created_at: string;             // ISO 8601
    estimated_time: string;         // PM可理解的时间预估（如"约3分钟"）
    estimated_cost_usd: number;     // 预估AI调用费用
    actual_cost_usd?: number;       // 实际花费（完成后填入）
    acceptance_status?: AcceptanceResult; // 验收结果
  };

  // 依赖关系（简化版，PM只看到"先后顺序"）
  depends_on: string[];             // 前置业务节点ID列表
  depended_by: string[];            // 后续业务节点ID列表（反向引用，自动计算）

  // 节点详情（按类型不同而不同）
  detail: BusinessNodeDetail;

  // 验收相关
  screenshots?: Screenshot[];       // 预览截图（page/feature/flow类型有）
  acceptance_questions?: AcceptanceQuestion[]; // 引导式验收的是否题
}

// 业务节点图标映射
type BusinessNodeIcon =
  | 'puzzle'         // feature → 拼图块
  | 'window'         // page → 窗口
  | 'arrow_cycle'    // flow → 箭头环
  | 'table'          // data → 表格
  | 'plug'           // connect → 插头
  | 'scale'          // rule → 天平
  | 'flag'           // milestone → 旗帜

// 截图定义
interface Screenshot {
  url: string;                      // 截图URL
  page_title: string;               // 页面标题
  captured_at: string;              // ISO 8601
  viewport: { width: number; height: number };
  annotations?: ScreenshotAnnotation[]; // PM标注（验收时）
}

interface ScreenshotAnnotation {
  x: number;
  y: number;
  width: number;
  height: number;
  comment: string;                  // PM的标注文字
}

// 验收问题
interface AcceptanceQuestion {
  id: string;
  question: string;                 // 如"注册成功后是否跳转到首页？"
  type: 'yes_no' | 'choice';
  choices?: string[];               // choice类型时的选项
  answer?: 'yes' | 'no' | string;  // PM的回答
  follow_up?: string;               // PM回答"no"时的追问
}

// 验收结果
interface AcceptanceResult {
  status: 'passed' | 'failed' | 'partial' | 'skipped';
  passed_questions: number;
  total_questions: number;
  issues: AcceptanceIssue[];
  accepted_at?: string;             // ISO 8601
}

interface AcceptanceIssue {
  question_id: string;
  pm_feedback: string;              // PM的原始反馈
  severity: 'critical' | 'major' | 'minor' | 'cosmetic';
  fix_status: 'pending' | 'fixing' | 'fixed' | 'wont_fix';
  fix_attempts: number;
}
```

#### 5.3.3 业务节点详情（按类型区分）

```typescript
// 联合类型：每种业务节点有不同的详情结构
type BusinessNodeDetail =
  | FeatureDetail
  | PageDetail
  | FlowDetail
  | DataDetail
  | ConnectDetail
  | RuleDetail
  | MilestoneDetail;

interface FeatureDetail {
  type: 'feature';
  includes: string[];               // 包含的子功能描述（PM语言）
  user_story?: string;              // 用户故事（"作为X，我想要Y，以便Z"）
}

interface PageDetail {
  type: 'page';
  route: string;                    // 页面路由（如"/login"）
  components: string[];             // 页面包含的功能区块描述
  responsive: boolean;              // 是否适配移动端
}

interface FlowDetail {
  type: 'flow';
  steps: FlowStep[];                // 流程步骤
  entry_page: string;               // 入口页面的业务节点ID
  exit_page: string;                // 出口页面的业务节点ID
}

interface FlowStep {
  order: number;
  page_node_id: string;             // 关联的页面业务节点
  action: string;                   // PM描述的用户动作（如"点击'立即购买'"）
  next_condition?: string;          // 进入下一步的条件
}

interface DataDetail {
  type: 'data';
  fields: DataField[];              // PM可见的数据字段
  estimated_records?: string;       // 预估数据量（如"万级"）
}

interface DataField {
  name: string;                     // PM语言的字段名（如"订单号"）
  description: string;              // 字段说明
  required: boolean;
  example?: string;                 // 示例值
}

interface ConnectDetail {
  type: 'connect';
  service_name: string;             // 第三方服务名称（如"微信支付"）
  requires_credentials: boolean;    // 是否需要PM提供密钥
  credential_fields?: string[];     // 需要的密钥字段（如["商户号", "API密钥"]）
  sandbox_available: boolean;       // 是否有沙箱模式
}

interface RuleDetail {
  type: 'rule';
  condition: string;                // 触发条件（PM语言）
  action: string;                   // 执行动作（PM语言）
  priority?: number;                // 规则优先级（多条规则时）
  conflicts_with?: string[];        // 互斥的规则节点ID
}

interface MilestoneDetail {
  type: 'milestone';
  required_nodes: string[];         // 到达条件：这些业务节点必须是"已确认"
  auto_pause: boolean;              // 到达时是否自动暂停Pipeline
  notification: string;             // 通知PM的消息
}
```

#### 5.3.4 业务层边（简化版）

PM只需要看到功能之间的"先后依赖"关系，不需要理解端口、上下文传递策略等技术细节。

```typescript
interface BusinessEdge {
  id: string;
  source: string;                   // 源业务节点ID
  target: string;                   // 目标业务节点ID
  label?: string;                   // 可选标签（如"完成后触发"）
  type: 'depends_on';               // PM只看到一种关系：依赖
  // 注意：没有port、transform等技术概念
  // 底层可能对应多条技术层Edge
  tech_edge_ids: string[];          // 底层对应的技术边ID列表
}
```

**业务边与技术边的映射：**

一条业务边可能对应多条技术边。例如业务节点"下单支付"依赖"商品详情"，底层可能有3条技术边（API接口、数据模型引用、前端路由跳转）。PM只需要看到"下单支付 → 商品详情"一条线。

```typescript
// 映射引擎负责聚合
function projectBusinessEdges(techEdges: Edge[], nodeMapping: Map<string, string>): BusinessEdge[] {
  // 1. 将每条技术边的source/target映射到业务节点ID
  // 2. 相同业务节点对之间的多条技术边合并为一条业务边
  // 3. 去除业务节点内部的技术边（同一业务节点的技术节点之间的边PM不需要看）
  const edgeMap = new Map<string, BusinessEdge>();

  for (const techEdge of techEdges) {
    const sourceBizId = nodeMapping.get(techEdge.source_node);
    const targetBizId = nodeMapping.get(techEdge.target_node);

    // 跳过同一业务节点内部的边
    if (sourceBizId === targetBizId) continue;
    if (!sourceBizId || !targetBizId) continue;

    const key = `${sourceBizId}→${targetBizId}`;
    if (edgeMap.has(key)) {
      edgeMap.get(key)!.tech_edge_ids.push(techEdge.id);
    } else {
      edgeMap.set(key, {
        id: generateUUID(),
        source: sourceBizId,
        target: targetBizId,
        type: 'depends_on',
        tech_edge_ids: [techEdge.id],
      });
    }
  }

  return Array.from(edgeMap.values());
}
```

### 5.4 状态派生规则

业务节点的状态不允许直接设置——它始终由底层技术节点的状态组合派生。以下是完整的派生规则。

#### 5.4.1 业务状态枚举

```typescript
type BusinessStatus =
  | 'planning'        // 待规划（灰色，静止）
  | 'designing'       // 方案中（蓝色，静止）
  | 'pending_confirm' // 待确认（橙色，脉冲闪烁）
  | 'developing'      // 开发中（蓝色，旋转动画）
  | 'previewable'     // 可预览（紫色，脉冲闪烁）
  | 'needs_fix'       // 需修改（红色，静止）
  | 'confirmed'       // 已确认（绿色，勾号）
  | 'live'            // 已上线（深绿色，火箭图标）
```

#### 5.4.2 技术细分状态枚举

```typescript
// 技术层在 TechNodeStatus 基础上，有更细粒度的内部状态
type TechDetailedStatus =
  // Phase 1相关
  | 'pending'
  | 'analyzing'              // AI正在分析需求
  | 'planning'               // AI正在规划技术方案
  | 'plan_ready'             // 方案就绪，等PM确认
  // Phase 2相关
  | 'ready'
  | 'generating'             // AI正在生成代码
  | 'completed'              // 代码生成完毕
  | 'validated'              // ★ 新增：自动验证通过
  // Phase 3相关
  | 'linting'                // 正在执行lint检查
  | 'testing'                // 正在执行测试
  // Phase 5相关
  | 'deploying_preview'      // 正在部署预览
  | 'preview_ready'          // 预览就绪
  // 修复相关
  | 'fix_analyzing'          // AI分析问题原因
  | 'fix_generating'         // AI生成修复代码
  | 'fix_testing'            // 修复后重新测试
  | 'fix_deploying'          // 修复后重新部署预览
  // 终态
  | 'approved'               // 人类审查通过
  | 'production_deployed'    // 已部署到生产环境
  // 异常态
  | 'error'
  | 'partial'
  | 'stale'
  | 'skipped'
  | 'reviewing'
```

#### 5.4.3 派生函数

```typescript
/**
 * 核心派生函数：从一组技术节点的状态推导出业务状态。
 *
 * 规则按优先级从高到低排列——第一个匹配的规则决定业务状态。
 * 注意：这是纯函数，没有副作用，可安全地频繁调用。
 */
function deriveBusinessStatus(techNodes: TechNode[]): BusinessStatus {
  if (techNodes.length === 0) {
    return 'planning';
  }

  const statuses = techNodes.map(n => n.status as TechDetailedStatus);

  // 规则1: 全部已上线 → 已上线
  if (statuses.every(s => s === 'production_deployed')) {
    return 'live';
  }

  // 规则2: 全部approved → 已确认
  if (statuses.every(s => s === 'approved' || s === 'production_deployed')) {
    return 'confirmed';
  }

  // 规则3: 任一处于修复状态 → 需修改
  const fixStatuses: TechDetailedStatus[] = [
    'fix_analyzing', 'fix_generating', 'fix_testing', 'fix_deploying'
  ];
  if (statuses.some(s => fixStatuses.includes(s))) {
    return 'needs_fix';
  }

  // 规则4: 全部validated/approved + preview_ready → 可预览
  // （至少有一个preview_ready或全部validated以上）
  const previewableStatuses: TechDetailedStatus[] = [
    'validated', 'preview_ready', 'approved', 'production_deployed'
  ];
  if (statuses.every(s => previewableStatuses.includes(s))) {
    return 'previewable';
  }

  // 规则5: 任一正在生成/完成/验证/lint/测试/部署 → 开发中
  const developingStatuses: TechDetailedStatus[] = [
    'ready', 'generating', 'completed', 'validated',
    'linting', 'testing', 'deploying_preview', 'preview_ready'
  ];
  if (statuses.some(s => developingStatuses.includes(s))) {
    return 'developing';
  }

  // 规则6: 全部plan_ready → 待确认
  if (statuses.every(s => s === 'plan_ready')) {
    return 'pending_confirm';
  }

  // 规则7: 任一analyzing/planning → 方案中
  if (statuses.some(s => s === 'analyzing' || s === 'planning')) {
    return 'designing';
  }

  // 规则8: 全部pending → 待规划
  if (statuses.every(s => s === 'pending')) {
    return 'planning';
  }

  // 兜底：如果存在error但其他节点还在运行，显示"开发中"（AI正在修复）
  // 避免直接把技术error暴露给PM
  if (statuses.some(s => s === 'error') && statuses.some(s => developingStatuses.includes(s))) {
    return 'developing';
  }

  // 如果全部error且无任何进行中的修复 → 需修改
  if (statuses.every(s => s === 'error' || s === 'partial')) {
    return 'needs_fix';
  }

  // 默认
  return 'planning';
}
```

#### 5.4.4 特殊派生规则

```typescript
/**
 * 特殊场景的派生覆盖规则。
 * 在 deriveBusinessStatus 之后执行，可覆盖其结果。
 */
interface DerivationOverride {
  // 场景1: 单个技术节点error，但其他都在运行
  // 不暴露error给PM，AI后台自动重试
  single_error_override: {
    condition: 'error节点数 <= 1 且 非error节点有正在运行的';
    result: 'developing'; // 而非 needs_fix
    pm_visible: false;    // PM不感知
  };

  // 场景2: 达到重试上限的error
  // 才向PM报告问题
  max_retry_exceeded: {
    condition: 'error节点的修复次数 >= 3';
    result: 'needs_fix';
    pm_visible: true;
    pm_message: '翻译为PM语言的问题描述'; // 由翻译层处理
  };

  // 场景3: 里程碑节点的特殊规则
  milestone_override: {
    condition: 'business_node.type === milestone';
    // 里程碑的状态由其required_nodes决定
    derive: (milestone: BusinessNode, allNodes: BusinessNode[]) => BusinessStatus;
  };

  // 场景4: stale状态的传播
  stale_propagation: {
    condition: '技术节点被标记为stale';
    result: 'needs_fix';
    pm_message: '这个功能的前置功能被修改了，需要重新验证';
  };
}

/**
 * 里程碑节点的派生规则——独立于技术节点状态
 */
function deriveMilestoneStatus(
  milestone: BusinessNode & { detail: MilestoneDetail },
  allBusinessNodes: Map<string, BusinessNode>
): BusinessStatus {
  const requiredNodes = milestone.detail.required_nodes
    .map(id => allBusinessNodes.get(id))
    .filter(Boolean) as BusinessNode[];

  // 所有关联节点都已确认 → 里程碑"可预览"（等PM确认）
  if (requiredNodes.every(n => n.status === 'confirmed' || n.status === 'live')) {
    return 'previewable';
  }

  // 任一关联节点需修改 → 里程碑"需修改"
  if (requiredNodes.some(n => n.status === 'needs_fix')) {
    return 'needs_fix';
  }

  // 任一关联节点在开发中 → 里程碑"开发中"
  if (requiredNodes.some(n => n.status === 'developing')) {
    return 'developing';
  }

  return 'planning';
}
```

### 5.5 事件溯源（双层事件）

事件系统扩展为双层：技术层事件记录底层操作，业务层事件记录PM可见的业务行为。所有事件共享统一的基础接口。

#### 5.5.1 统一事件接口

```typescript
interface DagEvent {
  id: string;                       // 事件唯一ID
  timestamp: string;                // ISO 8601
  layer: 'tech' | 'business';      // ★ 新增：事件所属层
  type: TechEventType | BusinessEventType;
  payload: Record<string, unknown>;
  inverse?: Record<string, unknown>; // 撤销所需参数（tech层事件必有）
  author: 'user' | 'ai' | 'system'; // system = 映射引擎自动产生
  ai_model?: string;                // AI操作时记录使用的模型
  correlation_id?: string;          // 关联ID——同一PM操作触发的tech+business事件共享
  pipeline_phase?: number;          // 事件发生时的Pipeline Phase（1-7）
}
```

#### 5.5.2 技术层事件类型

```typescript
type TechEventType =
  // 节点操作
  | 'node_add'
  | 'node_delete'
  | 'node_update'
  | 'node_status_change'
  // 边操作
  | 'edge_add'
  | 'edge_delete'
  | 'edge_update'
  // 结构操作
  | 'layout_change'
  | 'group_change'
  // 批量操作
  | 'batch'
  // 执行相关
  | 'execution_start'
  | 'execution_complete'
  | 'execution_error'
  // 验证相关（新增）
  | 'validation_start'
  | 'validation_pass'
  | 'validation_fail'

// 事件Payload示例
interface NodeStatusChangePayload {
  node_id: string;
  old_status: TechNodeStatus;
  new_status: TechNodeStatus;
  reason: string;                   // 状态变化原因
  validation_results?: ValidationResult[]; // validated转换时附带验证结果
}

interface ValidationResult {
  check_name: string;               // 如 'syntax', 'lint', 'security'
  passed: boolean;
  details?: string;                 // 失败时的错误信息
  auto_fixed?: boolean;             // 是否已自动修复
}
```

#### 5.5.3 业务层事件类型（新增）

```typescript
type BusinessEventType =
  | 'requirement_submitted'         // PM提交了需求描述（I1完成）
  | 'plan_generated'                // AI生成了功能地图
  | 'plan_confirmed'                // PM确认了功能地图（I2完成）
  | 'plan_modified'                 // PM修改了功能地图
  | 'ui_style_confirmed'            // PM确认了UI风格（I3完成）
  | 'acceptance_started'            // PM开始验收（I4开始）
  | 'acceptance_feedback'           // PM对某个功能给出了验收反馈
  | 'acceptance_completed'          // PM完成了全部验收（I4完成）
  | 'publish_approved'              // PM确认发布（I5完成）
  | 'pipeline_phase_completed'      // Pipeline某个Phase完成
  | 'business_node_status_change'   // 业务节点状态变化（由派生引擎触发）
  | 'cost_milestone'                // AI调用费用达到某个里程碑

// 业务事件Payload示例
interface RequirementSubmittedPayload {
  raw_text: string;                 // PM的原始需求文本
  clarification_rounds: number;     // 经过了几轮追问
  completeness_score: number;       // 需求完整度评分（0-1）
}

interface AcceptanceFeedbackPayload {
  business_node_id: string;
  question_id: string;
  answer: 'yes' | 'no' | string;
  pm_comment?: string;              // PM的补充说明
  screenshot_annotation?: ScreenshotAnnotation;
}

interface PipelinePhaseCompletedPayload {
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  phase_name: string;
  duration_ms: number;
  errors_encountered: number;
  errors_auto_fixed: number;
  cost_usd: number;
}
```

#### 5.5.4 事件关联机制

技术层事件和业务层事件通过 `correlation_id` 关联。一个PM操作可能触发1条业务事件 + 多条技术事件。

```typescript
// 示例：PM确认方案（1条业务事件 → 多条技术事件）
// correlation_id = "corr_abc123"

// 业务层事件
{
  id: "evt_biz_001",
  layer: "business",
  type: "plan_confirmed",
  correlation_id: "corr_abc123",
  author: "user",
  payload: { confirmed_nodes: ["biz_1", "biz_2", "biz_3"] }
}

// 技术层事件（自动触发）
{
  id: "evt_tech_001",
  layer: "tech",
  type: "node_status_change",
  correlation_id: "corr_abc123",
  author: "system",
  payload: { node_id: "tech_1", old_status: "plan_ready", new_status: "ready" }
}
{
  id: "evt_tech_002",
  layer: "tech",
  type: "node_status_change",
  correlation_id: "corr_abc123",
  author: "system",
  payload: { node_id: "tech_2", old_status: "plan_ready", new_status: "ready" }
}
// ... 更多技术节点的状态变化
```

### 5.6 快照策略

快照系统扩展为包含双层状态，并在每个Pipeline Phase完成时自动创建。

#### 5.6.1 快照数据结构

```typescript
interface DagSnapshot {
  version: number;                  // 快照版本号（单调递增）
  timestamp: string;                // ISO 8601
  trigger: SnapshotTrigger;         // 快照触发原因

  // 技术层完整状态
  tech_layer: {
    nodes: TechNode[];
    edges: Edge[];
    groups: NodeGroup[];
  };

  // 业务层完整状态（新增）
  business_layer: {
    nodes: BusinessNode[];
    edges: BusinessEdge[];
  };

  // Pipeline状态（新增）
  pipeline_state: {
    current_phase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    phase_statuses: Record<number, 'pending' | 'running' | 'completed' | 'failed'>;
    total_cost_usd: number;
    total_duration_ms: number;
    error_count: number;
  };

  // 元数据
  event_count_since_last_snapshot: number;
  snapshot_size_bytes: number;
}

type SnapshotTrigger =
  | 'pipeline_phase_complete'       // ★ 新增：每个Phase完成时自动快照
  | 'event_count_threshold'         // 每20个事件自动快照
  | 'user_manual_save'              // 用户手动保存
  | 'pm_confirmation'               // PM确认操作时（I2/I4/I5）
  | 'before_rollback'               // 回滚前自动快照（安全网）
  | 'periodic'                      // 定时快照（每10分钟，如果有变化）
```

#### 5.6.2 快照策略

```typescript
interface SnapshotPolicy {
  // 自动快照触发条件（满足任一即触发）
  triggers: {
    // 条件1: Pipeline Phase完成
    on_phase_complete: true;        // 每个Phase完成后自动快照
    // 条件2: 事件数量阈值
    event_count_threshold: 20;      // 每20个事件一个快照
    // 条件3: 用户操作
    on_user_confirmation: true;     // PM确认操作时
    // 条件4: 定时
    periodic_interval_ms: 600000;   // 每10分钟（如果有变化）
  };

  // 快照保留策略
  retention: {
    // Phase快照：永久保留（项目生命周期内）
    phase_snapshots: 'keep_all';
    // 事件阈值快照：保留最近20个
    threshold_snapshots_max: 20;
    // 定时快照：保留最近48个（8小时）
    periodic_snapshots_max: 48;
  };

  // 恢复策略
  recovery: {
    // 恢复 = 找最近快照 + 重播后续events
    find_nearest_snapshot: (targetVersion: number) => DagSnapshot;
    replay_events: (fromSnapshot: DagSnapshot, toVersion: number) => void;
    // Undo = 执行最后一个event的inverse
    undo_last: () => void;
    // 回到指定Phase的快照
    rollback_to_phase: (phase: number) => DagSnapshot;
  };
}
```

#### 5.6.3 快照与Pipeline Phase的关系

```
Phase 1完成 → 快照S1（包含：功能地图 + PM确认结果）
    │
Phase 2完成 → 快照S2（包含：S1 + 生成的所有代码）
    │
Phase 3完成 → 快照S3（包含：S2 + 质量检查结果）
    │
Phase 4完成 → 快照S4（包含：S3 + 测试报告 + 覆盖率）
    │
Phase 5完成 → 快照S5（包含：S4 + 预览URL + 截图）
    │
Phase 6完成 → 快照S6（包含：S5 + 验收报告）
    │
Phase 7完成 → 快照S7（包含：S6 + 部署信息 + 生产URL）
```

**回滚场景：** 如果Phase 6验收发现严重问题，系统可以回滚到S2（Phase 2完成后的快照），只重新生成受影响的功能节点，而不是从头开始。

---

## 6. 业务翻译层

业务翻译层是连接技术层和PM的桥梁。所有技术操作、状态、错误在到达PM之前，都经过翻译层转换为PM能理解的业务语言。

### 6.1 三层翻译架构

翻译层分为三个粒度级别，对应不同的PM场景：

```
┌───────────────────────────────────────────────────┐
│  Level 3: 项目→产品（全局仪表盘）                    │
│  "您的宠物寄养平台已完成70%，预计还需15分钟"          │
├───────────────────────────────────────────────────┤
│  Level 2: 模块→功能（阶段性报告）                    │
│  "用户注册功能已完成 ✓，支付功能正在开发中..."        │
├───────────────────────────────────────────────────┤
│  Level 1: 操作→动作（实时进度流）                    │
│  "正在创建登录页面的界面..."                          │
└───────────────────────────────────────────────────┘
```

#### 6.1.1 Level 1: 操作 → 动作（实时进度流）

PM在"开发中"阶段看到的实时进度信息。技术操作翻译为一句PM能理解的动作描述。

```typescript
interface OperationTranslation {
  // 技术操作 → PM可见描述
  translations: Record<string, TranslationRule>;
}

interface TranslationRule {
  tech_event: string;               // 技术层事件类型
  tech_context: Record<string, unknown>; // 事件上下文
  pm_text: string;                  // PM看到的文字
  pm_icon?: string;                 // 可选图标
  show_in_feed: boolean;            // 是否在进度流中显示
}

// 翻译规则表
const LEVEL1_TRANSLATIONS: Record<string, (ctx: TranslationContext) => string> = {
  // 代码生成
  'node_status:generating': (ctx) =>
    `正在创建${ctx.businessNodeLabel}...`,
  'node_status:completed': (ctx) =>
    `${ctx.businessNodeLabel}的代码已生成`,
  'node_status:validated': (ctx) =>
    `${ctx.businessNodeLabel}已通过自动检查 ✓`,

  // 测试
  'test:running': (ctx) =>
    `正在测试${ctx.businessNodeLabel}...`,
  'test:passed': (ctx) =>
    `${ctx.businessNodeLabel}测试通过 ✓`,
  'test:failed_auto_fixing': (ctx) =>
    `发现一个小问题，正在自动修复...`,

  // 部署
  'deploy:preview_start': (ctx) =>
    `正在准备预览环境...`,
  'deploy:preview_ready': (ctx) =>
    `预览环境已就绪，准备开始验收`,

  // 错误修复（PM不需要知道技术细节）
  'fix:auto_retry': (ctx) =>
    `正在优化${ctx.businessNodeLabel}...`,
  'fix:model_switch': (ctx) =>
    `换一种方式重新生成${ctx.businessNodeLabel}...`,
};

interface TranslationContext {
  businessNodeLabel: string;        // 业务节点标签（PM语言）
  businessNodeType: BusinessNodeType;
  techNodeType: TechNodeType;
  techNodeLabel: string;
  pipelinePhase: number;
  errorMessage?: string;
}
```

#### 6.1.2 Level 2: 模块 → 功能（阶段性报告）

Pipeline每个Phase完成时，或PM打开看板时看到的功能级状态报告。

```typescript
interface ModuleTranslation {
  // 将技术进度翻译为功能完成度
  translateProgress(businessNodes: BusinessNode[]): ProgressReport;
}

interface ProgressReport {
  summary: string;                  // 一句话总结（如"8个功能中已完成5个"）
  completed: ProgressItem[];        // 已完成的功能
  in_progress: ProgressItem[];      // 进行中的功能
  waiting: ProgressItem[];          // 等待中的功能
  issues: ProgressItem[];           // 有问题的功能
  estimated_remaining: string;      // 预估剩余时间（如"约10分钟"）
}

interface ProgressItem {
  node_id: string;
  label: string;                    // PM语言的功能名
  status_text: string;              // PM语言的状态描述
  status_icon: string;              // 状态图标
  sub_progress?: string;            // 子进度（如"3/5个子功能已完成"）
}

// 翻译函数
function translateBusinessStatus(status: BusinessStatus): { text: string; icon: string } {
  const map: Record<BusinessStatus, { text: string; icon: string }> = {
    planning:        { text: '等待开始',   icon: '⬜' },
    designing:       { text: '正在规划',   icon: '🔵' },
    pending_confirm: { text: '等你确认',   icon: '🟠' },
    developing:      { text: '正在开发',   icon: '🔄' },
    previewable:     { text: '可以预览',   icon: '🟣' },
    needs_fix:       { text: '需要修改',   icon: '🔴' },
    confirmed:       { text: '已确认',     icon: '✅' },
    live:            { text: '已上线',     icon: '🚀' },
  };
  return map[status];
}
```

#### 6.1.3 Level 3: 项目 → 产品（全局仪表盘）

PM打开MIXIA Builder首页时看到的项目全局状态。

```typescript
interface ProjectTranslation {
  translateOverview(
    businessNodes: BusinessNode[],
    pipelineState: PipelineState,
    costSummary: CostSummary
  ): ProjectOverview;
}

interface ProjectOverview {
  // 一句话状态
  headline: string;                 // "您的宠物寄养平台已完成70%"
  // 进度条
  progress_percentage: number;      // 0-100
  // PM需要做什么
  pm_action_required: PMAction | null;
  // 关键数字
  stats: {
    total_features: number;
    completed_features: number;
    estimated_remaining_time: string;
    total_cost_usd: number;
    current_phase: string;          // "正在测试中"
  };
}

interface PMAction {
  action_type: 'confirm_plan' | 'review_acceptance' | 'approve_publish';
  label: string;                    // "确认功能方案" / "开始验收" / "确认发布"
  urgency: 'now' | 'when_ready';   // now = 立即需要PM操作
  affected_nodes: string[];         // 需要操作的功能节点
}
```

### 6.2 错误场景的翻译规范

技术错误绝不直接暴露给PM。每种技术错误都有对应的PM语言翻译。

#### 6.2.1 单错误翻译

```typescript
interface ErrorTranslation {
  // 技术错误类型 → PM语言
  translateError(error: TechError, context: TranslationContext): PMError;
}

interface TechError {
  type: string;                     // 技术错误类型
  message: string;                  // 原始错误信息
  node_id: string;
  stack_trace?: string;
}

interface PMError {
  headline: string;                 // PM看到的一句话描述
  detail?: string;                  // 可选的补充说明
  severity: 'info' | 'warning' | 'action_required';
  suggested_action?: string;        // 建议PM做什么
}

// 翻译规则表
const ERROR_TRANSLATIONS: Record<string, (ctx: TranslationContext) => PMError> = {
  // TypeError / SyntaxError → PM语言
  'TypeError': (ctx) => ({
    headline: `${ctx.businessNodeLabel}的实现遇到一个技术问题`,
    detail: '系统正在自动修复，通常需要1-2分钟',
    severity: 'info',
  }),

  'SyntaxError': (ctx) => ({
    headline: `${ctx.businessNodeLabel}的代码格式需要调整`,
    detail: '系统正在自动修复',
    severity: 'info',
  }),

  // 依赖冲突
  'DependencyConflict': (ctx) => ({
    headline: `${ctx.businessNodeLabel}使用的某个组件版本有冲突`,
    detail: '系统正在自动解决版本兼容问题',
    severity: 'info',
  }),

  // API超时
  'AIProviderTimeout': (ctx) => ({
    headline: `AI服务响应较慢，正在重试`,
    detail: '已自动切换到备用AI，不影响最终结果',
    severity: 'info',
  }),

  // 测试失败
  'TestFailure': (ctx) => ({
    headline: `${ctx.businessNodeLabel}的测试发现一个问题`,
    detail: '系统正在分析并修复，修复后会重新测试',
    severity: 'info',
  }),

  // 部署失败
  'DeployError': (ctx) => ({
    headline: `预览环境部署遇到问题`,
    detail: '正在尝试备用部署方案',
    severity: 'warning',
  }),

  // 达到重试上限（需要PM介入）
  'MaxRetryExceeded': (ctx) => ({
    headline: `${ctx.businessNodeLabel}的实现遇到了困难`,
    detail: '自动修复未能解决问题，需要你帮忙确认一下',
    severity: 'action_required',
    suggested_action: '点击查看问题详情，系统会引导你定位问题',
  }),

  // 安全漏洞（高危需PM知道）
  'SecurityVulnerability_high': (ctx) => ({
    headline: `检测到一个安全隐患`,
    detail: '这个问题需要关注——系统正在尝试修复，如果无法自动修复会告知你详情',
    severity: 'warning',
  }),

  // 成本告警
  'CostBudgetWarning': (ctx) => ({
    headline: `AI调用费用接近预算上限`,
    detail: `当前已花费 $${ctx.errorMessage}，接近您设定的预算上限`,
    severity: 'action_required',
    suggested_action: '继续生成？还是暂停，调整方案后再继续？',
  }),
};
```

#### 6.2.2 多节点同时失败的汇总策略

```typescript
interface BatchErrorTranslation {
  /**
   * 多个节点同时失败时，不逐一报告，而是汇总为一条PM可理解的消息。
   */
  translateBatchErrors(errors: TechError[], context: TranslationContext[]): PMError;
}

function translateBatchErrors(errors: TechError[], contexts: TranslationContext[]): PMError {
  const count = errors.length;

  // 策略1: 同类错误合并
  const errorTypes = new Set(errors.map(e => e.type));
  if (errorTypes.size === 1) {
    const type = errors[0].type;
    return {
      headline: `${count}个功能遇到了相同的问题`,
      detail: `系统正在批量修复，预计需要2-3分钟`,
      severity: count >= 3 ? 'warning' : 'info',
    };
  }

  // 策略2: 不同类错误概括
  if (count <= 3) {
    const names = contexts.map(c => c.businessNodeLabel).join('、');
    return {
      headline: `${names}的实现遇到了一些问题`,
      detail: '系统正在逐一修复',
      severity: 'warning',
    };
  }

  // 策略3: 大面积失败 → 建议调整方案
  if (count > 3) {
    return {
      headline: `多个功能遇到问题（${count}个）`,
      detail: '这可能意味着方案需要调整。建议查看功能地图，确认功能间的依赖关系是否合理。',
      severity: 'action_required',
      suggested_action: '查看功能地图，系统会高亮有问题的功能',
    };
  }

  return {
    headline: `部分功能遇到问题`,
    detail: '系统正在处理中',
    severity: 'info',
  };
}
```

#### 6.2.3 翻译层自身出错时的降级

```typescript
interface TranslationFallback {
  /**
   * 翻译层本身可能出错（如模板渲染失败、上下文缺失）。
   * 定义降级行为，确保PM始终能看到某种反馈。
   */
  fallback_chain: [
    // Level 1: 用通用模板
    {
      strategy: 'generic_template';
      template: (nodeLabel: string) => `${nodeLabel}正在处理中...`;
    },
    // Level 2: 显示状态图标+节点名（无描述文字）
    {
      strategy: 'icon_only';
      render: (status: BusinessStatus) => translateBusinessStatus(status).icon;
    },
    // Level 3: 日志记录 + 静默（PM看不到任何异常信息）
    {
      strategy: 'silent_log';
      log: (error: Error) => console.error('[TranslationLayer]', error);
    },
  ];

  // 翻译层的健康检查
  health_check: {
    // 每5分钟检查翻译规则表完整性
    interval_ms: 300000;
    // 检查项：每种TechEventType都有对应翻译
    check_coverage: () => boolean;
    // 缺失翻译 → 用通用模板填充 + 告警日志
    on_missing: 'fill_generic_and_warn';
  };
}
```

### 6.3 反向翻译（PM反馈 → 技术修改指令）

PM的反馈是自然语言或选择题回答，需要反向翻译为技术层可执行的修改指令。

#### 6.3.1 反向翻译管道

```typescript
interface ReverseTranslationPipeline {
  /**
   * PM反馈 → 技术修改指令的完整流程
   *
   * PM反馈 → 歧义检测 → 选择题缩小范围 → AI复述确认 → 技术指令生成
   */
  stages: [
    'feedback_parse',       // 解析PM反馈类型
    'ambiguity_detect',     // 歧义检测
    'scope_narrow',         // 缩小范围（选择题）
    'ai_restate',           // AI复述确认
    'tech_instruction_gen', // 生成技术指令
  ];
}

// 阶段1: 反馈解析
interface FeedbackClassification {
  type: FeedbackType;
  confidence: number;               // 0-1，AI对自己分类结果的信心
  affected_nodes: string[];         // 可能涉及的业务节点
  raw_text: string;                 // PM的原始文字
}

type FeedbackType =
  | 'explicit_instruction'          // 明确指令："把按钮颜色改成蓝色"
  | 'vague_complaint'               // 模糊不满："这个看起来不太对"
  | 'logic_change'                  // 逻辑修改："注册时应该先验证手机号"
  | 'new_requirement'               // 新增需求："还需要一个导出Excel功能"
  | 'remove_requirement'            // 删除需求："评论功能不要了"
  | 'contradictory'                 // 矛盾修改："不需要登录，但要有个人中心"
```

#### 6.3.2 歧义检测规则

```typescript
interface AmbiguityDetector {
  /**
   * 检测PM反馈中的歧义，避免AI误解后白改。
   */
  rules: AmbiguityRule[];
}

interface AmbiguityRule {
  name: string;
  detect: (feedback: string, context: FeedbackContext) => AmbiguityResult | null;
}

interface AmbiguityResult {
  type: 'scope_ambiguous' | 'intent_ambiguous' | 'contradictory';
  description: string;
  clarification_needed: ClarificationQuestion;
}

interface ClarificationQuestion {
  question: string;
  type: 'choice' | 'yes_no';
  choices?: string[];
}

interface FeedbackContext {
  current_business_nodes: BusinessNode[];
  recent_acceptance_results: AcceptanceResult[];
  conversation_history: ConversationTurn[];
}

// 歧义检测规则实例
const AMBIGUITY_RULES: AmbiguityRule[] = [
  {
    name: 'scope_ambiguous',
    // "这个页面不对" → 哪个页面？哪里不对？
    detect: (feedback, ctx) => {
      if (feedback.includes('这个') && !feedback.includes('具体')) {
        const candidates = ctx.current_business_nodes.filter(n =>
          n.type === 'page' && n.status === 'previewable'
        );
        if (candidates.length > 1) {
          return {
            type: 'scope_ambiguous',
            description: '无法确定PM指的是哪个页面',
            clarification_needed: {
              question: '你说的是哪个页面？',
              type: 'choice',
              choices: candidates.map(n => n.label),
            },
          };
        }
      }
      return null;
    },
  },
  {
    name: 'intent_ambiguous',
    // "注册太复杂" → 减字段？分步骤？加第三方登录？
    detect: (feedback, ctx) => {
      const vagueWords = ['太复杂', '不方便', '不好用', '难用', '体验差'];
      if (vagueWords.some(w => feedback.includes(w))) {
        return {
          type: 'intent_ambiguous',
          description: 'PM的反馈过于笼统，需要具体化',
          clarification_needed: {
            question: '可以通过以下方式改善，你觉得哪种合适？',
            type: 'choice',
            // 选项由AI根据上下文动态生成
          },
        };
      }
      return null;
    },
  },
  {
    name: 'contradictory',
    // 检测与已确认需求的矛盾
    detect: (feedback, ctx) => {
      // AI分析反馈是否与已确认的功能逻辑矛盾
      // 具体实现依赖AI推理能力
      return null; // AI动态检测
    },
  },
];
```

#### 6.3.3 选择题优先策略

```typescript
interface ChoiceFirstStrategy {
  /**
   * 核心原则：PM的任何反馈，系统第一反应是给出选择题而非让PM自由描述。
   *
   * 选择题的好处：
   * 1. 降低PM的认知负担（选比写容易）
   * 2. 减少歧义（选项是预定义的）
   * 3. 加速反馈循环（PM秒选 vs 写半天）
   * 4. 便于系统精确理解PM意图
   */

  // 根据反馈类型生成选择题
  generateChoices(
    feedbackType: FeedbackType,
    context: FeedbackContext
  ): ClarificationQuestion;

  // 选择题层级：从粗到细逐步缩小范围
  narrowingLevels: [
    'which_node',    // 哪个功能有问题？
    'which_aspect',  // 功能的哪个方面？（UI / 逻辑 / 数据 / 性能）
    'what_change',   // 具体怎么改？（提供2-4个具体方案）
  ];

  // 兜底：PM连选3轮都选了"以上都不是"
  fallback: 'screenshot_upload' | 'free_text_with_ai_restate';
}

// 选择题生成示例
function generateNarrowingChoices(
  level: number,
  feedback: FeedbackClassification,
  context: FeedbackContext
): ClarificationQuestion {
  switch (level) {
    case 0: // 定位功能
      return {
        question: '你说的是哪个功能？',
        type: 'choice',
        choices: context.current_business_nodes
          .filter(n => n.status === 'previewable' || n.status === 'needs_fix')
          .map(n => n.label),
      };
    case 1: // 定位方面
      return {
        question: '这个功能哪里不对？',
        type: 'choice',
        choices: ['页面样式/布局', '操作流程/逻辑', '显示的数据不对', '功能缺少了什么', '其他'],
      };
    case 2: // 具体方案
      return {
        question: '你希望怎么改？',
        type: 'choice',
        // 选项由AI根据前两轮回答动态生成
        choices: [], // AI动态生成
      };
    default:
      return {
        question: '可以截图标注一下问题吗？',
        type: 'choice',
        choices: ['上传截图', '我试着文字描述'],
      };
  }
}
```

#### 6.3.4 AI复述确认机制

```typescript
interface AIRestateConfirmation {
  /**
   * AI收到PM反馈后，不立即动手修改。
   * 先用结构化格式复述理解，让PM确认。
   *
   * 格式：
   *   位置：[哪个功能/页面]
   *   现状：[当前是什么样]
   *   期望：[PM希望改成什么样]
   *   影响：[这个修改会影响哪些其他功能]
   *
   *   理解正确吗？ [是，去修] [不对，我再说]
   */
  restate(
    parsedFeedback: FeedbackClassification,
    narrowedScope: NarrowedScope
  ): RestateMessage;
}

interface RestateMessage {
  location: string;                 // 定位（如"登录页 → 密码输入框"）
  current_state: string;            // 现状描述
  expected_state: string;           // PM期望的状态
  impact_analysis: {
    affected_nodes: string[];       // 受影响的其他功能
    estimated_fix_time: string;     // 预估修复时间
    estimated_fix_cost: number;     // 预估修复费用
  };
  confirm_options: ['是，去修', '不对，我再说'];
}

interface NarrowedScope {
  target_node_id: string;           // 目标业务节点
  aspect: 'ui' | 'logic' | 'data' | 'performance' | 'missing_feature';
  specific_change?: string;         // 具体改动描述（如果PM已经明确）
}

/**
 * PM确认后，生成技术层修改指令
 */
function generateTechInstructions(
  confirmed: RestateMessage,
  scope: NarrowedScope
): TechModification[] {
  // 1. 找到目标业务节点映射的技术节点
  // 2. 根据修改类型确定需要修改哪些技术节点
  // 3. 生成技术层修改指令
  // 4. 标记受影响的下游技术节点为 stale
  return []; // 具体实现由执行引擎完成
}

interface TechModification {
  tech_node_id: string;
  action: 'regenerate' | 'patch' | 'delete' | 'add';
  instruction: string;              // AI修改指令
  priority: number;                 // 修改优先级
  cascade: boolean;                 // 是否触发下游重新生成
}
```

---

## 7. AI测试三层防线

AI生成的代码不可盲信。三层测试防线是质量保证的核心机制，每一层针对不同维度的错误。

### 7.1 Layer 1: 同源自测

**定义：** 生成代码的同一个AI（同Provider、同模型）同时生成测试并执行。

**优势：** 快速、低成本、AI对自己的代码最了解。
**弱点：** AI可能对自己的代码"视而不见"——代码和测试犯同一个错。

#### 7.1.1 覆盖率门禁

```typescript
interface Layer1Config {
  // 覆盖率门禁：低于阈值不允许进入下一步
  coverage_gates: {
    line_coverage_min: 0.60;        // 行覆盖率 >= 60%
    branch_coverage_min: 0.40;      // 分支覆盖率 >= 40%
    // 不要求100%——AI生成的测试追求100%覆盖率会导致大量无意义的测试
    // 60%/40%是"有用的测试"和"过度测试"之间的平衡点
  };

  // 测试类型
  test_types: {
    unit_tests: true;               // 函数级单元测试
    component_tests: true;          // 前端组件测试（React Testing Library）
    api_tests: true;                // API端点测试
    // 不包含E2E——E2E由Layer 3负责
  };

  // AI生成测试的prompt策略
  test_generation: {
    // 与代码生成分开调用（不在同一个prompt中）
    // 原因：同一prompt中生成代码+测试，测试容易"迎合"代码
    separate_invocation: true;
    // 传递给测试生成的上下文
    context: ['code_output', 'port_schema', 'business_description'];
    // 不传递给测试的内容（防止"看答案考试"）
    excluded: ['implementation_detail', 'internal_comments'];
  };
}
```

#### 7.1.2 修复循环实现

```typescript
interface FixLoop {
  /**
   * 测试失败 → AI分析原因 → 修改代码或测试 → 重跑测试
   * 最多3次循环。
   */
  max_iterations: 3;

  // 每轮修复策略递进
  strategies: [
    {
      round: 1;
      action: 'fix_code';          // 第1轮：假设代码有bug，修改代码
      prompt: '以下测试失败了，分析原因并修改代码使其通过';
    },
    {
      round: 2;
      action: 'fix_test_or_code';  // 第2轮：可能是测试不合理，同时审查代码和测试
      prompt: '代码和测试可能都有问题，分析哪边需要修改';
    },
    {
      round: 3;
      action: 'switch_model';      // 第3轮：换一个AI模型来修复
      prompt: '之前的修复没有成功，请从头分析代码逻辑是否正确';
    },
  ];

  // 3轮都失败 → 标记为Layer 1 failed，不阻塞，交给Layer 2
  on_max_exceeded: 'escalate_to_layer2';
}

// 修复循环的执行流程
interface FixIteration {
  iteration: number;                // 第几轮
  test_results: TestResult[];       // 本轮测试结果
  failure_analysis: string;         // AI的失败原因分析
  fix_action: 'code_modified' | 'test_modified' | 'both_modified';
  modified_files: string[];         // 本轮修改了哪些文件
  ai_model: string;                 // 本轮使用的AI模型
  tokens_used: number;
  duration_ms: number;
}

interface TestResult {
  test_name: string;
  test_file: string;
  passed: boolean;
  error_message?: string;
  error_type?: 'assertion' | 'runtime' | 'timeout';
  duration_ms: number;
}
```

### 7.2 Layer 2: 交叉验证

**定义：** 用**不同的AI Provider**从**PM需求描述（而非代码）**独立生成测试。

**优势：** 打破"同一AI对自己代码视而不见"的盲区。从需求出发生成的测试更接近PM的实际期望。
**弱点：** 成本翻倍、耗时增加。

#### 7.2.1 交叉验证核心原则

```typescript
interface Layer2Config {
  /**
   * 核心原则：测试从需求生成，而非从代码生成。
   *
   * Layer 1的测试知道代码实现细节，所以容易"迎合"代码。
   * Layer 2的测试只知道PM的需求描述，所以它验证的是"需求是否被满足"。
   */

  // 输入：PM需求描述 + 业务节点定义（不包含代码实现）
  input: {
    pm_requirement: string;         // PM的原始需求文本
    business_node: BusinessNode;    // 业务节点定义
    acceptance_criteria: string[];  // 验收标准
    // 明确排除：
    excluded: ['source_code', 'implementation_detail'];
  };

  // AI Provider选择策略
  provider_strategy: CrossProviderStrategy;

  // 最大重试
  max_fix_iterations: 2;           // Layer 2只允许2轮修复（比Layer 1少）
}

interface CrossProviderStrategy {
  /**
   * 选择与Layer 1不同的AI Provider。
   * 不同AI的"知识盲区"不同，交叉使用能覆盖更多边界。
   */
  rule: 'different_provider';       // 必须与Layer 1的Provider不同

  // 备选Provider优先级
  preference: [
    // 如果Layer 1用了Claude → Layer 2优先用DeepSeek或Codex
    { if_layer1: 'claude',   prefer: ['deepseek', 'codex', 'qwen'] },
    { if_layer1: 'codex',    prefer: ['claude', 'deepseek', 'qwen'] },
    { if_layer1: 'deepseek', prefer: ['claude', 'codex', 'qwen'] },
    { if_layer1: 'qwen',     prefer: ['claude', 'deepseek', 'codex'] },
  ];

  // 降级：如果首选Provider不可用
  fallback: 'same_provider_different_prompt';
  // 同一Provider但用完全不同的prompt模板（不理想但聊胜于无）
}
```

#### 7.2.2 交叉验证的测试类型

```typescript
interface Layer2Tests {
  /**
   * Layer 2生成的测试类型与Layer 1不同，侧重业务语义。
   */
  test_types: {
    // 1. 用户故事验证：按PM的用户故事生成端到端场景
    user_story_tests: {
      input: 'business_node.detail.user_story';
      output: 'E2E test scenarios';
      tool: 'Playwright';
    };

    // 2. 边界值测试：从数据节点的字段定义推导边界
    boundary_tests: {
      input: 'business_node.detail.fields';
      output: '边界值 + 异常输入测试';
      tool: 'Vitest / Pytest';
    };

    // 3. 业务规则测试：从rule节点直接生成
    business_rule_tests: {
      input: 'business_node(type=rule).detail';
      output: '规则条件的全组合测试';
      tool: 'Vitest / Pytest';
    };

    // 4. 流程完整性测试：从flow节点的步骤定义生成
    flow_integrity_tests: {
      input: 'business_node(type=flow).detail.steps';
      output: '完整用户路径E2E测试';
      tool: 'Playwright';
    };
  };
}
```

### 7.3 Layer 3: PM引导验收

**定义：** 最终的业务语义防线。AI无法替代PM判断"这个逻辑对不对"、"这个流程符不符合业务实际"。

**优势：** 唯一能验证业务语义正确性的层。
**弱点：** 需要PM时间、PM可能遗漏。

#### 7.3.1 PM验收的定位

```typescript
interface Layer3Config {
  /**
   * Layer 3不是"测试"，是"验收"。
   *
   * Layer 1 + Layer 2保证代码在技术上是正确的。
   * Layer 3保证代码在业务上是PM想要的。
   *
   * 即使Layer 1+2全部通过，Layer 3仍然可能失败——
   * 因为AI可能"正确地实现了错误的需求"。
   */

  // 验收覆盖范围
  scope: {
    // 所有feature/page/flow/rule节点必须验收
    required: ['feature', 'page', 'flow', 'rule'];
    // data/connect/milestone可跳过（技术性强，PM看不懂细节）
    optional: ['data', 'connect', 'milestone'];
  };

  // 验收方式（详见第8章）
  methods: {
    screenshot_review: true;        // 截图审查（page/feature类型）
    flow_walkthrough: true;         // 流程走查（flow类型）
    rule_verification: true;        // 规则验证（rule类型）
    // 不包含代码审查——PM不看代码
  };

  // "快速验收"模式（替代"全部信任AI"按钮）
  quick_mode: QuickAcceptanceMode;
}
```

#### 7.3.2 快速验收模式

```typescript
interface QuickAcceptanceMode {
  /**
   * 不提供"全部信任AI"按钮——这会让PM跳过所有验收，失去质量最后一道防线。
   * 替代方案："快速验收"模式——只验核心路径，跳过边缘场景。
   */

  // 触发条件：PM说"快速验收"或点击"快速模式"按钮
  trigger: 'pm_explicit_request';

  // 快速模式的验收范围
  scope: {
    // 核心路径：必须验（约占总功能的30-50%）
    core_paths: {
      // 自动识别核心路径的规则：
      // 1. 所有flow类型节点的主路径
      // 2. 被3个以上节点依赖的功能
      // 3. 涉及支付/权限/数据写入的功能
      auto_identify: true;
      // PM可手动添加/移除核心路径
      pm_override: true;
    };

    // 非核心路径：跳过，但标记为"未验收"
    skipped_paths: {
      label: '未验收（快速模式跳过）';
      // 不阻塞上线，但在部署清单中明确标注
      blocks_deploy: false;
      warning_text: '以下功能使用了快速验收模式，未经完整验证';
    };
  };

  // 快速模式的风险提示
  risk_notice: '快速验收只验证了核心路径。非核心功能可能存在问题，建议上线后尽快完成完整验收。';
}
```

### 7.4 Validate-Before-Propagate原则

**核心思想：** 一个节点的输出必须经过验证后才能传递给下游节点。这是阻断AI幻觉级联传播的关键机制。

#### 7.4.1 传播规则

```typescript
interface ValidateBeforePropagate {
  /**
   * 节点状态必须达到 validated 才允许传播输出到下游。
   *
   * generating → completed → validated → 可传播到下游
   *                          ↑
   *                     这一步是关键
   *
   * 没有 validated，即使 completed 也不传播。
   * 原因：completed只代表AI"说完了"，不代表"说对了"。
   */

  // 传播前置条件
  propagation_gate: {
    required_status: 'validated';   // 必须是validated
    // completed不够——必须通过自动验证
    // approved不需要——人工审查后传播太慢
  };

  // 验证内容（completed → validated 的检查项）
  validation_checks: ValidationCheck[];
}

interface ValidationCheck {
  name: string;
  description: string;
  tool: string;
  required: boolean;                // true = 必须通过，false = 警告但不阻塞
  auto_fixable: boolean;            // 失败后能否自动修复
  max_fix_attempts: number;
}

const VALIDATION_CHECKS: ValidationCheck[] = [
  {
    name: 'syntax',
    description: '语法检查——代码是否能被解析器正确解析',
    tool: 'tsc --noEmit / python -m py_compile',
    required: true,
    auto_fixable: true,
    max_fix_attempts: 3,
  },
  {
    name: 'lint',
    description: 'Lint检查——代码风格和常见错误',
    tool: 'eslint / ruff',
    required: true,
    auto_fixable: true,             // eslint --fix / ruff --fix
    max_fix_attempts: 3,
  },
  {
    name: 'dependency_resolution',
    description: '依赖验证——所有import的包和模块都存在',
    tool: 'npm ls / pip check',
    required: true,
    auto_fixable: true,             // 替换为真实存在的包
    max_fix_attempts: 2,
  },
  {
    name: 'schema_validation',
    description: 'Schema验证——输出数据符合端口定义的Schema',
    tool: 'ajv / json-schema-validator',
    required: true,
    auto_fixable: false,            // Schema不匹配通常意味着逻辑错误
    max_fix_attempts: 2,
  },
  {
    name: 'security_scan',
    description: '安全扫描——无硬编码密钥、无已知漏洞模式',
    tool: 'semgrep / npm audit',
    required: true,
    auto_fixable: true,             // 移除硬编码密钥、升级有漏洞的包
    max_fix_attempts: 2,
  },
  {
    name: 'dead_code',
    description: '死代码检测——无未使用的导入和变量',
    tool: '静态分析（TypeScript unused / Python vulture）',
    required: false,                // 不阻塞传播，但建议修复
    auto_fixable: true,
    max_fix_attempts: 1,
  },
];
```

#### 7.4.2 传播策略

```typescript
interface PropagationStrategy {
  /**
   * validated节点的输出如何传递给下游节点。
   * 传递策略取决于Edge的type和transform配置。
   */

  // 按边类型区分
  by_edge_type: {
    hard: {
      // 必须等源节点validated后才开始下游节点
      blocking: true;
      // 传递完整输出或按transform配置
      context_pass: 'per_transform_config';
    };
    soft: {
      // 不阻塞下游节点开始
      blocking: false;
      // 源节点validated前：传递空上下文
      // 源节点validated后：传递输出（如果下游还没完成就注入）
      context_pass: 'lazy_inject';
    };
    reference: {
      // 仅引用，不影响执行
      blocking: false;
      context_pass: 'metadata_only';
    };
  };

  // 上下文分层传递（与旧文档一致）
  context_layers: {
    direct_parent: 'full';          // 直接前驱：完整输出
    grandparent: 'summary';         // 间接前驱（2-3层）：AI摘要
    distant: 'metadata_only';       // 更远：仅元数据（类型+标签+状态）
    global: 'project_config';       // 全局：技术栈+编码规范
  };

  // 传播失败处理
  on_propagation_failure: {
    // 下游节点收到的上下文不完整（如摘要生成失败）
    action: 'retry_once_then_degrade';
    // 降级：用metadata_only替代summary
    degrade_to: 'metadata_only';
    // 告警日志（PM不可见）
    log_warning: true;
  };
}
```

---

## 8. 引导式验收流程

引导式验收是PM参与度最高的环节，也是质量保证的最终防线。目标是：PM不需要看代码、不需要理解技术细节——通过截图和是否题，逐功能确认"对不对"。

### 8.1 四阶段验收

```
┌────────────────────────────────────────────────────────┐
│ 阶段A: 功能清单概览（~1分钟）                            │
│ PM看到所有功能的完成状态总览                               │
├────────────────────────────────────────────────────────┤
│ 阶段B: 逐功能引导验收（每个功能2-3分钟）                  │
│ 系统展示截图 + 2-3个是否题，PM逐个确认                    │
├────────────────────────────────────────────────────────┤
│ 阶段C: 问题定位（当PM说"否"时触发）                       │
│ 从选择题开始缩小范围 → 截图标注 → AI复述确认              │
├────────────────────────────────────────────────────────┤
│ 阶段D: 验收总结                                          │
│ PM看到完整验收报告，决定上线或返工                         │
└────────────────────────────────────────────────────────┘
```

#### 8.1.1 阶段A: 功能清单概览（约1分钟）

```typescript
interface AcceptancePhaseA {
  /**
   * PM打开验收页面后，第一眼看到的是功能清单总览。
   * 目标：让PM快速了解"哪些功能做好了"，建立全局概念。
   */

  display: {
    // 总览卡片
    summary_card: {
      headline: string;             // "8个功能全部就绪，等你验收"
      total_features: number;
      ready_for_review: number;
      auto_test_passed: number;     // "已通过自动测试"（增强PM信心）
    };

    // 功能清单（按推荐验收顺序排列）
    feature_list: AcceptanceFeatureItem[];

    // 预估总验收时间
    estimated_time: string;         // "预计需要15-20分钟"

    // 操作按钮
    actions: {
      start_full: '开始完整验收';   // 逐功能验收
      start_quick: '快速验收';      // 只验核心路径
    };
  };
}

interface AcceptanceFeatureItem {
  node_id: string;
  label: string;                    // PM语言的功能名
  type: BusinessNodeType;
  icon: string;
  test_status: 'all_passed' | 'mostly_passed' | 'has_warnings';
  review_order: number;             // 推荐的验收顺序
  is_core_path: boolean;            // 是否核心路径（快速验收会验这些）
  estimated_review_time: string;    // 预估单项验收时间
}

// 验收顺序的排列策略
function determineReviewOrder(nodes: BusinessNode[]): AcceptanceFeatureItem[] {
  // 1. 核心路径优先（被多个节点依赖的功能先验）
  // 2. 流程节点优先于单个功能节点（flow先于feature）
  // 3. 规则节点排在流程之后（先确认流程对不对，再检查规则）
  // 4. 页面节点按用户旅程顺序排列
  return []; // 具体排序实现
}
```

#### 8.1.2 阶段B: 逐功能引导验收（每个功能2-3分钟）

```typescript
interface AcceptancePhaseB {
  /**
   * 逐个功能展示截图 + 是否题。
   * PM的核心动作：看截图 → 回答2-3个问题 → 下一个。
   */

  // 每个功能的验收面板
  perFeaturePanel: AcceptancePanel;
}

interface AcceptancePanel {
  // 功能标题和说明
  header: {
    label: string;                  // "用户注册"
    description: string;            // "新用户通过手机号注册账号"
    progress: string;               // "3/8 功能验收中"
  };

  // 截图展示区
  screenshots: {
    // 按操作步骤排列的截图序列
    steps: AcceptanceStep[];
    // 截图对比（方案设计稿 vs 实际生成）
    comparison?: {
      design: Screenshot;           // 设计预期
      actual: Screenshot;           // 实际截图
    };
  };

  // 是否题（2-3个，覆盖核心验收点）
  questions: AcceptanceQuestion[];

  // 操作按钮
  actions: {
    all_ok: '没问题，下一个';       // 所有问题回答"是"
    has_issue: '有问题';            // 进入阶段C
    skip: '跳过此功能';            // 标记为"未验收"
  };
}

interface AcceptanceStep {
  order: number;
  screenshot: Screenshot;
  caption: string;                  // 截图说明（如"注册页面 — 填写手机号和密码"）
  highlight_areas?: Area[];         // 截图上的高亮区域（引导PM关注的地方）
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;                    // 高亮区域的说明
}

// 是否题的自动生成策略
function generateAcceptanceQuestions(node: BusinessNode): AcceptanceQuestion[] {
  const questions: AcceptanceQuestion[] = [];

  // 按节点类型生成不同的问题
  switch (node.type) {
    case 'feature':
      // 功能节点：问"功能是否完整"、"操作是否符合预期"
      questions.push({
        id: `q_${node.id}_completeness`,
        question: `${node.label}的功能是否完整？（包含了你需要的所有操作）`,
        type: 'yes_no',
      });
      questions.push({
        id: `q_${node.id}_ux`,
        question: `操作流程是否顺畅？（点击顺序、页面跳转是否合理）`,
        type: 'yes_no',
      });
      break;

    case 'page':
      // 页面节点：问"布局是否OK"、"信息是否完整"
      questions.push({
        id: `q_${node.id}_layout`,
        question: `这个页面的布局和样式是否满意？`,
        type: 'yes_no',
      });
      questions.push({
        id: `q_${node.id}_content`,
        question: `页面上显示的信息是否完整？（没有遗漏的字段）`,
        type: 'yes_no',
      });
      break;

    case 'flow':
      // 流程节点：问"从头到尾走一遍是否通顺"
      questions.push({
        id: `q_${node.id}_flow`,
        question: `从第一步到最后一步，整个流程是否通顺？`,
        type: 'yes_no',
      });
      questions.push({
        id: `q_${node.id}_edge_cases`,
        question: `如果中途取消或返回上一步，表现是否正常？`,
        type: 'yes_no',
      });
      break;

    case 'rule':
      // 规则节点：给出具体场景让PM判断
      const detail = node.detail as RuleDetail;
      questions.push({
        id: `q_${node.id}_rule_correct`,
        question: `规则"${detail.condition} → ${detail.action}"是否正确？`,
        type: 'yes_no',
      });
      questions.push({
        id: `q_${node.id}_rule_edge`,
        question: `边界情况是否处理正确？（如刚好等于条件值时）`,
        type: 'yes_no',
      });
      break;
  }

  return questions;
}
```

#### 8.1.3 阶段C: 问题定位（当PM说"否"时）

```typescript
interface AcceptancePhaseC {
  /**
   * PM说"有问题"时进入此阶段。
   * 核心策略：从粗到细，用选择题缩小范围，最后截图标注。
   */

  // 定位流程
  locating_flow: LocationStage[];
}

type LocationStage =
  | WhichAspect                     // 第一步：哪个方面有问题？
  | WhatExactly                     // 第二步：具体是什么问题？
  | HowToFix                        // 第三步：期望怎么修改？
  | ScreenshotFallback;             // 兜底：截图标注

interface WhichAspect {
  stage: 'which_aspect';
  question: '这个功能哪里有问题？';
  choices: [
    '页面看起来不对（样式/布局/颜色）',
    '操作不对（点了没反应/跳转错误）',
    '数据不对（显示的信息有误）',
    '逻辑不对（规则/计算结果不符合预期）',
    '缺少功能（应该有但没有的东西）',
    '说不清楚（我截图标注）',
  ];
}

interface WhatExactly {
  stage: 'what_exactly';
  // 根据上一步的回答，动态生成更具体的选择题
  // 例如PM选了"页面看起来不对"→ 问具体是颜色/字体/间距/图标/布局
  question: string;                 // AI动态生成
  choices: string[];                // AI根据上下文动态生成
}

interface HowToFix {
  stage: 'how_to_fix';
  // AI复述理解 + 提供修复方案选择
  ai_restate: RestateMessage;
  fix_options: FixOption[];
}

interface FixOption {
  label: string;                    // PM可理解的方案描述
  estimated_time: string;           // 预估修复时间
  impact: string[];                 // 会影响哪些其他功能
}

interface ScreenshotFallback {
  stage: 'screenshot_fallback';
  // PM上传截图并标注问题区域
  prompt: '截个图，在有问题的地方画个圈或箭头';
  upload_options: ['截图上传', '录制10秒屏幕'];
  // AI分析截图标注，转化为技术修改指令
  ai_analysis: (screenshot: Screenshot, annotations: ScreenshotAnnotation[]) => TechModification[];
}
```

#### 8.1.4 阶段D: 验收总结

```typescript
interface AcceptancePhaseD {
  /**
   * 所有功能验收完毕后，展示完整验收报告。
   * PM根据报告决定：上线 / 返工 / 部分上线。
   */

  display: AcceptanceSummary;
}

interface AcceptanceSummary {
  // 总览
  headline: string;                 // "7个功能通过，1个功能需要修改"
  overall_status: 'all_passed' | 'has_issues' | 'critical_issues';

  // 按状态分组的功能列表
  passed: AcceptanceSummaryItem[];
  needs_fix: AcceptanceSummaryItem[];
  skipped: AcceptanceSummaryItem[];

  // 需要修改的功能的问题汇总
  issues_summary: IssueSummary[];

  // PM操作选项
  actions: {
    // 全部通过时
    proceed_to_publish: '全部没问题，准备上线';
    // 有问题时
    fix_and_recheck: '修复后重新验收这些功能';
    fix_later: '先上线已通过的功能，问题功能后续修复';
    // 通用
    redo_acceptance: '重新验收所有功能';
  };

  // 修复预估
  fix_estimate?: {
    total_time: string;             // "预计需要5-10分钟修复"
    affected_features: string[];
    will_need_recheck: boolean;     // 修复后是否需要重新验收
  };
}

interface AcceptanceSummaryItem {
  node_id: string;
  label: string;
  type: BusinessNodeType;
  status: 'passed' | 'failed' | 'skipped';
  questions_answered: number;
  questions_total: number;
  issues: AcceptanceIssue[];
}

interface IssueSummary {
  node_label: string;
  issue_count: number;
  severity_breakdown: Record<'critical' | 'major' | 'minor' | 'cosmetic', number>;
  pm_description: string;           // PM语言的问题描述
}
```

### 8.2 业务逻辑走查模式

除了截图验收，PM还需要走查业务逻辑——特别是涉及规则（rule）和流程（flow）的功能。

#### 8.2.1 场景剧本自动生成

```typescript
interface ScenarioWalkthrough {
  /**
   * 系统自动为每个flow节点生成"场景剧本"。
   * 剧本以用户角色为视角，一步步走完整个流程。
   * PM读剧本就像在读一个用户故事——直觉判断"对不对"。
   */

  generateScript(flowNode: BusinessNode & { detail: FlowDetail }): WalkthroughScript;
}

interface WalkthroughScript {
  title: string;                    // "下单支付流程 — 完整场景"
  role: string;                     // "你是一个想要购买商品的买家"
  preconditions: string[];          // 前置条件（如"已登录"、"购物车有商品"）

  steps: WalkthroughStep[];

  // 嵌入的规则卡片
  rule_cards: RuleCard[];
}

interface WalkthroughStep {
  order: number;
  page: string;                     // 当前页面名称
  screenshot: Screenshot;           // 当前步骤的截图
  action: string;                   // PM要做的动作（如"点击'立即购买'按钮"）
  expected_result: string;          // 期望看到的结果（如"跳转到确认订单页"）
  verification_question: string;    // 验证问题（如"页面是否跳转到了确认订单页？"）
  notes?: string;                   // 补充说明
}

interface RuleCard {
  /**
   * 嵌入在走查步骤中的规则卡片。
   * 当走查步骤涉及某条业务规则时，弹出规则卡片让PM确认。
   */
  rule_node_id: string;
  trigger_at_step: number;          // 在哪一步弹出
  card_content: {
    title: string;                  // "满减优惠规则"
    condition: string;              // "订单总额 >= 100元"
    action: string;                 // "减免20元"
    example: string;                // "示例：商品总额110元 → 实付90元"
    question: string;               // "这个优惠规则正确吗？"
  };
}
```

#### 8.2.2 异常流程走查

```typescript
interface AbnormalFlowWalkthrough {
  /**
   * 正常流程之外，系统自动生成3类异常场景供PM走查。
   * PM可以选择全部走查或跳过。
   */

  categories: AbnormalCategory[];
}

interface AbnormalCategory {
  name: string;
  description: string;
  scenarios: AbnormalScenario[];
  pm_skip_option: boolean;          // PM可以跳过此类别
}

const ABNORMAL_CATEGORIES: AbnormalCategory[] = [
  {
    name: '权限异常',
    description: '未登录/无权限时的系统表现',
    scenarios: [
      {
        title: '未登录访问需登录页面',
        steps: '直接访问订单页面URL → 应跳转到登录页',
        screenshot: null,           // 系统自动截图
        question: '未登录时是否正确跳转到了登录页？',
      },
      {
        title: '普通用户访问管理后台',
        steps: '用普通用户账号访问管理后台URL → 应显示403',
        screenshot: null,
        question: '普通用户是否被正确拦截？',
      },
    ],
    pm_skip_option: true,
  },
  {
    name: '并发/竞态异常',
    description: '多用户同时操作时的系统表现',
    scenarios: [
      {
        title: '商品库存竞争',
        steps: '最后1件商品，两个用户同时下单 → 只有一个能成功',
        screenshot: null,
        question: '库存为0时是否正确提示"商品已售罄"？',
      },
    ],
    pm_skip_option: true,
  },
  {
    name: '边界值异常',
    description: '极端输入或边界条件时的系统表现',
    scenarios: [
      {
        title: '超长文本输入',
        steps: '在名称输入框输入500个字符',
        screenshot: null,
        question: '页面是否正常显示？（不错乱、不溢出）',
      },
      {
        title: '空值提交',
        steps: '不填写任何内容直接点提交',
        screenshot: null,
        question: '是否有合适的错误提示？',
      },
      {
        title: '满减边界',
        steps: '订单金额刚好等于100元',
        screenshot: null,
        question: '满减优惠是否正确生效？',
      },
    ],
    pm_skip_option: true,
  },
];

interface AbnormalScenario {
  title: string;
  steps: string;
  screenshot: Screenshot | null;    // 系统自动截图
  question: string;                 // PM验证问题
}
```

### 8.3 反馈迭代循环

PM发现问题后，进入修复→再验的循环。系统严格控制循环次数，避免无限返工。

#### 8.3.1 修复循环流程

```typescript
interface FeedbackIterationLoop {
  /**
   * PM发现问题 → 系统引导描述 → AI修复 → 系统引导再验
   *
   * 每个功能节点的修复最多3轮。
   * 3轮修不好 → 进入五级降级链。
   */

  max_iterations_per_node: 3;

  // 每轮的流程
  iteration_flow: IterationRound[];
}

interface IterationRound {
  round: number;

  // 步骤1: PM描述问题（通过阶段C的引导流程）
  problem_description: {
    method: 'choice_tree' | 'screenshot' | 'free_text';
    output: TechModification[];     // 转化为技术修改指令
  };

  // 步骤2: AI修复
  ai_fix: {
    // 第1轮：同模型修复
    // 第2轮：换prompt策略
    // 第3轮：换AI模型
    strategy: FixStrategy;
    timeout_ms: number;             // 修复超时
    auto_test_after_fix: true;      // 修复后自动重跑测试
    auto_screenshot_after_fix: true; // 修复后自动重新截图
  };

  // 步骤3: PM再验
  re_verification: {
    // 只验修改过的部分（不需要重新验收全部）
    scope: 'affected_only';
    // 展示修改前后的截图对比
    show_diff: true;
    // PM操作："修好了" / "还是不对"
    actions: ['修好了', '还是不对'];
  };
}

type FixStrategy =
  | { type: 'same_model'; description: '同一AI模型修复' }
  | { type: 'different_prompt'; description: '换一种prompt策略' }
  | { type: 'different_model'; description: '换一个AI模型重新生成' };

function getFixStrategy(round: number): FixStrategy {
  switch (round) {
    case 1: return { type: 'same_model', description: '同一AI模型修复' };
    case 2: return { type: 'different_prompt', description: '换一种prompt策略' };
    case 3: return { type: 'different_model', description: '换一个AI模型重新生成' };
    default: return { type: 'different_model', description: '换一个AI模型重新生成' };
  }
}
```

#### 8.3.2 五级降级链

```typescript
interface DegradationChain {
  /**
   * 3轮修复都失败后，进入五级降级链。
   * 每一级尝试不同的策略，逐步降低自动化程度。
   * 最终兜底：生成人类开发者可接手的交接文档。
   */

  levels: DegradationLevel[];
}

interface DegradationLevel {
  level: number;
  name: string;
  action: string;
  auto_trigger: boolean;            // 是否自动触发（还是需要PM确认）
  pm_visible_message: string;       // PM看到的消息
  estimated_time: string;           // 预估处理时间
}

const DEGRADATION_CHAIN: DegradationLevel[] = [
  {
    level: 1,
    name: '换模型重做',
    action: '使用完全不同的AI模型重新生成该功能的全部代码',
    auto_trigger: true,             // 自动执行，不打扰PM
    pm_visible_message: '正在用另一种方式重新实现这个功能...',
    estimated_time: '3-5分钟',
  },
  {
    level: 2,
    name: '简化实现',
    action: '分析功能需求，自动降低实现复杂度（如去掉动画、简化交互）',
    auto_trigger: true,
    pm_visible_message: '功能实现遇到困难，正在简化实现方式...',
    estimated_time: '2-3分钟',
  },
  {
    level: 3,
    name: '功能拆分',
    action: '将该功能拆分为2-3个更小的子功能，分别实现',
    auto_trigger: false,            // 需要PM确认拆分方案
    pm_visible_message: '这个功能比较复杂，建议拆分成几个小功能分别实现。以下是拆分方案：',
    estimated_time: '5-10分钟',
  },
  {
    level: 4,
    name: '标记为"需人工"',
    action: '该功能标记为"需要专业开发者介入"，其余功能正常上线',
    auto_trigger: false,
    pm_visible_message: '这个功能的实现超出了AI当前能力，建议交给专业开发者处理。其余功能可以正常上线。',
    estimated_time: '无——排除该功能后继续',
  },
  {
    level: 5,
    name: '生成交接文档',
    action: '生成完整的技术交接文档，包含：需求描述、已生成的代码、失败原因分析、修复建议',
    auto_trigger: true,             // 到了Level 5自动生成
    pm_visible_message: '已生成技术交接文档，开发者可以在此基础上快速完成这个功能。',
    estimated_time: '1-2分钟（生成文档）',
  },
];
```

#### 8.3.3 交接文档结构

```typescript
interface HandoverDocument {
  /**
   * Level 5降级时生成的技术交接文档。
   * 目标读者：人类开发者，帮助其快速接手。
   */

  // 文档头部
  header: {
    feature_name: string;           // 功能名称
    pm_requirement: string;         // PM的原始需求描述
    generated_at: string;           // ISO 8601
    failure_summary: string;        // 一句话概括为什么AI没搞定
  };

  // 已完成的部分
  completed_parts: {
    files: { path: string; status: 'complete' | 'partial' | 'incorrect' }[];
    passing_tests: string[];
    failing_tests: string[];
  };

  // 失败原因分析
  failure_analysis: {
    root_cause: string;             // 根本原因
    attempted_fixes: {
      round: number;
      strategy: string;
      result: string;
    }[];
    ai_suggestion: string;          // AI对人类开发者的建议
  };

  // PM的验收反馈历史
  pm_feedback_history: {
    round: number;
    feedback: string;
    screenshot?: string;
  }[];

  // 技术上下文
  tech_context: {
    tech_stack: string;
    related_nodes: string[];        // 相关的技术节点及其状态
    dependencies: string[];         // 依赖的其他功能
    api_contracts: string[];        // 需要遵守的API接口契约
  };
}
```

#### 8.3.4 迭代控制面板（PM可见）

```typescript
interface IterationControlPanel {
  /**
   * PM在验收过程中看到的迭代控制面板。
   * 显示当前功能的修复进度和剩余尝试次数。
   */

  display: {
    // 功能名称和当前轮次
    header: string;                 // "用户注册 — 第2轮修复"

    // 修复进度条
    progress: {
      current_round: number;        // 当前第几轮
      max_rounds: 3;
      remaining: number;            // 剩余尝试次数
    };

    // 本轮修复状态
    fix_status: 'analyzing' | 'fixing' | 'testing' | 'ready_for_review';
    fix_status_text: string;        // "AI正在分析问题原因..."

    // 修复前后对比（ready_for_review时显示）
    comparison?: {
      before: Screenshot;           // 修复前截图
      after: Screenshot;            // 修复后截图
      changes_description: string;  // "修改了按钮颜色和间距"
    };

    // PM操作
    actions: {
      confirm_fixed: '修好了，继续验收';
      still_wrong: '还是不对';
      skip_feature: '跳过这个功能，先验其他的';
      accept_as_is: '虽然不完美，但可以接受';
    };
  };
}
```

---

> **本章小结**
>
> - **第5章**定义了双层数据架构：技术层是truth source（8种节点类型 + 新增validated状态），业务层是只读投影（7种节点类型 + 8种业务状态）。状态派生由纯函数实现，保证两层一致。事件溯源扩展为双层事件，快照在每个Pipeline Phase完成时自动创建。
>
> - **第6章**定义了三级翻译架构（操作→动作、模块→功能、项目→产品），覆盖正常翻译、错误翻译、批量错误汇总、翻译层自身降级，以及反向翻译（PM反馈→技术指令）的完整管道。
>
> - **第7章**定义了三层测试防线：Layer 1同源自测（60%/40%覆盖率门禁 + 3轮修复循环），Layer 2交叉验证（不同AI Provider从需求生成测试），Layer 3 PM引导验收（用"快速验收"替代"全部信任AI"按钮）。Validate-Before-Propagate原则确保只有validated的节点才能传播输出。
>
> - **第8章**定义了四阶段验收流程（A清单→B逐功能→C问题定位→D总结），业务逻辑走查模式（场景剧本 + 规则卡片 + 三类异常走查），以及反馈迭代循环（3轮修复 + 五级降级链，Level 5生成交接文档）。
