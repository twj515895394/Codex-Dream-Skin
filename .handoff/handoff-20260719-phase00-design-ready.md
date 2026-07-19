# Dream Skin Studio · Phase 00 设计 Ready 交接

```yaml
handoffDate: 2026-07-19
repository: twj515895394/Codex-Dream-Skin
branch: feat/codex-theme-import-mvp
headAtHandoff: c2d30ef3eb0a53e7d1556f1adbb076120aba47f0
pullRequest: 2
pullRequestState: open
pullRequestMerged: false
pullRequestMergeableAtHandoff: false
currentPhase: Phase 00
phaseStatus: Ready
completedWorkItem: DS-FND-001
currentWorkItem: DS-QA-001
parallelReadyWorkItem: DS-FND-002
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
upstreamReviewId: UPR-20260719-001
relatedUpstreamActions:
  - UPA-001
  - UPA-002
  - UPA-003
  - UPA-004
  - UPA-005
  - UPA-006
  - UPA-007
  - UPA-008
  - UPA-012
  - UPA-013
acceptedAdrs:
  - ADR-0001
  - ADR-0002
  - ADR-0003
proposedAdrs:
  - ADR-0004
currentPhaseHandoff: phases/phase00/current.md
currentPhaseSnapshot: phases/phase00/archive/handoff-20260719-phase00-design-ready.md
```

> 本文件是不可覆盖的项目级历史快照。后续状态以 `.handoff/current.md`、`.handoff/phases/phase00/current.md` 和 `docs/studio/work-register.md` 为准。

## 1. 本轮完成内容

本轮重新核对了 `feat/codex-theme-import-mvp` 分支的现有 Runtime、主题导入和跨平台安全代码，并完成 `DS-FND-001`：Phase 00 全部开发前细化设计。

已完成并提交：

- Phase 00 产品需求、用户角色、范围和非目标；
- UX 信息架构、正常流程、取消、失败和恢复流程；
- Runtime JSON API v1 请求/响应 Envelope；
- stdout、stderr、退出码和稳定错误码；
- macOS/Windows Platform Adapter 边界；
- operation lock、stale lock 身份校验和冲突策略；
- transaction journal 与事务状态机；
- staging、backup、publish、verify、commit、cleanup 和 rollback；
- versioned managed Runtime 安装、升级和降级模型；
- Tauri 2、Electron、Native Shell 双平台 Spike 评分和硬淘汰条件；
- Foundation CI、Contract Test、失败注入和实机矩阵；
- 安全、隐私和日志脱敏设计；
- Dev/Alpha 发布、升级、降级和 emergency Restore；
- ADR 与验收证据目录；
- `main` 从旧游标续接 Review，并推进到 `dfcfa4f0...`；
- Work Register、upstream baseline、adoption log 和 Phase handoff 同步。

Phase 00 已从 `Planned` 进入 `Ready`。这只表示开发前门禁满足，不表示 Phase 00 功能已经实现。

## 2. 当前真实能力

### 2.1 macOS

当前已有：

- `.codex-theme` 纯数据包导入；
- 包扩展名、64 MB 大小、ZIP 路径和可执行内容预检查；
- 解压后 symlink 和特殊文件拒绝；
- manifest、theme、ID、图片和 preview 校验；
- 复用 injector `--check-payload`；
- 导入到本地主题库并复用主题切换链路；
- 主题切换 staging、稳定文件快照和 `theme.json` commit marker；
- Codex 签名、Team ID、架构和内置 Node 校验；
- CDP 回环地址、端口所有权和 Injector 身份验证；
- Start、Pause、Status、Verify、Doctor、Restore；
- SwiftBar 和 CLI 入口。

### 2.2 Windows

当前已有：

- 官方 Store/Appx Codex 包身份和路径验证；
- Node、CDP、进程和监听端口验证；
- per-user Mutex 操作锁基础；
- junction、symlink 和 reparse point 防护；
- UTF-8 配置与原子写入基础；
- 主题保存、切换、图片导入和暂停；
- Start、Verify、Restore、Tray 和 CLI 入口。

### 2.3 共同基础

- 不修改官方 Codex 二进制、`app.asar`、WindowsApps 或代码签名；
- CDP 仅绑定本机回环地址；
- 文件系统主题库是事实来源；
- 已有 active theme 发布目录；
- 已有 Verify、Doctor 和 Restore 恢复链路；
- `.codex-theme` 保持纯数据，不允许携带执行代码。

