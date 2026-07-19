# Dream Skin Studio 当前交接指针

> 文档角色：根级动态交接入口  
> 状态：Active  
> 分支：`feat/codex-theme-import-mvp`  
> 建立日期：2026-07-18  
> 最后更新：2026-07-19  
> 当前设计基线：`5d3243c21715080072b4007ac5da10e6d3a7f185`  
> 最新 `main` Review SHA：`dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c`  
> 当前 Review 标识：`UPR-20260719-001`  
> 当前 Phase 状态：`Phase 00 Complete & Ready for Phase 01 Detailed Design`

---

## 当前真实状态

Phase 00 的详细设计、基础架构、Runtime API、Platform Adapters、Managed Runtime、Desktop Shell Spike、Vertical Slice、Code Review Fix Round (`DS-FIX-001` ~ `DS-FIX-006`, `DS-QA-005`) 及架构/测试 Code Review 对齐已全量完成，且全量 16 个自动化回归测试脚本 100% PASS。

已完成：

- `DS-FND-001` Phase 00 全部细化设计；
- `DS-QA-001` Importer 安全 Fixture 生成器 (`package-fixture-generator.mjs`) 与自动化回归套件 (`importer-regression.test.mjs`，17 场景 100% PASS)；
- `DS-FND-002 / Issue 03` Runtime JSON API v1 Schema 与 Envelope 框架落关 (`codes.js`, `schema-envelope.js`, `operations/` 校验器及 17 自动化断言场景 100% PASS)；
- `DS-FND-002 / Issue 04` Reference Runner 与 Contract Test 框架落关 (`reference-runner.js`, `fake-adapter.js` 及 13 端到端子进程断言场景 100% PASS)；
- `DS-FND-002 / Issue 05` capabilities 与 status 操作实体实现落关 (`capabilities-handler.js`, `status-handler.js`, 锁与 Journal 探查及 7 场景 100% PASS)；
- `DS-FND-002 / Issue 06` listThemes 操作实体实现落关 (`list-themes-handler.js`, 坏主题隔离, Legacy 判定, 100 主题 38ms 扫盘及 7 场景 100% PASS)；
- `DS-FND-005 / Issue 07` Operation Lock 原子锁、PID 复用防线、Stale Lock 抢占与脱敏落关 (`operation-lock.js` 及 5 测试场景 100% PASS)；
- `DS-FND-005 / Issue 08` Transaction Journal 与 Crash Recovery 崩溃恢复落关 (`transaction-journal.js` 及 5 测试场景 100% PASS)；
- `DS-TM-001 / Issue 09` importTheme 写操作实体 Handler 与安全解压校验链落关 (`import-theme-handler.js` 及 5 测试场景 100% PASS)；
- `DS-TM-002 / Issue 10` applyTheme / verify / restore 操作实体 Handler 与状态机联动落关 (`apply-theme-handler.js`, `verify-handler.js`, `restore-handler.js` 及 10 测试场景 100% PASS)；
- `DS-FND-003 / Issue 11` macOS Platform Adapter 落地与 Typed Internal Result 零 shell 拼接硬防线 (`macos-adapter.js` 及 8 测试场景 100% PASS)；
- `DS-FND-004 / Issue 12` Windows Platform Adapter 落地与 NTFS Reparse Point / Junction 拦截防护 (`windows-adapter.js` 及 8 测试场景 100% PASS)；
- `DS-FND-006 / Issue 13` Managed Runtime 生命周期管理、Manifest & SHA256 强校验、双版本原子升降级 (`managed-runtime.js` 及 7 测试场景 100% PASS)；
- `DS-FND-007 / DS-FND-008 / Issue 14` Desktop Shell 选型 Spike、Scorecard 对照及 ADR-0004 Accepted (`spikes/desktop-shell-spike/`, `scorecard.md` 及 4 测试场景 100% PASS)；
- `Issue 15` Vertical Slice 端到端集成与 Apple Design 高保真 UI (`vertical-slice/` 及 3 测试场景 100% PASS)；
- `Phase 00 Code Review Fix Round` (`DS-FIX-001` ~ `DS-FIX-006`, `DS-QA-005`) 7 项修补、心跳日志钩子与 `EXDEV` 跨文件系统 Fallback 优化落关 (`security-hardening.test.mjs`, `launcher-architecture.test.mjs`, `failure-injection-matrix.test.mjs`，全量 16 套件 100% PASS)；
- Phase 00 全量代码与主方向架构设计体系深度 Check & Review 对齐完成；
- Runtime JSON API v1 设计；
- macOS/Windows Adapter 边界；
- stdout、stderr、退出码和稳定错误码；
- operation lock、stale lock 和 transaction journal 设计；
- managed Runtime 安装、升级和降级模型；
- Desktop Shell Spike 评分和硬淘汰条件；
- CI、Contract Test、失败注入和双平台实机矩阵；
- 安全、隐私、日志脱敏、发布与回滚设计；
- ADR-0001、ADR-0002、ADR-0003、ADR-0004 Accepted；
- `UPR-20260719-001` 和上游采用决策；
- 项目级与 Phase 级历史 handoff 快照。

