# Dream Skin Studio 全项目实施计划

> 文档角色：项目级实施计划  
> 主控入口：[`MASTER-PLAN.md`](./MASTER-PLAN.md)  
> 适用分支：`feat/codex-theme-import-mvp`  
> 计划方式：按依赖和验收门禁推进，不以未经验证的日期承诺替代工程状态。

## 1. 计划目标

本计划把 Dream Skin Studio 从当前“脚本 Runtime + 本地主题库 + `.codex-theme` 导入 MVP”推进为可发布的跨平台桌面产品。

实施过程必须同时满足：

- 不破坏现有 macOS / Windows Runtime；
- 不修改官方 Codex 二进制、`app.asar`、WindowsApps 或代码签名；
- 保留 Verify、Doctor 和 Restore 能力；
- 主题包继续保持纯数据；
- Studio 预览与实机使用同一编译结果；
- 所有写操作可恢复；
- 每个阶段开发前先完成细化设计；
- 定期审查 `main`，但不自动合并。

## 2. 规划假设

为了便于衡量进度，本计划使用“Iteration”而非固定交付日期：

- 1 个 Iteration 建议为 1～2 周；
- 每个 Iteration 必须产生可验证成果；
- 阶段结束时间取决于跨平台实机、签名、安装和回滚验证；
- 单人开发时优先保证 macOS 主流程，但共享 Core、Contract 和 Windows Adapter 不能被写死为 macOS 专用；
- Marketplace 和外部 AI 不进入早期关键路径。

下面的迭代数量是工作量级别，不是承诺日期。

## 3. 总体实施路径

```text
Phase 00 Foundation / Runtime API / Shell Spike
    ↓
Phase 01 Theme Manager MVP
    ↓
Phase 02 Theme Compiler / Schema v2 / Trusted Preview
    ↓
Phase 03 Theme Editor
    ↓
Phase 04 Asset Library / AI Authoring
    ↓
Phase 05 Marketplace / Trust / Update
```

关键路径：

```text
Runtime JSON API
    ↓
Desktop Shell
    ↓
Theme Repository
    ↓
Theme Manager
    ↓
Canonical Model + Compiler
    ↓
Fixture/Live Preview
    ↓
Editor
```

不建议跳过 Compiler 和可信 Preview 直接开发复杂 Editor，否则会再次出现设计预览与真实效果不一致的问题。

## 4. 横向工作流

### 4.1 Foundation 与 Runtime

负责：

- 平台能力探测；
- Codex 安装、签名和包身份；
- Runtime 安装和升级；
- 状态、锁、日志、错误码；
- Apply、Preview、Verify、Restore；
- macOS / Windows Adapter。

### 4.2 Theme Domain

负责：

- Theme Repository；
- `.codex-theme` Package Service；
- Schema；
- Normalizer / Migrator；
- Compiler；
- Draft、版本、完整性和兼容性。

### 4.3 Studio UI

负责：

- Desktop Shell；
- Theme Library；
- Theme Detail；
- Runtime Status；
- Preview；
- Editor；
- Assets；
- Settings / Diagnostics。

### 4.4 Quality、Security 与 Release

负责：

- CI；
- Contract Tests；
- Visual Regression；
- 实机验收；
- 签名、安装、升级和回滚；
- 日志脱敏；
- 威胁模型；
- 发布文档。

### 4.5 Upstream Intelligence

负责：

- 连续记录 `main` 比较节点；
- 分析新增设计；
- 维护 UPA 采用动作；
- 在阶段开始前提供迁移建议；
- 不自动 merge/rebase。

## 5. Phase 00：Foundation、Runtime API 与 Desktop Shell Spike

### 5.1 目标

建立 Studio 可以安全开发和持续验证的工程底座。Phase 00 不追求完整 GUI，而要证明：Studio 能通过结构化接口读取状态、列出主题、执行一次安全 Apply，并在失败时返回稳定错误。

### 5.2 建议工作量