## 3. 当前尚未实现

以下仍然是设计或计划，不得描述为已完成：

- Runtime API Host；
- Runtime JSON Schema 和机器可执行 Contract Runner；
- macOS Runtime JSON Adapter；
- Windows Runtime JSON Adapter；
- 所有入口共享的 operation lock 实现；
- transaction journal、recoveryRequired 和 cleanupPending 代码；
- versioned managed Runtime installer；
- Runtime payload manifest、hash 和签名验证实现；
- Tauri 2、Electron、Native Shell 双平台 prototype；
- Desktop Shell 最终技术选型；
- Studio 主题列表 Vertical Slice；
- Apply、Verify、Restore Vertical Slice；
- Foundation CI 完整矩阵；
- macOS/Windows Phase 00 实机验收；
- 完整 Theme Manager、Compiler、Preview、Editor、AI 和 Marketplace。

## 4. 关键架构决策

### ADR-0001 · Accepted

Runtime API 使用单请求子进程边界：

```text
固定可执行入口
  ↓ stdin 单个 UTF-8 JSON request
Runtime Host
  ↓ stdout 单个 JSON response
  ↓ stderr 诊断日志
  ↓ 真实退出码
进程退出
```

UI 不拼接 Shell/PowerShell 命令，不解析人类日志判断成功，也不直接连接 CDP。

### ADR-0002 · Accepted

Studio、SwiftBar、Tray、CLI、installer 和 recovery tool 共享 operation lock 与 transaction journal。

stale lock 不能仅按时间删除，必须核验 PID、进程启动时间、Runtime 身份和 journal 状态。commit 前失败必须回滚；commit 后清理失败只记录 warning。

### ADR-0003 · Accepted

正式 Studio 使用版本化 managed Runtime：

```text
STATE_ROOT/runtime/
├── current.json
├── previous.json
├── versions/<version>/
├── staging/
└── rollback/
```

安装后不能依赖源码 checkout 或用户 PATH。升级失败回到 previous，紧急恢复工具必须独立于当前损坏 Runtime。

### ADR-0004 · Proposed

Desktop Shell 尚未选型。Tauri 2、Electron 和 Native Shell 必须完成双平台 artifact、sidecar、签名、安装、升级、降级、无源码运行和无 PATH Node 测试后再决定。

## 5. 上游状态

最新已审查 `main`：

```text
dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
```

本次 Review：

```text
UPR-20260719-001
```

下一次范围：

```text
dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c..<current-main-sha>
```

处理原则：只做续接 Review 和采用决策，不自动 merge/rebase `main`。UPA 只有在真实实现、测试和提交完成后才能标记为 `Adopted`。

## 6. 当前 Work Item

### `DS-QA-001` · Ready

实现 `.codex-theme` importer 自动化回归。

必须优先覆盖：

- 正常包；
- ZIP 路径穿越；
- executable content；
- symlink 和特殊文件；
- 缺失 manifest、theme、image；
- manifest/theme ID 不一致；
- 控制字符和路径边界；
- 包大小、entry 数量、解压大小和图片限制；
- 同 ID conflict/replace；
- publish 失败后的旧主题恢复；
- 隔离测试 state root；
- `--no-apply`，不启动或操作真实 Codex。

进入 `In Progress` 前必须记录实现基线、fixture 目录和测试命令。

## 7. 可并行 Work Item

### `DS-FND-002` · Ready

把已批准的 Runtime JSON API v1 落地为机器可执行契约：

- request/response JSON Schema；
- reference Runtime Host；
- error code 与 exit code mapping；
- stdout 单 JSON 和 stderr 断言；
- Contract Runner；
- capabilities、status、listThemes 初始 fixture。

禁止先实现 macOS/Windows Adapter，再回头补契约。

## 8. 当前阻塞、风险和 Known Issues

### 阻塞

当前没有设计阻塞。

### 风险

- PR #2 当前 GitHub 报告 `mergeable=false`，但本阶段不执行 merge；
- Windows 尚无 `.codex-theme` 统一 importer；
- legacy Runtime 输出是人类文本，需要 Adapter 归一化；
- macOS 使用 Codex 内置 Node、Windows 使用 PATH Node，不能作为最终分发模型；
- operation lock 当前两平台语义不一致；
- Desktop Shell 尚未选型；
- managed Runtime 的 sidecar/Node/单文件形态需要 Spike；
- 双平台签名、安装、升级和实机条件尚未验证；
- Codex 更新可能改变 DOM、CDP 或原生控件结构。