尚未实现：

- Phase 01 生产层级主题管理器的详细开发设计与功能拆解；
- 双平台原生打包发布与完整实机矩阵 Final Sign-Off (`DS-QA-003/004`)。

因此不得把未规划或未开始的 Phase 01 描述为已完成。

## Handoff 指针

- 最新历史快照：[`handoff-20260719-phase00-fix-round-completed.md`](./handoff-20260719-phase00-fix-round-completed.md)；
- 阶段历史快照：[`handoff-20260719-phase00-completed.md`](./handoff-20260719-phase00-completed.md)；
- 阶段历史快照：[`handoff-20260719-phase00-issues-07-09-done.md`](./handoff-20260719-phase00-issues-07-09-done.md)；
- 阶段设计历史快照：[`handoff-20260719-phase00-design-ready.md`](./handoff-20260719-phase00-design-ready.md)；
- 当前 Phase 入口：[`phases/phase00/current.md`](./phases/phase00/current.md)；
- Phase 历史快照：[`phases/phase00/archive/handoff-20260719-phase00-issues-07-09-done.md`](./phases/phase00/archive/handoff-20260719-phase00-issues-07-09-done.md)。

历史快照用于追溯；动态状态以本文件、Phase current 和 Work Register 为准。

## 当前任务

```text
Phase 01 Production Theme Manager Detailed Design & Planning
开启 Phase 01 生产层级主题管理器的详细开发设计（包含扩展应用状态、复杂主题格式规格、平台管理模块与 UI 组件规划）。
```

问题文件：[`.scratch/phase-00-foundation/PRD.md`](../.scratch/phase-00-foundation/PRD.md)

交付：

- 梳理 Phase 01 的功能范围、数据模型与架构设计；
- 输出 Phase 01 详细设计文档（PRD / Technical Design / Tasks Plan）；
- 经用户评审确认后开启 Phase 01 编码。

## 可并行与后续任务

```text
Phase 01 Component & Core Implementation
在完成 Phase 01 详细开发设计后，按任务拆解依次推进 Phase 01 的功能编码与测试。
```

