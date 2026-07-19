# Phase 00 安全与隐私设计

## 1. 安全目标

Phase 00 必须保证：

1. 主题包永远是纯数据，不能变成代码执行载体；
2. Studio UI 无任意命令执行能力；
3. 只控制经过身份验证的官方 Codex、Runtime 和 Injector；
4. 所有受管写入限制在用户级 state/runtime 根目录；
5. 写操作可追踪、可恢复，锁和 journal 不被弱 stale 判断破坏；
6. 默认无网络、无账号、无遥测；
7. 日志和诊断不会泄露对话、项目路径、用户名或敏感环境变量。

## 2. 信任边界

```text
Untrusted local files (.codex-theme, images)
                   │
                   ▼
System File Picker / Drag Drop
                   │
                   ▼
Desktop Shell (low trust UI input)
                   │ typed JSON only
                   ▼
App Core
                   │ validated operation
                   ▼
Runtime Host ── lock / journal / policy
        │
        ├── Platform Adapter
        │      ├── managed scripts/binary
        │      └── OS APIs
        │
        └── Existing Injector/Renderer
                   │ loopback CDP
                   ▼
             Official Codex
```

信任级别：

- `.codex-theme`、图片、主题目录外部变化：不可信；
- UI 输入：不可信，必须由 Runtime 再验证；
- App Core：可信控制面，但不能拥有平台敏感捷径；
- Runtime Host/Adapter：高信任、最小权限；
- managed runtime payload：只有完整性和平台签名通过后可信；
- existing legacy scripts：过渡可信组件，必须固定路径和版本；
- CDP endpoint：默认不可信，必须验证回环地址、端口所有权和 Codex 身份；
- Marketplace/AI：Phase 00 不存在。

## 3. 威胁模型

### T-001 · ZIP 路径穿越

攻击：包条目使用绝对路径、`../`、混合分隔符、Unicode 或重复路径逃逸 staging。

控制：

- 解压前枚举所有 entries；
- 统一路径分隔符和 Unicode 规范化后检查；
- 拒绝 absolute、drive letter、UNC、`..`；
- 解压后逐项 canonicalize，必须位于 extraction root；
- destination 由 Runtime 根据校验 ID 生成；
- 测试大小写、尾随点/空格和 Windows 保留名。

### T-002 · symlink/junction/reparse point

攻击：包或 state root 中的链接把写入引到任意位置。

控制：

- 包内拒绝 symlink 和特殊文件；
- Windows 拒绝 reparse point；
- macOS 使用 no-follow/open + realpath containment；
- 创建前后检查所有路径组件；
- managed runtime 和 transaction 目录不允许链接；
- current Runtime 使用 JSON pointer，不使用 symlink/junction。

### T-003 · executable content / polyglot

攻击：主题包包含脚本、应用、动态库或伪装扩展。

控制：

- allowlist 文件类型而不是只靠 denylist；
- Phase 00 package root 允许 `manifest.json`、`theme.json`、受支持图片、可选 preview/README；
- 拒绝可执行权限位和平台 executable 类型；
- 图片通过 magic/header 和 metadata helper 验证，不只看扩展名；
- Runtime 不执行包中任何文件。

### T-004 · ZIP bomb / 资源耗尽

控制：

- 压缩包最大 64 MiB；
- entry 数量上限；
- 单 entry 和总解压字节上限；
- 压缩比异常阈值；
- extraction 超时；
- 图片最大 16 MiB、单边 16384、50MP；
- 缩略图异步解码并限制内存；
- 失败时清理 staging，但保留最小脱敏证据。

具体建议：

- max entries：256；
- max extracted bytes：128 MiB；
- max single extracted file：64 MiB；
- README 最大 1 MiB；
- JSON 最大 1 MiB。

### T-005 · JSON/Schema 恶意输入

控制：

- 限制文件大小和递归深度；
- 拒绝控制字符；
- ID 使用严格 ASCII allowlist；
- theme.image/preview 只能是 package root 文件名；
- 不执行 JSON 中的表达式；
- 未知字段按版本策略处理；
- 错误 message 不回显完整恶意输入。

### T-006 · 命令注入

控制：

- request 通过 stdin JSON；
- UI 不传 command、script、shellArgs；
- Runtime 使用固定 executable 和参数数组；
- 禁止 `bash -c`、PowerShell string command；
- legacy script 路径来自受管 manifest；
- 文件路径作为单独参数或 stdin，不拼接；
- Windows 真实退出码和 stderr 包装必须测试特殊字符路径。

### T-007 · TOCTOU 主题替换

攻击：校验后、复制前替换 theme.json 或图片。

控制：

