# Dream Skin Studio 多阶段开发路线

> 文档级别：L0 路线骨架  
> 原则：每个阶段进入开发前，必须在 `docs/studio/phases/` 下完成 L1 细化设计并通过阶段门禁。

## 1. 路线总览

```text
Phase 0  基线整合与技术验证
    ↓
Phase 1  Theme Manager MVP
    ↓
Phase 2  统一主题编译与可信预览
    ↓
Phase 3  可视化 Theme Editor
    ↓
Phase 4  AI Authoring 与素材工作流
    ↓
Phase 5  Marketplace、更新与信任体系
```

这是一条依赖链，不建议跳过 Phase 2 直接做复杂编辑器，也不建议在 Theme Package、版本和签名模型稳定前建设 Marketplace。

## 2. Phase 0：基线整合与技术验证

### 目标

为 Studio 开发建立可信基线，消除当前功能分支与 `main` 的分叉，验证 Desktop Shell 和 Runtime Adapter 路线。

### 必须完成

- 将 `feat/codex-theme-import-mvp` 同步到最新 `main`；
- 解决 macOS installer、文档和 CI 冲突；
- 为 `.codex-theme` 导入增加自动测试；
- 执行 macOS 实机导入、切换、重启、恢复测试；
- 执行 Windows 回归测试；
- 形成 Tauri 2 技术 Spike；
- 定义 Platform Runtime JSON API v1 草案；
- 确认 Studio 的签名、安装、升级和 sidecar 方案；
- 编写 ADR：Desktop Shell 技术选择。

### 交付物

```text
apps/studio-spike/                    # 可删除的技术验证项目
core/contracts/runtime-api-v1.*       # 契约草案
macos/scripts/* --json                # 至少一个示范操作
windows/scripts/* -Json               # 至少一个示范操作
docs/studio/phases/phase-00-.../
```

### 验收

- CI 恢复绿色；
- 当前脚本功能不回退；
- Studio Spike 能读取平台状态、列出主题并调用一次安全 Apply；
- UI 不能任意执行 Shell 字符串；
- 失败结果能以结构化错误返回。

### 本阶段不做

- 正式主题管理 UI；
- Theme Schema v2；
- Live Preview；
- AI 与 Marketplace。

## 3. Phase 1：Theme Manager MVP

### 产品目标

让普通用户完全通过 Dream Skin Studio 完成：

```text
查看主题 → 导入 → 查看详情 → 应用 → 切换 → 导出 → 删除 → 恢复
```

### 功能范围

#### Theme Library

- 卡片列表；
- 内置、导入、自定义来源标识；
- 当前主题标识；
- 搜索与简单筛选；
- 主题详情；
- preview 图片显示；
- 损坏、不兼容和缺失预览状态。

#### Theme Operations

- 导入 `.codex-theme`；
- 应用；
- 复制；
- 重命名显示名；
- 导出 `.codex-theme`；
- 删除；
- 打开主题所在目录；
- 完全恢复。

#### Runtime Status

- Codex 是否运行；
- Skin active/paused/off；
- 当前主题；
- Runtime 版本；
- Doctor/Verify 入口；
- 日志打开与复制诊断摘要。

### 技术重点

- Studio 仅封装现有 Runtime；
- Theme Repository 兼容无 manifest 的旧主题；
- 删除当前主题时要求先切换或恢复；
- 所有修改使用锁和 staging；
- Theme Card 的 preview 只展示包内预览或安全生成缩略图，不声称是完整实机效果。

### 验收

- macOS 用户不打开终端即可完成整个主题管理闭环；
- Windows 至少实现列表、应用、删除和恢复的同语义版本；
- v1 preset/custom/imported 主题均能被枚举；
- 导入错误在 UI 中可理解；
- 删除和覆盖可恢复；
- SwiftBar/Tray 与 Studio 操作后状态一致。

### 本阶段不做

- 可视化调色编辑；
- 模拟 Codex 的完整实时预览；
- Theme Schema v2；
- AI 与在线市场。

## 4. Phase 2：统一主题编译与可信预览

### 产品目标

建立设计、预览和实机之间的单一来源，解决当前主题概念图与实际渲染不一致的问题。

### 功能范围

- Theme Normalizer；
- Theme Compiler；
- v1 兼容映射；
- Theme Schema v2；
- Light/Dark 独立 token；
- Home/Coding Fixture Preview；
- 多尺寸预览；
- Preview 诊断；
- Live Preview Session；
- Apply/Commit/Revert。

### Theme Schema v2 第一批能力

- `modes.light` / `modes.dark`；
- page/panel/panelAlt/input/text/muted/border；
- homeCard/composer/codeBlock/attachment/userMessage/popover；
- home/task overlays；
- opacity/blur/radius/shadow；
- art focus/safe area/task mode；
- Runtime compatibility。

### 技术重点

- Preview 和 Codex Renderer 共用 compiler 产物；
- Fixture DOM 只模拟结构，不单独推导主题；
- Live Preview 使用独立临时目录；
- Studio 崩溃或超时自动恢复原主题；
- v2 不允许任意 CSS/JS；
- 编译结果有版本号和诊断。

