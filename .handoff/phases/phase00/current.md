# Phase 00 当前交接

```yaml
phase: 00
name: Foundation, Runtime API and Desktop Shell Spike
status: Ready
completedWorkItem: DS-FND-001
currentWorkItem: DS-QA-001
parallelReadyWorkItem: DS-FND-002
branch: feat/codex-theme-import-mvp
headRecordedBeforePhaseCurrentUpdate: 4a7b425ab04311177f6d35a4874dbb37221aaaab
designBaselineCommit: 5d3243c21715080072b4007ac5da10e6d3a7f185
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
upstreamReviewId: UPR-20260719-001
latestProjectHandoff: ../../handoff-20260719-phase00-design-ready.md
latestHistoricalSnapshot: archive/handoff-20260719-phase00-design-ready.md
```

> `headRecordedBeforePhaseCurrentUpdate` 是生成项目级历史 handoff 后、更新本文件之前的真实分支 HEAD。读取新会话时仍需重新确认 GitHub 当前 HEAD。

## 当前状态

Phase 00 的开发前细化设计已经完成，阶段从 `Planned` 进入 `Ready`。

`Ready` 只表示以下内容已完成：

- 产品目标、范围和非目标；
- UX、正常/失败/恢复流程；
- Runtime JSON API v1；
- macOS/Windows Adapter 边界；
- stdout、stderr、退出码和错误码；
- operation lock、stale lock 和 transaction journal；
- staging、backup、publish、verify、commit、cleanup、rollback；
- managed Runtime 安装、升级和降级；
- Desktop Shell Spike 方法和评分；
- CI、Contract Test、实机、发布和回滚；
- 安全与隐私；
- ADR 和验收证据结构。

以下尚未实现：

- Runtime API Host/Schema/Contract Runner；
- macOS/Windows Adapter；
- 共享锁和 journal 代码；
- managed Runtime installer；
- Desktop Shell prototype；
- Vertical Slice；
- 自动化和实机验收。

## Handoff 指针

- 项目级不可覆盖快照：[`../../handoff-20260719-phase00-design-ready.md`](../../handoff-20260719-phase00-design-ready.md)；
- Phase 级不可覆盖快照：[`archive/handoff-20260719-phase00-design-ready.md`](./archive/handoff-20260719-phase00-design-ready.md)；
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

完成证据：

- Phase 00 全部设计文档；
- `UPR-20260719-001`；
- upstream cursor 推进到 `dfcfa4f0...`；
- `UPA-012/013` 登记；
- Work Register 更新；
- Phase 级和项目级 handoff 快照。

由于这是设计 Work Item：

- 自动测试：不适用；
- 实机证据：不适用；
- 不得据此声称 Phase 00 功能已交付。

## 当前 Work Item

### `DS-QA-001` · Ready

实现 `.codex-theme` importer 自动化回归，优先覆盖：

- 正常包；
- 路径穿越；
- executable content；
- symlink/special file；
- 缺失 manifest/theme/image；
- ID 与控制字符；
- 包和图片限制；
- 同 ID conflict/replace；
- publish 失败后恢复；
- 测试 state root 隔离；
- 不触发真实 Codex 的 `--no-apply` 路径。

进入 `In Progress` 前记录本次实现基线、fixture 目录和测试命令。

## 并行 Ready Work Item

### `DS-FND-002` · Ready

把已批准的 Runtime API 设计落地为：

- JSON Schema；
- reference Runtime Host；
- request/response envelope；
- error/exit mapping；
- Contract Runner；
- stdout 单 JSON、stderr 和退出码测试；
- capabilities/status/listThemes 初始 fixture。

不要直接先写 macOS/Windows Adapter，再回头补 Schema。

## ADR 状态

- ADR-0001：Accepted；
- ADR-0002：Accepted；
- ADR-0003：Accepted；
- ADR-0004：Proposed，必须等双平台 Desktop Shell Spike 证据后才能 Accepted。

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
