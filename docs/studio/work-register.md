# Dream Skin Studio 工作登记表

> 文档角色：当前工作、状态、依赖和证据的唯一登记表  
> 主控入口：[`MASTER-PLAN.md`](./MASTER-PLAN.md)  
> 最后更新：2026-07-19

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
phase00DesignBaselineCommit: 5d3243c21715080072b4007ac5da10e6d3a7f185
openPullRequest: 2
pullRequestMerged: false
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
lastUpstreamReviewId: UPR-20260719-001
currentPhase: Phase 00 Ready
currentWorkItem: DS-QA-001
```

说明：

- `phase00DesignBaselineCommit` 是开始细化设计前审查的真实代码基线；后续文档提交不会改变该基线含义；
- `Phase 00 Ready` 只表示开发前设计门禁已满足，不表示 Runtime API、Adapter、Desktop Shell 或 Vertical Slice 已实现；
- PR #2 继续保持 Open、未合并；本轮没有 merge/rebase `main`。

## 3. 已完成治理工作

| ID | 工作 | Phase | 状态 | 证据 |
| --- | --- | --- | --- | --- |
| `DS-DOC-001` | `.codex-theme` 包格式、导入设计和使用文档 | Pre-Phase | Done | `docs/theme-package-specification.md`、`docs/codex-theme-import-mvp-design.md`、`docs/codex-theme-import-macos-guide.md` |
| `DS-DOC-002` | Dream Skin Studio 总体 Blueprint 与多阶段 Roadmap | Governance | Done | `docs/studio/dream-skin-studio-blueprint.md`、`docs/studio/multi-stage-roadmap.md` |
| `DS-DOC-003` | 阶段细化设计与交付模板 | Governance | Done | `docs/studio/phase-design-and-delivery-template.md` |
| `DS-DOC-004` | 上游 `main` 连续 Review 机制 | Governance | Done | `docs/studio/upstream/`、`UPR-20260718-001`、`UPR-20260719-001` |
| `DS-DOC-005` | Studio 主控文档、实施计划和统一规则 | Governance | Done | `MASTER-PLAN.md`、`project-implementation-plan.md`、`engineering-rulebook.md`、本文件 |

## 4. Phase 00 工作包

### 4.1 当前优先级

```text
P0-1 Importer 回归（DS-QA-001，当前）
  ↓
P0-2 Runtime API 契约实现与 Contract Runner（DS-FND-002）
  ↓
P0-3 双平台 Adapter、锁、事务和受管 Runtime
  ↓
P0-4 Desktop Shell Spike
  ↓
P0-5 Vertical Slice
  ↓