- macOS 继续使用 no-follow stable descriptors/staging；
- Windows 使用受管目录检查和 staging copy 后再验证；
- Apply 只消费 staged snapshot；
- expected revision 只用于检测变化，不替代 Runtime 重新验证；
- publish 前重新检查 stage hash。

### T-008 · 锁伪造或误删

攻击：恶意/损坏 owner.json 诱导 Runtime 删除仍活跃锁，或 PID reuse。

控制：

- 验证 PID + process start time + executable；
- TTL/heartbeat 不是唯一 stale 依据；
- 身份不匹配的活进程不自动 signal/删除；
- stale lock 先重命名归档；
- owner 文件权限仅当前用户；
- Windows Mutex 与持久目录双层；
- recovery entrypoint 也必须获取同一锁。

### T-009 · transaction journal 篡改

控制：

- journal 路径固定在 state root；
- 原子写和用户权限；
- 相对路径 only；
- schema/version 严格校验；
- backup/stage hash；
- journal 不可信时不自动执行任意路径恢复；
- 损坏进入 `recoveryRequired`，使用已知目录和最小 restore。

### T-010 · Runtime 更新替换

攻击：用恶意 runtime payload 替换执行面。

控制：

- payload 只能来自签名 App bundle/installer；
- manifest + SHA-256；
- macOS code signing/notarization；
- Windows Authenticode/installer identity；
- stage 后 self-check；
- publish version directory 后只切 current pointer；
- Runtime 运行时确认 executable 位于受管 version root；
- updater 不接受 UI 提供的任意 URL 或路径；
- Phase 00 无在线更新下载，先验证本地 bundle upgrade。

### T-011 · CDP 被其他进程占用

控制：

- 只连接 `127.0.0.1/localhost/::1`；
- 验证 listener PID/进程树/官方 Codex executable；
- 验证 `/json/version` browser ID 和 WebSocket URL；
- 验证 page target 为 `app://`；
- 不对非 Codex 端口发送注入；
- 身份异常返回 `CDP_OWNER_INVALID` 并建议 Restore。

### T-012 · Injector PID reuse / signal wrong process

控制：

- 保存 PID、start time、node path、injector path、port；
- signal 前全部匹配；
- 活进程身份不匹配时 fail closed；
- 不因为 state 缺字段就猜测当前路径；
- KILL 前二次验证身份。

### T-013 · 修改官方 Codex

控制：

- 永不修改 `.app`、`app.asar`、WindowsApps、代码签名；
- Adapter 只启动官方安装和外部注入；
- Restore 验证官方身份；
- 所有 write target allowlist 排除官方安装目录。

### T-014 · 配置损坏

控制：

- Windows 保留字节、CRLF、引号和非冲突子表；
- macOS/Windows 修改前 byte-for-byte backup；
- stage + same-directory atomic replace；
- commit 前失败恢复；
- backup hash 和原始权限记录；
- 不把 TOML/配置全量 parse-reserialize 当默认策略。

### T-015 · UI/Renderer 内容注入

Phase 00 Studio 显示主题元数据和 preview：

- 所有字符串按文本渲染；
- 禁止 HTML 注入；
- Electron 候选必须关闭 nodeIntegration、启用 contextIsolation 和严格 CSP；
- Tauri scope 只允许受管目录；
- 本地图片通过受控 asset protocol 或读取 API，不开放任意 file URL；
- README 不渲染任意 HTML/脚本，Phase 00 可不展示正文。

### T-016 · 日志泄露

可能泄露：home、用户名、SID、主题包路径、项目名、Codex 页面内容、环境变量、命令行。

控制：

- 结构化日志字段 allowlist；
- `$HOME/$STATE_ROOT/$RUNTIME_ROOT` placeholder；
- user identity 只存 hash；
- 不记录主题 JSON 全文或 README；
- 不记录 CDP 页面 DOM、对话文本、截图像素；
- stderr 写入文件前 redaction；
- “复制诊断”默认只复制摘要；
- 完整诊断包必须用户主动创建并预览内容列表。

### T-017 · 恶意外部修改主题库

控制：

- listThemes 将单个损坏主题隔离；
- Apply 前重新读取；
- active publish 只来自 staged snapshot；
- 不执行主题目录文件；
- 目录权限建议仅当前用户；
- 外部变化返回 `THEME_CHANGED`。

### T-018 · 恢复工具被滥用

控制：

- emergency restore 只有固定操作，不接受 destination/command；
- 只 signal 已验证进程；
- 只恢复已知配置和 state root；
- 记录 journal；
- 不需要网络或 UI 主进程；
- 不删除主题库，除非未来有独立明确卸载操作。

## 4. 权限模型

### 4.1 默认权限

