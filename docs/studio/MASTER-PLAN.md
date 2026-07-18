# Dream Skin Studio 主控文档

> 文档角色：**项目最高层执行入口与规则索引**  
> 状态：Active  
> 适用分支：`feat/codex-theme-import-mvp`  
> 建立日期：2026-07-18  
> 当前 Studio 基线：`28fc77fdc69f5497f3f74469ca22cfd77a8f6c81`  
> 已审查上游 `main` 节点：`19fa0342846219fb0476bfd648aa7f0f0019bb0b`

## 1. 文档目的

Dream Skin Studio 已经从单一主题导入功能进入长期产品化演进阶段。随着 Theme Manager、Preview、Editor、AI Authoring、Marketplace、双平台 Runtime 和上游选择性迁移逐步展开，项目不能继续依赖聊天记录、零散说明或单个阶段文档来维持上下文。

本文件用于统一回答五个问题：

1. 项目最终要做成什么；
2. 当前处于什么阶段；
3. 下一步应该做什么；
4. 所有开发、优化和迁移必须遵守哪些规则；
5. 发生文档冲突时，以什么为准。

本文件不是把所有细节重复一遍，而是作为项目的**控制平面**，将愿景、阶段、规则、工作登记、上游审查和阶段交付串成一条可追踪链路。

## 2. 单一事实来源

### 2.1 文档权威顺序

发生冲突时，按以下顺序处理：

1. 本文件中的不可变原则与当前执行状态；
2. 已接受的 ADR；
3. 当前 Phase 的细化设计与验收文档；
4. [`project-implementation-plan.md`](./project-implementation-plan.md)；
5. [`engineering-rulebook.md`](./engineering-rulebook.md)；
6. [`dream-skin-studio-blueprint.md`](./dream-skin-studio-blueprint.md)；
7. [`multi-stage-roadmap.md`](./multi-stage-roadmap.md)；
8. 基线、上游 Review、实现记录和历史说明。

更具体的阶段设计可以补充总体骨架，但不能无记录地违反本文件的安全、事务、预览一致性和文档真实性原则。需要改变这些原则时，必须：

```text
提出变更 → 新增 ADR → 评审影响 → 更新本文件 → 更新受影响文档 → 再实施
```

### 2.2 状态事实来源

| 信息 | 唯一来源 |
| --- | --- |
| 当前项目阶段 | [`work-register.md`](./work-register.md) |
| 阶段目标与依赖 | [`project-implementation-plan.md`](./project-implementation-plan.md) |
| 产品与架构长期骨架 | [`dream-skin-studio-blueprint.md`](./dream-skin-studio-blueprint.md) |
| 开发与优化规则 | [`engineering-rulebook.md`](./engineering-rulebook.md) |
| 阶段详细设计 | `docs/studio/phases/phase-XX-*/` |
| 上游对比续接节点 | [`upstream/upstream-baseline.md`](./upstream/upstream-baseline.md) |
| 上游能力迁移状态 | [`upstream/upstream-adoption-log.md`](./upstream/upstream-adoption-log.md) |
| 主题包格式 | [`../theme-package-specification.md`](../theme-package-specification.md) |
| 当前项目真实能力 | [`current-project-baseline.md`](./current-project-baseline.md) |

聊天记录、Issue 评论和临时计划不能替代上述文件。

## 3. 产品目标

Dream Skin Studio 的目标是成为一个本地优先、可恢复、跨平台的 Codex 主题工作台：

```text
主题管理
  + 可信预览
  + 可视化创作
  + 快速切换
  + 导入与导出
  + 素材管理
  + AI 辅助
  + 诊断与恢复
  + 可选主题市场
```

产品完成后，普通用户不需要理解 Shell、PowerShell、CDP、主题目录或手写 JSON；主题作者能够在 Studio 中完成从背景图到可分发 `.codex-theme` 的完整流程；维护者能够通过结构化状态、测试、日志和回滚机制控制风险。

## 4. 当前真实状态

### 4.1 已完成基础

- macOS 和 Windows 均已有外部 CDP 注入 Runtime；
- 不修改官方 Codex `.app`、`app.asar`、WindowsApps 或代码签名；
- 已有主题目录、激活主题、预设主题和图片导入能力；
- macOS 有 SwiftBar 菜单栏入口，Windows 有托盘入口；
- 已有启动、注入、Verify、Doctor、Pause 和 Restore 链路；
- 当前功能分支已经实现 macOS `.codex-theme` 纯数据包导入；
- `.codex-theme` 已完成 macOS 实机导入验证；
- Studio 产品骨架、多阶段路线、阶段模板和上游跟踪机制已经建立；
- 已完成首次 `main` 上游审查，下一次从 `19fa034...` 续接。

### 4.2 尚未实现

