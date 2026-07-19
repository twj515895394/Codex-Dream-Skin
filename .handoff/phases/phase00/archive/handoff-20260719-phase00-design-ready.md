# Phase 00 设计完成交接快照

> 快照日期：2026-07-19  
> 仓库：`twj515895394/Codex-Dream-Skin`  
> 分支：`feat/codex-theme-import-mvp`  
> 设计前代码基线：`5d3243c21715080072b4007ac5da10e6d3a7f185`  
> 快照前最新文档提交：`332a8cc8e99c649af4d4999ef0e736853542689c`

## 1. 当前状态

```yaml
phase: 00
phaseStatus: Ready
completedWorkItem: DS-FND-001
currentWorkItem: DS-QA-001
parallelReadyWorkItem: DS-FND-002
pullRequest: 2
pullRequestState: open
pullRequestMerged: false
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
upstreamReviewId: UPR-20260719-001
mergeOrRebasePerformed: false
```

`Ready` 表示 Phase 00 的产品、UX、技术、契约、安全、测试、发布和 ADR 设计已完成；不表示 Runtime API、Adapter、锁、受管 Runtime、Desktop Shell 或 Vertical Slice 已实现。

## 2. 本轮完成

### 2.1 重新审查当前分支代码

重点读取并纳入设计：

- `macos/scripts/import-theme-macos.sh`；
- `macos/scripts/switch-theme-macos.sh`；
- `macos/scripts/common-macos.sh`；
- `windows/scripts/common-windows.ps1`；
- `windows/scripts/theme-windows.ps1`；
- 当前项目基线、实施计划、模板、Work Register 和上游机制。

关键结论：

- macOS importer/switch 已有较好的包校验、稳定 staging 和 commit marker 基础，但没有跨入口 operation lock、统一 JSON/error/exit contract 和 transaction journal；
- Windows 已有 per-user Mutex、reparse point、Appx 身份和原子写基础，但与 macOS 的状态、锁和输出语义不统一；
- macOS 使用 Codex 内置 Node、Windows 使用 PATH Node，不适合作为正式 Studio 受管分发；
- 现有 Runtime 应先封装为 Adapter，不应在 Phase 00 重写 Injector/Renderer。

### 2.2 续接上游 Review

完成：

```text
19fa0342846219fb0476bfd648aa7f0f0019bb0b
  ..
dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
```

- `main` 新增 9 个提交；
- 生成 `UPR-20260719-001`；
- 游标推进到 `dfcfa4f0...`；
- 新增 `UPA-012` 和 `UPA-013`；
- 没有 merge/rebase。

### 2.3 Phase 00 设计目录

已完成：

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

### 2.4 ADR 状态

- ADR-0001：Accepted；单请求子进程、stdin JSON、stdout 单 JSON、stderr 诊断；
- ADR-0002：Accepted；跨入口持久锁 + owner identity + transaction journal；
- ADR-0003：Accepted；版本化 managed runtime + current/previous JSON pointer；
- ADR-0004：Proposed；Tauri 2/Electron/Native 必须经过双平台 Spike 后才能最终选型。

## 3. 已批准的核心设计

### Runtime API v1

最小 operation：

```text
capabilities
status
listThemes
importTheme
applyTheme
verify
restore
```

- stdin request JSON；
- stdout 仅一个 response JSON；
- stderr 诊断；
- 稳定错误码和类别退出码；
- Import 返回 installed/applied/verified 分离状态；
- Apply 返回 rollbackAttempted/rollbackSucceeded；
- UI 不解析人类日志。

### Operation Lock

```text
STATE_ROOT/locks/operation.lock/owner.json
```

- non-blocking；
- PID + process start time + executable 验证；
- TTL/heartbeat 不是唯一 stale 依据；
- stale 锁先归档；
- Windows Mutex 可作为快速层，但不替代持久事实。

### Transaction Journal

```text
created → locked → detected → staged → validated
→ backedUp → published → verified → committed
→ cleanupPending → completed
```

- commit 前失败必须恢复；
- committed 后 cleanup 失败只 warning；
- rollbackFailed 进入 recoveryRequired 并阻止新写操作。

### Managed Runtime

```text
STATE_ROOT/runtime/
├── current.json
├── previous.json
├── versions/<version>/
├── staging/
└── rollback/
```

- 不依赖源码 checkout；
- 不依赖用户 PATH；
- manifest/hash/platform signing；
- stage/publish/smoke test/current pointer；
- upgrade/downgrade/rollback；
- emergency Restore 独立分发。

## 4. 下一工作

### 当前：`DS-QA-001`

实现 `.codex-theme` importer 自动化回归：

- 正常包；
- 路径穿越；
- executable；
- symlink/special file；
- 缺失 manifest/theme/image；
- ID/控制字符；
- 包/图片限制；
- 同 ID replace；
- publish 失败恢复；
- `--no-apply` 隔离测试。

### 并行 Ready：`DS-FND-002`

把设计契约落成：

- JSON Schema；
- reference Runtime Host；
- exit code/error mapping；
- Contract Runner；
- stdout/stderr assertions；
- capabilities/status/listThemes 初始 fixture。

## 5. 禁止提前进行

- 不开始正式 Theme Manager 大规模 UI；
- 不先选定 Tauri/Electron；
- 不自动 merge/rebase `main`；
- 不把 UPA Planned 写成 Adopted；
- 不把设计状态写成代码或实机已完成；
- 不让 UI 直接执行任意 Shell/PowerShell 或连接 CDP；
- 不绕过 lock/journal 实现写操作。

## 6. 新会话读取顺序

1. `.handoff/current.md`；
2. `.handoff/phases/phase00/current.md`；
3. `docs/studio/work-register.md`；
4. Phase 00 `README.md`；
5. `contracts-and-data-model.md`；
6. `technical-design.md`；
7. `test-and-acceptance-plan.md`；
8. `security-and-privacy.md`；
9. ADR 索引；
10. upstream baseline/adoption log。
