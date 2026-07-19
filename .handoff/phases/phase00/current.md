# Phase 00 当前交接

```yaml
phase: 00
name: Foundation, Runtime API and Desktop Shell Spike
status: Ready
completedWorkItem: DS-FND-002 (Issues 03-06)
currentWorkItem: DS-FND-005 (Issue 07)
parallelReadyWorkItem: DS-QA-001
branch: feat/codex-theme-import-mvp
headRecordedBeforePhaseCurrentUpdate: 800d38c6c90426d2d5896ca00c044480c3651d18
designBaselineCommit: 5d3243c21715080072b4007ac5da10e6d3a7f185
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
upstreamReviewId: UPR-20260719-001
latestProjectHandoff: ../../handoff-20260719-phase00-issues-03-06-done.md
latestHistoricalSnapshot: archive/handoff-20260719-phase00-issues-03-06-done.md
```

> `headRecordedBeforePhaseCurrentUpdate` 是生成项目级历史 handoff 后、更新本文件之前的真实分支 HEAD。读取新会话时仍需重新确认 GitHub 当前 HEAD。

## 当前状态

Phase 00 的开发前细化设计已经完成，且 Runtime API 基础契约、Reference Runner 和只读 Operation 已全量实施完成并通过契约回归。

已完成：

- `DS-FND-001` Phase 00 全部细化设计；
- `DS-QA-001` Importer 安全 Fixture 生成器与自动化回归（17 场景 100% PASS）；
- `DS-FND-002 / Issue 03` Runtime JSON API v1 Schema 与 Envelope 不变量断言（17 场景 100% PASS）；
- `DS-FND-002 / Issue 04` Reference Runner 进程模型与 Contract Test 框架（13 端到端子进程场景 100% PASS）；
- `DS-FND-002 / Issue 05` `capabilities` 与 `status` 实体 Handler、并发写锁及 Journal 探查（7 场景 100% PASS）；
- `DS-FND-002 / Issue 06` `listThemes` 实体 Handler、坏主题隔离防线与 100 主题 38ms 扫盘（7 场景 100% PASS）。

以下尚未实现：

- `operation lock` (owner.json) 与抢占防线 (`DS-FND-005 / Issue 07`)；
- transaction journal 与崩溃恢复 (`DS-FND-005 / Issue 08`)；
- importTheme / applyTheme / verify / restore 操作实体逻辑 (`DS-TM-001/002 / Issue 09-10`)；
- macOS/Windows Runtime JSON Adapter (`DS-FND-003/004`)；
- managed Runtime installer (`DS-FND-006`)；
- Desktop Shell prototype 和最终选型 (`DS-FND-007/008`)；
- 双平台签名、安装、升级、降级和实机验收 (`DS-QA-003/004`)。

## Handoff 指针

- 项目级不可覆盖快照：[`../../handoff-20260719-phase00-issues-03-06-done.md`](../../handoff-20260719-phase00-issues-03-06-done.md)；
- Phase 级不可覆盖快照：[`archive/handoff-20260719-phase00-issues-03-06-done.md`](./archive/handoff-20260719-phase00-issues-03-06-done.md)；
- 当前阶段入口：本文件；
- 跨阶段唯一入口：[`../../current.md`](../../current.md)。

## 设计目录

```text
docs/studio/phases/phase-00-foundation-and-shell-spike/
├── README.md
├── product-requirements.md
├── ux-and-interaction.md
├── technical-design.md
├── contracts-and-data-model.md
├── security-and-privacy.md
├── test-and-acceptance-plan.md
├── rollout-and-rollback.md
├── adr/
│   ├── README.md
│   ├── 0001-runtime-api-process-boundary.md
│   ├── 0002-operation-lock-and-transaction-journal.md
│   ├── 0003-versioned-managed-runtime.md
│   └── 0004-desktop-shell-selection.md
└── acceptance/
    └── README.md
```

## 已完成 Work Item

### `DS-FND-001` · Done
### `DS-QA-001` · Done
### `DS-FND-002` (Issues 03-06) · Done

完成证据：

- `codes.js`, `schema-envelope.js`, `operations/*.js`；
- `reference-runner.js`, `fake-adapter.js`；
- `capabilities-handler.js`, `status-handler.js`, `list-themes-handler.js`；
- 4 个自动化回归测试文件，全部测试 100% PASS。

## 当前 Work Item

### `DS-FND-005` / Issue 07 · Ready

