# Phase 00 UX 与交互设计

## 1. 设计定位

Phase 00 的 UI 是技术 Vertical Slice，不是最终 Theme Manager 视觉稿。它必须真实展示 Runtime 状态、主题列表、操作冲突、错误和恢复，不得用静态 mock 数据掩盖执行面缺口。

本阶段不建立完整设计系统，但必须验证：

- Desktop Shell 能稳定调用 Runtime API；
- 所有核心状态有可理解的 UI；
- 用户能在不打开终端的情况下完成 Apply、Verify、Restore；
- 失败、取消和恢复不会被统一成模糊提示；
- macOS 与 Windows 的核心流程一致。

## 2. 信息架构

```text
Studio Window
├── Top Status Bar
│   ├── Runtime status
│   ├── Codex status
│   ├── Skin status
│   └── current operation / recovery alert
├── Theme List
│   ├── ready themes
│   ├── warning themes
│   └── invalid themes
├── Selection Detail
│   ├── theme metadata
│   ├── package preview image（若存在）
│   ├── compatibility summary
│   └── Apply action
└── Operation Drawer
    ├── current step
    ├── warnings
    ├── recovery action
    ├── copy diagnostics
    └── Verify / Restore
```

系统菜单只保留开发与诊断入口，不承载业务主流程。

## 3. 页面状态

### 3.1 Initial

窗口已创建但尚未完成 Runtime 握手。

显示：

- 骨架屏；
- “正在检查本地 Runtime”；
- 不显示可点击 Apply。

禁止：用缓存状态假装 Runtime 已 ready。

### 3.2 Loading

`capabilities/status/listThemes` 正在执行。

要求：

- 每个请求有超时和 requestId；
- listThemes 可晚于 status 完成；
- 用户可取消非关键长操作，但不能取消已经进入 publish 的写事务。

### 3.3 Ready

Runtime 可用、无未完成事务。

显示：

- Runtime/Codex/Skin 三层状态；
- 主题列表；
- 可用操作。

### 3.4 Empty

主题库为空或没有可用主题。

显示：

- “没有可用主题”；
- 打开主题目录；
- Phase 00 可选提供 Import 文件入口；
- 不把损坏主题全部过滤后误报为空，warning/invalid 应单独列出。

### 3.5 Warning

Runtime 可继续使用，但存在非阻断问题，例如：

- cleanupPending；
- legacy backend；
- manifest 缺失；
- preview 缺失；
- Codex 版本未经验证；
- managed runtime 有旧版本可清理。

状态必须提供：

- 简短解释；
- 是否影响当前操作；
- 推荐动作；
- 详情入口。

### 3.6 Error

操作失败且没有破坏已提交状态，或 Runtime 无法启动。

显示：

- 用户可理解的错误标题；
- error code；
- recoverable；
- 推荐 action；
- requestId；
- “复制诊断信息”。

默认不直接展示完整路径和底层堆栈。

### 3.7 Recovery Required

存在 rollback 失败、损坏 journal 或无法确认 active state。

要求：

- 页面进入阻断模式；
- 禁用 Import/Apply；
- 只保留 Status、诊断、Recover/Restore；
- 明确当前主题和 Codex 状态可能不可信；
- 恢复成功后重新执行完整 status + verify。

### 3.8 Busy

另一个入口正在执行写操作。

显示：

- operation 类型；
- 开始时间；
- 发起入口（可安全识别时）；
- “刷新状态”；
- 不提供强制抢锁按钮。

维护者模式可显示 lock owner 摘要，但普通用户不能手工删除锁。

### 3.9 Disabled

某操作因 capability、状态或兼容性不可用。

按钮旁必须说明原因，例如：

- Codex 未安装；
- Runtime 正在更新；
- 主题 invalid；
- 当前处于 recoveryRequired；
- 平台 Adapter 不支持该操作。

## 4. 关键流程

## 4.1 启动与握手

