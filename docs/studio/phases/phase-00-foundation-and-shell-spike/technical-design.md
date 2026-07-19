# Phase 00 技术设计

## 1. 设计目标

本设计把现有 macOS Shell/Node 与 Windows PowerShell/Node Runtime 封装成稳定执行面，使 Studio、SwiftBar、Tray 和 CLI 共享：

- Runtime JSON API v1；
- 跨平台 operation 语义；
- 稳定错误模型；
- 跨入口锁；
- transaction journal；
- 受管 Runtime 生命周期；
- 可测试、可升级、可回滚的桌面集成边界。

本阶段不重写 Injector/Renderer，不实现 Theme Compiler。

## 2. 当前实现事实

### 2.1 macOS

- 安装引擎：`~/.codex/codex-dream-skin-studio`；
- 状态根：`~/Library/Application Support/CodexDreamSkinStudio`；
- active theme：`STATE_ROOT/theme`；
- saved themes：`STATE_ROOT/themes`；
- importer 先 ZIP 预检、解压、payload 校验，再以目录 move 替换；
- switch 通过 `stage-theme.mjs` 创建稳定快照，校验后先发布图片、最后发布 `theme.json`；
- Runtime 校验官方 Codex 签名、Team ID、架构、内置 Node、CDP 监听归属和 Injector PID 身份；
- 输出以人类文本为主，失败通常退出 1；
- importer/switch 尚无统一 operation lock。

### 2.2 Windows

- 状态根：`%LOCALAPPDATA%\CodexDreamSkin`；
- active theme：`active-theme`；
- saved themes：`themes`；
- `Local\CodexDreamSkin.<SID>.Operation` Mutex 已覆盖部分 install/start/restore/verify；
- 路径 containment、reparse point、防止任意进程/端口和 Appx 身份校验已存在；
- 当前 Node 从 PATH 解析，要求 22+；
- 主题写入具有临时文件和原子 JSON 写基础，但没有统一 journal。

### 2.3 设计结论

- 统一的是 API、状态、错误、锁和事务语义；
- 平台脚本继续复用，但只能位于 Adapter 后；
- 现有局部原子发布保留并纳入统一事务；
- UI 永远不解析 legacy 人类输出；
- Windows Mutex 可保留为快速本地 guard，持久锁目录和 journal 才是跨平台事实。

## 3. 目标模块图

```text
┌─────────────────────────────────────────────────────────┐
│ Desktop Shell / SwiftBar / Tray / CLI                  │
└───────────────────────┬─────────────────────────────────┘
                        │ Runtime JSON API v1
                        ▼
┌─────────────────────────────────────────────────────────┐
│ App Core                                                │
│ - request validation                                    │
│ - capability gating                                     │
│ - result/action mapping                                 │
│ - no platform commands                                  │
└───────────────────────┬─────────────────────────────────┘
                        │ typed operation
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Runtime Host                                            │
│ - JSON process boundary                                 │
│ - operation lock                                        │
│ - transaction coordinator                               │
│ - journal / recovery                                    │
│ - logging / redaction                                   │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
                ▼                          ▼
┌─────────────────────────┐  ┌────────────────────────────┐
│ macOS Platform Adapter  │  │ Windows Platform Adapter   │
│ Shell + managed Node    │  │ PowerShell + managed Node  │
└───────────────┬─────────┘  └──────────────┬─────────────┘
                │                            │
                └──────────────┬─────────────┘
                               ▼
┌─────────────────────────────────────────────────────────┐
│ Existing Runtime / Injector / Renderer / Official Codex │
└─────────────────────────────────────────────────────────┘
```

## 4. Runtime 进程边界

### 4.1 Phase 00 调用模型

采用“一次请求、一个子进程、一个响应”的模型：

1. 调用方启动受管 Runtime entrypoint；
2. 通过 stdin 写入一个 UTF-8 JSON request；
3. Runtime 执行一个 operation；
4. stdout 仅写入一个 UTF-8 JSON response；
5. stderr 写诊断日志；
6. 进程退出并返回稳定类别退出码。

理由：

