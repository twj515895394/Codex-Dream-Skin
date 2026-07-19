# Phase 00 测试与验收计划

## 1. 质量目标

Phase 00 的测试目标不是证明某个平台“能跑一次”，而是证明：

- Runtime JSON API 在 macOS/Windows 具有同一语义；
- importer、Apply、Restore 的安全边界可自动回归；
- 锁、事务和失败恢复经过故障注入；
- Desktop Shell 安装后脱离源码和 PATH 运行；
- 签名、安装、升级、降级、CDP 和原生控件经过实机验证；
- 现有 SwiftBar、Tray、CLI 主流程无回退。

## 2. 测试分层

```text
Static / Schema
    ↓
Unit
    ↓
Runtime Contract
    ↓
Platform Integration
    ↓
Desktop Shell E2E
    ↓
Real-device / Signing / Recovery
```

任何上层通过都不能替代下层安全断言；模拟测试不能替代涉及签名、安装、CDP 和恢复的实机。

## 3. 测试环境和 fixture 原则

### 3.1 隔离 state root

所有自动测试必须支持覆盖 `STATE_ROOT` 到临时目录，不接触真实用户主题、配置或 Codex 状态。

### 3.2 可替换平台依赖

Contract 测试使用 reference/fake adapter 验证 API；平台集成测试再调用真实 Shell/PowerShell 和 Node helper。

### 3.3 fixture 可审计

```text
tests/fixtures/
├── themes/
├── packages/
├── runtime-manifests/
├── journals/
├── states/
└── platform/
```

恶意 ZIP fixture 应通过生成脚本产生，避免仓库工具自动解压。生成器本身需要单元测试。

## 4. 静态检查

### 4.1 通用

- JSON/Markdown 格式；
- `.editorconfig`、`.gitattributes`；
- 二进制资产声明；
- shell line endings；
- secrets scan；
- dependency/license inventory；
- Runtime manifest 与文件 hash 一致。

### 4.2 macOS

- `bash -n`；
- ShellCheck（允许明确注释的例外）；
- Node `--check`；
- 禁止 UI/Adapter 中 `bash -c`；
- 固定 `/usr/bin`/`/bin` 工具路径审查；
- plist、entitlements 和签名配置检查。

### 4.3 Windows

- Windows PowerShell 5.1 parse；
- PowerShell 7 parse；
- UTF-8/BOM/CRLF 规则；
- PSScriptAnalyzer；
- 禁止 `Invoke-Expression` 和任意 `-Command`；
- installer/manifest/签名配置检查。

### 4.4 Desktop Shell

- TypeScript typecheck；
- lint；
- dependency audit；
- Tauri capability/Electron security config 静态断言；
- 禁止远程 URL、任意 shell、宽 filesystem scope。

## 5. Unit Test

### 5.1 Request/Response

- 合法/非法 JSON；
- 1 MiB request limit；
- apiVersion；
- unknown operation；
- unknown input fields；
- requestId 边界；
- stdout 单 JSON；
- error envelope 不变量；
- exit code/category 映射；
- unknown response enum 的客户端退化。

### 5.2 Theme Repository

- ready v1 theme；
- 无 manifest legacy theme；
- 无 preview；
- theme.json 无效；
- 图片缺失；
- 重复 ID；
- 目录名与 ID 不一致；
- 单个坏主题不影响其他列表；
- snapshot revision 稳定和变化；
- 外部修改后 `THEME_CHANGED`。

### 5.3 Package Safety

- 扩展名错误；
- 空包；
- >64 MiB；
- unreadable ZIP；
- 空 ZIP；
- absolute path；
- `../` 各变体；
- Windows drive/UNC；
- 反斜杠和混合分隔符；
- duplicate entries；
- symlink；
- junction/reparse fixture；
- FIFO/device/special file；
- `.sh/.command/.js/.mjs/.exe/.dll/.dylib/.so/.app/.pkg`；
- executable permission bit；
- package root wrapper 目录；
- 多个 root 目录；
- manifest/theme 缺失；
- ID 控制字符、Unicode、>80；
- manifest/theme ID 不一致；
- image/preview 子目录或 absolute path；
- JSON >1 MiB；
- entry count >256；
- extracted bytes >128 MiB；
- 压缩比异常；
- 图片 >16 MiB、>16384px、>50MP、格式伪装。

### 5.4 Lock

- 首次获取；
- 第二进程冲突；
- owner 写入中崩溃；
- PID 不存在；
- PID reuse/start time 不同；
- executable 不同；
- heartbeat 过期但进程有效；
- journal terminal；
- journal non-terminal；
- stale 归档；
- 身份可疑时拒绝自动删除；
- Windows Mutex abandoned；
- Studio/CLI/Tray/SwiftBar 同一锁。

### 5.5 Transaction

每个 phase 注入失败：

- created；
- locked；
- detected；
- staged；
- validated；
- backedUp；
- published before marker；
- marker written；
- verify；
- committed；
- cleanup。

断言：

