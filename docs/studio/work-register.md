# Dream Skin Studio 工作登记表

> 文档角色：当前工作、状态、依赖和证据的唯一登记表  
> 主控入口：[`MASTER-PLAN.md`](./MASTER-PLAN.md)  
> 最后更新：2026-07-18

## 1. 状态定义

| 状态 | 含义 |
| --- | --- |
| `Planned` | 已登记，尚未满足开发门禁 |
| `Ready` | 设计、依赖、安全和测试方案已完成 |
| `In Progress` | 正在实施，有实际工作分支或提交 |
| `Verification` | 功能冻结，正在执行自动化和实机验收 |
| `Done` | 实现、测试、实机、文档和回滚全部完成 |
| `Paused` | 暂停，原因和恢复条件明确 |
| `Rejected` | 评审后不实施，原因已记录 |

## 2. 当前项目状态

```yaml
studioBranch: feat/codex-theme-import-mvp
studioHeadAtRegisterCreation: 831f8beda89d87eed724289f053dac90726a2545
openPullRequest: 2
pullRequestMerged: false
lastReviewedMainCommit: 19fa0342846219fb0476bfd648aa7f0f0019bb0b
currentPhase: Phase 00 Planned
```

说明：本文件建立后产生的文档提交会继续推进分支 HEAD；每个 Phase 开始时必须记录新的 `baselineCommit`，不能长期沿用本节的创建节点。

## 3. 已完成治理工作

| ID | 工作 | Phase | 状态 | 证据 |
| --- | --- | --- | --- | --- |
| `DS-DOC-001` | `.codex-theme` 包格式、导入设计和使用文档 | Pre-Phase | Done | `docs/theme-package-specification.md`、`docs/codex-theme-import-mvp-design.md`、`docs/codex-theme-import-macos-guide.md` |
| `DS-DOC-002` | Dream Skin Studio 总体 Blueprint 与多阶段 Roadmap | Governance | Done | `docs/studio/dream-skin-studio-blueprint.md`、`docs/studio/multi-stage-roadmap.md` |
| `DS-DOC-003` | 阶段细化设计与交付模板 | Governance | Done | `docs/studio/phase-design-and-delivery-template.md` |
| `DS-DOC-004` | 上游 `main` 连续 Review 机制 | Governance | Done | `docs/studio/upstream/`、`UPR-20260718-001` |
| `DS-DOC-005` | Studio 主控文档、实施计划和统一规则 | Governance | Done | `MASTER-PLAN.md`、`project-implementation-plan.md`、`engineering-rulebook.md`、本文件 |

## 4. Phase 00 工作包

### 4.1 当前优先级

```text
P0-1 Importer 回归
  ↓
P0-2 Runtime API 与错误模型
  ↓
P0-3 锁、事务和受管 Runtime
  ↓
P0-4 Desktop Shell Spike
  ↓
P0-5 Vertical Slice
  ↓
P0-6 双平台验收
```

### 4.2 Work Items

| ID | 工作 | 类型 | 状态 | 依赖 | 上游动作 | 验收重点 |
| --- | --- | --- | --- | --- | --- | --- |
| `DS-FND-001` | 建立 Phase 00 细化设计目录和 README | docs/design | Planned | 主控文档 | `UPR-20260718-001` | 通过 Phase 00 Ready 门禁 |
| `DS-QA-001` | `.codex-theme` importer 自动化回归 | test | Planned | 当前 importer | — | 正常包、路径穿越、脚本、符号链接、缺失文件、ID 冲突、覆盖回滚 |
| `DS-QA-002` | 恢复并扩展跨平台 CI | test/ci | Planned | `DS-QA-001` | `UPA-001`、`UPA-002` | Shell/Node/PowerShell、PS 5.1/7、Importer、Contract tests |
| `DS-FND-002` | Runtime JSON API v1 契约 | architecture | Planned | Phase 00 设计 | `UPA-004`、`UPA-005` | capabilities/status/list/import/apply/verify/restore；稳定错误码 |
| `DS-FND-003` | macOS Runtime JSON Adapter 示例 | feature | Planned | `DS-FND-002` | — | stdout JSON、stderr 日志、真实退出码、无命令拼接 |
| `DS-FND-004` | Windows Runtime JSON Adapter 示例 | feature | Planned | `DS-FND-002` | `UPA-004`、`UPA-005` | 与 macOS 同语义、PS 5.1/7 可用 |
| `DS-FND-005` | 跨入口 operation lock 设计 | architecture/security | Planned | `DS-FND-002` | `UPA-006` | Studio/SwiftBar/Tray/CLI 串行化、stale lock 身份验证 |
| `DS-FND-006` | 受管 Runtime 分发与事务更新模型 | architecture | Planned | `DS-FND-005` | `UPA-003`、`UPA-006` | staging、hash、backup、publish、rollback、source-independent |
| `DS-FND-007` | Desktop Shell 技术 Spike | spike | Planned | `DS-FND-002` | — | Tauri/Electron/Native 对比、签名、sidecar、安装、升级 |
| `DS-FND-008` | Desktop Shell ADR | adr | Planned | `DS-FND-007` | — | 明确选择、替代方案、代价和回退 |
| `DS-TM-001` | Studio 最小主题列表 Vertical Slice | feature | Planned | `DS-FND-003/004/007` | — | 读取主题、显示状态、无终端 |
| `DS-TM-002` | Studio 最小 Apply/Verify/Restore Vertical Slice | feature | Planned | `DS-TM-001` | `UPA-007`、`UPA-008` | 安全 Apply、结构化结果、原生控件不回退 |
| `DS-QA-003` | Phase 00 macOS 实机矩阵 | verification | Planned | Phase 00 实现 | — | 导入、应用、重启、Verify、Restore |
| `DS-QA-004` | Phase 00 Windows 实机矩阵 | verification | Planned | Phase 00 实现 | `UPA-003/004/005/008` | 安装、列表、Apply、Verify、Restore、PS 5.1/7 |

