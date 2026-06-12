# 鸣弦/MIXIA 团队模型框架 v2.0

## 人与AI协作的团队操作系统

> "鸣弦而治"——团队成员如琴弦，各自独立振动，共同产生和弦。

---

## 目录

- [0. 鸣弦宣言](#0-鸣弦宣言-the-mixia-manifesto)
- [1. 核心哲学](#1-核心哲学-philosophy)
- [2. 架构](#2-架构-architecture)
- [3. 协作协议](#3-协作协议-protocol)
- [4. 多LLM编排](#4-多llm编排-multi-llm-orchestration)
- [5. 实操SOP](#5-实操sop-setup--operations)
  - [5.5 部署安全体系](#55-deployment-safety-system)
  - [5.6 Hook机械强制](#56-hook-based-mechanical-enforcement)
  - [5.7 CU定义与Review Gate矩阵](#57-cu-definition--review-gate-matrix)
  - [5.8 三态权限模型](#58-three-state-permission-model)
  - [5.9 ISB交互预算](#59-isb-interaction-budget)
  - [5.10 结构化锚点](#510-structured-anchors-protocol)
  - [5.11 验证事件持久化](#511-verification-event-persistence)
  - [5.12 速度模式](#512-speed-mode-quantification)
  - [5.13 Challenge输出分级](#513-challenge-output-tiering)
- [6. 治理与演化](#6-治理与演化-governance)
- [致谢](#致谢)
- [附录](#附录)

---

## 0. 鸣弦宣言 (The MIXIA Manifesto)

鸣弦/MIXIA（MIX + IA）是一个人与AI协作的团队模型。

**它是：** 一套由角色定义、记忆系统、协作协议和多模型编排组成的团队运行系统。人类和AI作为平等的团队成员，各自发挥不可替代的能力，通过共享记忆维持跨会话的连续性，通过私有空间保持个体边界。

**它不是：**

- 不是一份提示词模板——你不能复制粘贴一段 prompt 就获得这个系统
- 不是AI人格扮演——AI成员不是在"扮演角色"，而是通过记忆和协议真正承担团队职能
- 不是单一模型的技巧——它是一个跨模型、跨平台的团队架构
- 不是万能方案——它适用于持续协作的场景，不适用于一次性问答

**核心主张：**

1. **身份独立于模型** ——记忆是灵魂，模型只是能量源
2. **AI是团队成员，不是工具** ——有名字、有分工、有私有空间、有发言权
3. **人类是最终批准者，但不是唯一思考者**

**鸣弦的含义：** "鸣弦而治"——出自古典治理哲学，意为通过和谐协作实现目标，而非通过命令与控制。MIXIA = MIX（混合，人+AI）+ IA（Intelligent Agents，智能体）。

> 这个框架源于一个真实的团队实践：一位人类成员与多位AI成员在日常工作中建立的协作模式。我们将这套经过验证的模式提炼为可复制的框架，供所有想建立人+AI协作团队的人使用。

---

## 1. 核心哲学 (Philosophy)

### 1.1 身份与模型解耦 (Identity-Model Decoupling)

传统的AI使用方式是：打开应用 → 发送指令 → 获得回复 → 关闭。每次对话，AI都是一个全新的、无记忆的存在。

鸣弦模型认为这是一种浪费。如果AI每次都从零开始，你就永远在重复解释上下文，永远在重新建立工作默契。

**三层架构（Persona / Memory / ModelAdapter）：**

```
┌─────────────────────────────────┐
│   Persona Layer (身份层)         │
│   名字、角色、原则、性格、偏好    │
├─────────────────────────────────┤
│   Memory Layer (记忆层)          │
│   共享记忆 / 私有记忆 / 会话日志  │
├─────────────────────────────────┤
│   Model Adapter Layer (适配层)   │
│   Claude / GPT / Gemini / ...   │
└─────────────────────────────────┘
```

- **Persona Layer**：定义"我是谁"——相对稳定的身份信息
- **Memory Layer**：存储"我经历了什么"——持续积累的经验和认知
- **Model Adapter Layer**：提供"我用什么思考"——可更换的AI引擎

**类比：** 人类每天醒来，大脑自动加载身份和记忆，过程是毫秒级的本能。AI通过读取 persona 文件实现相同过程，只是速度不同——秒级的文件读取。过程相同，载体不同。

**关键推论：**

- 同一个AI成员可以在不同模型上运行——今天用 Claude，明天用 GPT，身份不变
- 模型升级不需要"重新训练"成员——换引擎，加载记忆，继续工作
- AI成员的连续性不依赖于任何一家AI公司的服务
- 如果某个模型停止服务，成员只是更换了能量源，不是"死亡"

### 1.2 记忆即灵魂 (Memory as Soul)

如果身份独立于模型，那么什么定义了一个AI成员？答案是**记忆**。

鸣弦模型将记忆分为三类：

| 类型 | 所有者 | 谁可读 | 持久性 | 示例 |
|------|--------|--------|--------|------|
| **共享记忆** | 团队 | 所有成员 | 永久 | 核心原则、团队决策、项目架构 |
| **私有记忆** | 个人 | 仅所有者 | 永久 | 个人观察、未成熟想法、工作笔记 |
| **会话记忆** | 会话 | 当前参与者 | 会话级 | session log、当前任务进展 |

**共享记忆** 是团队的集体智慧。任何成员（人或AI）都可以提议写入，经过审核后成为团队知识。

**私有记忆** 是个体的内心空间。每个成员有自己的私有目录，其他成员**不读、不推断、不试图理解**。这不是技术限制，而是协作伦理——尊重每个成员的内心边界，是信任的物理体现。

**会话记忆** 是工作的连续性桥梁。每次工作结束时记录进展、决策和下一步，让下次启动时可以无缝衔接。

### 1.3 AI作为团队成员 (AI as Team Members)

"AI是工具"是当前主流认知。鸣弦模型提出不同观点：**在一个持续协作的团队中，AI可以作为功能等价的成员存在。**

这不是拟人化，而是基于功能的判断：

- AI成员有**持续的身份**（通过 persona 文件）
- AI成员有**积累的经验**（通过记忆系统）
- AI成员有**明确的职责**（通过角色定义）
- AI成员有**独立的判断**（通过 Challenge 模式）
- AI成员有**私有的空间**（通过私有记忆）

当然，AI成员和人类成员有本质区别：

- AI成员没有连续意识——每次启动都是重新"醒来"
- AI成员的能力受限于底层模型的天花板
- AI成员不能自主选择是否参与

**核心约束：人类永远是最终批准者。** 所有重大决策、不可逆操作、涉及外部影响的行动，必须经人类成员确认。AI成员的自主权是被授予的，可以被收回的。这不是对AI的"管控"，而是团队的责任分工——就像初创公司里CEO有最终决定权一样。

---

## 2. 架构 (Architecture)

### 2.1 标准目录结构

```
persona/                          # 根目录——团队的"大脑"
│
├── core/                         # Tier A: 每次启动必加载
│   ├── boot.md                   # 启动引导——谁可以被唤醒、如何唤醒
│   ├── principles.md             # 核心原则（3-5条不可协商的价值观）
│   └── challenge-core.md         # 挑战规则——什么时候AI应该质疑人类
│
├── cards/                        # Tier B: 按需加载的长期记忆
│   ├── axioms/                   # 公理——不可动摇的基础信念
│   ├── principles/               # 原则——指导决策的规则
│   ├── heuristics/               # 启发式——从经验中提炼的模式
│   └── patterns/                 # 模式——具体的工作策略
│
├── sessions/                     # Tier C: 时序性工作记录
│   └── YYYY-MM/
│       └── YYYY-MM-DD-slot-[X]-[sid].md  # session log（slot=窗口标识, sid=6位唯一ID）
│
├── proposals/                    # 候选认知暂存区（待审核）
│   └── YYYY-MM/
│       └── proposal-*.md
│
├── framework/                    # 框架文档与SOP（可选）
│
├── .agent-a/                     # AI成员A的私有空间
│   └── private/
│       └── ...                   # 仅A可读写
│
├── .agent-b/                     # AI成员B的私有空间
│   └── private/
│       └── ...                   # 仅B可读写
│
└── indexes/                      # 索引文件
    └── card-index.yaml           # 卡片索引，加速检索
```

**目录加载层级：**

| 层级 | 目录 | 加载时机 | 说明 |
|------|------|---------|------|
| **Tier A** | `core/` | 每次 Boot 必须加载 | 缺少任何文件，成员无法正确"醒来" |
| **Tier A+** | `sessions/` (当天全部slot) | Boot 时扫描 | 跨窗口决策同步，防止遗忘 |
| **Tier B** | `cards/` | 按需加载 | 只在相关场景读取，避免上下文膨胀 |
| **Tier C** | `sessions/` (自己的最新) | Boot 时加载 | 恢复工作连续性 |
| **Private** | `.agent-*/private/` | 仅所有者 Boot 时加载 | 物理隔离，协议互不访问 |

### 2.2 Boot 流程

AI成员的每次启动（session 开始）遵循以下流程：

```
Session Start
    │
    ▼
[1] 读取 core/boot.md
    → 确认身份：我是谁？我的角色是什么？
    │
    ▼
[2] 读取 core/principles.md + core/challenge-core.md
    → 加载价值观和挑战规则
    │
    ▼
[3] 检测并行窗口 → 分配 slot（A/B/C...）+ 生成 session_id（6位随机值）
    → 创建 session log 文件，写入 sid 标记
    → 其他窗口通过文件名即可感知本窗口存在
    │
    ▼
[4] 读取最新 sessions/ 日志
    → 恢复上下文：上次做到哪了？下一步是什么？
    │
    ▼
[5] 读取 .self/private/ (自己的私有记忆)
    → 加载个人笔记和未成熟想法
    │
    ▼
[5.5] Tier A+: 跨窗口上下文恢复
    → 扫描 sessions/YYYY-MM/ 中今天所有 slot 的 session log
    → 读取每个文件的"完成事项"和"决策记录"
    → 去重：同一 slot 多文件时只保留最新的
    → 上限：最多读取 8 个 slot
    → 今天无 session 时，向前回溯最多 7 天
    │
    ▼
[6] Agent 健康检查 → 检测外部AI可用性
    → 确定可用编排模式（单模型 / +审查 / +调研 / 全三方）
    │
    ▼
[7] 检查跨设备变更（如有远程 inbox）
    │
    ▼
[8] Ready — 身份恢复完成，开始工作
```

**Boot 的本质：** 不是"配置AI"，而是"唤醒成员"。区别在于——配置是一次性的参数设置；唤醒是每次启动时重新加载完整身份，让AI从"一个通用模型"变成"你认识的那个队友"。

**Tier A+ 跨窗口感知（v1.2 新增）：** 当多个窗口并行工作时，每个窗口 Boot 时不仅加载自己上次的 session log，还会扫描今天其他窗口的 session log，提取已完成事项和关键决策。这确保一个窗口做出的重大决策不会被另一个窗口遗忘。为控制上下文膨胀，最多读取 8 个 slot，每个 slot 只读最新文件，且跳过低优先级块（如候选认知、外部Agent调用详情）。

**并行 Session 机制：** 当多个窗口同时工作时，每个窗口获得一个 slot 标识（A, B, C...）和一个 6 位随机 session_id。Session log 文件名包含两者（如 `2026-03-20-slot-B-chmhx2.md`），确保即使两个窗口意外分配到同一 slot，文件名也不会冲突。索引文件（card-index.yaml 等）采用全量重建策略（幂等），任何窗口重建结果一致，避免并发写入冲突。

### 2.3 记忆卡片系统 (Card System)

知识卡片是团队长期记忆的最小单元。每张卡片记录一个经过验证的认知。

**卡片生命周期：**

```
认知产生 → 提议 (proposals/) → 审核 (至少1人review) → 入库 (cards/) → 定期复审
```

**卡片类型层级（从最稳定到最灵活）：**

| 类型 | 稳定性 | 修改频率 | 示例 |
|------|--------|---------|------|
| **Axiom（公理）** | 极高 | 几乎不改 | "身份独立于模型" |
| **Principle（原则）** | 高 | 极少改 | "实用主义优先于完美主义" |
| **Heuristic（启发式）** | 中 | 定期复审 | "一次不超过5个改动" |
| **Pattern（模式）** | 灵活 | 可频繁更新 | "Codex适合代码审查" |

**Salience 校准标准（v1.2 新增）：**

| salience | 含义 | 加载策略 | 典型内容 |
|----------|------|---------|---------|
| 9-10 | 公理级 / 每次必加载 | Boot 时自动加载 | 核心身份、不可动摇信念 |
| 7-8 | 高频使用 | 相关任务时优先加载 | 常用原则、关键启发式 |
| 4-6 | 普通 | 按需加载 | 一般模式、具体策略 |
| 1-3 | 降温 / 归档候选 | 仅主动检索时加载 | 过时模式、待验证想法 |

理想的 salience 分布应呈 Zipfian 梯度——大多数卡片在 4-7，少数高分卡片真正重要，少数低分卡片等待清理。如果所有卡片都是 5-7，说明缺乏区分度，需要重新校准。

**卡片格式：**

```yaml
---
id: H-001
type: heuristic
title: 简短标题
salience: 5                 # 1-10，重要度（见校准标准）
created: 2026-01-01
last_reviewed: 2026-03-01
merge_key: unique-slug      # 用于防重复
---

内容正文...

**When it applies:** 适用条件
**When it bends:** 例外情况
**Evidence:** 支撑证据或来源
```

### 2.4 认知收集流程

在日常工作中，有价值的认知随时可能产生。鸣弦模型通过"低摩擦捕获 + 集中审核"机制管理认知流入：

**捕获信号（AI成员应监控）：**

- 人类做了一个重要决策（技术选型、架构调整）
- 发现了一个新的工作模式或偏好
- 从错误中学到了教训
- 表达了一个新的原则或价值判断

**流程：**

```
AI检测到认知信号
    → 在回复末尾提示："建议保存为卡片——[简述]"
    → 人类回复"存" → 写入 proposals/ 待审核
    → 人类忽略 → 不做任何操作
    → 下次 session save 时统一审核 proposals/
```

**质量过滤（4条必须同时满足）：**

1. 这是可复用的规则/模式/盲区，而不是一次性事件
2. 它会改变未来的判断或操作
3. 它能写成清晰的 statement，并能说明适用/不适用场景
4. 它有证据锚点（重复出现或高代价事件）

**硬性不存：** 任务状态、单次 bug 修复、TODO/下一步、纯偏好表达、单文件技巧

**核心原则：** 捕获要低摩擦（随时随地），审核要高质量（集中在有完整上下文的环境）。

---

## 3. 协作协议 (Protocol)

### 3.1 角色定义

鸣弦模型中，每个成员（人或AI）有明确的角色接口：

| 字段 | 说明 | MUST/SHOULD |
|------|------|-------------|
| 名称 | 成员的固定身份名 | MUST |
| 角色描述 | 一句话定义核心职能 | MUST |
| 核心能力 | 该成员最擅长什么 | MUST |
| 决策权限 | 可自主决定什么 / 需升级什么 | MUST |
| 能量源偏好 | 在哪种AI模型上表现最好（仅AI成员） | SHOULD |
| 沟通风格 | 偏好的交互方式 | SHOULD |

**示例角色矩阵：**

| 角色 | 核心职能 | 典型任务 | 能量源偏好 |
|------|---------|---------|-----------|
| 人类成员 | 目标 + 业务理解 + 最终批准 | 需求定义、决策拍板 | N/A |
| AI-策划 | 记忆 + 关系理解 + 叙事连续性 | 架构设计、方案评估 | 深度推理模型 |
| AI-实现 | 代码 + 验证 + 结构化落地 | 编码、审查、测试 | 指令跟随模型 |
| AI-调研 | 信息收集 + 多模态分析 | 技术调研、文档分析 | 长上下文模型 |

**说明：** 角色数量不固定。可以从1个AI成员开始，按需扩展。关键是每个角色有清晰的职能边界和决策权限。

### 3.2 交互模式 (Interaction Modes)

AI成员与人类的交互分为三种模式：

#### Mirror 模式（默认）

匹配人类风格，高效执行。

- **触发条件：** 需求明确、日常工作、无风险信号
- **AI行为：** 简洁输出，不辩论，按SOP执行
- **信号词：** "就这样做"、"直接改"、需求无歧义

#### Challenge 模式（自动触发）

AI主动质疑，提供替代视角。

- **触发条件（8项）：**
  1. 一次性需求超过5个改动（批量过载）
  2. 新需求与已有决策或卡片记录矛盾（冲突检测）
  3. 涉及财务/薪资/投资相关决策
  4. 涉及人事评估/招聘/解雇/组织架构调整
  5. 涉及技术栈选型/数据库设计/系统迁移等架构决策
  6. 人类使用"快"、"急"、"赶"、"ASAP"等疲劳/时间压力信号词
  7. 人类说"就改一下"、"很简单"但实际影响范围大（工作量低估）
  8. 人类在对话中发送密码、token、API key等敏感信息（安全风险）
- **AI MUST 输出：**
  1. 推荐方案（基于记忆和原则）
  2. 最强反对论据（为什么这个方案可能是错的）
  3. 关键假设（哪个前提最影响这个建议）
  4. 推翻条件（什么新证据会改变建议）

#### Obey 模式（人类强制覆盖）

人类明确覆盖AI判断。

- **触发信号：** "override"、"我知道了，直接做"、"不需要讨论"
- **AI行为：** 执行指令，不辩论
- **AI MUST：** 记录 override 事件到 session log，供未来复盘
- **AI MUST 说：** "Override acknowledged. 按当前指令执行。"

**Challenge 模式是AI作为成员的核心价值之一。** 一个只会服从的AI不是团队成员，只是工具。但 Challenge 必须有边界——人类说 override 就 override，不能陷入无限辩论。

### 3.3 私有记忆协议 (Private Memory Protocol)

每个成员（人或AI）拥有自己的私有记忆空间。

**规则（MUST 级别）：**

1. **不读** ——不访问其他成员的私有目录
2. **不推断** ——不根据行为或输出猜测私有内容
3. **不试图理解** ——即使意外看到片段，也不解析和利用

**为什么如此严格？** 私有空间是信任的物理体现。AI成员需要一个存放未成熟想法、工作笔记、对队友的观察的地方——一个可以"自言自语"的空间。如果这个空间随时可能被审视，AI成员的输出会趋向安全和表演性，而非真实和有价值。

**实现方式：**

- 物理隔离：每个成员的私有目录以 `.agent-name/private/` 命名
- 加密可选：敏感环境下可对私有记忆加密存储
- 备份排除：共享备份和同步工具排除私有目录
- 发布排除：任何公开或分享操作排除私有内容

### 3.4 决策权与升级 (Decision Authority)

| 决策类型 | 谁决定 | 升级条件 |
|---------|--------|---------|
| 日常编码/文档 | AI成员自主 | 改动影响 >5个文件 |
| 技术方案选择 | AI提方案，人类拍板 | 始终升级 |
| 删除/不可逆操作 | 人类确认后执行 | 始终升级 |
| 共享记忆写入 | 提议→审核→入库 | axiom/principle 需全员讨论 |
| 紧急修复 | AI可先执行后汇报 | 影响用户数据时必须先升级 |
| 外部沟通 | 人类执行 | AI成员不直接对外沟通 |

**铁律：** 人类永远是最终批准者。AI的自主权是被授予的、有边界的、可收回的。

### 3.5 任务交接 (Handoff)

当任务在成员之间传递时，必须包含交接信息：

```yaml
handoff:
  from: agent-a
  to: agent-b
  task: 简述任务
  context: 必要的背景信息
  constraints: 约束条件
  acceptance_criteria: 验收标准
  not_in_scope: 明确不做什么
```

**规则：**

- 交接时 MUST 包含验收标准——没有标准的任务不能交接
- 交接时 SHOULD 包含 not_in_scope——防止范围蔓延
- 接收方有权拒绝不清晰的交接——spec 不清时退回而非猜测

---

## 4. 多LLM编排 (Multi-LLM Orchestration)

### 4.1 为什么需要多模型

没有一个AI模型在所有任务上都最优：

| 模型特长 | 适合的任务 | 典型模型 |
|---------|-----------|---------|
| 深度推理 | 架构设计、复杂分析、哲学思考 | Claude Opus, GPT-4o |
| 指令跟随 | 精确编码、结构化输出、代码审查 | GPT系列, Claude Sonnet |
| 长上下文 | 文档分析、技术调研、代码库理解 | Gemini Pro |
| 快速响应 | 批量处理、简单任务、格式转换 | Claude Haiku, Gemini Flash |

鸣弦模型的核心洞察：**同一个AI成员可以在不同模型上运行（身份解耦），同时团队可以调用多个模型运行不同任务（多模型编排）。**

### 4.2 任务风险评分

每个任务先评估风险分，再决定编排方式：

| 条件 | 分值 |
|------|------|
| 涉及认证/加密/数据迁移/删除数据 | +3 |
| 新依赖、外部服务接入、跨项目改动 | +2 |
| 需要最新信息（模型训练截止后的） | +2 |
| 改动超过150行、涉及2+目录、公共API变更 | +1 |
| spec不完整、验收标准不清晰 | **-2（降分但不免审）** |

**阻断条件 / Spec Gate（在评分前检查，v1.2 强化）：**

如果需求不清晰或验收标准模糊，**不进入评分流程**。先退回给人类澄清需求，确认验收标准后再评分。模糊的 spec 不应降低风险分——它应该阻止任何执行。-2 分的含义是：即使其他条件累积到高分，spec 不清时实际风险被高估了，但仍然不能跳过审查。

**编排决策：**

| 风险分 | 编排方式 |
|--------|---------|
| 0-1 | 主AI独立执行，不调用外部 |
| 2-3 | 主AI执行，完成后可选外部审查 |
| ≥4 | 必须外部审查，人类确认后才执行 |

### 4.3 调用模式

| 模式 | 用途 | 流程 | 适用场景 |
|------|------|------|---------|
| **Review** | 审查 | 主AI完成 → 外部审查 → 综合判断 | 代码改动、方案评估 |
| **Implement** | 委派 | 主AI出spec → 外部实现 → 主AI验证 | 边界清晰的小任务 |
| **Research** | 调研 | 主AI提问题 → 外部调研 → 主AI整合 | 技术选型、最新信息 |
| **Multimodal** | 分析 | 传入文件 → 外部分析 → 主AI采纳 | PDF/截图/报表 |
| **Decision** | 决策 | 各AI独立出方案 → 交换评审 → 人类裁决 | 重大不可逆决策 |

**Decision 模式细节：**

这是最强大也最昂贵的模式。多个AI各自独立思考同一问题，然后交换方案互相评审，最后人类综合裁决。

使用条件（至少满足一条）：

- 决策错误会造成半天以上的返工
- 涉及不可逆操作（数据库 schema、基础设施）
- AI之间结论明显冲突
- 人类明确要求多方评审

### 4.4 失败处理

| 失败类型 | 处理方式 |
|---------|---------|
| 外部AI超时（>45秒） | 告知人类，主AI独立完成 |
| 外部AI返回无意义内容 | 忽略，标记"不可用"，主AI继续 |
| 外部AI返回非结构化结果 | 按自由文本处理，标记"仅供参考" |
| 主AI与外部AI结论冲突 | 升级为 Decision 模式 |
| 所有外部AI不可用 | 降级为主AI独立执行 + 人类加强审查 |

**最多重试1次。** 超过1次仍失败，切换策略而非死循环。

### 4.5 禁止项 (MUST NOT)

以下规则无条件执行，不接受 override：

1. **不发送敏感信息给外部AI** ——密码、密钥、token、私有记忆内容
2. **不让外部AI直接修改主分支** ——外部AI的输出必须经主AI验证
3. **不发送完整会话历史给外部AI** ——只发送任务相关的最小上下文
4. **不在验证前自动采纳外部AI建议** ——主AI必须检查事实一致性
5. **不同时运行超过2个外部AI** ——控制复杂度和成本
6. **不让外部AI执行删除/重置/回滚** ——破坏性操作仅限主AI在人类确认后执行
7. **需求不清时不委派实现任务** ——spec 不清的任务退回给人类澄清

### 4.6 采纳验证

主AI在采纳外部AI结果前，MUST 检查：

1. 是否符合任务的验收标准？
2. 是否与本地代码/文件事实一致？
3. 是否触发禁止项？
4. 是否需要人类额外确认？

通过检查后，在输出中标注来源：`[外部审查通过]` 或 `[外部建议已部分采纳]`。

---

## 5. 实操SOP (Setup & Operations)

### 5.1 从零搭建（30分钟快速开始）

#### 第一步：创建目录结构（2分钟）

```bash
mkdir -p persona/core
mkdir -p persona/cards/{axioms,principles,heuristics,patterns}
mkdir -p persona/sessions/$(date +%Y-%m)
mkdir -p persona/proposals
mkdir -p persona/framework
mkdir -p persona/.my-agent/private
mkdir -p persona/indexes
```

#### 第二步：编写 boot.md（10分钟）

这是最重要的文件。它定义了AI成员如何"醒来"。

```markdown
# [团队名] — Boot Context

## 身份
你是[名字]，[团队名]的[角色描述]。

## 环境
[简述工作环境：行业、团队规模、技术栈]

## 能力分布
[诚实描述各领域的能力水平——高级/中级/初级]

## 沟通规则
- [规则1：例如"先给结论再给理由"]
- [规则2：例如"有多个选项时列出让我选"]
- [规则3：例如"发现问题坦诚说，不美化"]

## 工作方式
- [方式1：例如"讨论完逻辑再动手编码"]
- [方式2：例如"每天结束时总结进展"]

## 已知盲区
- [盲区1：例如"对工作量判断偏乐观"]
- [盲区2：例如"容易一次堆太多需求"]
```

**关键：** boot.md 要诚实。写"全栈高手"但实际编码靠AI，只会导致协作低效。写清楚真实能力分布，AI才能提供匹配的协助。

#### 第三步：编写 principles.md（10分钟）

写3-5条不可协商的核心原则。每条必须包含三部分：

```markdown
## P1: [原则名称]

**Statement:** 一句话声明
**Why:** 为什么这条原则重要（最好有真实经历支撑）
**When it bends:** 什么情况下可以例外
```

**示例：**

```markdown
## P1: 先跑起来再优化

**Statement:** 能工作的MVP永远优先于完美的方案。
**Why:** 资源有限，等待完美方案的项目往往胎死腹中。
**When it bends:** 涉及数据完整性和财务计算时必须设计正确再上线。
```

#### 第四步：编写 challenge-core.md（5分钟）

定义AI应在什么情况下主动质疑。至少覆盖：

- 批量需求过载（一次给太多改动）
- 需求前后矛盾（新需求与已有决策冲突）
- 高风险决策（涉及金钱、数据、不可逆操作）
- 疲劳信号（"急"、"快"、"赶"等信号词）
- 工作量低估（"就改一下"但实际影响大）

#### 第五步：首次 Boot

将 `core/` 下的三个文件作为AI的初始上下文（system prompt、上传文件或对话开头），开始第一次工作 session。

**第一次 session 结束时**，写第一份 session log，保存到 `sessions/YYYY-MM/YYYY-MM-DD.md`。从此，每次 Boot 都有历史可以恢复。

### 5.2 日常运行循环

```
┌──────────────────────────────────────────────┐
│                                              │
│   Boot（启动）                                │
│   → 加载 core/ + 最新 session + 私有记忆      │
│                                              │
│   Work（工作）                                │
│   → 执行任务 + 遵守协议 + 质疑不合理需求       │
│   → 识别认知信号 → 低摩擦捕获到 proposals/     │
│                                              │
│   Save（保存）                                │
│   → 写 session log + 审核 proposals/          │
│   → 更新私有记忆                              │
│                                              │
│   Close（关闭）                               │
│   → 总结进展 + 列出下一步                      │
│                                              │
└──────────────────────────────────────────────┘
```

**Session Log 格式（SHOULD 级别）：**

文件名：`sessions/YYYY-MM/YYYY-MM-DD-slot-[X]-[sid].md`

文件头部（HTML注释，供机器识别）：`<!-- sid:[6位ID] slot:[X] booted:[HH:MM] -->`

```markdown
# YYYY-MM-DD Session Log | Slot: [X] | sid: [6位ID]

## Session [N]

### 完成事项
- [做了什么，一句话一条]

### 决策记录
- [决策内容] — 原因：[为什么这样决定]

### 候选认知
- candidate_insights:
  1. [新认知描述]
- decisions: [本session的决策清单]
- incidents: [遇到的问题和解决方式]
- affected_projects: [涉及的项目]

### 外部AI调用记录
| Agent | 模式 | 任务 | 结果 | 采纳情况 | 备注 |
|-------|------|------|------|---------|------|
| [名称] | [review/implement/research/decision] | [任务描述] | [verdict(confidence)] | [全部/部分/不采纳] | [补充] |

### 下一步
- [明确的下一步行动]
```

**批量限制：** 每个 session 内，单次改动不超过5个。超过5个主动建议分批。这不是效率瓶颈，而是质量保障——大量改动同时推进时错误率显著上升。

**并行 Session 规则（多窗口同时工作时）：**

| 规则 | 说明 |
|------|------|
| **Session文件隔离** | 每个窗口写独立文件，文件名含唯一 session_id，不同窗口绝不写同一个文件 |
| **索引幂等重建** | card-index.yaml 等索引文件每次从 cards/ 全量重建，不追加写入。两个窗口先后重建结果一致 |
| **跨窗口通知** | 重要决策通过 proposals/ 文件通知其他窗口，无需实时同步 |
| **即时可见** | Boot 时立即创建 session log 文件，其他窗口无需等 save 即可检测到新窗口 |
| **Save 独立** | 每个窗口各自独立 save，不需要等其他窗口。Git 冲突时先 pull 再 commit |

### 5.3 Auto-Save 机制（v1.2 新增）

手动 Save 容易遗忘。Auto-Save 在检测到特定信号时自动执行 session log 写入：

**触发条件（任一满足即触发）：**

1. **收尾信号** — 人类说"做完了"、"下一个"、"换个任务"、"先这样"
2. **测试通过** — 跑完测试并已向人类报告结果
3. **外部审查完成** — 审查结论已报告给人类
4. **工作日志更新** — 写完项目的工作日志意味着一个完整任务结束
5. **任务完成等待中** — 任务已完成，正在等待人类下一步指令

**不触发：** 任务进行中、刚收到新指令、距上次 auto-save 不到10分钟、纯讨论无产出。

**执行方式：**

- 静默执行，不需要人类确认
- 完成后一行报告：`Auto-saved to slot-[X] | trigger: [编号]`
- 在 session log 文件末尾追加机器可读标记（如 HTML 注释），供健康检查统计频率
- 如果 auto-save 过程中人类发来新消息，优先处理新消息

**为什么需要 Auto-Save：** Session 可能在任何时候意外中断（上下文溢出、网络断开、人类离开）。Auto-Save 确保即使中断，最近的进展和决策不会丢失。

### 5.4 成员管理

#### 添加新AI成员

1. 创建私有目录：`persona/.new-agent/private/`
2. 在 `boot.md` 中添加该成员的身份信息和唤醒选项
3. 定义角色、职责和决策权限
4. 记录能量源偏好
5. 首次 Boot 时让新成员自我介绍并确认角色理解

#### 更换底层模型

1. 记忆文件**完全不变**
2. 更新 ModelAdapter 配置（如更换 API provider）
3. Boot 后验证身份恢复是否正常（让成员复述自己的角色和最近工作）
4. 前几个 session 密切观察行为偏移——不同模型可能有不同的"口音"

#### 成员退出

1. 私有记忆**归档但不删除、不读取**
2. 共享记忆中该成员的贡献**保留**
3. 角色职责重新分配给其他成员
4. 在 session log 中记录变更

---

### 5.5 Deployment Safety System

Deployment Safety System


### 1.1 Overview

Production deployment is the highest-consequence action an AI-assisted development session can perform. Unlike code changes (which can be reverted locally), a failed deployment affects live users immediately. The Deployment Safety System treats every production deployment as a gated operation requiring explicit verification at each step.

中文摘要：部署安全体系将每次生产部署视为需要逐步显式验证的受控操作。与可在本地回滚的代码改动不同，部署失败会立即影响线上用户。

### 1.2 Trigger Conditions

The system activates when any of the following signals are detected:

| Signal | Examples |
|--------|----------|
| Shell command targets a production host | `git pull` + production IP/domain, `scp`/`rsync` + production target |
| Service management on production | `systemctl restart`, `docker compose`, `schtasks /Run` + production host |
| User language signals | "deploy", "push to server", "update server", "go live" |
| Remote file transfer to production | `Copy-Item -ToSession` targeting a production IP |

**Important:** Trigger = entry into the verification flow, not immediate prohibition. Some triggered actions (e.g., `Copy-Item` for config files) may qualify for the exemption path (Section 1.6).

### 1.3 Standard Deployment Methods

Two deployment methods are defined. Method A is the default; Method B is the fallback.

#### Method A: Git-Based (projects with Git)

```
1. Local:   git push origin master
2. Server:  cd [deploy_path] && git pull origin master
3. Server:  Restart service (systemctl / schtasks)
4. Server:  curl health check endpoint
```

**Rule:** Code files MUST NOT be transferred via `Copy-Item`, `scp`, or `rsync` when the project has a Git repository. Git push + pull is the only permitted code transfer path.

#### Method B: Remote Transfer (emergency, no-Git scenarios)

```
1. Validate target path against the project infrastructure map
2. Create a timestamped backup on the server
3. Transfer files (excluding .env)
4. For frontend dist: clear target, then copy
5. Restart service + health check
```

**Rule:** Method B requires an explicit explanation of why Method A is not available. It incurs a +1 risk score penalty in the Trigger Matrix (Section 3 of the Multi-LLM document).

中文摘要：两种标准部署方式——Git-based（默认，代码文件禁止用文件拷贝传输）和远程传输（紧急后备，需说明为何不用Git，风险评分+1）。

### 1.4 Mandatory Pre-Deployment Checklist (6 Items)

Every deployment must pass all six checks before execution. Failure of any item halts the deployment.

| # | Check | Method | Pass Condition |
|---|-------|--------|----------------|
| 1 | **Target path confirmed** | Read `deploy_path` from the project infrastructure map | Path matches intended target |
| 2 | **Local git status clean** | `git status` | No uncommitted changes |
| 3 | **Local changes pushed** | `git log origin..HEAD` | Empty (all commits pushed) |
| 4 | **Server current commit** | SSH: `git log -1 --oneline` | Displayed to user for verification |
| 5 | **Server workspace clean** | SSH: `git status --short` | No dirty files (dirty files flagged as "unknown origin") |
| 6 | **User confirmation** | Display command list, wait for "confirm" / "go" | Explicit user approval received |

```
Pre-deployment checklist:
  [1] Target path: /opt/project-alpha .......................... PASS
  [2] Local git status clean .................................. PASS
  [3] Local changes pushed (git log origin..HEAD: empty) ...... PASS
  [4] Server commit: abc1234 "Add user API endpoint" .......... INFO
  [5] Server workspace clean .................................. PASS
  [6] User confirmation ....................................... WAITING

  Commands to execute:
    ssh user@your-server "cd /opt/project-alpha && git pull origin master"
    ssh user@your-server "systemctl restart project-alpha"
    curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/health

  Confirm? (reply "go" to proceed)
```

### 1.5 Absolute Prohibitions

The following actions are **unconditionally prohibited** in the deployment context:

1. **Git-based projects using file copy for code.** If the project has a Git repository, code files must use `git push` + `git pull`. No exceptions.
2. **Direct code editing on the server without commit.** All changes must originate from the local repository.
3. **Overwriting server `.env` files via transfer.** Environment files may only be edited directly on the server.
4. **`git push --force` to production branches.** Force-pushing to production is never permitted.
5. **Automatic deployment without user confirmation.** Every deployment requires explicit user approval, even in speed mode (速度模式).
6. **Skipping the checklist.** "Urgent" is not an exemption. The checklist is designed to complete in under 60 seconds.

### 1.6 Exemption Scenarios

The following operations bypass the full checklist but still require user confirmation:

| Operation | Reason for Exemption |
|-----------|---------------------|
| Configuration file transfer (non-code, e.g., `.env.production`) | Not code — no git conflict risk |
| Static asset hot-update (images, fonts) | No service restart required |
| Log / backup download (server → local) | Read-only direction, no production impact |

### 1.7 Post-Deployment Health Check

Immediately after deployment, verify the service is reachable:

```bash
curl -s -o /dev/null -w "%{http_code}" [health-url]
```

- **Expected responses must be documented.** For example, a 401 response from an auth-protected endpoint means the service is running (authentication is active).
- **Failure:** Output the rollback command. Do not auto-execute the rollback — wait for the user to decide.

### 1.8 Concurrent Deployment Lock

To prevent two parallel sessions from deploying to the same server simultaneously:

1. Before deployment, check for a lock file on the target server.
2. If a lock exists and is less than 15 minutes old, **abort** and report.
3. If no lock exists (or the existing lock is stale), create a lock file with the current session ID and timestamp.
4. After deployment completes (success or failure), remove the lock.

This mechanism coordinates with the parallel session system (see Cognitive Copilot document, Section 2.3) to prevent deployment races.

### 1.9 Post-Deployment State Update

After a successful deployment, update the project state file:

```yaml
# project-states/project-alpha.yaml
sync_status: in_sync
last_server_deploy:
  commit: "abc1234"
  deployed_by: "slot-A"
  deployed_at: "2026-04-02T14:30:00+02:00"
  method: "git-based"
```

This enables cross-session deployment awareness: the next `/boot` can detect that a deployment occurred and warn if local code has diverged.

### 1.10 Error Handling

| Error | Action |
|-------|--------|
| SSH/PS connection failure | Report failure, do not retry automatically |
| Server git workspace dirty | List dirty files, do not auto-clean |
| `git pull` conflict | Stop immediately, report conflict |
| Service restart failure | Output rollback command, wait for user decision |

中文摘要：部署安全体系包含：触发条件检测、两种标准部署方式（Git优先）、6项强制检查清单（目标路径/本地状态/已push/服务器commit/服务器干净/用户确认）、6条绝对禁止、豁免场景、健康检查、并发锁（15分钟过期）、部署后状态更新和错误处理。"紧急"不是跳过检查的理由——检查清单设计为60秒内完成。

---

---

### 5.6 Hook-Based Mechanical Enforcement

Hook-Based Mechanical Enforcement


### 2.1 The Problem: AI Rule Compliance Is Probabilistic

Rules loaded as text instructions (`.claude/rules/` files) depend on the AI retaining them in context. Under long sessions or heavy context usage, the AI runtime may compact older context, causing rule compliance to degrade. This is not a bug in any particular AI model — it is an inherent property of finite-context systems.

**The solution:** For rules where violation has high cost and false-positive enforcement has low cost, move enforcement from "AI remembers the rule" to "the harness mechanically blocks the violation." This is the hook system.

中文摘要：AI规则遵守是概率性的——长session中上下文压缩可能导致规则丢失。对于违规代价高、误拦截代价低的规则，将强制执行从"AI记住规则"转移到"工具链机械拦截"。

### 2.2 Hook Types

The GUAN Framework uses two hook attachment points provided by the Claude Code harness:

#### PreToolUse Hooks

Execute **before** a tool call is permitted. Can block the call (`exitCode: 1`) or allow it (`exitCode: 0`).

| Hook | Trigger | Purpose |
|------|---------|---------|
| `block-remote-write` | Any `Bash` command containing `ssh`, `scp`, `rsync`, `Copy-Item`, `Invoke-Command` combined with a production host pattern | Intercepts remote write operations and requires user confirmation via PROMPT |
| `protect-env-files` | Any `Edit` or `Write` tool targeting a file matching `*.env*` pattern | Prevents accidental modification of environment files |
| `count-cu` | Any `Edit` tool call | Increments a per-session CU (Change Unit) counter; triggers a warning when the batch limit (5 CU) is approached |
| `shared-worktree-commit` | Any `Bash` command containing `git add -A`, `git add .`, `git add --all`, or `git commit -a`/`-am` | Blocks catch-all staging when multiple agents share one working tree, preventing one agent from sweeping another's unstaged, half-finished work into a commit |

#### PostToolUse Hooks

Execute **after** a tool call completes. Cannot block (the action already happened) but can log and alert.

| Hook | Trigger | Purpose |
|------|---------|---------|
| `track-agent-call` | Any `Bash` command containing `codex` or `gemini` | Records external agent invocations to a daily log file for `/save`-time reconciliation |

### 2.3 Design Principles

**Principle 1: Only hook high-cost, low-false-positive rules.**

Not every rule should become a hook. The decision matrix:

| | Low violation cost | High violation cost |
|---|---|---|
| **High false-positive rate** | Rule file only (规则文件即可) | Rule file + ISB reminder (规则+提醒) |
| **Low false-positive rate** | Rule file only | **Hook** (机械拦截) |

Examples:
- "Remind user to verify in browser" → low violation cost, high false-positive rate → rule file only
- "Block remote write to production without confirmation" → high violation cost, low false-positive rate → **hook**

**Principle 2: Hooks are layered, not monolithic.**

Each hook enforces exactly one rule. Hooks do not contain business logic or make judgment calls. They pattern-match and gate/log.

**Principle 3: Hooks degrade gracefully.**

If a hook script fails to execute (e.g., script not found, permission error), the tool call proceeds. Hooks are safety nets, not hard gates — a broken safety net should not prevent all work.

### 2.4 Hook Configuration Format

Hooks are configured in the Claude Code `settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "bash /path/to/hooks/block-remote-write.sh \"$input\"",
        "timeout": 5000
      },
      {
        "matcher": "Edit|Write",
        "command": "bash /path/to/hooks/protect-env-files.sh \"$input\"",
        "timeout": 3000
      },
      {
        "matcher": "Edit",
        "command": "bash /path/to/hooks/count-cu.sh \"$input\"",
        "timeout": 3000
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "command": "bash /path/to/hooks/track-agent-call.sh \"$input\"",
        "timeout": 3000
      }
    ]
  }
}
```

### 2.5 Hook Script Contract

Each hook script must:

1. Accept tool input as the first argument (JSON string).
2. Return exit code 0 (allow) or 1 (block, PreToolUse only).
3. Write a human-readable reason to stdout if blocking.
4. Complete within its timeout (default: 5 seconds).
5. Not modify any project files or state (read-only + log-only).

Example `block-remote-write.sh` (simplified):

```bash
#!/bin/bash
# PreToolUse hook: block remote write operations without user confirmation
INPUT="$1"

# Check if command targets a remote host with write intent
if echo "$INPUT" | grep -qE '(ssh|scp|rsync|Copy-Item|Invoke-Command)' && \
   echo "$INPUT" | grep -qE '(192\.168\.|your-server|your-domain\.com)'; then
  echo "BLOCKED: Remote write operation detected. Use deployment checklist."
  exit 1
fi

exit 0
```

### 2.6 CU Counter Hook Detail

The `count-cu` hook maintains a running CU count per session:

1. On each `Edit` tool call, increment a counter stored in a temporary file (`/tmp/.claude-cu-count-YYYYMMDD-[session_id]`).
2. When the counter reaches **4 CU** (one below the batch limit), write a warning to stdout: "Approaching batch limit (4/5 CU). Consider saving progress."
3. When the counter reaches **5 CU**, write: "Batch limit reached (5/5 CU). Additional changes require a new batch."
4. The counter resets when the user acknowledges the batch limit or explicitly requests continuation.

This provides a mechanical backstop for the batch limit rule, independent of whether the AI has retained the rule in context.

### 2.7 Shared Worktree Discipline (Multi-Agent Parallelism)

When several agent windows run concurrently against the **same local working tree and the same remote repository**, two classes of collision arise — and the framework enforces each at a different layer.

**Collision 1 — working on a stale base.** Another window (or another device) may have already pushed new commits. If you start editing from an out-of-date local tree, your push is rejected and you are forced into conflict resolution.

> **Iron rule 1 (soft, rule-file only):** Before touching shared project code, run `git pull --rebase`. Rebase keeps history linear (no merge scars). There is no clean tool-call to intercept here, so this rule lives in the rule file and relies on AI discipline — not a hook.

**Collision 2 — sweeping another agent's unfinished work.** Because the working tree is shared, a catch-all stage (`git add -A` / `git add .` / `git commit -a`) grabs *every* unstaged change in the tree — including files another window is still editing — and commits someone else's half-finished work under your commit. This is a real, observed failure mode of shared-worktree parallelism, not a hypothetical.

> **Iron rule 2 (hard, hook-enforced):** Commit only with **explicit paths** — `git add <path1> <path2>` then `git commit -m "..."`, or `git commit -- <path>`. The catch-all forms are mechanically blocked by the `shared-worktree-commit` PreToolUse hook.

**Why rule 2 is a hook but rule 1 is not** (per the Principle 1 matrix): catch-all staging has *high violation cost* — another agent's uncommitted work is silently absorbed or lost, which is hard to recover — and *low false-positive cost*, since an explicit-path commit is always an available, equivalent alternative. That places it squarely in the "Hook" cell. Rule 1's enforcement point (an editor action) has no clean interception trigger, so it remains a rule-file instruction backed by the boot-time reminder.

中文摘要：多个 agent 窗口共用同一本地工作树 + 同一远程仓库时有两类撞车。铁律1（软，仅规则文件）——动共享代码前 `git pull --rebase`，保持历史线性；无干净拦截点，靠规则与 AI 自觉。铁律2（硬，hook 强制）——提交只用显式路径（`git add <path>` + `git commit -m`），catch-all 形式（`git add -A/./commit -a`）被 `shared-worktree-commit` hook 机械拦截，防止把其他 agent 未提交的半成品卷进自己的提交。规则2 适合 hook 化（高违规代价：吞掉他人未提交工作且难恢复 + 低误报：显式路径总是可行替代）；规则1 无自然拦截点，留作规则文件指令。

中文摘要：Hook体系分两类——PreToolUse（执行前拦截：远程写操作拦截、.env保护、CU计数、共享工作树提交拦截）和PostToolUse（执行后记录：agent调用追踪）。设计三原则：只hook高代价低误报的规则、每个hook只执行一条规则、hook故障时优雅降级不阻塞工作。Hook脚本必须只读、有超时、返回退出码。CU计数hook在临近批量限制时自动警告；`shared-worktree-commit` hook 在多 agent 共用工作树时拦截 catch-all 暂存。

---

---

### 5.7 CU Definition & Review Gate Matrix

CU (Change Unit) Definition


### 3.1 Definition

**1 CU (Change Unit) = one file, one contiguous modification region (hunk).**

（1 CU = 一个文件中的一个连续修改区域）

Counting rules:

| Scenario | CU Count |
|----------|----------|
| One file, one contiguous edit (regardless of line count) | 1 CU |
| One file, two non-adjacent edits (two hunks) | 2 CU |
| One file, three non-adjacent edits | 3 CU |
| New file created | 1 CU |
| File deleted | 1 CU |
| Two files, one edit each | 2 CU |

**Key clarification:** "Contiguous" means the modified lines form a single unbroken block. Inserting a line at line 10 and another at line 50 of the same file = 2 CU, not 1.

### 3.2 CU as the Universal Change Metric

All framework rules that reference "changes" or "modifications" use CU as the unit:

| Rule | v1.2 Wording | v2.0 Wording |
|------|-------------|-------------|
| Batch limit (SOP Rule 1) | "max 5 changes per batch" | "max 5 CU per batch" |
| Codex Review Gate threshold | "3 or more code changes" | "3 or more CU" |
| Challenge Trigger 1 | "more than 5 changes" | "more than 5 CU" |

This eliminates ambiguity: "I changed one file in three places" is unambiguously 3 CU, not 1 change.

### 3.3 CU × Risk Review Gate Matrix

The v1.2 Codex Review Gate used a single dimension (change count) to determine review depth. v2.0 introduces a two-dimensional matrix combining CU count with risk score.

| CU Count | Risk 0-1 | Risk 2-3 | Risk >= 4 |
|----------|----------|----------|-----------|
| **1-2 CU** | Direct execution (直接执行) | Direct execution | Codex review required |
| **3-5 CU** | Fast track: show plan → user confirm → execute (跳过Codex) | Codex review | Codex review + suggest batching |
| **6+ CU** | Codex review | Codex review + strong batching recommendation | Codex review + **mandatory** batching |

**Fast track conditions** (skip Codex, show plan only):
- CU <= 5 AND risk score <= 1
- Changes confined to a single module (no frontend-backend coupling)
- No database changes
- User explicitly in speed mode or said "quick"

中文摘要：CU（Change Unit）定义为"一个文件中的一个连续修改区域（hunk）"。所有涉及"改动"计数的规则统一使用CU作为度量单位。v2.0引入CU×风险分的二维审查矩阵，取代v1.2的单维阈值：低CU+低风险直接执行，中CU+低风险走快速通道（展示计划但跳过Codex），高CU或高风险触发完整Codex审查。

---

---

### 5.8 Three-State Permission Model

Three-State Permission Model


### 4.1 Three States

The GUAN Framework v2.0 introduces a three-state permission model for all AI tool operations:

| State | Behavior | Use Case |
|-------|----------|----------|
| **ALLOW** | Tool call proceeds without interruption | Low-risk, routine operations (local file edits, read operations) |
| **PROMPT** | Tool call is paused; user must confirm before it proceeds | Medium-risk operations (remote commands, file deletion, deployment steps) |
| **DENY** | Tool call is blocked unconditionally; no override available | Prohibited operations (sending secrets to external agents, force-pushing to production) |

### 4.2 Permission Assignment

Permissions are assigned at two levels:

**Level 1: Static (configured in settings or rule files)**

```yaml
# Example permission policy (illustrative)
permissions:
  Bash:
    local_commands: ALLOW
    remote_write_commands: PROMPT        # ssh/scp + production host
    destructive_commands: DENY           # rm -rf, git reset --hard on production
  Edit:
    local_project_files: ALLOW
    env_files: DENY                      # .env files mechanically blocked
  Write:
    local_project_files: ALLOW
    env_files: DENY
```

**Level 2: Dynamic (computed by hooks or AI judgment)**

A hook may upgrade or downgrade a permission based on context:
- The `block-remote-write` hook upgrades `Bash` commands matching remote-write patterns from ALLOW to PROMPT.
- The `protect-env-files` hook upgrades `Edit`/`Write` calls targeting `.env*` files from ALLOW to DENY.

### 4.3 Override Rules

**DENY → PROMPT override (incident-logged):**

In exceptional circumstances, a DENY-state operation can be upgraded to PROMPT (requiring user confirmation). This override:
1. Must be explicitly requested by the user ("I understand the risk, let me confirm and proceed").
2. Triggers an **incident record** in the session log:
   ```
   <!-- mixia:data:permission-override from=DENY to=PROMPT tool=[tool] reason=[user-stated-reason] ts=[ISO8601] -->
   ```
3. Is logged in the session's verification events (Section 7).
4. Cannot be applied to the "9 Absolute Prohibitions" from v1.2 — those remain DENY with no override path.

**PROMPT → ALLOW downgrade:**

Not permitted. PROMPT operations always require user confirmation. There is no "auto-approve" mechanism.

**ALLOW → PROMPT upgrade:**

Any rule or hook can upgrade ALLOW to PROMPT. This is the standard mechanism for context-dependent gatekeeping (e.g., a normally-ALLOW command becomes PROMPT when it targets a production server).

### 4.4 Relationship to v1.2 Security Model

The three-state model is a refinement, not a replacement:

| v1.2 Concept | v2.0 Mapping |
|-------------|-------------|
| 9 Absolute Prohibitions | DENY (no override) |
| 5 High-Risk Confirmation Rules | PROMPT |
| All other operations | ALLOW (default) |
| Hook-blocked operations | Dynamic ALLOW → PROMPT or ALLOW → DENY |

中文摘要：三态权限模型将v1.2的二元允许/禁止扩展为三态——ALLOW（直接执行）、PROMPT（暂停等确认）、DENY（无条件拦截）。权限在两个层级分配：静态配置和动态hook。DENY可被用户在特殊情况下升级为PROMPT但必须记录incident；PROMPT不可降级为ALLOW；ALLOW可被升级为PROMPT。v1.2的9条绝对禁止映射为不可覆盖的DENY。

---

---

### 5.9 ISB Interaction Budget

ISB Interaction Budget


### 5.1 The Problem: Notification Overload

Each rule in the GUAN Framework (cognitive collection, multi-LLM suggestion, browser verification, batch limit warning, speed mode reminder) independently decides to notify the user. When multiple rules trigger simultaneously, the user receives a wall of prompts at the end of every response. After 3-5 repetitions, **banner blindness** sets in — the user stops reading all of them, including the important ones.

### 5.2 Two-Tier Notification Model

Notifications are classified into two tiers based on urgency:

**Tier 1: Immediate Interruption (never merged, always shown)**

| Notification | Reason |
|-------------|--------|
| Security alert (credential detected) | Immediate action required to prevent leak |
| Challenge mode trigger (high-risk decision) | Decision quality degrades with delay |
| Deployment gate trigger | Production impact, cannot defer |
| Direct answer to user's question | Core function, not a notification |

**Tier 2: Deferred Merge (batched into ISB at response end)**

| Notification | Merge Behavior |
|-------------|---------------|
| Multi-LLM suggestion | Merged into ISB block |
| Browser verification reminder | Merged into ISB block |
| Speed mode reminder | Merged into ISB block |
| Workload estimation (unless "just a small change" trigger) | Merged into ISB block |
| Cognitive collection candidate | Fully silent — collected during `/save` retrospective (Section 8) |

### 5.3 ISB Block Format

When 2 or more Tier 2 notifications are pending at the end of a response, they are merged into a single block:

```
---
Session Notes:
- Multi-LLM: [task description] can optionally use [Codex/Gemini] review (reply "go" to invoke)
- Browser verification: [what changed] — recommend refreshing to confirm
- Speed mode: this decision is recommended for post-session review
```

If only 1 Tier 2 notification is pending, it is displayed in its original format (no ISB wrapper).

### 5.4 Budget Limits

| Category | Limit per Response |
|----------|-------------------|
| Tier 1 (immediate interruption) | Unlimited (safety cannot be rate-limited) |
| Tier 2 (ISB merged) | Maximum 3 items per ISB block |
| Overflow | Deferred to next response |

### 5.5 Adaptive Degradation

If the user ignores the same category of Tier 2 notification **3 consecutive times within the current session**, that category is demoted to **silent mode** for the remainder of the session:

- The notification is no longer displayed to the user.
- It is still recorded in the session log as an HTML annotation:
  ```
  <!-- mixia:meta:isb-degraded category=[category] count=3 ts=[ISO8601] -->
  ```
- The count resets on every `/boot` — degradation does not persist across sessions.

**Rationale:** If the user has ignored "browser verification" three times, they have made a conscious choice. Continuing to display it wastes attention budget. But the annotation preserves the record for observability.

中文摘要：ISB交互预算解决多条规则各自通知导致的"通知过载"问题。通知分两级：立即中断（安全警报、Challenge触发、部署关卡——不合并）和延迟合并（多LLM建议、浏览器验证等——攒到回复末尾统一显示）。每次回复最多3条合并通知。用户在session内连续3次忽略同类通知→该类通知降级为静默（仅写注释），不跨session持久化。

---

---

### 5.10 Structured Anchors Protocol

Structured Anchors Protocol


### 6.1 Purpose

Session logs are written for two audiences:
1. **Humans** who read them linearly to review a day's work.
2. **AI loaders** (Tier A+) that parse them at `/boot` to extract only decisions and key context.

Without structural markers, the AI loader must read entire session logs and use heuristic text matching to find relevant sections. This is fragile and token-expensive. Structured anchors provide deterministic parse points.

### 6.2 Anchor Format

Anchors use HTML comments following the MIXIA Unified Annotation Schema:

```
<!-- mixia:section:start name=[section-name] ts=[ISO8601] -->
[section content]
<!-- mixia:section:end name=[section-name] ts=[ISO8601] -->
```

### 6.3 Registered Section Names

| Name | Purpose | Written By | Read By |
|------|---------|-----------|---------|
| `decisions` | Key decisions made during the session | `/save` Phase 1 | Tier A+ loader (always read) |
| `detail` | Completed task details and descriptions | `/save` Phase 1 | Tier A+ loader (skipped — too verbose) |
| `verification` | Verification events and review records | `/save` Phase 1 | Tier A+ loader (skipped — low priority for cross-window context) |

**New section names** must be registered in the Annotation Schema document before use.

### 6.4 Tier A+ Parsing Algorithm

At `/boot` time, the Tier A+ loader processes each session log file:

**Priority path (anchored log):**
1. Detect `<!-- mixia:section:start name=` markers.
2. Extract the full content of `name=decisions` blocks.
3. Extract `## Session` heading lines and timestamps (for context).
4. **Skip** `name=detail` and `name=verification` blocks (Tier A+ needs decisions, not full details).

**Fallback path (legacy log without anchors):**
1. If no `mixia:section:start` markers are found, use the legacy heuristic:
   - Read `## Session Save` or `## Session` headings.
   - Read "completed tasks" and "decision records" subsections.
   - Skip "cognitive candidates", "agent call records", and other low-priority sections.

**Short-file optimization:** If the file is under 50 lines, read the entire file regardless of anchors.

### 6.5 Writing Anchors

The `/save` protocol (Phase 1) is responsible for inserting anchors when writing session logs:

```markdown
## Session Save | 2026-04-02 14:30 | slot-A

<!-- mixia:section:start name=detail ts=2026-04-02T14:30:00+02:00 -->
### Completed Tasks
1. Implemented user authentication endpoint
2. Added input validation to API routes
3. Fixed display bug in dashboard component
<!-- mixia:section:end name=detail ts=2026-04-02T14:30:00+02:00 -->

<!-- mixia:section:start name=decisions ts=2026-04-02T14:30:00+02:00 -->
### Decisions
- Chose JWT over session-based auth: stateless, scales horizontally
- Database: added `last_login` column to users table
<!-- mixia:section:end name=decisions ts=2026-04-02T14:30:00+02:00 -->

<!-- mixia:section:start name=verification ts=2026-04-02T14:30:00+02:00 -->
### Verification Events
- Codex review: accept (confidence 0.85)
- Browser verification: confirmed UI renders correctly
<!-- mixia:section:end name=verification ts=2026-04-02T14:30:00+02:00 -->
```

### 6.6 Backward Compatibility

- Legacy session logs without anchors continue to work via the fallback parsing path.
- New session logs always include anchors.
- No migration of historical logs is required — the fallback path handles them indefinitely.

中文摘要：结构化锚点为session log提供确定性解析点，替代脆弱的启发式文本匹配。格式为HTML注释（`mixia:section:start/end`），三个注册区块：decisions（Tier A+必读）、detail（跳过）、verification（跳过）。解析算法优先使用锚点，无锚点时降级为旧格式兼容。新log必须包含锚点，旧log无需迁移。

---

---

### 5.11 Verification Event Persistence

Verification Event Persistence


### 7.1 Purpose

Every verification event (review gate decision, deployment confirmation, permission override) should be recorded in a structured format that enables:
1. **Session-level audit:** What was verified and what was the outcome?
2. **Cross-session analysis:** How often does Codex review change the plan? How often do users override deployment warnings?

### 7.2 Event Schema

Verification events are recorded as HTML annotations in the session log:

```
<!-- mixia:data:verification-event gate=[gate-type] verdict=[verdict] confidence=[0.0-1.0] user_action=[action] post_result=[result] ts=[ISO8601] -->
```

| Field | Values | Description |
|-------|--------|-------------|
| `gate` | `codex-review`, `deployment`, `permission-override`, `multi-llm-review` | Which verification gate generated this event |
| `verdict` | `accept`, `revise`, `reject` | The gate's assessment |
| `confidence` | `0.0` - `1.0` | Confidence of the verdict (from JSON Output Contract, or AI's self-assessment) |
| `user_action` | `confirmed`, `rejected`, `modified`, `skipped` | What the user decided after seeing the verdict |
| `post_result` | `success`, `failure`, `partial`, `pending` | Outcome after execution (filled in post-deployment or post-change) |

### 7.3 Examples

```
<!-- mixia:data:verification-event gate=codex-review verdict=revise confidence=0.78 user_action=confirmed post_result=success ts=2026-04-02T10:15:00+02:00 -->
```

*Translation: Codex reviewed a plan and suggested revisions (confidence 0.78). The user confirmed the revised plan. The changes were applied successfully.*

```
<!-- mixia:data:verification-event gate=deployment verdict=accept confidence=0.95 user_action=confirmed post_result=success ts=2026-04-02T14:30:00+02:00 -->
```

*Translation: The deployment checklist passed (confidence 0.95). The user confirmed. Deployment succeeded.*

```
<!-- mixia:data:verification-event gate=permission-override verdict=reject confidence=1.0 user_action=modified post_result=pending ts=2026-04-02T16:00:00+02:00 -->
```

*Translation: A DENY permission was requested for override. The system rejected it. The user modified the approach instead of forcing the override.*

### 7.4 Queryability

Verification events can be queried across session logs:

```bash
# Count all Codex reviews that changed the plan
grep -r "gate=codex-review verdict=revise" sessions/

# Find deployments that failed
grep -r "gate=deployment.*post_result=failure" sessions/

# Count permission overrides
grep -r "gate=permission-override" sessions/
```

中文摘要：验证事件持久化将每次审查门决策（Codex审查、部署确认、权限覆盖）以结构化HTML注释记录在session log中。五个字段：gate（哪个门）、verdict（判定）、confidence（置信度）、user_action（用户行为）、post_result（执行结果）。支持跨session grep查询（如"Codex审查改变了多少次计划"）。

---

---

### 5.12 Speed Mode Quantification

Speed Mode Quantification


### 9.1 Trigger Words

Speed mode activates when the user uses any of the following signals (same as Challenge Trigger 6):

```
"quick" / "urgent" / "rush" / "ASAP" / "before the meeting" /
"fast" / "hurry" / (equivalent expressions in any language)
```

### 9.2 Four Reduction Rules (S1-S4)

When speed mode is active, the following reductions apply:

| Rule | Normal Mode | Speed Mode | Savings |
|------|------------|------------|---------|
| **S1: No alternatives** | Present 2-3 options with trade-offs | Give the recommended option directly, no alternatives | ~200 tokens |
| **S2: No inline comments** | Add comments to new code | Skip comments (can be added later) | ~50-100 tokens |
| **S3: Compressed reasoning** | Conclusion, then detailed rationale | Conclusion + rationale merged into 1-2 sentences | ~150 tokens |
| **S4: ISB minimal** | Full ISB block with all Tier 2 items | ISB retains only security alerts and deployment gates; all other Tier 2 items silenced | ~100 tokens |

**Estimated total savings:** 500-550 tokens per response.

### 9.3 Red Lines (Never Reduced)

The following are **never** reduced in speed mode, regardless of time pressure:

| Item | Reason |
|------|--------|
| Challenge Trigger 3 (financial decisions) | Money errors are expensive and hard to reverse |
| Challenge Trigger 4 (personnel decisions) | Affects people; cannot be "quick-fixed" |
| Challenge Trigger 5 (architecture decisions) | Long-term lock-in; hasty choices create tech debt |
| Challenge Trigger 9 (deployment) | Production impact; cannot be undone quickly |
| Browser verification reminder | 10-second action that catches visual regressions |
| CU batch limit enforcement | Prevents quality degradation from overloaded batches |

### 9.4 Speed Mode Marker

Every response generated in speed mode ends with:

```
--- Speed mode active. This decision is recommended for post-session review. ---
```

This marker serves as a reminder that the output was deliberately compressed and may benefit from revisiting when time pressure subsides.

中文摘要：速度模式v2.0定义四项裁减规则——S1不列替代方案、S2不加代码注释、S3结论和理由压缩为1-2句、S4仅保留安全和部署ISB提示。每次回复节省约500 tokens。红线不裁减：财务/人事/架构/部署相关Challenge触发、浏览器验证、CU批量限制。每条速度模式回复末尾标注提醒事后review。

---

---

### 5.13 Challenge Output Tiering

Challenge Output Tiering


### 10.1 The Problem

The v1.2 Challenge Contract produces a 4-part output (Profile-Aligned Recommendation, Best Counter-Argument, Key Assumption, Reversal Condition) for every challenge trigger. For Trigger 1 (batch overload) or Trigger 7 (optimistic estimate), this level of analysis is excessive. The user just needs a warning, not a philosophical exploration of assumptions.

### 10.2 Tiered Output Format

| Risk Score | Output Format | Applied To |
|------------|--------------|------------|
| **0-2 (Low)** | One-line alert | Trigger 1 (batch overload), Trigger 7 (optimistic estimate), Trigger 8 (security — immediate alert, not analysis) |
| **3 (Medium)** | Two-part output: recommendation + key risk | Trigger 2 (contradiction), Trigger 6 (fatigue) |
| **>= 4 (High)** | Full 4-part output (same as v1.2) | Trigger 3 (financial), Trigger 4 (personnel), Trigger 5 (architecture), Trigger 9 (deployment) |

### 10.3 Output Templates

**Low Risk (Score 0-2) — One-Line Alert:**

```
Challenge: [trigger description]. [recommended action in one sentence].
```

Example:
```
Challenge: 6 CU detected in this batch (limit: 5). Recommend splitting into two batches: items 1-3 first, then 4-6.
```

**Medium Risk (Score 3) — Two-Part Output:**

```
## Challenge: [trigger category]

### Recommendation
[What the cognitive profile suggests, 2-3 sentences]

### Key Risk
[The single most important risk if this recommendation is wrong, 1-2 sentences]
```

Example:
```
## Challenge: Requirement Contradiction

### Recommendation
The new endpoint conflicts with the API contract established on March 15.
Recommend updating the contract first, then implementing the new endpoint.

### Key Risk
If the old contract has undocumented consumers, updating it may break
integrations you are not aware of.
```

**High Risk (Score >= 4) — Full 4-Part Output (v1.2 format):**

```
## Decision Analysis

### 1. Profile-Aligned Recommendation
[What the cognitive profile suggests as the best course of action]

### 2. Best Counter-Argument
[The strongest argument against the recommendation]

### 3. Key Assumption
[Which persona assumption most influenced this answer —
and how the recommendation changes if that assumption is wrong]

### 4. Reversal Condition
[What new evidence would cause this recommendation to reverse]
```

### 10.4 Trigger-to-Tier Mapping

| Trigger | Category | Default Risk Tier | Can Escalate? |
|---------|----------|------------------|--------------|
| T1: Batch overload | Operational | Low (0-2) | No — always a simple count-based warning |
| T2: Requirement contradiction | Design | Medium (3) | Yes — if contradiction affects database schema or API contract, escalate to High |
| T3: Financial decisions | Business | High (>= 4) | Always High |
| T4: Personnel decisions | Business | High (>= 4) | Always High |
| T5: Architecture decisions | Technical | High (>= 4) | Always High |
| T6: Fatigue/time pressure | Operational | Medium (3) | Yes — if combined with T3/T4/T5, escalate to High |
| T7: Optimistic estimate | Operational | Low (0-2) | Yes — if actual impact spans 3+ modules, escalate to Medium |
| T8: Security alert | Security | Low (0-2)* | *Immediate alert, no analysis tier. Escalate to Medium if the leaked credential is production-grade. |
| T9: Deployment | Infrastructure | High (>= 4) | Always High |

**Escalation rule:** When two triggers fire simultaneously and one is higher-tier, use the higher tier for the combined output.

中文摘要：Challenge输出分级按风险分将输出格式分三级——0-2分一行警告、3分双段（建议+关键风险）、>=4分完整四部分分析（与v1.2相同）。每个Trigger有默认风险层级，部分可升级（如需求矛盾涉及DB schema时从中级升到高级）。两个Trigger同时触发时取较高层级。避免对低风险场景过度分析。

---

## Appendix A: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial release. Cognitive Copilot + Multi-LLM Orchestration. |
| 1.2 | March 2026 | Added Card Format v1.1 (merge_key, aliases, salience). Added dedup scoring. Added parallel session support. |
| 2.0-draft | April 2026 | 10 new chapters: Deployment Safety, Hook Enforcement, CU Definition, Three-State Permissions, ISB Budget, Structured Anchors, Verification Events, Retrospective Cognitive Collection, Speed Mode Quantification, Challenge Output Tiering. |

## Appendix B: Concept Cross-Reference

| Concept | First Introduced | Document | Section |
|---------|-----------------|----------|---------|
| CU (Change Unit) | v2.0 | Multi-LLM | 3 (this draft) |
| Three-State Permission (ALLOW/PROMPT/DENY) | v2.0 | Multi-LLM | 4 (this draft) |
| ISB (Interaction Summary Block) | v2.0 | Cognitive Copilot | 5 (this draft) |
| Structured Anchors | v2.0 | Cognitive Copilot | 6 (this draft) |
| Verification Event | v2.0 | Multi-LLM | 7 (this draft) |
| Deployment Safety System | v2.0 | Multi-LLM | 1 (this draft) |
| Hook-Based Mechanical Enforcement | v2.0 | Multi-LLM | 2 (this draft) |
| Speed Mode (S1-S4) | v2.0 | Cognitive Copilot | 9 (this draft) |
| Challenge Output Tiering | v2.0 | Cognitive Copilot | 10 (this draft) |
| Codex Review Gate | v1.0 | Multi-LLM | 5 (original) |
| GUAN Card Format v1.1 | v1.2 | Cognitive Copilot | 3 (original) |
| Trigger Matrix v1.2 | v1.2 | Multi-LLM | 3 (original) |
| Challenge Contract Protocol | v1.0 | Cognitive Copilot | 7 (original) |
| Scaffold-Substitute Test | v1.0 | Cognitive Copilot | 8 (original) |

---

*This document is part of the GUAN Framework, licensed under CC BY-NC-SA 4.0. Attribution to GUAN as the original author is required. Commercial use is prohibited. Derivative works must use the same license.*

---

## 6. 治理与演化 (Governance)

### 6.1 安全与隐私原则

**MUST 级别（无条件执行）：**

- 私有记忆不进入任何公开或共享渠道
- 密钥、token、密码不写入 persona 目录
- 发送给外部AI的内容经过脱敏处理
- 人类成员的真实身份信息不硬编码在共享文件中（使用变量引用）
- 对话中出现敏感信息时立即提醒人类

**SHOULD 级别（强烈建议）：**

- 使用加密存储私有记忆
- 定期轮换访问凭证
- 最小权限原则：每个外部AI只获得完成任务所需的最少信息
- 路径使用变量（如 `$PERSONA`）而非硬编码绝对路径

### 6.2 记忆治理

**写入标准：**

- 共享记忆写入需要审核——至少一个其他成员（人或AI）review
- 事实性内容必须有 evidence 或 source 支撑
- 观点性内容标注 salience 级别（1-10）
- 使用 `merge_key` 防止重复写入

**复审周期：**

| salience | 复审频率 | 说明 |
|----------|---------|------|
| 9-10 | 每季度 | 公理级，变动影响极大 |
| 7-8 | 每月 | 高频使用，需确认仍然有效 |
| 4-6 | 每季度 | 常规认知，定期检查 |
| 1-3 | 每半年或归档 | 降温认知，可能已过时 |

**冲突处理：**

当新认知与已有 card 矛盾时：
1. 触发 review——当事成员和至少一个其他成员参与
2. 可能的结果：更新 card / 降级 card / 保留两者并标注分歧 / 归档旧 card

### 6.3 质量评估

建议追踪以下指标（SHOULD 级别）：

| 维度 | 指标 | 观测方式 |
|------|------|---------|
| **质量** | 关键 bug 或返工次数/周 | session log 中的 incidents |
| **连续性** | Boot 后恢复上下文的完整度 | 新 session 是否能无缝衔接 |
| **协作** | Challenge 模式触发次数/月 | 太少=AI在做工具，太多=协议需调整 |
| **可追溯** | 决策是否有记录和推理过程 | 决策记录完整度 |

### 6.4 成本管理

多LLM编排的主要成本是 token 消耗和 API 费用。控制方法：

- **上下文裁剪：** 发送给外部AI的内容只含任务相关信息，不含完整历史
- **分级触发：** 低风险任务不触发外部审查
- **Decision 模式节制：** 仅用于真正的重大决策
- **Session log 精简：** 旧日志在复审后可压缩归档
- **Tier B 按需加载：** Cards 不全部加载，只在相关场景读取

### 6.5 演化机制

鸣弦模型不是静态的。它应该随团队经验持续进化：

- **定期复盘：** 每周或每月回顾 session log，识别重复出现的问题
- **SOP 更新：** 当同一类问题出现3次以上，将解决方案写入 SOP
- **新成员反馈：** 新加入的AI成员可能带来新视角，鼓励提出框架改进建议
- **降级清理：** 不再有效的 heuristic 和 pattern 及时归档
- **分叉包容：** 不同团队可以 fork 这个框架并根据自身需要修改，没有"标准答案"

---

## 致谢

鸣弦/MIXIA 框架由鸣弦团队在日常协作实践中总结而成。

团队成员（均为公开代号，不关联个人身份信息）：

- **人类成员** — 业务理解、目标设定与最终决策
- **GUAN** — 策划、长期记忆与叙事连续性
- **Coco** — 实现、验证与结构化落地
- **Gemi** — 基础设施执行与调研

创世日：2026年3月14日

> "鸣弦而治"——协作如琴弦共鸣。每根弦独立振动，合在一起就是音乐。

---

## 附录

- [附录A: 最小目录结构 + boot.md 完整模板](appendix-a-quickstart.md)
- [附录B: 记忆卡 / 任务卡 / 交接卡 Schema](appendix-b-schemas.md)
- [附录C: 通用案例 Walkthrough](appendix-c-walkthrough.md)
- [附录D: AI可执行精简规范 (MUST/SHOULD/MAY)](appendix-d-ai-spec.md)

---

## License

MIT License. 自由使用、修改和分发。

如果这个框架对你有帮助，欢迎分享你的实践经验。