2～4 个 Iteration，取决于 Desktop Shell 签名、sidecar 和 Windows 实机条件。

### 5.3 实施批次

#### 00-A：当前能力固化

- 为 `.codex-theme` importer 建立自动化测试；
- 补 ZIP 路径、脚本文件、符号链接、缺失文件、ID 冲突和原子覆盖测试；
- 固化 macOS 实机导入、切换、重启、Verify、Restore 流程；
- 固化 Windows 现有回归；
- 建立跨平台行尾、编码和静态检查；
- 对首次上游 Review 中的 CI、安全和原子替换能力形成采用顺序。

输出：

```text
macos/tests/theme-package-import.*
windows/tests/...
.github/workflows/studio-foundation.*
docs/studio/phases/phase-00-.../
```

#### 00-B：Runtime JSON API v1

最小操作：

```text
capabilities
status
listThemes
importTheme
applyTheme
verify
restore
```

统一响应：

```json
{
  "apiVersion": 1,
  "requestId": "...",
  "operation": "applyTheme",
  "ok": true,
  "data": {},
  "warnings": [],
  "error": null
}
```

要求：

- stdout 只输出结构化结果；
- 日志走 stderr 或日志文件；
- 真实退出码保留；
- 错误码可映射为 UI 动作；
- 参数不可通过拼接 Shell 字符串传入；
- macOS 和 Windows 返回相同操作语义。

#### 00-C：共享操作锁与事务模型

统一处理：

- Studio、SwiftBar、Tray、CLI 并发；
- stale lock；
- import/apply/delete/preview 冲突；
- Runtime 更新期间禁止启动旧脚本；
- 提交前失败回滚；
- 提交后清理失败 warning。

重点吸收 `UPA-003`、`UPA-004`、`UPA-005`、`UPA-006` 的设计价值。

#### 00-D：Desktop Shell Spike

候选：

- Tauri 2 + React/TypeScript；
- Electron；
- macOS SwiftUI + Windows WinUI/WPF。

Spike 至少验证：

- 双平台构建；
- 文件选择和拖拽；
- 调用受控 Runtime Adapter；
- sidecar/脚本签名；
- 日志和错误展示；
- 本地图片缩略图；
- 自动更新和降级可行性；
- 安装后不依赖源码 checkout。

输出 ADR，不凭偏好直接锁定技术。

#### 00-E：最小 Vertical Slice

Studio Spike 完成：

```text
打开 Studio
  ↓
读取 Runtime 状态
  ↓
列出本地主题
  ↓
选择主题
  ↓
Apply
  ↓
显示结构化结果
  ↓
Verify / Restore
```

### 5.4 Phase 00 验收

- Importer 自动测试存在；
- Runtime API 有版本和错误码；
- UI 无任意命令执行入口；
- macOS 和 Windows至少通过同一 Contract Test 核心集合；
- Shell Spike 有 ADR；
- Vertical Slice 可运行；
- 现有桌面命令、SwiftBar 和 Tray 不回退；
- 上游采用动作已更新真实状态。

## 6. Phase 01：Theme Manager MVP

### 6.1 目标

用户不打开终端即可完成本地主题管理闭环。

### 6.2 建议工作量

3～5 个 Iteration。

### 6.3 功能包

#### Theme Repository

- 枚举 v1 preset/custom/imported 主题；
- 兼容无 manifest 和无 preview 的旧主题；
- 检测损坏、重复 ID、图片缺失和不兼容；
- 监听外部文件变化；
- 文件系统作为事实来源；
- 可选索引缓存。

#### Theme Library UI

- 卡片列表；
- 当前主题标识；
- 来源、版本、预览和状态；
- 搜索、筛选、排序；
- 空状态、错误状态和损坏状态；
- 主题详情页。

#### Operations

- 导入；
- 应用；
- 复制；
- 重命名显示名；
- 导出；
- 删除；
- 打开目录；
- Verify；
- Restore。

#### Runtime Status

- Codex running / stopped；
- Skin active / paused / off；
- Runtime 版本；
- 当前主题；
- Doctor 摘要；
- 日志和脱敏诊断包。