- 避免 Phase 00 引入长期后台 daemon 生命周期；
- 子进程崩溃边界清晰；
- 易于 Contract Test 和故障注入；
- 文件路径不通过拼接命令参数传入；
- 后续可在不改变 API envelope 的情况下演进为长驻 host。

### 4.2 禁止项

- UI 拼接 `bash -c`、`powershell -Command`；
- 将 JSON 放入未转义命令行；
- stdout 混入 progress、banner、warning；
- 根据 stderr 文本决定业务成功；
- Runtime 接受任意 command/script 字段；
- 调用方直接传入任意 destination path。

## 5. Runtime Host 内部边界

### 5.1 Request Router

职责：

- 严格解析 JSON；
- 验证 `apiVersion/operation/requestId/input/options`；
- 拒绝未知 operation；
- 将未知 input 字段记录 warning 或按 operation schema 拒绝；
- 生成 operationId；
- 根据 operation metadata 决定是否需要锁和 journal。

### 5.2 Capability Service

聚合：

- 平台和架构；
- Adapter 版本；
- Codex 安装和身份能力；
- Runtime payload 版本；
- operation 支持；
- legacy backend；
- 重启、通知、文件选择等可选能力。

### 5.3 Theme Repository Adapter

Phase 00 只提供只读枚举和按 ID 重新解析：

- 列出主题目录；
- 标记 legacy/imported/bundled/custom；
- 单主题失败隔离；
- 生成 snapshot revision；
- 不使用数据库作为事实来源。

### 5.4 Transaction Coordinator

负责：

- lock；
- journal；
- stage；
- backup；
- publish；
- verify；
- commit；
- cleanup；
- rollback；
- crash recovery。

Platform Adapter 不允许自行绕过 coordinator 修改受管资源。

### 5.5 Platform Adapter

统一接口示意：

```text
probeCapabilities()
readStatus()
listThemes()
validatePackage(path)
importTheme(plan)
loadThemeById(id)
applyTheme(plan)
verify(context)
restore(plan)
installRuntime(plan)
```

每个 Adapter 返回 typed internal result，不返回供 UI 解析的字符串。

## 6. operation 分类

| Operation | 只读 | 需要写锁 | Journal | 可要求重启 |
| --- | --- | --- | --- | --- |
| `capabilities` | 是 | 否 | 否 | 否 |
| `status` | 是 | 否 | 否 | 否 |
| `listThemes` | 是 | 否 | 否 | 否 |
| `importTheme` | 否 | 是 | 是 | 可选 Apply 时是 |
| `applyTheme` | 否 | 是 | 是 | 是 |
| `verify` | 逻辑只读 | inspection guard | 否 | 否 |
| `restore` | 否 | 是 | 是 | 可能 |
| `installRuntime`（内部） | 否 | 是 | 是 | 否 |

`status/listThemes` 在写操作期间允许读取原子状态和 journal，但必须返回 `busy`，不得读取半发布目录。

## 7. 跨入口 operation lock

### 7.1 锁位置

规范路径：

```text
STATE_ROOT/locks/operation.lock/
└── owner.json
```

通过原子创建目录获取锁。Windows 可先获取 named Mutex，再创建持久锁目录；macOS 可使用目录锁或同等原子文件系统原语。

### 7.2 owner.json

包含：

- `lockSchemaVersion`；
- `operationId`；
- `requestId`；
- `operation`；
- `entrypoint`；
- `pid`；
- `processStartedAt`；
- `runtimeExecutable`；
- `runtimeVersion`；
- `userIdentityHash`；
- `createdAt`；
- `heartbeatAt`（可选）。

不写原始用户名、项目路径或包路径。

### 7.3 获取策略

- 默认 non-blocking；
- 已占用返回 `OPERATION_BUSY`；
- UI 可在用户明确重试时再次请求；
- updater 与 restore 使用同一锁；
- 不提供普通用户“强制删除锁”。

### 7.4 stale 判断

锁超时不能单独证明 stale。按顺序验证：