- commit 前恢复旧状态；
- committed 后 cleanup 失败保留新状态 + warning；
- rollback 失败进入 recoveryRequired；
- journal 原子且可解析；
- current pointer 正确清除或保留；
- restart 后 recovery 决策一致。

### 5.6 Runtime Manifest

- path traversal；
- missing/extra file；
- hash mismatch；
- platform/arch mismatch；
- API range mismatch；
- entrypoint 不存在；
- link/special file；
- current/previous pointer；
- downgrade；
- smoke test 失败回退；
- cleanup old version warning。

### 5.7 Redaction

输入包含：

- home；
- 用户名/SID；
- 中文/空格/引号路径；
- 项目名；
- token 形态环境变量；
- Codex 页面文字。

断言 response、journal、普通诊断摘要均不泄露；原始敏感信息不被默认日志记录。

## 6. Runtime Contract Test

同一套 tests 运行：

1. reference adapter；
2. macOS adapter；
3. Windows PowerShell 5.1 adapter；
4. Windows PowerShell 7 adapter。

核心集合：

| Contract | 断言 |
| --- | --- |
| `capabilities` | API/operation/limit/platform 字段 |
| `status-ready` | Runtime/Codex/Skin enums |
| `status-busy` | operation summary，不读半发布状态 |
| `status-recovery` | journal 映射和阻断 |
| `listThemes` | 单坏主题隔离、revision |
| `import-valid` | installed=true |
| `import-conflict` | reject/replace 语义 |
| `import-unsafe` | 稳定 error code |
| `import-partial` | installed 与 applied 分开 |
| `apply-hot` | applied/verified/usedHotPath |
| `apply-restart-required` | publish 前返回授权动作 |
| `apply-rollback` | verify fail + previous restored |
| `apply-rollback-fail` | recoveryRequired |
| `verify` | 分项 checks |
| `restore-normal` | official state verified |
| `restore-emergency` | 最小依赖和 partial 语义 |
| `stdout` | 仅一个 JSON object |
| `stderr` | 诊断不污染 stdout |
| `exit-code` | 与 category 映射 |
| `forward-compat` | unknown response fields ignored |

Golden JSON 只锁定契约字段，不锁定本地化 message 全文。

## 7. macOS 集成测试

### 7.1 importer

- 复用当前 `import-theme-macos.sh` 真实 helper；
- `--no-apply` 避免真实 Codex；
- 临时 state root；
- 正常包、replace、失败恢复；
- importer metadata 控制字符；
- stage/theme image TOCTOU；
- cleanup；
- legacy human output 只在 Adapter 内消化。

### 7.2 switch/apply

- stable descriptor snapshot；
- staged payload validation；
- `theme.json` commit marker 最后发布；
- hot path 成功；
- hot path 失败后 restart-required；
- 未授权不强制关闭 Codex；
- verify failure restore active backup；
- lock 与 SwiftBar 模拟入口冲突。

### 7.3 Runtime identity

- bundle ID；
- Team ID；
- Node signer；
- architecture；
- minimum version；
- CDP listener 非 Codex；
- Injector PID/start time/path/port；
- stale state 不 signal 活跃其他进程。

## 8. Windows 集成测试

### 8.1 PowerShell 矩阵

- Windows PowerShell 5.1；
- PowerShell 7 latest supported；
- 特殊字符、中文、空格路径；
- stderr 和 `$LASTEXITCODE` 保真；
- JSON 无 BOM/无额外输出。

### 8.2 主题和路径

- state root ACL；
- active/saved/images；
- reparse components；
- same-directory atomic write；
- config byte-for-byte backup/restore；
- Appx package identity；
- registered package changes；
- Mutex + persistent lock。

### 8.3 managed runtime

- installer stage/hash/publish；
- current/previous；
- 源码目录删除后仍运行；
- PATH 移除 Node 后仍运行；
- upgrade/downgrade；
- signed entrypoint；
- failed smoke test rollback。

## 9. Desktop Shell E2E

每个候选框架运行同一场景：

1. clean install；
2. first launch；
3. capabilities/status；
4. empty/listThemes；
5. select and Apply；
6. restart-required confirmation；
7. Verify；
8. operation busy；
9. recoveryRequired；
10. Restore；
11. close/reopen；
12. upgrade；
13. downgrade；
14. uninstall App but keep data；
15. emergency Restore without normal UI。

自动断言：

- 无任意 command UI；
- sidecar 固定路径；
- stdout/stderr 不死锁；
- crash 不丢 journal；
- keyboard navigation；
- 200% scaling；
- warning/error 不只靠颜色。

## 10. CI 设计

### 10.1 Pull Request 快速矩阵

- docs/schema lint；
- Linux portable Node tests（纯 JS helpers）；
- macOS latest：shell/static + Node + importer fixture；
- Windows latest PS 5.1：parse/static/unit/contract；
- Windows latest PS 7：unit/contract；
- App Core typecheck/unit；
- Desktop Shell security config checks。

### 10.2 main/nightly 矩阵