P0-6 双平台验收
```

`DS-QA-001` 与 `DS-FND-002` 可以在边界清晰时并行准备，但不得跳过测试 fixture、Schema 和错误模型直接开发大型 UI。

### 4.2 Work Items

| ID | 工作 | 类型 | 状态 | 依赖 | 上游动作 | 验收重点 |
| --- | --- | --- | --- | --- | --- | --- |
| `DS-FND-001` | 建立并完成 Phase 00 全部细化设计 | docs/design | Done | 主控文档 | `UPR-20260719-001` | Phase 目录、全套设计、ADR、Ready 门禁、状态同步 |
| `DS-QA-001` | `.codex-theme` importer 自动化回归 | test | Ready | 当前 importer、Phase 00 测试设计 | — | 正常包、路径穿越、脚本、符号链接、缺失文件、ID 冲突、覆盖回滚 |
| `DS-QA-002` | 恢复并扩展跨平台 CI | test/ci | Planned | `DS-QA-001` | `UPA-001`、`UPA-002` | Shell/Node/PowerShell、PS 5.1/7、Importer、Contract tests |
| `DS-FND-002` | Runtime JSON API v1 契约实现与 Contract Runner | architecture | Ready | Phase 00 设计、ADR-0001 | `UPA-004`、`UPA-005` | capabilities/status/list/import/apply/verify/restore；Schema、稳定错误码和退出码 |
| `DS-FND-003` | macOS Runtime JSON Adapter 示例 | feature | Planned | `DS-FND-002` | `UPA-012` | stdout JSON、stderr 日志、真实退出码、无命令拼接 |
| `DS-FND-004` | Windows Runtime JSON Adapter 示例 | feature | Planned | `DS-FND-002` | `UPA-004`、`UPA-005` | 与 macOS 同语义、PS 5.1/7 可用 |
| `DS-FND-005` | 跨入口 operation lock 与 transaction journal | architecture/security | Planned | `DS-FND-002`、ADR-0002 | `UPA-006`、`UPA-012` | Studio/SwiftBar/Tray/CLI 串行化、stale identity、崩溃恢复 |
| `DS-FND-006` | 受管 Runtime 分发与事务更新 | architecture/feature | Planned | `DS-FND-005`、ADR-0003 | `UPA-003`、`UPA-006` | staging、hash、backup、current/previous、rollback、source-independent |
| `DS-FND-007` | Desktop Shell 技术 Spike | spike | Planned | `DS-FND-002` | — | Tauri/Electron/Native 双平台 artifact、签名、sidecar、安装、升级 |
| `DS-FND-008` | Desktop Shell ADR 最终决策 | adr | Planned | `DS-FND-007`、ADR-0004 Proposed | — | 明确选择、替代方案、代价、证据和回退 |
| `DS-TM-001` | Studio 最小主题列表 Vertical Slice | feature | Planned | `DS-FND-003/004/007` | — | 读取主题、显示状态、无终端 |
| `DS-TM-002` | Studio 最小 Apply/Verify/Restore Vertical Slice | feature | Planned | `DS-TM-001/005/006` | `UPA-007`、`UPA-008` | 安全 Apply、结构化结果、自动回滚、原生控件不回退 |
| `DS-QA-003` | Phase 00 macOS 实机矩阵 | verification | Planned | Phase 00 实现 | `UPA-012` | 安装、导入、应用、重启、Verify、Restore、升级/降级 |
| `DS-QA-004` | Phase 00 Windows 实机矩阵 | verification | Planned | Phase 00 实现 | `UPA-003/004/005/008` | 安装、列表、Apply、Verify、Restore、PS 5.1/7、升级/降级 |

### 4.3 `DS-FND-001` 完成记录

```yaml
statusChange: Planned -> Done
completedAt: 2026-07-19
designBaseline: 5d3243c21715080072b4007ac5da10e6d3a7f185
upstreamReview: UPR-20260719-001
reviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
evidence:
  - docs/studio/phases/phase-00-foundation-and-shell-spike/
  - docs/studio/upstream/reviews/2026-07-19-main-review.md
  - docs/studio/upstream/upstream-baseline.md
  - docs/studio/upstream/upstream-adoption-log.md
automatedTests: not-applicable-design-only
realDeviceEvidence: not-applicable-design-only
knownIssues:
  - Desktop Shell ADR-0004 remains Proposed pending Spike
next:
  - DS-QA-001
  - DS-FND-002
```

### 4.4 Ready 依据

- `DS-QA-001`：测试 fixture、安全矩阵、失败注入、隔离 state root 和验收标准已定义；下一步是实现测试；
- `DS-FND-002`：Runtime API v1 envelope、operation、错误码、退出码、数据模型和 Contract Test 已完成设计；下一步是落地机器可执行 Schema 和 reference runner；
- 其余 Work Item 仍保持 `Planned`，直到直接依赖满足并补充实施基线、Owner 和具体测试入口。

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
| `UPA-012` macOS 生命周期与多入口状态 | `DS-FND-002/003/005`、`DS-QA-003` | Planned，适配采用 |
| `UPA-013` 预设集合变化 | Phase 01 Theme Repository | Deferred/Observed |

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
Ready → In Progress
Reason: package fixture implementation started
Baseline: <sha>
Upstream Review: UPR-20260719-001
Next: implement safe and malicious ZIP fixtures
```

## 10. 当前下一动作

项目下一项正式工作：

```text
DS-QA-001：实现 .codex-theme importer 自动化回归
```

随后或边界清晰时并行推进：

```text
DS-FND-002：把已批准的 Runtime JSON API v1 设计落地为 Schema、reference host 和 Contract Runner
```

在双平台 Adapter、锁、事务和 Desktop Shell Spike 达到相应门禁前，不开始正式 Theme Manager 大规模 UI 开发。