1. owner.json 是否存在且可解析；
2. PID 是否存活；
3. process start time 是否一致，防 PID reuse；
4. executable 是否匹配受管 Runtime；
5. operation journal 是否处于 terminal state；
6. 空锁目录超过 30 秒且无 owner/journal，可作为创建中崩溃处理；
7. 身份不匹配的存活进程视为可疑冲突，不自动删除。

确认 stale 后：

- 原子重命名到 `locks/stale/<timestamp>-<operationId>`；
- 写 recovery event；
- 不直接 `rm -rf` 丢失证据；
- 检查关联 journal 后决定恢复。

### 7.5 心跳

Phase 00 可每 2 秒更新 `heartbeatAt`；心跳只用于诊断和用户提示，不作为唯一 stale 依据。

## 8. Transaction Journal

### 8.1 目录

```text
STATE_ROOT/transactions/<operationId>/
├── journal.json
├── request.json.redacted
├── stage/
├── backup/
└── logs/
```

当前指针：

```text
STATE_ROOT/transactions/current.json
```

`current.json` 通过临时文件 + rename 原子更新。

### 8.2 状态机

```text
created
  ↓
locked
  ↓
detected
  ↓
staged
  ↓
validated
  ↓
backedUp
  ↓
published
  ↓
verified
  ↓
committed
  ↓
cleanupPending
  ↓
completed
```

失败分支：

```text
before committed → restoring → restored | rollbackFailed
committed + cleanup fail → cleanupPending + warning
```

### 8.3 提交语义

- `committed=false`：失败必须恢复旧状态；
- `committed=true`：新状态是事实来源；后续 cleanup 失败不得把业务结果改为失败；
- `verified=true` 才能对 Apply 返回完全成功；
- Import 可在 `installed=true`、`applied=false` 时返回部分成功；
- rollback 结果必须进入 response。

### 8.4 crash recovery

启动 `status` 时：

1. 扫描 `current.json`；
2. 验证 journal；
3. 判断 owner 是否存活；
4. terminal journal → 清 current pointer；
5. pre-commit 非 terminal → 自动恢复候选；
6. post-commit cleanupPending → 保留新状态并安排清理；
7. journal 损坏或 rollbackFailed → `recoveryRequired`。

自动恢复只能在证据充分时执行；否则提示紧急 Restore。

## 9. 各 operation 事务设计

## 9.1 importTheme

```text
Detect package
→ Lock
→ Preflight ZIP
→ Extract to transaction stage
→ Validate files/schema/image/payload
→ Resolve conflict policy
→ Backup existing theme directory
→ Publish destination directory
→ Verify repository readback
→ Commit installed state
→ Optional applyTheme child plan
→ Cleanup
```

要求：

- 包路径只作为 source，不允许决定 destination；
- theme ID 经过 schema 校验后映射到 `themes/<id>`；
- replace 使用 same-volume rename；
- keepBoth 若实现，由 Runtime 生成新 ID，不信任包提供任意路径；
- Apply 失败不撤销已明确提交的 Import，除非请求 `atomicImportAndApply=true`，Phase 00 默认 false；
- response 分别返回 `installed/applied/verified`。

## 9.2 applyTheme

```text
Resolve theme by ID
→ Lock
→ Snapshot source with no-follow semantics
→ Validate staged snapshot
→ Backup active theme
→ Publish image/files
→ Publish theme.json commit marker
→ Hot apply
→ If restart required: stop before publish or request authorization
→ Verify
→ Commit
→ Cleanup old active files
```

关键约束：

- 完整 restart 授权应在进入不可逆 publish 前获得；
- 使用 legacy hot path 时也必须在 coordinator 内；
- Verify 失败自动恢复 active backup，并重新 Verify previous state；
- rollback 失败进入 `recoveryRequired`；
- active theme 目录跨平台名称可以不同，Adapter 对外隐藏。

## 9.3 verify

- 读取稳定 state snapshot；
- 若写锁存在，返回 `OPERATION_BUSY`，不与 publish 竞争；
- 校验 Codex identity、loopback CDP、Injector identity、renderer marker、active payload；
- 输出分项 result；
- 不自动修改状态。

## 9.4 restore

