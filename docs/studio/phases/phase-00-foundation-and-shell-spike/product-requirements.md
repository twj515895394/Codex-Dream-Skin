# Phase 00 产品需求

## 1. 问题定义

当前 Codex Dream Skin 已能通过 macOS Shell/SwiftBar 和 Windows PowerShell/Tray 完成安装、启动、主题切换、验证和恢复，也已在 macOS 实现 `.codex-theme` 导入 MVP。但这些能力尚不能直接支撑一个可靠的桌面 Studio：

- 操作入口分散，用户必须理解脚本、菜单和状态目录；
- 两个平台的参数、输出、错误和依赖不同；
- UI 若直接调用现有脚本，只能解析人类文本，无法稳定区分取消、冲突、验证失败和回滚失败；
- 多入口可能同时修改主题或 Runtime；
- 现有写操作有局部原子性，但没有统一 transaction journal；
- 安装后的执行面仍可能依赖源码目录、Codex 内置 Node 或系统 PATH；
- 没有基于证据的 Desktop Shell 选型。

Phase 00 解决的是“能否安全建设 Studio”的问题，而不是“Studio 是否已经有完整主题管理体验”。

## 2. 为什么现在做

Theme Manager、Preview、Editor、AI 和 Marketplace 都会放大当前基础缺口。若先做 UI，后补 Runtime 契约和事务，会导致：

- UI 与平台脚本强耦合；
- 错误提示靠字符串匹配；
- macOS 主流程无法自然扩展到 Windows；
- 后续 Preview、Editor 保存、Marketplace 更新各自重复实现锁与回滚；
- 安装包在用户机器上依赖不可控环境。

因此 Runtime API、Adapter、锁、事务和分发必须先于大规模 UI。

## 3. 用户角色

### 3.1 普通主题使用者

目标：无需终端即可看到 Runtime 状态、列出主题、应用、验证和恢复。

关心：

- 操作是否安全；
- 是否会影响官方 Codex；
- 失败后能否恢复；
- 当前主题到底有没有生效；
- 为什么某个操作不可用。

### 3.2 主题作者

Phase 00 只提供基础能力，不提供完整 Editor。作者关心：

- 本地主题能否被稳定枚举；
- `.codex-theme` 是否能被安全导入；
- 错误是否明确指出包、图片或 Schema 问题；
- 导入成功但应用失败时，主题是否仍安全保存在库中。

### 3.3 项目维护者

目标：通过 Contract Test、结构化错误、日志和实机证据定位问题，安全演进双平台 Runtime。

关心：

- 同一操作跨平台是否同语义；
- 退出码和底层 stderr 是否保真；
- 失败发生在 commit 前还是 commit 后；
- 是否发生自动 rollback，rollback 是否成功；
- Runtime、Codex、主题和 Adapter 版本是否兼容。

### 3.4 发布维护者

目标：验证安装、签名、升级、降级和紧急恢复，不让发布包依赖源码 checkout。

## 4. 核心产品原则

1. **本地优先**：Phase 00 不需要账号、云端或遥测。
2. **可恢复优先**：所有写操作先定义失败和恢复。
3. **控制面/执行面分离**：Studio 不直接操作 CDP 和平台敏感资源。
4. **跨平台语义一致**：底层实现不同，业务结果一致。
5. **文件系统为事实来源**：主题目录可直接备份和重建索引。
6. **现有 Runtime 渐进封装**：早期不重写 Injector/Renderer。
7. **文档真实**：设计、Spike、单平台验证和正式实现严格区分。

## 5. 功能需求

### PR-001 · Runtime 能力探测

Runtime 必须返回：

- API 版本；
- Adapter 版本；
- 平台、架构；
- 支持的 operation；
- 可选功能与限制；
- Codex 安装/运行能力；
- managed runtime 状态；
- legacy backend 是否启用。

验收：UI 不根据操作系统名称猜功能。

### PR-002 · 结构化状态

`status` 至少表达：

- Runtime：`ready/degraded/unavailable/updating/recoveryRequired`；
- Codex：`running/stopped/unknown`；
- Skin：`active/paused/off/unknown`；
- 当前主题 ID、名称、来源和可验证性；
- 当前 operation 或 recovery journal；
- 版本兼容摘要；
- 脱敏的诊断提示。

验收：状态不可由 stdout 日志推断。

### PR-003 · 主题枚举