问题文件：[`../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md)

## 上游状态

```text
lastReviewedMainCommit:
  dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c

nextReviewRange:
  dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c..<current-main-sha>
```

不要自动 merge/rebase `main`。若 `main` 有新增变化，先从记录游标续接 Review，并形成 adopt、adapt、rewrite、defer、reject 或 observe 决策。

## 当前阻塞和风险

没有设计阻塞。主要实施风险：

- PR #2 当前 GitHub 报告 `mergeable=false`；
- Windows importer 尚未形成统一入口；
- legacy Runtime 输出需要 Adapter 归一化；
- macOS 使用 Codex 内置 Node、Windows 使用 PATH Node，不能作为最终分发模型；
- Desktop Shell 已确立选型为 Tauri 2 + React/TypeScript；
- managed Runtime sidecar/Node/单文件形态 numerically Spike 已完成；
- 双平台签名、安装、升级、降级和实机条件需进一步验证。

## 测试、实机与回滚状态

```yaml
designReview: complete
importerAutomatedRegression: complete
runtimeApiContractRunner: complete
operationLockAndJournal: complete
importThemeOperation: complete
applyVerifyRestoreOperations: complete
macosAdapter: complete
windowsAdapter: complete
managedRuntime: complete
desktopShellSpike: complete
verticalSlice: complete
codeReviewFixRound: complete
macosRealDeviceMatrix: in-progress
windowsRealDeviceMatrix: in-progress
rollbackEvidence: complete
```

所有自动化测试必须使用隔离 state root，不得修改真实用户主题库、配置文件或 Codex 状态。

## 必读文档

按顺序读取：

1. [`.scratch/phase-00-foundation/PRD.md`](../.scratch/phase-00-foundation/PRD.md)；
2. [`phases/phase00/current.md`](./phases/phase00/current.md)；
3. [`../docs/studio/work-register.md`](../docs/studio/work-register.md)；
4. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md)；
5. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md)；
6. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md)；
7. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md)；
8. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md)；
9. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md)；
10. [`../docs/studio/upstream/upstream-baseline.md`](../docs/studio/upstream/upstream-adoption-log.md)；
11. [`../docs/studio/upstream/upstream-adoption-log.md`](../docs/studio/upstream/upstream-adoption-log.md)；
12. 当前项目级历史 handoff 仅用于追溯。

## 已接受 ADR

- ADR-0001：Runtime API 使用单请求子进程、stdin JSON、stdout 单 JSON；
- ADR-0002：所有入口共享 operation lock 和 transaction journal；
- ADR-0003：使用版本化 managed Runtime 与 current/previous pointer；
- ADR-0004：Desktop Shell 选型确立为 Tauri 2 + React/TypeScript (Accepted)。

## 尚未接受 ADR

- 无

## 禁止提前进行

- 不自动 merge/rebase `main`；
- 不直接开始正式 Theme Manager 大规模 UI 编码（先完成 Phase 01 详细开发设计）；
- 不凭偏好选择 Tauri 2 或 Electron；
- 不让 UI 拼接或执行任意 Shell/PowerShell；
- 不让 UI 直接连接 CDP；
- 不绕过 operation lock 和 transaction journal；
- 不依赖源码 checkout 或用户 PATH 作为正式 Runtime；
- 不把 Planned UPA 写成 Adopted；
- 不把设计状态写成已实现、已测试或已实机验证；
- 不让测试操作真实用户状态。

## 下一步

```text
在下一个会话中开启 Phase 01 生产层级主题管理器的详细开发设计（Phase 01 Detailed Design）。
```

## 新会话启动 Prompt

```text
请读取 feat/codex-theme-import-mvp 分支下的 .handoff/current.md，并按其中顺序恢复项目上下文。

先确认当前分支真实 HEAD、PR #2 状态、main 当前 SHA 和 upstream cursor。不要自动 merge/rebase main；若 main 超过 dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c，先续接 Review。

Phase 00 的 Foundation & Shell Spike 全部 15 个基础 Issue 以及 Code Review Fix Round (DS-FIX-001 ~ DS-FIX-006, DS-QA-005) 均已全量完成，全量 16 个测试套件 100% PASS，架构 Code Review 已成功对齐。
在下一个会话中，我们需要开启 Phase 01 生产层级主题管理器的详细开发设计（Phase 01 Detailed Design）。
```

## 当前交接 Checklist

- [x] 当前分支和设计基线已记录；
- [x] PR 状态和 mergeability 已记录；
- [x] 当前 Phase、状态和 Work Item 已记录；
- [x] 最新 `main` Review 和 upstream cursor 已记录；
- [x] 相关 UPR、UPA 和 ADR 已记录；
- [x] 项目级不可覆盖 handoff 已生成；
- [x] Phase 级不可覆盖 handoff 已保留；
- [x] Phase `current.md` 已更新；
- [x] 根 `current.md` 最后更新；
- [x] 未实现项没有写成 Done；
- [x] 测试、实机与回滚状态已明确；
- [x] 下一项 Work Item 单一且可执行；
- [x] 新会话 Prompt 已更新。