```text
Lock
→ Detect managed/legacy state
→ Backup diagnostic evidence
→ Stop verified injector/runtime only
→ Restore config bytes / launch identity
→ Remove or disable active injection state
→ Start official Codex when policy requires
→ Verify official state
→ Commit restore
→ Cleanup
```

紧急 Restore entrypoint 使用最小依赖，并复用相同 journal schema。

## 10. 状态目录规范化

Phase 00 不强制立即迁移现有 active 目录名称，但定义逻辑结构：

```text
STATE_ROOT/
├── state.json
├── themes/
├── active/                 # 逻辑名称；Adapter 映射到现有 theme/active-theme
├── images/
├── locks/
├── transactions/
├── runtime/
├── logs/
└── diagnostics/
```

迁移原则：

- 现有用户目录不做启动时隐式破坏性重命名；
- Adapter 提供 logical path mapping；
- 新目录按 0700/用户 ACL 创建；
- 文件按 0600/用户 ACL；
- 路径必须在 state root 内且拒绝 link/reparse。

## 11. managed runtime

### 11.1 目标布局

```text
STATE_ROOT/runtime/
├── current.json
├── previous.json
├── versions/
│   └── <runtimeVersion>/
│       ├── runtime-manifest.json
│       ├── bin/
│       ├── scripts/
│       ├── assets/
│       └── hashes.json
├── staging/
└── rollback/
```

不用 symlink/junction 作为 current 指针；`current.json` 保存版本和相对目录，并原子更新。

### 11.2 payload manifest

至少包含：

- runtimeVersion；
- apiMin/apiMax；
- platform/arch；
- entrypoint；
- files + SHA-256；
- build commit；
- signing metadata；
- minimum OS；
- legacy backend compatibility。

### 11.3 安装/升级

```text
Verify app-bundled payload
→ Lock
→ Stage version directory
→ Reject links/special files
→ Verify hash and platform
→ Run self-check
→ Publish version directory
→ Backup current pointer
→ Switch current.json
→ Run capabilities/status smoke test
→ Commit
→ Keep previous version
→ Cleanup older versions
```

失败：

- current 切换前失败：删除 staging；
- current 切换后 smoke test 失败：恢复 previous pointer；
- cleanup 失败：warning；
- previous 不可用：标记 `recoveryRequired`，保留 legacy recovery tool。

### 11.4 Node 策略

最终 Runtime 不依赖用户 PATH。

Spike 比较：

1. 打包受支持 Node LTS + JS scripts；
2. 将 Runtime Host 编译为单文件 sidecar，legacy scripts 作为资源；
3. Tauri/Rust Host 调用平台脚本；
4. Electron 主进程提供 Node，但仍把平台操作隔离到受管 adapter。

macOS 当前 Codex 内置 Node和 Windows PATH Node只作为 legacy compatibility backend，不作为发布架构承诺。

## 12. Desktop Shell Spike

### 12.1 候选

- Tauri 2 + React/TypeScript；
- Electron + React/TypeScript；
- macOS SwiftUI + Windows WinUI/WPF 双原生。

### 12.2 必做实验

每个候选必须产生可运行 artifact：

- macOS arm64/x64 目标策略；
- Windows x64；
- Runtime stdin/stdout JSON；
- stderr 捕获和大日志不死锁；
- 文件选择、拖拽；
- 本地图片缩略图；
- operation progress 轮询；
- sidecar 路径不能被用户输入替换；
- 安装后脱离源码目录运行；
- 签名、公证/安装器；
- updater staging 与 rollback；
- 键盘、屏幕阅读器、缩放；
- crash log 和诊断包。

### 12.3 评分

| 维度 | 权重 |
| --- | ---: |
| 安全进程边界与任意命令防护 | 20 |
| sidecar/签名/公证/安装器 | 20 |
| 自动更新与降级 | 15 |
| macOS/Windows 语义一致 | 15 |
| CI、测试和可调试性 | 10 |
| 包体、启动和内存 | 10 |
| 可访问性与系统集成 | 5 |
| 团队维护复杂度 | 5 |

硬淘汰条件：

- 无法安全绑定受管 Runtime；
- 安装后依赖源码或 PATH；
- updater 无法定义 rollback；
- 无法满足双平台签名；
- 需要开放任意 shell command；
- 一个候选只在单平台完成演示。

