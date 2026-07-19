# Phase 00 当前交接

```yaml
phase: 00
name: Foundation, Runtime API and Desktop Shell Spike
status: Ready
completedWorkItem: DS-FND-001
currentWorkItem: DS-QA-001
parallelReadyWorkItem: DS-FND-002
branch: feat/codex-theme-import-mvp
designBaselineCommit: 5d3243c21715080072b4007ac5da10e6d3a7f185
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
upstreamReviewId: UPR-20260719-001
latestHistoricalSnapshot: archive/handoff-20260719-phase00-design-ready.md
```

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
- 本 handoff 快照。

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

进入 `In Progress` 前记录本次实现基线和 fixture 目录。

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
- [x] 必要 ADR 已建立为 Accepted 或 Proposed。

## 当前阻塞与风险

没有设计阻塞。实施风险：

- Desktop Shell 尚未选型；
- Windows importer 尚未形成统一入口；
- legacy Runtime 输出需要 Adapter 归一化；
- managed Runtime 的 Node/sidecar 形态需 Spike；
- 双平台签名、安装和实机条件必须在进入 Verification 前落实。

## 禁止提前进行

- 不自动 merge/rebase `main`；
- 不开始正式 Theme Manager 大规模 UI；
- 不凭偏好确定 Tauri/Electron；
- 不让 UI 执行任意 Shell/PowerShell 或连接 CDP；
- 不绕过 operation lock 和 transaction journal；
- 不把 Planned UPA 写成 Adopted；
- 不把设计状态写成已实现或已测试。

## 下一步

```text
执行 DS-QA-001：建立 importer fixture 和自动化回归。
边界清晰时并行执行 DS-FND-002：落地 Runtime API Schema 与 reference Contract Runner。
```