- 完整 package safety；
- failure injection；
- managed runtime install/upgrade/downgrade；
- Desktop E2E；
- artifact build；
- SBOM/license；
- artifact hash；
- retained logs on failure。

### 10.3 release 候选

- signed macOS artifact + notarization；
- signed Windows installer；
- clean VM install；
- previous Alpha upgrade；
- downgrade；
- emergency Restore artifact；
- checksum and manifest publication。

CI 模拟的 code signing 不能替代最终真实证书实机验证。

## 11. 双平台实机矩阵

### 11.1 macOS

至少：

| 维度 | 最小集合 |
| --- | --- |
| 架构 | Apple Silicon；Intel 若仍支持则实机或明确 Known Issue |
| OS | 当前支持最低版本；当前稳定版本 |
| Codex | 当前正式版本；一次升级后的版本 |
| 状态 | clean install；existing legacy install；damaged state |
| 操作 | list/import/apply/restart/verify/restore |
| 分发 | signed app；notarized；源码目录不存在 |
| 恢复 | crash after publish；rollback；emergency restore |

### 11.2 Windows

至少：

| 维度 | 最小集合 |
| --- | --- |
| OS | Windows 10 supported；Windows 11 current |
| Shell | PS 5.1；PS 7 |
| Codex | Store current；一次包升级 |
| 状态 | clean；legacy；damaged journal；reparse attempt |
| 操作 | list/import（若 Phase 00 Windows 实现）/apply/verify/restore |
| 分发 | signed installer；PATH 无 Node；源码目录不存在 |
| 恢复 | updater interruption；rollback；emergency restore |

## 12. 实机验收步骤

每次记录：

- test ID；
- 日期；
- commit/artifact hash；
- platform/OS/arch；
- Codex version；
- Runtime/App version；
- theme ID/revision；
- expected/actual；
- requestId/operationId；
- screenshot；
- Verify result；
- Restore result；
- Known Issue。

### 核心场景 A · Clean Vertical Slice

```text
Install Studio
→ Launch without source checkout
→ Status ready/degraded explained
→ List themes
→ Apply a valid theme
→ Verify pass
→ Restore official appearance
```

### 核心场景 B · Conflict

```text
Start Apply from Studio
→ Start Apply from SwiftBar/Tray/CLI
→ second entry receives OPERATION_BUSY
→ first completes
→ status converges
```

### 核心场景 C · Verify failure

```text
Inject controlled verify failure
→ new active theme publish attempted
→ previous snapshot restored
→ response VERIFY_FAILED_ROLLED_BACK
→ previous theme verifies
```

### 核心场景 D · Crash recovery

```text
Terminate Runtime after publish before commit
→ restart Studio
→ status detects journal
→ recover/restore
→ no half theme remains
```

### 核心场景 E · Runtime upgrade rollback

```text
Install vN
→ stage vN+1 with controlled smoke failure
→ current pointer returns to vN
→ vN still runs
→ warning/evidence retained
```

### 核心场景 F · Official controls

- macOS/Windows Header、侧面板、输入框和原生菜单可见；
- 鼠标点击和键盘焦点正常；
- light/dark 基础截图；
- Theme CSS 装饰层不阻挡 pointer events。

## 13. Desktop Shell 评分证据

每个候选在 `acceptance/shell-spike/<candidate>/` 保存：

- build instructions；
- artifact size；
- cold/warm start；
- idle memory；
- sidecar design；
- security config；
- signing/install evidence；
- updater/rollback evidence；
- macOS/Windows screenshots；
- accessibility notes；
- scorecard；
- blockers/known issues。

没有双平台 artifact 的候选不能进入最终评分。

## 14. 通过标准

### Work Item Ready

- test cases 和 fixtures 列表评审；
- 可注入失败点；
- 临时 state root；
- 平台依赖可替换；
- 验收设备/证书可用或阻塞已登记。

### Phase Verification

- 所有 P0 自动测试通过；
- Contract 核心集合 macOS/Windows 通过；
- 无未说明 stdout 污染；
- 锁和事务 failure injection 通过；
- signed artifacts 实机通过；
- Vertical Slice 两平台完成；
- Restore 两平台通过；
- Shell ADR Accepted；
- Known Issues 无 P0 安全/数据损坏问题。

### Phase Done

除 Verification 外，还需：

- Work Register、Changelog、用户文档更新；
- acceptance 证据提交；
- 上游采用状态更新；
- rollback 演练记录；
- release/rollback owner 明确。

## 15. 阻断级别

| 级别 | 示例 | 处理 |
| --- | --- | --- |
| P0 | 任意命令执行、主题逃逸、signal 错进程、rollback 破坏用户状态 | 阻断 Phase |
| P1 | API 语义跨平台不一致、安装后依赖 PATH、Restore 失败 | 阻断 Verification |
| P2 | 非关键 warning、cleanup 残留、性能未达目标 | 可带 Known Issue |
| P3 | 文案、非核心视觉、可选平台集成 | 后续修复 |

任何 P0/P1 未关闭不得将 Phase 标记 Done。
