# Dream Skin Studio 当前交接入口

> 本文件是新会话的唯一最新入口。历史上下文保存在不可覆盖的 handoff 快照中。

```yaml
repository: twj515895394/Codex-Dream-Skin
branch: feat/codex-theme-import-mvp
headRecordedBeforeThisHandoffUpdate: 2a3f355c0e4b37549d2e0c975533ae9d1d6b52e2
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
currentHistoricalHandoff: handoff-20260718-dream-skin-studio-phase-design.md
currentPhaseSnapshot: phases/phase00/archive/handoff-20260719-phase00-design-ready.md
currentPhaseHandoff: phases/phase00/current.md
```

> 注意：本文件记录的是写入本次 handoff 之前的分支 HEAD。新会话仍必须读取 GitHub 当前分支真实 HEAD。不要自动 merge/rebase `main`。

## 当前真实状态

Phase 00 的详细设计已经完成并达到 `Ready`：

```text
docs/studio/phases/phase-00-foundation-and-shell-spike/
```

已完成：

- 产品需求、范围和非目标；
- UX、错误、取消和恢复流程；
- Runtime JSON API v1；
- macOS/Windows Adapter 边界；
- stdout、stderr、退出码和稳定错误码；
- operation lock、stale lock 和 transaction journal；
- managed Runtime 安装、升级和降级；
- Desktop Shell Spike 评分和硬淘汰条件；
- CI、Contract Test、失败注入和双平台实机矩阵；
- 安全、隐私、日志脱敏；
- Dev/Alpha 发布、升级、降级和 emergency Restore；
- ADR 与 acceptance 证据结构；
- `UPR-20260719-001` 和上游采用决策。

尚未实现：

- Runtime API Host、JSON Schema 和 Contract Runner；
- macOS/Windows Adapter；
- lock/journal 代码；
- managed Runtime installer；
- Desktop Shell prototype 和最终选型；
- Vertical Slice；
- 自动化、签名、安装和实机验收。

因此不得把 `Phase 00 Ready` 描述为 Phase 00 功能已经完成。

## 当前任务

```text
DS-QA-001
实现 .codex-theme importer 自动化回归。
```

优先覆盖：

- 正常包；
- 路径穿越；
- executable content；
- symlink/special file；
- 缺失 manifest/theme/image；
- ID、控制字符和路径边界；
- 包大小、entry 数量、解压大小和图片限制；
- 同 ID conflict/replace；
- publish 失败后的恢复；
- 测试 state root 隔离；
- `--no-apply`，不触发真实 Codex。

## 可并行任务

```text
DS-FND-002
把已批准的 Runtime JSON API v1 设计落地为机器可执行契约。
```

交付：

- JSON Schema；
- reference Runtime Host；
- request/response envelope；
- error/exit mapping；
- stdout/stderr assertions；
- Contract Runner；
- capabilities/status/listThemes 初始 fixture。

不要先写 macOS/Windows Adapter，再回头补契约。

## 必读文档

按顺序读取：

1. [`phases/phase00/current.md`](./phases/phase00/current.md)
2. [`../docs/studio/work-register.md`](../docs/studio/work-register.md)
3. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md)
4. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md)
5. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md)
6. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md)
7. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md)
8. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md)
9. [`../docs/studio/upstream/upstream-baseline.md`](../docs/studio/upstream/upstream-baseline.md)
10. [`../docs/studio/upstream/upstream-adoption-log.md`](../docs/studio/upstream/upstream-adoption-log.md)

## 开始前检查

新会话必须先确认：

- 当前分支仍为 `feat/codex-theme-import-mvp`；
- 当前分支真实 HEAD；
- PR #2 是否仍 Open、未合并；
- PR mergeability 是否变化；
- `main` 当前 SHA 是否超过 `dfcfa4f0...`；
- 若 `main` 有新增变化，从游标续接 Review，不自动 merge/rebase；
- `DS-QA-001` 或 `DS-FND-002` 的实现基线已记录；
- 测试使用隔离 state root，不修改真实用户状态。

## 已接受 ADR

- ADR-0001：Runtime API 使用单请求子进程、stdin JSON、stdout 单 JSON；
- ADR-0002：所有入口共享 operation lock 和 transaction journal；
- ADR-0003：使用版本化 managed Runtime 与 current/previous pointer。

## 尚未接受 ADR

- ADR-0004：Desktop Shell 选型仍为 `Proposed`；必须完成 Tauri 2、Electron、Native 双平台 Spike 和证据后再决定。

## 禁止提前进行

- 不自动 merge/rebase `main`；
- 不直接开始正式 Theme Manager 大规模 UI；
- 不凭偏好选择 Tauri/Electron；
- 不让 UI 拼接任意 Shell/PowerShell 命令；
- 不让 UI 直接连接 CDP；
- 不绕过 operation lock 和 transaction journal；
- 不依赖源码 checkout 或用户 PATH 作为正式 Runtime；
- 不把 Planned UPA 写成 Adopted；
- 不把设计状态写成已实现、已测试或已实机验证。

## 新会话启动 Prompt

```text
请读取 feat/codex-theme-import-mvp 分支下的 .handoff/current.md 和 .handoff/phases/phase00/current.md，并按其中顺序恢复上下文。

先确认当前分支 HEAD、PR #2 状态、main 当前 SHA 和 upstream cursor。不要自动 merge/rebase main；若 main 超过 dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c，先续接 Review。

Phase 00 已达到 Ready，DS-FND-001 已 Done，但功能实现尚未开始。接下来执行 DS-QA-001：建立 .codex-theme importer 自动化回归；边界清晰时可并行执行 DS-FND-002：落地 Runtime JSON API v1 Schema、reference host 和 Contract Runner。

严格使用隔离 state root，不操作真实用户主题或 Codex；不要提前进行 Theme Manager 大规模 UI 或 Desktop Shell 最终选型。
```

## 当前交接 Checklist

- [x] 当前分支和设计基线已记录；
- [x] PR #2 状态已记录；
- [x] 最新 `main` 已续接 Review；
- [x] upstream cursor 已推进；
- [x] Phase 00 细化设计完成；
- [x] `DS-FND-001` 达到 Done；
- [x] Phase 00 达到 Ready；
- [x] Work Register 已更新；
- [x] Phase snapshot 已创建；
- [x] 下一项 Work Item 单一且可执行；
- [x] Desktop Shell ADR 保持 Proposed；
- [x] 新会话 Prompt 已更新。