## 5. Phase 01 候选工作包

这些项目在 Phase 00 Done 前不进入 Ready。

| ID | 工作 | 状态 | 依赖 |
| --- | --- | --- | --- |
| `DS-TM-010` | Theme Repository v1 | Planned | Runtime API、文件事实来源规则 |
| `DS-TM-011` | Theme Library 卡片与筛选 | Planned | `DS-TM-010` |
| `DS-TM-012` | Theme Detail 与兼容诊断 | Planned | `DS-TM-010` |
| `DS-TM-013` | GUI 导入与同 ID 冲突处理 | Planned | Import API、事务锁 |
| `DS-TM-014` | Apply、Switch 与当前主题状态 | Planned | Runtime Adapter |
| `DS-TM-015` | Copy、Rename、Export、Delete | Planned | Repository、Package Service |
| `DS-TM-016` | Runtime Status、Doctor、日志摘要 | Planned | Runtime API |
| `DS-TM-017` | SwiftBar/Tray/Studio 状态一致性 | Planned | operation lock、status journal |
| `DS-QA-010` | Theme Manager 跨平台验收 | Planned | Phase 01 功能冻结 |

## 6. Phase 02 候选工作包

| ID | 工作 | 状态 | 依赖 |
| --- | --- | --- | --- |
| `DS-CMP-001` | Canonical Theme Model | Planned | Theme Repository 稳定 |
| `DS-CMP-002` | v1 Normalizer 与无损兼容 | Planned | `DS-CMP-001` |
| `DS-CMP-003` | Theme Schema v2 | Planned | `DS-CMP-001`、ADR |
| `DS-CMP-004` | Theme Compiler v1 | Planned | `DS-CMP-002/003` |
| `DS-PRV-001` | Fixture 场景与 DOM 契约 | Planned | Compiler |
| `DS-PRV-002` | Fixture Preview Renderer | Planned | `DS-PRV-001` |
| `DS-PRV-003` | Live Preview Session | Planned | Compiler、Runtime API、operation lock |
| `DS-QA-020` | Preview 与实机一致性基线 | Planned | Fixture + Live Preview |

## 7. Phase 03～05 Epic

| ID | Epic | Phase | 状态 |
| --- | --- | --- | --- |
| `DS-EDT-EPIC` | 可视化 Theme Editor | 03 | Planned |
| `DS-AST-EPIC` | Asset Library | 04 | Planned |
| `DS-AI-EPIC` | 本地优先 AI Authoring | 04 | Planned |
| `DS-MKT-EPIC` | Marketplace、Trust 和 Update | 05 | Planned |

Epic 在前置阶段接近 Done 时再拆成可执行 Work Item，避免过早锁死细节。

## 8. 上游采用映射

本表只做工作映射，真实状态仍以 [`upstream/upstream-adoption-log.md`](./upstream/upstream-adoption-log.md) 为准。

| UPA | 目标 Work Item | 当前处理 |
| --- | --- | --- |
| `UPA-001` portable line endings | `DS-QA-002` | Planned |
| `UPA-002` CI 与 PS 双矩阵 | `DS-QA-002` | Planned |
| `UPA-003` 受管 Runtime | `DS-FND-006` | Planned，跨平台重写 |
| `UPA-004` stderr/exit code | `DS-FND-002/004` | Planned |
| `UPA-005` config/Appx 身份 | `DS-FND-004` | Planned |
| `UPA-006` 原子替换语义 | `DS-FND-005/006` | Planned |
| `UPA-007` 原生 Header 控件 | `DS-TM-002`、视觉回归 | Planned |
| `UPA-008` Windows 深色菜单 | `DS-TM-002`、Windows 验收 | Planned |
| `UPA-009` 贡献指南 | `DS-DOC-*` | Candidate |
| `UPA-010` Windows 用户文档 | Phase 01 Release | Deferred |
| `UPA-011` Jinx 预览素材 | Assets/Marketplace | Deferred |

## 9. 状态更新规则

每次状态变化必须同时填写：

- 新状态；
- 相关提交；
- 自动测试；
- 实机证据；
- 阻塞或 Known Issue；
- 下一动作。

示例：

```text
DS-QA-001
Planned → Ready
Reason: test design reviewed
Baseline: <sha>
Upstream Review: UPR-20260718-001
Next: implement package fixtures
```

## 10. 当前下一动作

项目下一项正式工作应为：

```text
DS-FND-001：创建 Phase 00 细化设计目录
```

随后优先并行准备：

```text
DS-QA-001：Importer 自动化回归
DS-FND-002：Runtime JSON API v1 契约
```

在这三项满足 Ready 前，不开始正式 Theme Manager 大规模 UI 开发。
