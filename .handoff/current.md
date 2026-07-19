# Dream Skin Studio 当前交接指针

> 文档角色：根级动态交接入口  
> 状态：Active  
> 分支：`feat/codex-theme-import-mvp`  
> 建立日期：2026-07-18  
> 最后更新：2026-07-19  
> 当前设计基线：`5d3243c21715080072b4007ac5da10e6d3a7f185`  
> 最新 `main` Review SHA：`dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c`  
> 当前 Review 标识：`UPR-20260719-001`  
> 当前 Phase 状态：`Phase 00 Foundation In-Progress`

---

## 当前真实状态

Phase 00 的详细设计已经完成并达到 `Ready`，且已启动基础架构与自动化回归实施。

已完成：

- `DS-FND-001` Phase 00 全部细化设计；
- `DS-QA-001` Importer 安全 Fixture 生成器 (`package-fixture-generator.mjs`) 与自动化回归套件 (`importer-regression.test.mjs`，17 场景 100% PASS)；
- Runtime JSON API v1 设计；
- macOS/Windows Adapter 边界；
- stdout、stderr、退出码和稳定错误码；
- operation lock、stale lock 和 transaction journal 设计；
- managed Runtime 安装、升级和降级模型；
- Desktop Shell Spike 评分和硬淘汰条件；
- CI、Contract Test、失败注入和双平台实机矩阵；
- 安全、隐私、日志脱敏、发布与回滚设计；
- ADR-0001、ADR-0002、ADR-0003 Accepted；
- ADR-0004 Proposed；
- `UPR-20260719-001` 和上游采用决策；
- 项目级与 Phase 级历史 handoff 快照。

尚未实现：

- Runtime API Host、JSON Schema 和 Contract Runner (`DS-FND-002`)；
- macOS/Windows Runtime JSON Adapter (`DS-FND-003/004`)；
- operation lock 和 transaction journal 代码 (`DS-FND-005`)；
- managed Runtime installer (`DS-FND-006`)；
- Desktop Shell prototype 和最终选型 (`DS-FND-007/008`)；
- Studio Vertical Slice (`DS-TM-001/002`)；
- 双平台签名、安装、升级、降级和实机验收 (`DS-QA-003/004`)。

因此不得把 `Phase 00 Ready` 描述为 Phase 00 功能已经完成、测试通过或实机交付。

## Handoff 指针

- 最新历史快照：[`handoff-20260719-phase00-issues-01-02-done.md`](./handoff-20260719-phase00-issues-01-02-done.md)；
- 阶段设计历史快照：[`handoff-20260719-phase00-design-ready.md`](./handoff-20260719-phase00-design-ready.md)；
- 当前 Phase 入口：[`phases/phase00/current.md`](./phases/phase00/current.md)；
- Phase 历史快照：[`phases/phase00/archive/handoff-20260719-phase00-design-ready.md`](./phases/phase00/archive/handoff-20260719-phase00-design-ready.md)。

历史快照用于追溯；动态状态以本文件、Phase current 和 Work Register 为准。

## 当前任务

```text
DS-FND-002 / Issue 03
把 Runtime JSON API v1 设计落地为机器可执行契约与 Schema Envelope。
```

问题文件：[`.scratch/phase-00-foundation/issues/03-runtime-api-v1-schema-envelope.md`](../.scratch/phase-00-foundation/issues/03-runtime-api-v1-schema-envelope.md)

交付：

- request/response JSON Schema；
- error/exit code 归一化映射；
- stdout 单 JSON、stderr 诊断与退出码断言；
- Reference Runtime Host 基础；
- capabilities/status/listThemes 初始 Schema 校验。

不要先写 macOS/Windows Adapter，再回头补契约。

## 可并行与后续任务

```text
DS-FND-002 (续) / Issue 04
Runtime Host Reference Runner 与 Contract Test 框架。
```

问题文件：[`.scratch/phase-00-foundation/issues/04-reference-runner-contract-test.md`](../.scratch/phase-00-foundation/issues/04-reference-runner-contract-test.md)

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
- managed Runtime sidecar/Node/单文件形态 numerically Spike 尚未完成；
- 双平台签名、安装、升级、降级和实机条件尚未验证。

## 测试、实机与回滚状态

```yaml
designReview: complete
importerAutomatedRegression: complete
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

1. [`.scratch/phase-00-foundation/PRD.md`](../.scratch/phase-00-foundation/PRD.md)；
2. [`phases/phase00/current.md`](./phases/phase00/current.md)；
3. [`../docs/studio/work-register.md`](../docs/studio/work-register.md)；
4. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/README.md)；
5. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md)；
6. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md)；
7. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md)；
8. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md)；
9. [`../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md`](../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md)；
10. [`../docs/studio/upstream/upstream-baseline.md`](../docs/studio/upstream/upstream-baseline.md)；
11. [`../docs/studio/upstream/upstream-adoption-log.md`](../docs/studio/upstream/upstream-adoption-log.md)；
12. 当前项目级历史 handoff 仅用于追溯。

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
执行 DS-FND-002 / Issue 03：落地 Runtime JSON API v1 Schema 与 Request/Response Envelope。
```

## 新会话启动 Prompt

```text
请读取 feat/codex-theme-import-mvp 分支下的 .handoff/current.md，并按其中顺序恢复项目上下文。

先确认当前分支真实 HEAD、PR #2 状态、main 当前 SHA 和 upstream cursor。不要自动 merge/rebase main；若 main 超过 dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c，先续接 Review。

Phase 00 的 DS-QA-001 (Issue 01、02) 已全量测试通过并完成。接下来执行 DS-FND-002 / Issue 03：落地 Runtime JSON API v1 Schema 与 Request/Response Envelope。测试必须使用隔离 state root。

不要先写平台 Adapter，再回头补契约；不要提前进行 Theme Manager 大规模 UI 或 Desktop Shell 最终选型。
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