```text
Open Studio
  ↓
spawn Runtime Adapter
  ↓
capabilities
  ↓
status
  ├── ready → listThemes
  ├── degraded → listThemes + warning
  ├── recoveryRequired → recovery mode
  └── unavailable → diagnostics screen
```

交互规则：

- `capabilities` 失败时不继续猜测操作；
- API 版本不兼容显示升级/降级建议；
- Runtime 超时后可重试，但每次使用新 requestId；
- UI 不从 stderr 提取业务状态。

## 4.2 列出和选择主题

主题卡片最小字段：

- 名称；
- ID；
- 来源；
- ready/warning/invalid；
- 当前主题标记；
- package preview image（若存在，明确标注“包预览图”）；
- 兼容性摘要。

选择 invalid 主题：

- 允许查看诊断；
- 禁止 Apply；
- 不在 Phase 00 提供自动修复主题文件。

## 4.3 Apply

```text
Select theme
  ↓
click Apply
  ↓
UI validates current capability only
  ↓
Runtime revalidates actual files
  ↓
lock acquired
  ↓
backup / stage / publish
  ↓
hot apply or restart-required response
  ↓
verify
  ├── success → applied state
  ├── failure + rollback success → previous state restored
  └── failure + rollback failure → recoveryRequired
```

### Restart confirmation

若 Runtime 返回 `CODEX_RESTART_REQUIRED`：

- 显示为什么需要重启；
- 显示未保存工作风险；
- “取消”和“允许重启”并列；
- 允许重启后发送新请求，包含用户授权标记；
- 不重用原 requestId。

### Progress

阶段文案来自稳定 transaction phase，而不是日志字符串：

- 检查主题；
- 等待操作锁；
- 创建恢复点；
- 发布主题；
- 应用到 Codex；
- 验证；
- 完成清理。

Phase 00 可先用非流式请求；若操作较长，UI 通过 `status` 轮询 operationId。不得同时启动第二个写操作。

## 4.4 Import

Phase 00 Shell Spike 可把 Import 作为次要入口；正式冲突交互在 Phase 01 完善。

流程：

1. 系统文件选择器选择 `.codex-theme`；
2. Runtime 执行只读预检；
3. 若同 ID 冲突，返回 conflict summary；
4. UI 提供 Replace / Cancel；
5. 新 request 执行写入；
6. 返回 installed 与 applied 分离结果。

重要：

- 文件选择取消是正常结果，不显示错误弹窗；
- 导入成功、Apply 失败时，UI显示“主题已导入，但未应用”；
- 替换失败且旧主题恢复成功，显示错误但库保持原状；
- cleanupPending 是 warning，不显示为完全失败。

## 4.5 Verify

Verify 页面/抽屉显示分项：

- Runtime；
- Codex identity；
- CDP loopback ownership；
- Injector；
- Renderer marker；
- active theme payload；
- overall result。

单项失败必须有稳定 code。Phase 00 不在 UI 自动截图，但实机验收必须保存截图证据。

## 4.6 Restore

普通 Restore：

- 显示将停止 Dream Skin 并恢复官方外观；
- 不声称卸载官方 Codex；
- 完成后重新检查 Codex 和 Skin 状态。

紧急 Restore：

- 仅 recovery mode 或 Runtime unavailable 时显示；
- 使用独立最小 recovery entrypoint；
- 不依赖主 UI 完整启动；
- 结果区分 restored/partial/manualActionRequired。

## 4.7 外部文件变化

主题目录可能被用户、SwiftBar、Tray 或 CLI 修改。

Phase 00 策略：

- 每次 Apply 前 Runtime 重新读取和校验；
- listThemes 结果带 snapshot revision；
- 若选择后文件变化，返回 `THEME_CHANGED`；
- UI 刷新主题详情，不覆盖外部修改；
- 不在 Phase 00 做实时文件 watcher 的复杂冲突合并。

## 4.8 Studio/Codex 异常退出

### Studio 崩溃

Runtime 写事务不依赖 UI 进程持有业务状态。下次启动读取 journal。

### Runtime Adapter 崩溃