### 6.4 交互约束

- 删除当前主题前必须先切换或 Restore；
- 同 ID 导入必须提供覆盖、保留副本或取消；
- preview 图片只作为包内预览，不声称是完整实机；
- Runtime 不可用时仍允许安全的只读主题管理；
- SwiftBar/Tray/Studio 显示状态必须最终一致。

### 6.5 Phase 01 验收

- macOS 完成完整 GUI 管理闭环；
- Windows至少完成列表、应用、删除、Verify 和 Restore；
- 导出后可在另一环境重新导入；
- 损坏主题不会导致 Studio 崩溃；
- 所有写操作可恢复；
- 用户不需要手动定位状态目录。

## 7. Phase 02：Theme Compiler 与可信 Preview

### 7.1 目标

建立主题设计、Studio 预览和 Codex 实机之间的单一来源。

### 7.2 建议工作量

4～6 个 Iteration。

### 7.3 核心交付

#### Canonical Theme Model

- v1 Normalizer；
- Schema v2；
- 未知字段保留；
- 兼容诊断；
- Runtime compatibility；
- versioned migration。

#### Theme Compiler

生成：

- Light/Dark tokens；
- Home/Coding overlays；
- Card/Composer/Code/Attachment/User Message/Popover surfaces；
- opacity、blur、radius、shadow；
- art position、safe area 和 task mode；
- 诊断和 compiler revision。

#### Fixture Preview

固定场景：

- Home Light；
- Home Dark；
- Coding Light；
- Coding Dark；
- Popover；
- Composer；
- Code Block；
- Attachment；
- User Message。

Fixture DOM 可以模拟，但主题 token 不允许另算。

#### Live Preview

- session ID；
- 当前主题快照；
- Draft 临时槽位；
- Commit / Revert；
- 超时；
- 崩溃恢复；
- 单一活动会话；
- 不覆盖正式主题。

### 7.4 Phase 02 验收

- 同一 compiled artifact 同时供 Preview 和 Runtime；
- Light/Dark 独立配置；
- v1 主题继续可用；
- v2 round-trip 保持效果；
- Live Preview 异常退出后恢复；
- Preview 与实机差异有可量化和可解释记录。

## 8. Phase 03：可视化 Theme Editor

### 8.1 目标

用户从图片或现有主题创建完整主题，不手写 JSON。

### 8.2 建议工作量

5～8 个 Iteration。

### 8.3 主要模块

- 新建主题向导；
- 复制现有主题；
- 背景图导入、裁切和焦点；
- safe area / task mode；
- Light/Dark 调色；
- Surface / Overlay / Blur / Shadow / Radius；
- 组件级设置；
- 文案和元数据；
- Undo/Redo；
- Draft 自动保存；
- 冲突检测；
- 可读性和对比度诊断；
- Live Preview；
- 保存副本、版本和导出。

### 8.4 Phase 03 验收

- 从背景图到 `.codex-theme` 全流程不需要终端；
- Undo/Redo 和崩溃恢复可靠；
- Editor、Fixture、Live Preview 和 Apply 没有结构性分叉；
- 实机覆盖四个基础 Light/Dark/Home/Coding 场景；
- 外部文件变化不会被静默覆盖。

## 9. Phase 04：Asset Library 与 AI Authoring

### 9.1 目标

建立本地素材管理和可控 AI 辅助创作，不让外部模型成为主题系统依赖。

### 9.2 建议工作量

4～7 个 Iteration。

### 9.3 Asset Library

- source / prepared variants / thumbnail；
- hash、尺寸、mime、来源、授权、导入时间；
- derivedFrom；
- AI-generated 声明；
- 引用关系和安全删除；
- 去重和缓存。

### 9.4 本地 AI/算法能力

- 图像亮度和色彩分析；
- palette 建议；
- safe area 和 focus 建议；
- Light/Dark 初稿；
- 对比度修复；
- 主题变体；
- 所有结果进入 Draft。