- 正式 Dream Skin Studio 桌面应用；
- Runtime 结构化 JSON API；
- Theme Manager GUI；
- 统一 Theme Repository；
- Theme Compiler；
- 可信 Fixture Preview 与 Live Preview；
- Theme Schema v2；
- 可视化 Theme Editor；
- Asset Library；
- AI Authoring；
- Marketplace、包签名与在线更新。

### 4.3 当前决策

- 暂不合并 PR #2；
- 当前 Studio 分支继续独立演进；
- 不要求定期 merge/rebase `main`；
- 定期从上一次已审查 commit 续接分析 `main`；
- 上游能力按 `direct-adopt / adapt-adopt / concept-rewrite / defer / reject` 分类；
- 迁移必须使用独立提交、独立测试和采用日志；
- 现有 Runtime 在早期作为执行面继续复用，不因建设 GUI 而立即重写。

## 5. 不可变工程原则

### 5.1 预览与实机同源

```text
Theme Source
    ↓ normalize / migrate
Canonical Theme Model
    ↓ compile
Compiled Theme Tokens
    ├── Studio Preview
    └── Codex Runtime
```

禁止 Studio 单独制作一套“看起来更好”的预览 CSS，同时 Runtime 使用另一套规则。概念效果图必须明确标注，不得冒充可实现的实机效果。

### 5.2 控制面与执行面分离

- Studio UI 不直接连接 CDP；
- UI 不拼接 Shell/PowerShell 命令；
- App Core 通过结构化 Runtime Adapter 调用平台执行面；
- 现有 Runtime 继续负责 Codex 发现、进程身份、端口、注入、验证和恢复。

### 5.3 主题包只包含数据

`.codex-theme` 不允许携带脚本、应用、动态库或任意 CSS/JavaScript 执行能力。未来 Marketplace 也不能绕过本地 importer 和 Compiler。

### 5.4 所有写操作事务化

导入、覆盖、编辑保存、应用、删除、迁移、Runtime 更新和 Marketplace 更新均必须满足：

```text
Detect → Lock → Stage → Validate → Backup → Publish → Verify → Commit → Cleanup
                                            ↘ Failure → Restore
```

提交完成后的非关键清理失败不得反向破坏已经生效的正确状态，但必须记录 warning 和可重试动作。

### 5.5 文件系统保存主题事实

主题目录是主题内容的事实来源。SQLite 等数据库只能作为搜索索引、缓存、最近使用、收藏和 UI 状态，不能成为唯一主题存储。

### 5.6 可恢复优先

任何会影响当前主题、Codex 启动状态、配置文件、Runtime 或用户资产的操作都必须定义取消、失败和恢复路径。

### 5.7 跨平台语义一致

macOS 和 Windows 可以使用不同的签名、进程、安装和文件系统实现，但以下语义必须一致：

- 主题列表；
- 导入、应用、预览、回退、删除、导出；
- 错误码和 recoverable 状态；
- Theme Schema、Compiler 和包格式；
- 验收场景。

### 5.8 文档描述真实状态

未实现、未测试、仅设计、仅单平台验证、仅概念预览必须明确标注。禁止把计划写成已经交付。

## 6. 项目阶段

| Phase | 名称 | 当前状态 | 主要结果 |
| --- | --- | --- | --- |
| 00 | Foundation、Runtime API 与 Desktop Shell Spike | Planned | 可开发 Studio 的可信工程基线 |
| 01 | Theme Manager MVP | Planned | 无终端主题管理闭环 |
| 02 | Theme Compiler 与可信 Preview | Planned | 预览和实机同源，支持 Schema v2 |
| 03 | Theme Editor | Planned | 可视化创建、编辑、试用和导出主题 |
| 04 | Assets 与 AI Authoring | Planned | 本地优先的素材和 AI 辅助创作 |
| 05 | Marketplace 与 Trust | Planned | 安全安装、更新和分发第三方主题 |

详细计划见 [`project-implementation-plan.md`](./project-implementation-plan.md)。

## 7. 统一工作流

任何开发、修复、优化、迁移或文档变更都必须进入以下流程：

```text
登记 Work Item
    ↓
确认目标 Phase、基线 commit、上游 Review 和影响范围
    ↓
满足 Definition of Ready
    ↓
设计 / ADR / Contract
    ↓
实现
    ↓
自动测试 + 平台测试 + 视觉验收
    ↓
更新文档与 Work Register
    ↓
进入 Done 或记录 Known Issue
```

没有 Work Item ID 的实现不应成为正式阶段提交。紧急安全修复可以先处理，但必须在同一工作日补登记、测试和变更说明。

## 8. Work Item 分类

统一 ID 建议：