### 验收

- 同一主题在 Fixture Preview 与实机关键 token 一致；
- Light/Dark 能独立设置；
- Coding 页面有稳定阅读层级；
- Live Preview 不覆盖正式主题；
- v1 主题继续正常应用；
- v2 主题可导出、重新导入并保持效果。

### 本阶段不做

- 完整可视化编辑器；
- AI 自动生成；
- Marketplace。

## 5. Phase 3：可视化 Theme Editor

### 产品目标

用户可以在 Studio 中从图片或现有主题创建完整主题，并实时查看 Light/Dark、Home/Coding 场景。

### 功能范围

- 新建主题向导；
- 从现有主题复制；
- 背景图导入和裁切/焦点设置；
- safe area 和 task mode；
- Light/Dark 调色；
- Surface/Overlay/Shadow/Blur/Radius；
- 组件级样式；
- 文案与主题元数据；
- Undo/Redo；
- Draft 自动保存；
- 对比度和可读性检查；
- 保存为新版本；
- 导出 `.codex-theme`。

### 编辑器交互骨架

```text
左侧：属性面板
中间：场景 Preview
右侧：诊断、版本和主题信息
顶部：场景、Light/Dark、撤销、试用、保存、导出
```

### 技术重点

- Editor 只修改 Canonical Theme Model；
- 所有输入有范围限制；
- Draft 与正式主题分离；
- 保存时生成 manifest、theme、preview 和完整性信息；
- 冲突检测：外部文件变化时不静默覆盖。

### 验收

- 从一张背景图到可导入主题不需要手写 JSON；
- Undo/Redo 和崩溃恢复有效；
- 导出的包能在另一台机器导入；
- Editor Preview、Live Preview 和最终 Apply 不出现结构性差异；
- 视觉验收覆盖 Home Light、Home Dark、Coding Light、Coding Dark。

## 6. Phase 4：AI Authoring 与素材工作流

### 产品目标

让 AI 帮助用户从图片、描述或已有主题生成可靠初稿，但用户始终保有控制权。

### 功能范围

- 本地图像分析；
- 自动 palette；
- 自动 Light/Dark；
- safe area 和 focus 建议；
- 对比度修复建议；
- 一键生成主题初稿；
- 主题变体；
- 背景扩图、去 UI、模糊和轻量处理；
- 素材库和来源信息；
- 可选外部模型 Provider；
- 生成历史与可复现参数。

### 隐私要求

- 本地分析默认开启；
- 外部上传默认关闭；
- 上传前显示 Provider、数据类型和用途；
- 不上传 Codex 对话、项目名或用户目录；
- AI 生成素材记录 provenance；
- 人物、IP 和商业授权有提示。

### 验收

- 无网络时仍能完成基础自动主题生成；
- 外部 Provider 未配置时不影响 Studio；
- AI 结果先进入 Draft，不直接覆盖当前主题；
- 每项自动修改可撤销；
- 生成主题通过 Compiler 和可读性校验。

## 7. Phase 5：Marketplace、更新与信任体系

### 产品目标

支持安全浏览、安装和更新第三方主题，形成可持续主题生态。

### 前置条件

- Theme Package 稳定；
- Theme Schema v2 稳定；
- Runtime compatibility 模型稳定；
- 签名和版本策略完成；
- 删除、更新和回滚可靠。

### 功能范围

- Catalog；
- 搜索、标签、排序；
- 详情和截图；
- 安装与更新；
- 收藏；
- 作者与授权信息；
- Hash/Signature；
- 兼容性过滤；
- 已撤销或下架包提示；
- 更新回滚；
- 离线缓存。

### 验收

- Marketplace 包仍是纯数据；
- 下载后独立校验，Catalog 不能绕过本地 importer；
- 更新失败不会破坏旧版本；
- 不兼容主题无法误应用；
- 第三方内容有来源和信任状态；
- 用户可完全关闭 Marketplace 网络访问。

## 8. 跨阶段基础工程

每个阶段都要持续维护：

- 双平台 CI；
- Schema 测试；
- Import/Export round-trip；
- Runtime Adapter contract tests；
- 路径与包安全测试；
- Fixture visual regression；
- 实机 Verify；
- 日志脱敏；
- 文档和 Changelog；
- Release rollback。

## 9. 依赖关系

```text
Theme Manager
  └──依赖：现有主题库 + 平台 Runtime

可信 Preview
  └──依赖：Theme Compiler + Schema v2

Editor
  └──依赖：Preview + Draft + Compiler

AI Authoring
  └──依赖：Editor + Asset Library + Compiler

Marketplace
  └──依赖：Package + Version + Signature + Compatibility
```

## 10. 阶段优先级建议

最优执行顺序：

1. Phase 0 不可跳过；
2. Phase 1 先解决“有没有 Studio”的问题；
3. Phase 2 解决“预览是否可信”的问题；
4. Phase 3 解决“能否真正创作”的问题；
5. Phase 4、5 在核心产品稳定后推进。

不建议在 Phase 1 同时加入复杂编辑器、AI 和 Marketplace，否则会把当前可靠 Runtime 淹没在一轮难以验证的大重构中。