`listThemes` 必须：

- 枚举文件系统主题库；
- 兼容缺少 manifest/preview 的旧主题；
- 不因单个损坏主题中断整个列表；
- 标记 `ready/warning/invalid`；
- 返回来源 `bundled/custom/imported/legacy/unknown`；
- 对重复 ID、缺图、无权限和外部修改给出诊断；
- 不假设预设集合固定。

### PR-004 · 主题导入

`importTheme` 必须：

- 只接受本地 `.codex-theme` 文件；
- 执行包大小、ZIP、安全路径、脚本、symlink/reparse、特殊文件、Schema、图片和 payload 校验；
- 支持同 ID 冲突策略：`reject/replace/keepBoth`，Phase 00 实现至少支持 `reject/replace`；
- 先 staging，再替换；
- 导入和应用结果分开表达；
- 用户取消不产生库变化；
- 失败不破坏原主题；
- 返回 installed theme 的规范化摘要。

### PR-005 · 安全应用主题

`applyTheme` 必须：

- 仅接受枚举得到的稳定 theme ID；
- 重新读取并校验实际文件，不信任 UI 缓存路径；
- 获取共享 operation lock；
- 快照 active theme；
- staging 主题和图片；
- 发布 commit marker；
- 调用热应用，必要时执行授权的完整启动；
- Verify 失败自动尝试 Restore；
- 返回 `applied/verified/rollbackAttempted/rollbackSucceeded`。

默认不得无提示强制结束 Codex。需要 restart 时返回可执行 UI action。

### PR-006 · Verify

`verify` 必须区分：

- Runtime 可用；
- CDP 端口属于合法 Codex；
- Injector 身份匹配；
- Renderer 已加载；
- 当前主题 payload 与发布目录一致；
- 原生关键控件可见/可点击的实机证据由测试流程补充。

Verify 不应修改主题；若与写操作冲突，返回 `OPERATION_BUSY`。

### PR-007 · Restore

`restore` 必须：

- 关闭或停止 Dream Skin 执行面；
- 恢复配置和 Codex 启动状态；
- 不修改官方 Codex 安装文件；
- 处理损坏 state/journal；
- 支持紧急恢复模式；
- 返回恢复了哪些资源、跳过了哪些资源和后续人工动作。

### PR-008 · operation lock

所有可能修改主题、Runtime、Codex 启动或配置的入口必须共享锁：

- Studio；
- SwiftBar；
- Tray；
- CLI；
- installer/updater；
- recovery tool。

冲突默认立即返回，不无限等待。

### PR-009 · transaction journal

每个写操作必须记录：

- operation/request ID；
- 类型和阶段；
- 目标资源；
- 备份位置；
- publish/commit 状态；
- 验证结果；
- rollback 结果；
- cleanup 状态；
- 脱敏错误摘要。

崩溃后下一次 `status` 必须能判断是否需要自动或人工恢复。

### PR-010 · managed runtime

Studio 安装后必须：

- 不依赖源码 checkout；
- 不依赖用户 PATH 中 Node；
- 不把 Codex 内置 Node 当作长期唯一依赖；
- 使用版本化 Runtime payload；
- 校验 manifest/hash/签名；
- 支持 current/previous 版本切换；
- 升级中断可恢复；
- App 和 Runtime 兼容范围可检测。

### PR-011 · Desktop Shell Spike

必须在 macOS 和 Windows 实测 Tauri 2、Electron、Native 双端方案，覆盖：

- build/install/start；
- sidecar 或受管 Runtime 调用；
- stdin/stdout JSON；
- 文件选择和拖拽；
- 本地图片缩略图；
- 签名/公证/安装器；
- updater/rollback；
- 无源码路径运行；
- 键盘和辅助功能；
- 崩溃日志和诊断。

### PR-012 · 最小 Vertical Slice

最小界面必须完成：

```text
打开 Studio
→ 显示 Runtime 状态
→ 列出主题
→ 选择主题
→ Apply
→ 显示结构化结果
→ Verify
→ Restore
```

不要求正式视觉设计和完整主题管理功能。

## 6. 用户故事

### US-001 · 查看状态

作为普通用户，我希望打开 Studio 后看到 Runtime、Codex 和 Skin 的真实状态，以便知道能否安全应用主题。

前置：Studio 已安装。

主流程：

1. App Core 调用 `capabilities` 和 `status`；
2. UI 显示 ready/degraded 等状态；
3. UI 根据 action 提供修复入口。

