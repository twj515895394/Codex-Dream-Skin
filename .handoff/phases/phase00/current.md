# Phase 00 当前交接

```yaml
phase: 00
name: Foundation, Runtime API and Desktop Shell Spike
status: Completed
completedWorkItem: Issue 15 (Vertical Slice End-to-End Integration)
currentWorkItem: Phase 00 Code & Architecture Design Check
branch: feat/codex-theme-import-mvp
headRecordedBeforePhaseCurrentUpdate: 69807996c464efc14a90b411d31ed1aa34e9e4a8
designBaselineCommit: 5d3243c21715080072b4007ac5da10e6d3a7f185
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
upstreamReviewId: UPR-20260719-001
latestProjectHandoff: ../../handoff-20260719-phase00-completed.md
latestHistoricalSnapshot: archive/handoff-20260719-phase00-completed.md
```

> `headRecordedBeforePhaseCurrentUpdate` 是生成项目级历史 handoff 后、更新本文件之前的真实分支 HEAD。读取新会话时仍需重新确认 GitHub 当前 HEAD。

## 当前状态

Phase 00 (`Foundation, Runtime API and Desktop Shell Spike`) 的全部规划工作项 (Issue 03 ~ Issue 15) 已全量实施完成并通过全量平台回归测试！

最新交接文档：[`../../handoff-20260719-phase00-completed.md`](../../handoff-20260719-phase00-completed.md)

已完成全量列表：

- `DS-FND-001` Phase 00 全部细化设计；
- `DS-QA-001` Importer 安全 Fixture 生成器与自动化回归（17 场景 100% PASS）；
- `DS-FND-002 / Issue 03` Runtime JSON API v1 Schema 与 Envelope 不变量断言（17 场景 100% PASS）；
- `DS-FND-002 / Issue 04` Reference Runner 进程模型与 Contract Test 框架（13 端到端子进程场景 100% PASS）；
- `DS-FND-002 / Issue 05` `capabilities` 与 `status` 实体 Handler、并发写锁及 Journal 探查（7 场景 100% PASS）；
- `DS-FND-002 / Issue 06` `listThemes` 实体 Handler、坏主题隔离防线与 100 主题 38ms 扫盘（7 场景 100% PASS）；
- `DS-FND-005 / Issue 07` `operation lock` (owner.json) 原子锁与死锁抢占防线（5 场景 100% PASS）；
- `DS-FND-005 / Issue 08` `transaction journal` 与崩溃恢复 (Crash Recovery) 机制（5 场景 100% PASS）；
- `DS-TM-001 / Issue 09` `importTheme` 实体 Handler 与解压校验链（5 场景 100% PASS）；
- `DS-TM-002 / Issue 10` `applyTheme` / `verify` / `restore` 实体 Handler 与状态机联动（10 场景 100% PASS）；
- `DS-FND-003 / Issue 11` macOS Platform Adapter 落地与 Typed Internal Result 接口封装（8 场景 100% PASS）；
- `DS-FND-004 / Issue 12` Windows Platform Adapter 落地与 Typed Internal Result 接口封装（8 场景 100% PASS）；
- `DS-FND-006 / Issue 13` Managed Runtime 校验分发、双版本原子升降级与中断恢复（7 场景 100% PASS）；
- `DS-FND-007 / DS-FND-008 / Issue 14` Desktop Shell 选型 Spike、Scorecard 对照及 ADR-0004 Accepted（4 场景 100% PASS）；
- `Issue 15` Vertical Slice End-to-End 端到端集成与 Apple Design UI 界面（3 场景 100% PASS）。

## Handoff 指针

- 项目级不可覆盖快照：[`../../handoff-20260719-phase00-completed.md`](../../handoff-20260719-phase00-completed.md)；
- 阶段历史快照：[`archive/handoff-20260719-phase00-completed.md`](./archive/handoff-20260719-phase00-completed.md)；
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

全量完成：`DS-FND-001` ~ `DS-FND-008` (Issues 03 ~ 15)。

完成证据：

- `codes.js`, `schema-envelope.js`, `operations/*.js`；
- `reference-runner.js`, `fake-adapter.js`；
- `capabilities-handler.js`, `status-handler.js`, `list-themes-handler.js`；
- `operation-lock.js`, `transaction-journal.js`, `import-theme-handler.js`；
- `apply-theme-handler.js`, `verify-handler.js`, `restore-handler.js`；
- `adapters/macos-adapter.js`, `adapters/windows-adapter.js`；
- `managed-runtime.js`；
- `spikes/desktop-shell-spike/`；
- `vertical-slice/`；
- `docs/studio/phases/phase-00-foundation-and-shell-spike/adr/0004-desktop-shell-selection.md` (`Accepted`)；
- `docs/studio/phases/phase-00-foundation-and-shell-spike/acceptance/shell-spike/scorecard.md`；
- 13 个自动化回归测试文件，全部测试 100% PASS。

## ADR 状态

- ADR-0001：Accepted；
- ADR-0002：Accepted；
- ADR-0003：Accepted；
- ADR-0004：Accepted。

## 下一步

```text
下个会话对 Phase 00 的全量代码及架构设计与主方向设计规范（PRD/Architecture）进行整体 Code Check / Review 对齐。
```