总分不替代硬条件。ADR-0004 只有在证据归档后才能 Accepted。

## 13. Vertical Slice

### 13.1 最小功能

- App 启动；
- capabilities/status；
- listThemes；
- 选择主题；
- applyTheme；
- verify；
- restore；
- Operation Drawer；
- diagnostics copy。

### 13.2 不包含

- 正式搜索/筛选；
- Editor；
- Compiler Preview；
- Marketplace；
- 自动主题修复。

### 13.3 端到端时序

```text
UI        App Core       Runtime Host      Adapter       Codex
│            │                │               │            │
│ open       │                │               │            │
│───────────>│ capabilities   │               │            │
│            │───────────────>│ probe         │            │
│            │                │──────────────>│            │
│            │<───────────────│ JSON result   │            │
│ status/listThemes           │               │            │
│───────────>│───────────────>│──────────────>│            │
│ select/apply                │ lock+journal  │            │
│───────────>│───────────────>│──────────────>│ publish    │
│            │                │               │───────────>│
│            │                │               │ verify     │
│            │<───────────────│ structured result          │
│<───────────│ render state   │               │            │
```

## 14. 日志和诊断

### 14.1 日志层级

- Runtime JSON response：业务结果；
- stderr：当前调用诊断；
- rotating log file：长期诊断；
- transaction journal：恢复事实；
- acceptance evidence：人工/自动测试证据。

### 14.2 关联 ID

所有日志带：

- requestId；
- operationId（写操作）；
- runtimeVersion；
- adapterVersion；
- platform；
- error code。

### 14.3 脱敏

默认隐藏：

- 用户 home；
- 主题包绝对路径；
- 项目路径；
- Codex 对话/页面内容；
- 环境变量；
- 用户名和 SID 原文。

诊断包使用稳定 placeholder，如 `$HOME`、`$STATE_ROOT`。

## 15. 版本兼容

- API：整数 major `apiVersion=1`；
- Runtime response 带 `runtimeVersion/adapterVersion`；
- App 声明 `supportedApiMin/Max`；
- API major 不兼容立即失败；
- 同 major 新字段客户端忽略；
- operation capability 控制可用性；
- journal schema 单独版本化；
- managed runtime manifest 明确可服务 App 版本范围。

## 16. 上游影响

```yaml
upstreamReviewId: UPR-20260719-001
reviewedRange: 19fa0342846219fb0476bfd648aa7f0f0019bb0b..dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
relevantActions:
  - id: UPA-002
    decision: adapt
    reason: Foundation CI 增加 Import/Adapter/双平台 Contract
  - id: UPA-003
    decision: rewrite
    reason: 形成跨平台 versioned managed runtime
  - id: UPA-004
    decision: adopt
    reason: stderr 与真实退出码是 Runtime API 硬要求
  - id: UPA-005
    decision: adapt
    reason: Windows 保留配置字节和 Appx 身份
  - id: UPA-006
    decision: adopt
    reason: 统一提交前回滚与提交后 cleanup warning
  - id: UPA-012
    decision: adapt
    reason: macOS 生命周期与多入口状态进入 Adapter/Contract
  - id: UPA-013
    decision: defer
    reason: 预设集合变化由 Phase 01 Repository 处理
notAdopted:
  - 不自动 merge/rebase main
  - 不直接复制人类文本输出和平台入口耦合
```

## 17. 实施顺序

```text
DS-QA-001 Importer regression fixtures
  ↓
DS-FND-002 API schema + reference contract runner
  ↓
DS-FND-005 lock + journal primitives
  ↓
DS-FND-003 macOS Adapter
DS-FND-004 Windows Adapter
  ↓
DS-FND-006 managed runtime installer
  ↓
DS-FND-007 shell candidates
  ↓
DS-FND-008 shell ADR
  ↓
DS-TM-001/002 Vertical Slice
  ↓
DS-QA-003/004 real-device verification
```

`DS-QA-002` CI 从第一批 fixture 开始持续演进，不等所有实现完成后一次补齐。