失败：Runtime 不存在、版本不匹配、journal 未恢复。

数据变化：无。

验收：错误不是通用“发生错误”，而是稳定 code + 用户动作。

### US-002 · 列出本地主题

作为用户，我希望看到所有可用和损坏主题，而不是因为一个坏目录导致列表为空。

验收：损坏主题以 warning/invalid 卡片出现；其他主题仍可操作。

### US-003 · 导入主题包

作为主题作者，我希望选择 `.codex-theme` 后先完成安全校验，再决定是否覆盖同 ID 主题。

取消：文件选择或冲突确认时取消，返回 `CANCELLED`，无写入。

失败：恶意路径、脚本、缺图、Schema 不支持、空间不足。

恢复：替换失败恢复旧目录；cleanup 失败返回 warning。

### US-004 · 应用主题

作为用户，我希望应用主题后得到明确 Verify 结果；失败时恢复到操作前状态。

失败分支：

- 锁冲突：不修改；
- validation 失败：不 publish；
- publish 失败：恢复 active snapshot；
- inject/verify 失败：自动 rollback；
- rollback 失败：进入 `recoveryRequired` 并突出 Restore。

### US-005 · 处理需要重启

作为用户，我希望系统先告诉我为什么需要重启 Codex，并由我确认，而不是直接强制结束应用。

验收：返回 `CODEX_RESTART_REQUIRED` 和 `confirmRestart` action；确认后使用新的 request 执行。

### US-006 · 恢复异常事务

作为用户，我希望 Studio 在上次崩溃后能识别未完成操作并提供恢复。

主流程：status 发现 incomplete journal → UI 进入 recovery mode → 调用 restore/recover → 重新验证。

### US-007 · 维护者定位失败

作为维护者，我希望获得 requestId、operationId、错误码、退出码和脱敏日志位置，以便重现问题。

验收：stdout JSON 可用于自动化；stderr 保留原始诊断但不泄露敏感内容。

## 7. 非功能需求

### 7.1 安全

- 不执行主题包脚本；
- 不接受任意 shell command；
- CDP 仅回环地址；
- 验证 Codex/Injector/Runtime 身份；
- 受管目录拒绝 symlink/junction/reparse；
- 所有外部路径 canonicalize 后再使用。

### 7.2 可靠性

- 写操作幂等或可恢复；
- lock 不依赖超时作为唯一 stale 判断；
- commit 前失败 rollback；
- commit 后 cleanup 失败 warning；
- 状态文件原子写。

### 7.3 性能

- `capabilities/status` P95 本地执行目标 < 500ms；
- `listThemes` 100 个主题 P95 < 1s，不强制解码全部大图；
- 热 Apply 在 CDP 已就绪时目标 < 10s；
- UI 不因 stderr 流量阻塞。

性能目标是验收参考，不以绕过安全校验换取。

### 7.4 兼容性

- macOS 当前支持架构；
- Windows PowerShell 5.1 与 PowerShell 7 Adapter 测试；
- Theme Schema v1；
- API v1 严格版本协商；
- 未知 JSON 字段客户端应忽略，未知 enum 不应崩溃。

### 7.5 可访问性

- 全流程可键盘操作；
- 状态不只靠颜色；
- 焦点和屏幕阅读器标签明确；
- 错误详情可复制；
- 系统缩放和窄窗口可用。

## 8. 成功指标

Phase 00 成功不是 UI 页面数量，而是：

- 双平台核心 Contract Test 同语义通过；
- importer 恶意包和失败回滚测试通过；
- 多入口冲突不会同时写状态；
- 断电/崩溃模拟后能识别 journal 并恢复；
- Desktop Shell ADR 有双平台证据；
- Vertical Slice 从安装包运行，不依赖源码或 PATH；
- 现有 SwiftBar/Tray/CLI 主流程无回退；
- Restore 实机成功。

## 9. 延期需求

| 需求 | 延期阶段 |
| --- | --- |
| 搜索、筛选、主题详情和删除 | Phase 01 |
| Schema v2、Normalizer、Compiler | Phase 02 |
| Fixture/Live Preview | Phase 02 |
| Editor、Undo/Redo、草稿 | Phase 03 |
| Asset Library 和 AI | Phase 04 |
| Marketplace、在线签名和自动内容更新 | Phase 05 |