### 9.5 外部 Provider

- 默认关闭；
- 上传前确认 Provider、数据和用途；
- 密钥使用系统安全存储；
- 不上传 Codex 对话、项目名和用户目录；
- 保存可复现参数和 provenance；
- 失败可降级为本地流程。

## 10. Phase 05：Marketplace、Trust 与 Update

### 10.1 目标

安全浏览、安装、更新和撤回第三方主题。

### 10.2 建议工作量

5～8 个 Iteration，取决于是否建设服务端 Catalog 和作者体系。

### 10.3 前置条件

- Schema v2 稳定；
- Package 稳定；
- Runtime compatibility 稳定；
- 签名和作者身份模型完成；
- 更新、删除和回滚可靠；
- 素材授权字段稳定。

### 10.4 核心能力

- Catalog；
- 搜索、标签和排序；
- 详情、截图和作者；
- Install / Update / Rollback；
- Hash / Signature；
- 兼容性过滤；
- 下架、撤销和举报；
- 离线缓存；
- 网络访问总开关。

### 10.5 安全约束

- 下载包仍走本地 importer；
- Catalog 不能授予执行权限；
- 不兼容包不允许误应用；
- 旧版本在更新成功前保留；
- 用户能够完全禁用 Marketplace。

## 11. 版本与发布策略

建议产品版本：

```text
0.1.x  Foundation / Spike
0.2.x  Theme Manager Alpha
0.3.x  Theme Manager Beta + Cross-platform
0.4.x  Compiler / Preview Alpha
0.5.x  Editor Alpha
0.6.x  Editor Beta + Assets
0.7.x  AI Authoring Optional
0.8.x  Marketplace Preview
1.0.0  Stable Studio
```

版本号只在对应能力通过验收后使用，不以文档完成代替代码交付。

发布通道：

- Dev：开发者本地；
- Alpha：功能可用但数据模型可能变化；
- Beta：数据兼容和回滚稳定；
- Stable：安装、升级、降级、恢复和双平台验收完成。

## 12. 测试矩阵

### 每个提交

- lint / syntax；
- 单元测试；
- Schema / Package；
- Runtime API contract；
- path safety；
- 不修改官方二进制检查。

### 每个 Iteration

- macOS 集成测试；
- Windows 集成测试；
- Import/Export round-trip；
- Apply/Verify/Restore；
- Fixture visual regression；
- 关键错误注入。

### 每个 Phase

- 双平台实机；
- 当前 Codex 版本；
- Home Light/Dark；
- Coding Light/Dark；
- 原生控件点击；
- 安装、升级和回滚；
- Known Issues；
- 用户文档。

## 13. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| Codex DOM 变化 | Fixture + 实机 Verify + selector compatibility layer |
| CDP 同用户风险 | loopback、身份验证、Restore、明确状态提示 |
| GUI 与 Runtime 分叉 | Runtime API + 单一 Compiler + Contract Test |
| Windows/macOS 语义不一致 | 统一 Adapter contract，平台实现分别测试 |
| 主题损坏 | staging、backup、atomic publish、diagnostics |
| Studio 崩溃留下 Preview | session journal + timeout + startup recovery |
| 设计图与实机不一致 | compiled artifact 同源，概念图明确标注 |
| 上游变化过快 | commit 游标 Review，不盲目合并 |
| AI/Marketplace 扩大安全面 | 后置实施、默认关闭、纯数据、显式授权 |
| 文档失真 | Work Register、DoD 和主控文档更新门禁 |

## 14. 项目进度表达

不使用模糊的“完成百分比”作为唯一状态。统一用：

```text
Planned → Ready → In Progress → Verification → Done
```

每个状态必须有证据：

- Planned：登记目标；
- Ready：设计和门禁通过；
- In Progress：存在实现分支/提交；
- Verification：代码冻结，正在执行测试；
- Done：测试、实机、文档和回滚完成。

当前任务和证据见 [`work-register.md`](./work-register.md)。