落地 Operation Lock (`owner.json`) 原子锁、死锁 (Stale Lock) 识别与抢占机制。

## 并行 Ready Work Item

### `DS-FND-005` / Issue 08 · Ready

落地 Transaction Journal 与崩溃恢复策略。

## ADR 状态

- ADR-0001：Accepted；
- ADR-0002：Accepted；
- ADR-0003：Accepted；
- ADR-0004：Proposed。

## 上游状态

```text
lastReviewedMainCommit:
  dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c

nextReviewRange:
  dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c..<current-main-sha>
```

不自动 merge/rebase `main`。若有新变化，先续接 Review，再判断 adopt/adapt/rewrite/defer/reject/observe。

## Ready 门禁

- [x] 当前真实代码基线写入 Phase README；
- [x] 最新 `main` 从上次游标续接审查；
- [x] 产品目标、范围和非目标明确；
- [x] Runtime API 和错误模型定义；
- [x] Adapter、锁和事务边界定义；
- [x] Desktop Shell Spike 评估方法定义；
- [x] 安全与隐私评审完成；
- [x] CI、Contract Test、实机和回滚计划可执行；
- [x] 依赖、风险、Owner 和 Known Issues 规则明确；
- [x] Work Register 更新；
- [x] 必要 ADR 已建立为 Accepted 或 Proposed；
- [x] 项目级和 Phase 级历史 handoff 已生成。

## 当前阻塞与风险

没有设计阻塞。实施风险：

- PR #2 当前 GitHub 报告 `mergeable=false`；
- Desktop Shell 尚未选型；
- Windows importer 尚未形成统一入口；
- legacy Runtime 输出需要 Adapter 归一化；
- managed Runtime 的 Node/sidecar 形态需 Spike；
- 双平台签名、安装和实机条件必须在进入 Verification 前落实。

## 测试、实机与回滚状态

```yaml
importerAutomatedRegression: not-implemented
runtimeApiContractRunner: not-implemented
macosAdapter: not-implemented
windowsAdapter: not-implemented
operationLockAndJournal: not-implemented
managedRuntime: not-implemented
desktopShellSpike: not-started
verticalSlice: not-started
macosRealDeviceMatrix: not-started
windowsRealDeviceMatrix: not-started
rollbackEvidence: not-started
```

## 必读文档

1. 本文件；
2. `docs/studio/work-register.md`；
3. `docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`；
4. `docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md`；
5. `docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md`；
6. `docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md`；
7. `docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md`；
8. `docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md`；
9. `docs/studio/upstream/upstream-baseline.md`；
10. `docs/studio/upstream/upstream-adoption-log.md`；
11. 项目级历史 handoff 仅用于追溯。

## 禁止提前进行

- 不自动 merge/rebase `main`；
- 不开始正式 Theme Manager 大规模 UI；
- 不凭偏好确定 Tauri/Electron；
- 不让 UI 执行任意 Shell/PowerShell 或连接 CDP；
- 不绕过 operation lock 和 transaction journal；
- 不依赖源码 checkout 或用户 PATH 作为正式 Runtime；
- 不把 Planned UPA 写成 Adopted；
- 不把设计状态写成已实现或已测试；
- 不让测试操作真实用户主题、配置或 Codex。

## 下一步

```text
执行 DS-QA-001：建立 importer fixture、隔离 state root 和自动化回归。
边界清晰时并行执行 DS-FND-002：落地 Runtime API Schema 与 reference Contract Runner。
```

## 新会话启动 Prompt

```text
请读取 feat/codex-theme-import-mvp 分支下的 .handoff/current.md 和 .handoff/phases/phase00/current.md，并按其中顺序恢复上下文。

先确认当前分支真实 HEAD、PR #2 状态、main 当前 SHA 和 upstream cursor。不要自动 merge/rebase main；若 main 超过 dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c，先续接 Review。

Phase 00 已达到 Ready，DS-FND-001 已 Done，但功能实现尚未开始。接下来执行 DS-QA-001：建立 .codex-theme importer 自动化回归。测试必须使用隔离 state root，并走 --no-apply，不操作真实 Codex 或用户主题。

边界清晰时可并行执行 DS-FND-002：落地 Runtime JSON API v1 Schema、reference Runtime Host 和 Contract Runner。不要先写平台 Adapter，再回头补契约；不要提前进行 Theme Manager 大规模 UI 或 Desktop Shell 最终选型。
```