### 恢复原则

- 当前实现仍以已有 Verify、Doctor 和 Restore 为主要恢复入口；
- 自动化测试必须使用隔离 state root；
- 不允许测试写入真实用户主题库、配置或 Codex 状态；
- 写事务实现后，rollback 失败必须进入 `recoveryRequired` 并阻止后续写操作。

## 9. 测试、实机和回滚状态

```yaml
designReview: complete
runtimeApiContractTests: not-implemented
importerAutomatedRegression: not-implemented
macosAdapterTests: not-implemented
windowsAdapterTests: not-implemented
operationLockFailureInjection: not-implemented
managedRuntimeUpgradeRollback: not-implemented
desktopShellSpike: not-started
verticalSlice: not-started
macosRealDeviceMatrix: not-started
windowsRealDeviceMatrix: not-started
releaseRollbackEvidence: not-started
```

`DS-FND-001` 是设计 Work Item，因此自动测试和实机证据不适用；这不能替代 Phase 00 实现后的 Definition of Done。

## 10. 必读文档顺序

新会话按以下顺序读取：

1. `.handoff/current.md`；
2. `.handoff/phases/phase00/current.md`；
3. `docs/studio/work-register.md`；
4. `docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`；
5. `docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md`；
6. `docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md`；
7. `docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md`；
8. `docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md`；
9. `docs/studio/phases/phase-00-foundation-and-shell-spike/adr/README.md`；
10. `docs/studio/upstream/upstream-baseline.md`；
11. `docs/studio/upstream/upstream-adoption-log.md`；
12. 本历史快照仅用于追溯，不作为动态状态入口。

## 11. 禁止提前进行

- 不自动 merge/rebase `main`；
- 不开始正式 Theme Manager 大规模 UI；
- 不凭偏好确定 Tauri 2 或 Electron；
- 不让 UI 拼接或执行任意 Shell/PowerShell；
- 不让 UI 直接连接 CDP；
- 不绕过 operation lock 和 transaction journal；
- 不依赖源码 checkout 或用户 PATH 作为正式 Runtime；
- 不把 Planned UPA 写成 Adopted；
- 不把 `Ready` 写成已实现、已测试或已实机交付；
- 不在测试中修改真实用户状态。

## 12. 下一项可执行工作

```text
DS-QA-001
建立 importer fixture、隔离测试 state root，并实现自动化回归。
```

边界清晰时可并行：

```text
DS-FND-002
落地 Runtime API v1 JSON Schema、reference host 和 Contract Runner。
```

## 13. 新会话启动 Prompt

```text
请读取 feat/codex-theme-import-mvp 分支下的 .handoff/current.md，并按其中顺序恢复项目上下文。

先确认当前分支真实 HEAD、PR #2 状态、main 当前 SHA 和 upstream cursor。不要自动 merge/rebase main；若 main 超过 dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c，先续接 Review。

Phase 00 已达到 Ready，DS-FND-001 已 Done，但功能实现尚未开始。接下来执行 DS-QA-001：建立 .codex-theme importer 自动化回归。测试必须使用隔离 state root，并走 --no-apply，不操作真实 Codex 或用户主题。

边界清晰时可并行执行 DS-FND-002：落地 Runtime JSON API v1 Schema、reference Runtime Host 和 Contract Runner。不要先写平台 Adapter，再回头补契约；不要提前进行 Theme Manager 大规模 UI 或 Desktop Shell 最终选型。
```

## 14. 交接 Checklist

- [x] 当前分支和 HEAD 已记录；
- [x] PR 状态和 mergeability 已确认；
- [x] 当前 Phase、状态和 Work Item 已记录；
- [x] 最近一次 `main` Review 和游标已记录；
- [x] 相关 UPR、UPA 和 ADR 已记录；
- [x] 已完成设计项有仓库提交和文档证据；
- [x] 未实现能力没有写成 Done；
- [x] Known Issues、风险和恢复原则已记录；
- [x] 测试、实机和回滚状态已记录；
- [x] 下一步是单一、可执行的 Work Item；
- [x] 新会话 Prompt 已更新；
- [ ] Phase `current.md` 更新为指向本快照；
- [ ] 根 `.handoff/current.md` 最后更新。
