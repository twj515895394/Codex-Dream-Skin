# Dream Skin Studio 当前交接入口

> 本文件是跨阶段、跨会话的唯一最新入口。历史状态保存在不可覆盖的 handoff 快照中。

```yaml
repository: twj515895394/Codex-Dream-Skin
branch: feat/codex-theme-import-mvp
headRecordedBeforeCurrentUpdate: 09c994bbc1aff04e0fd51fc428cf8c87f3848adf
phase00DesignBaselineCommit: 5d3243c21715080072b4007ac5da10e6d3a7f185
pullRequest: 2
pullRequestState: open
pullRequestMerged: false
pullRequestMergeableAtLastCheck: false
currentPhase: Phase 00
phaseStatus: Ready
completedWorkItem: DS-FND-001
currentWorkItem: DS-QA-001
parallelReadyWorkItem: DS-FND-002
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
upstreamReviewId: UPR-20260719-001
currentHistoricalHandoff: handoff-20260719-phase00-design-ready.md
currentPhaseSnapshot: phases/phase00/archive/handoff-20260719-phase00-design-ready.md
currentPhaseHandoff: phases/phase00/current.md
```

> `headRecordedBeforeCurrentUpdate` 是项目级历史 handoff 和 Phase current 更新完成后、更新本文件之前的真实分支 HEAD。新会话仍必须读取 GitHub 当前分支 HEAD，不能把该 SHA 当作永久最新值。

## 当前真实状态

Phase 00 的详细设计已经完成并达到 `Ready`。

已完成：

- `DS-FND-001` Phase 00 全部细化设计；
- Runtime JSON API v1 设计；
- macOS/Windows Adapter 边界；
- stdout、stderr、退出码和稳定错误码；
- operation lock、stale lock 和 transaction journal；
- managed Runtime 安装、升级和降级模型；
- Desktop Shell Spike 评分和硬淘汰条件；
- CI、Contract Test、失败注入和双平台实机矩阵；
- 安全、隐私、日志脱敏、发布与回滚设计；
- ADR-0001、ADR-0002、ADR-0003 Accepted；
- ADR-0004 Proposed；
- `UPR-20260719-001` 和上游采用决策；
- 项目级与 Phase 级历史 handoff 快照。

尚未实现：

- Runtime API Host、JSON Schema 和 Contract Runner；
- macOS/Windows Runtime JSON Adapter；
- operation lock 和 transaction journal 代码；
- managed Runtime installer；
- Desktop Shell prototype 和最终选型；
- Studio Vertical Slice；
- importer 自动化回归；
- 双平台签名、安装、升级、降级和实机验收。

因此不得把 `Phase 00 Ready` 描述为 Phase 00 功能已经完成、测试通过或实机交付。

## Handoff 指针

- 当前项目级历史快照：[`handoff-20260719-phase00-design-ready.md`](./handoff-20260719-phase00-design-ready.md)；
- 当前 Phase 入口：[`phases/phase00/current.md`](./phases/phase00/current.md)；
- Phase 历史快照：[`phases/phase00/archive/handoff-20260719-phase00-design-ready.md`](./phases/phase00/archive/handoff-20260719-phase00-design-ready.md)。

历史快照用于追溯；动态状态以本文件、Phase current 和 Work Register 为准。

## 当前任务

```text
DS-QA-001
实现 .codex-theme importer 自动化回归。
```

优先覆盖：

- 正常包；
- 路径穿越；
- executable content；
- symlink 和特殊文件；
- 缺失 manifest/theme/image；
- ID、控制字符和路径边界；
- 包大小、entry 数量、解压大小和图片限制；
- 同 ID conflict/replace；
- publish 失败后的旧主题恢复；
- 隔离测试 state root；
- `--no-apply`，不触发真实 Codex。

进入 `In Progress` 前必须记录实现基线、fixture 目录和测试命令。

## 可并行任务

```text
DS-FND-002
把 Runtime JSON API v1 设计落地为机器可执行契约。
```

交付：

- request/response JSON Schema；
- reference Runtime Host；
- error/exit mapping；
- stdout 单 JSON、stderr 和退出码断言；
- Contract Runner；
- capabilities/status/listThemes 初始 fixture。

不要先写 macOS/Windows Adapter，再回头补契约。

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
- operation lock 当前两平台语义不一致；
- macOS 使用 Codex 内置 Node、Windows 使用 PATH Node，不能作为最终分发模型；
- Desktop Shell 尚未选型；
- managed Runtime sidecar/Node/单文件形态尚未 Spike；
- 双平台签名、安装、升级、降级和实机条件尚未验证。

## 测试、实机与回滚状态

```yaml
designReview: complete
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

所有自动化测试必须使用隔离 state root，不得修改真实用户主题库、配置文件或 Codex 状态。

## 必读文档

按顺序读取：

1. [`phases/phase00/current.md`](./phases/phase00/current.md)；
2. [`../docs/studio/work-register.md`](../docs/studio/work-register.md)；
3. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md)；
4. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md)；
5. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md)；
6. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md)；
7. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md)；
8. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md)；
9. [`../docs/studio/upstream/upstream-baseline.md`](../docs/studio/upstream/upstream-baseline.md)；
10. [`../docs/studio/upstream/upstream-adoption-log.md`](../docs/studio/upstream/upstream-adoption-log.md)；
11. 当前项目级历史 handoff 仅用于追溯。

## 已接受 ADR

- ADR-0001：Runtime API 使用单请求子进程、stdin JSON、stdout 单 JSON；
- ADR-0002：所有入口共享 operation lock 和 transaction journal；
- ADR-0003：使用版本化 managed Runtime 与 current/previous pointer。

## 尚未接受 ADR

- ADR-0004：Desktop Shell 选型仍为 `Proposed`；必须完成 Tauri 2、Electron、Native 双平台 Spike 和证据后再决定。

## 禁止提前进行

- 不自动 merge/rebase `main`；
- 不直接开始正式 Theme Manager 大规模 UI；
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
执行 DS-QA-001：建立 importer fixture、隔离测试 state root 和自动化回归。
```

边界清晰时并行：

```text
执行 DS-FND-002：落地 Runtime API v1 JSON Schema、reference Runtime Host 和 Contract Runner。
```

## 新会话启动 Prompt

```text
请读取 feat/codex-theme-import-mvp 分支下的 .handoff/current.md，并按其中顺序恢复项目上下文。

先确认当前分支真实 HEAD、PR #2 状态、main 当前 SHA 和 upstream cursor。不要自动 merge/rebase main；若 main 超过 dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c，先续接 Review。

Phase 00 已达到 Ready，DS-FND-001 已 Done，但功能实现尚未开始。接下来执行 DS-QA-001：建立 .codex-theme importer 自动化回归。测试必须使用隔离 state root，并走 --no-apply，不操作真实 Codex 或用户主题。

边界清晰时可并行执行 DS-FND-002：落地 Runtime JSON API v1 Schema、reference Runtime Host 和 Contract Runner。不要先写平台 Adapter，再回头补契约；不要提前进行 Theme Manager 大规模 UI 或 Desktop Shell 最终选型。
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
- [x] 测试、实机和回滚状态已明确；
- [x] 下一项 Work Item 单一且可执行；
- [x] 新会话 Prompt 已更新。