| 前缀 | 类型 |
| --- | --- |
| `DS-FND-*` | Foundation / Runtime / Desktop Shell |
| `DS-TM-*` | Theme Manager |
| `DS-CMP-*` | Schema / Normalizer / Compiler |
| `DS-PRV-*` | Fixture / Live Preview |
| `DS-EDT-*` | Editor |
| `DS-AST-*` | Asset Library |
| `DS-AI-*` | AI Authoring |
| `DS-MKT-*` | Marketplace / Trust |
| `DS-SEC-*` | Security / Privacy |
| `DS-QA-*` | Test / Visual / Release |
| `DS-DOC-*` | Documentation / Governance |
| `UPA-*` | Upstream Adoption Action |

Work Item 的状态、依赖和证据统一登记在 [`work-register.md`](./work-register.md)。

## 9. 阶段门禁

### 9.1 Ready 门禁

阶段或大型 Work Item 进入开发前必须具备：

- 目标、范围、非目标；
- 用户流程和失败流程；
- 技术设计和模块边界；
- 数据、Schema 或 API 契约；
- 迁移、备份和回滚；
- 安全与隐私审查；
- 测试和实机验收计划；
- 当前 `main` 已按记录节点完成 Review；
- 相关上游能力已经有采用或不采用决策；
- 依赖和 Owner 明确。

不要求为了进入阶段而合并 `main`。

### 9.2 Done 门禁

- 实现提交存在；
- 自动测试通过；
- 相关平台实机验证通过；
- 视觉变化有基线和截图；
- 错误、取消和恢复路径验证；
- 文档、Changelog、Work Register 更新；
- 未完成事项进入 Known Issues 或下一 Work Item；
- 没有把计划状态误写为完成。

## 10. 优化工作规则

任何性能、视觉、体验、安全或工程优化必须先定义基线和成功指标。

示例：

```text
问题：Coding 页面卡片阴影过硬
基线：现有 Light/Dark 实机截图 + CSS token
目标：降低边缘对比，不损失文本可读性
方法：修改 Compiler token，而不是只改概念图
验证：Fixture + macOS/Windows 实机 + 原生控件点击
回滚：保留旧 token revision
```

禁止以“感觉更快”“看起来更好”“代码更干净”作为唯一验收标准。详细规则见 [`engineering-rulebook.md`](./engineering-rulebook.md)。

## 11. 上游审查规则

- 只从 [`upstream/upstream-baseline.md`](./upstream/upstream-baseline.md) 的 `lastReviewedUpstreamCommit` 续接；
- 比较范围必须使用 commit SHA，不使用模糊日期代替；
- Review 完成前不能推进游标；
- 迁移能力必须进入 [`upstream/upstream-adoption-log.md`](./upstream/upstream-adoption-log.md)；
- `Adopted` 必须有 Studio 实现提交和测试证据；
- 不因上游 commit 数量增加而自动 merge/rebase；
- 每个 Phase 进入 Ready 前强制执行一次上游检查。

## 12. 文档更新矩阵

| 变化 | 必须更新 |
| --- | --- |
| 总体产品边界变化 | 本文件 + Blueprint + ADR |
| 阶段顺序、范围或依赖变化 | 本文件 + Implementation Plan + Phase README |
| 开发或优化规则变化 | 本文件 + Engineering Rulebook |
| 新 Work Item 或状态变化 | Work Register |
| Schema / Runtime API 变化 | Phase Contract + ADR + 用户/开发文档 |
| 上游出现新能力 | Upstream Review + Adoption Log |
| 视觉实现变化 | Theme/Compiler 文档 + Visual Baseline + 实机截图 |
| 安全边界变化 | Security 文档 + Threat Model + Tests |
| 发布、升级或回滚变化 | Rollout 文档 + Changelog + User Guide |

## 13. 当前下一步

当前不立即建设完整 Theme Manager UI。先进入 Phase 00 细化设计，优先顺序：

1. 为 `.codex-theme` importer 增加自动化回归；
2. 定义 Runtime JSON API v1；
3. 定义共享 operation lock 与错误模型；
4. 完成 Tauri 2 / Electron / Native Shell Spike 和 ADR；
5. 建立 Studio 最小工程、主题列表和一次安全 Apply 链路；
6. 吸收已登记的高优先级上游安全、CI 和 Runtime 事务设计；
7. 通过 macOS 和 Windows 基线测试后，再进入 Theme Manager MVP。

具体 Work Item 见 [`work-register.md`](./work-register.md)。

## 14. 主控文档维护规则

- 每个 Phase 状态变化时更新；
- 重大 ADR 接受后更新；
- 项目边界或不可变原则变化时更新；
- 上游 Review 不需要每次改本文，只更新节点或影响当前计划时再改；
- 不在本文堆积实现细节，细节放在 Phase 或专题文档；
- 删除或替代规则时保留 Git 历史，并在提交说明中写明原因。