- 只使用当前用户权限；
- 不要求 root/admin 执行日常 Apply/Verify/Restore；
- state root 目录：macOS 0700，文件 0600；Windows 当前用户 ACL；
- 安装器若需要提升，只限安装步骤，Runtime 日常降权运行；
- 不使用全局共享 writable 目录。

### 4.2 文件选择

Desktop Shell 使用系统文件选择器。选择权限只授予 source file，不意味着 Runtime 信任内容。

### 4.3 Shell/平台命令

Platform Adapter 维护 executable allowlist：

- App 自带 Runtime entrypoint；
- 受管 legacy scripts；
- 必需 OS 工具绝对路径；
- 官方 Codex executable/包身份。

不允许 PATH 搜索任意同名脚本。Windows Phase 00 过渡 Node PATH 只可存在于 legacy tests，不得进入正式 Studio artifact。

## 5. Desktop Shell 候选安全门禁

### 5.1 Tauri 2

必须验证：

- command allowlist；
- filesystem scope；
- sidecar 固定路径和签名；
- CSP；
- updater 签名与 rollback；
- no shell plugin 或严格禁用任意 command。

### 5.2 Electron

必须验证：

- `nodeIntegration=false`；
- `contextIsolation=true`；
- sandbox；
- preload API 最小化；
- navigation/window open 禁止；
- CSP；
- IPC schema validation；
- asar 不是安全边界；
- updater 供应链和 rollback。

### 5.3 Native 双端

必须验证：

- 两端都能保持同一 App Core/Runtime Contract；
- 不因平台分叉复制业务规则；
- 安装器、更新器和签名证据；
- 文件访问和 sidecar 权限。

任何候选若需要暴露任意 shell API，直接淘汰。

## 6. 隐私设计

### 6.1 本地数据

Phase 00 保存：

- 本地主题文件；
- Runtime 状态；
- operation lock/journal；
- 脱敏日志；
- Runtime 版本和完整性；
- 用户主动保存的验收截图（测试环境）。

### 6.2 不收集

- Codex 对话；
- 项目文件内容；
- API Key、Base URL、模型配置；
- 浏览历史；
- 用户账号；
- 使用遥测；
- 崩溃自动上传。

### 6.3 网络

- Phase 00 Runtime 不访问互联网；
- 唯一网络通信是本机 loopback CDP；
- Desktop Shell 不加载远程网页；
- updater Spike 可研究机制，但 Alpha 默认关闭在线更新；
- 任何未来网络功能需要新 ADR 和隐私评审。

### 6.4 保留与删除

- transaction terminal journal 默认保留最近 20 个或 30 天，取较小集合；
- rollbackFailed/recoveryRequired journal 在问题解决前保留；
- rotating logs 默认最多 10 个文件、每个 2 MiB；
- 用户可清理日志和已完成 journal；
- 清理不能删除 current/previous Runtime、主题库或未解决恢复证据；
- 卸载 Studio 与删除主题数据必须是两个独立选择。

## 7. 安全错误处理

- 对用户：稳定 code、简短说明、可恢复动作；
- 对日志：脱敏底层错误；
- 对未知异常：fail closed，不继续 publish；
- 对身份不匹配：不 signal、不注入；
- 对 journal 损坏：不按其中任意路径执行恢复；
- 对 cleanup 失败：新状态已 committed 时只 warning；
- 对 rollback 失败：阻止后续写操作。

## 8. 安全测试要求

必须自动化：

- ZIP traversal 变体；
- symlink/junction/reparse；
- executable/polyglot；
- ZIP bomb 阈值；
- 图片维度/像素/格式；
- 控制字符、Unicode ID、保留名；
- source path 特殊字符；
- command injection 字符串；
- TOCTOU 替换；
- lock PID reuse；
- 活进程身份不匹配；
- journal path 篡改；
- Runtime manifest/hash 篡改；
- stdout 污染；
- stderr/exit code 保真；
- CDP 非 Codex listener；
- config byte-for-byte rollback；
- Electron/Tauri 安全配置静态断言。

必须实机：

- macOS code signing/notarization；
- Windows Authenticode/installer identity；
- 官方 Codex 身份；
- loopback listener ownership；
- Injector signal safety；
- Restore；
- 安装、升级和降级。

## 9. 安全评审结论

Phase 00 可以进入实现，但以下是硬阻断条件：

- Runtime Host 仍接受任意命令；
- Desktop artifact 依赖用户 PATH 或源码 checkout；
- operation lock 只靠 TTL 删除；
- journal 允许绝对任意恢复路径；
- 主题包可包含脚本/JS/CSS 执行；
- UI 直接连接 CDP；
- updater 无签名或无 rollback；
- rollback 失败后仍允许继续写操作；
- 日志记录 Codex 对话或未脱敏环境变量。