lock 和 journal 保留；status 通过 PID/start time 判断 stale，并进入恢复流程。

### Codex 崩溃

Apply 不自动宣称失败或成功；Runtime 记录 publish 状态，下一次 status/verify 决定是否需要 restart 或 rollback。

## 5. 错误到 UI 动作映射

| Error code | 默认文案 | Primary action |
| --- | --- | --- |
| `OPERATION_BUSY` | 另一个 Dream Skin 操作正在进行 | 刷新状态 |
| `CANCELLED` | 操作已取消 | 无 |
| `THEME_NOT_FOUND` | 主题已被移动或删除 | 刷新主题列表 |
| `THEME_CHANGED` | 主题文件已发生变化 | 重新加载 |
| `THEME_INVALID` | 主题内容不符合要求 | 查看诊断 |
| `PACKAGE_UNSAFE` | 主题包包含不安全内容 | 查看诊断 |
| `CODEX_NOT_FOUND` | 未找到官方 Codex | 打开帮助 |
| `CODEX_RESTART_REQUIRED` | 需要重启 Codex 才能继续 | 确认重启 |
| `RUNTIME_VERSION_MISMATCH` | Studio 与 Runtime 版本不兼容 | 修复 Runtime |
| `VERIFY_FAILED_ROLLED_BACK` | 应用失败，已恢复原主题 | 查看详情 |
| `ROLLBACK_FAILED` | 自动恢复失败 | 紧急 Restore |
| `RECOVERY_REQUIRED` | 检测到未完成操作 | 恢复 |
| `PERMISSION_DENIED` | 没有访问所需文件的权限 | 打开系统设置/帮助 |

UI 文案可以本地化，但 code 和 action 不变。

## 6. 预览真实性

Phase 00 只可能出现：

- `Package Preview Image`；
- `Real Device Screenshot`（验收证据）；
- Desktop Shell 自身概念布局。

明确不提供：

- Fixture Preview；
- Live Preview；
- Compiler 同源预览。

规则：

- 包内 preview 必须标注“主题包预览图，实际效果可能不同”；
- 不用自制 CSS 模拟 Codex 并称为实机；
- 实机截图标注平台、Codex 版本、主题 ID、时间和测试编号；
- Shell Spike 的视觉稿不作为 Theme Manager 最终 UI 承诺。

## 7. 可访问性

### 键盘

- Tab 顺序：状态 → 主题列表 → 详情 → 主操作 → Operation Drawer；
- 主题列表支持方向键和 Enter；
- Esc 仅关闭非关键弹窗，不取消 publish 中事务；
- Restore 不设置危险的单键快捷键。

### 屏幕阅读器

- 状态包含文字，不只用图标；
- 主题卡片读出名称、来源、有效性、是否当前；
- progress 变化使用适度 live region，避免日志刷屏；
- error code 和建议动作可访问。

### 视觉

- 对比度满足桌面应用基本可读性；
- 200% 缩放不遮挡 Restore；
- 最小窗口下 Operation Drawer 可滚动；
- 动效遵循 reduced motion；
- warning/error 不只靠颜色区分。

## 8. 平台差异

允许差异：

- macOS title bar、文件选择器、公证提示；
- Windows title bar、安装器、UAC/系统设置入口；
- 系统通知和路径显示格式。

不允许差异：

- 核心 operation 名称；
- error code 和 action；
- Apply/Verify/Restore 主流程；
- recoveryRequired 阻断语义；
- 主题有效性状态；
- 用户取消和 restart 授权。

## 9. Spike UX 验收

- 启动、ready、empty、warning、error、busy、recoveryRequired 状态都有可运行画面；
- Apply 需要重启时不会无提示强制关闭 Codex；
- 导入成功但应用失败能清楚表达部分成功；
- error detail 可复制且默认脱敏；
- Recovery mode 能在主题列表不可用时执行 Restore；
- macOS/Windows 核心流程文字和操作顺序一致；
- 键盘可完成选择、Apply、Verify、Restore；
- UI 没有任意命令输入框或调试 shell。
