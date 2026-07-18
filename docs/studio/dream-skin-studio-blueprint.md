# Dream Skin Studio 产品与架构骨架

> 文档级别：L0 总体设计  
> 适用范围：macOS + Windows 目标架构  
> 说明：本文定义长期骨架，不替代每个阶段开始前的详细设计。

## 1. 产品愿景

Dream Skin Studio 的最终形态不是“一个更漂亮的脚本入口”，而是一个本地优先、可恢复、可扩展的桌面主题工作台：

```text
管理主题
  + 预览主题
  + 创作主题
  + 随意切换
  + 导入/导出
  + AI 辅助生成
  + 诊断与恢复
  + 可选主题市场
```

核心体验目标：

1. 用户不需要理解 Shell、PowerShell、CDP 或主题目录；
2. 主题卡片能够展示真实元数据和预览；
3. 点击“试用”不会破坏当前主题，退出可恢复；
4. 点击“应用”后立即生效，并保留重启持久性；
5. 编辑器中看到的效果与 Codex 实机使用同一套主题编译结果；
6. 故障时 Studio 能说明原因并提供安全恢复；
7. macOS 和 Windows 体验一致，平台安全实现允许不同。

## 2. 产品信息架构

```text
Dream Skin Studio
├── 主题库 Themes
│   ├── 全部主题
│   ├── 已安装
│   ├── 内置主题
│   ├── 我的创作
│   └── 最近使用
├── 预览 Preview
│   ├── 浅色首页
│   ├── 深色首页
│   ├── Coding 对话页
│   └── 实机临时试用
├── 编辑器 Editor
│   ├── 背景与构图
│   ├── Light / Dark
│   ├── Surface 与组件
│   ├── Overlay / Blur / Shadow
│   ├── 文案与品牌
│   └── 版本、元数据与导出
├── 素材 Assets
│   ├── 背景图
│   ├── 预览图
│   ├── 调色板
│   └── 来源与授权信息
├── AI 创作 AI Create
│   ├── 图片分析
│   ├── 自动调色
│   ├── 构图建议
│   ├── 主题初稿
│   └── 可选外部生成服务
├── 主题市场 Marketplace
│   ├── 浏览
│   ├── 安装
│   ├── 更新
│   ├── 收藏
│   └── 信任与签名
└── 设置与诊断 Settings
    ├── Runtime 状态
    ├── Codex 路径与版本
    ├── 日志与 Doctor
    ├── 导入/导出目录
    ├── 安全与隐私
    └── 完全恢复
```

第一阶段不会同时实现所有模块。左侧导航可以按能力逐步解锁，但整体信息架构应保持稳定。

## 3. 架构原则

### 3.1 控制面与执行面分离

```text
Studio UI / App Core                  控制面
        ↓
Platform Runtime Adapter
        ↓
现有 macOS Shell / Node 或 Windows PowerShell / Node
        ↓
Injector + Renderer + Codex           执行面
```

Studio 负责：

- 展示；
- 编排；
- 校验反馈；
- 用户意图；
- 主题域操作；
- 预览会话；
- 编辑和导出。

现有 Runtime 继续负责：

- Codex 发现与签名/包身份；
- CDP 端口和进程所有权；
- 启动、注入、Watcher；
- 原子发布；
- Verify、Doctor、Restore；
- 平台配置安全。

### 3.2 文件系统是主题事实来源

主题实体继续保存在用户主题库：

```text
<STATE_ROOT>/themes/<theme-id>/
```

Studio 可以增加索引数据库，但数据库只保存：

- 搜索索引；
- 最近使用；
- 收藏；
- UI 状态；
- 缓存的缩略图和分析结果。

主题文件本身必须可独立复制、导出和恢复，不能只存在数据库 BLOB 中。

### 3.3 预览与运行时单一来源

为解决过去“设计图与实机不一致”的问题，目标链路必须是：

```text
Theme Source
    ↓ normalize + migrate
Canonical Theme Model
    ↓ compile
Runtime Tokens / Surface Tokens / Overlay Tokens
    ├──→ Studio Preview Renderer
    └──→ Codex Runtime Renderer
```

禁止：

```text
Studio 单独写一套预览 CSS
Codex Injector 再写另一套运行 CSS
```

Preview 可以使用模拟 Codex Fixture DOM，但 token 编译、Light/Dark 解析、Surface 计算和 Overlay 规则必须共享。

### 3.4 向后兼容

Theme Schema v1 和现有主题目录必须继续可用。

读取流程：

```text
v1 theme.json
  ↓ ThemeNormalizer
Canonical Theme Model
  ↓ 可选升级导出
v2 theme.json
```

旧主题默认通过兼容策略生成缺失 token，不要求用户立即迁移。

### 3.5 所有写操作事务化

以下操作必须 staging + validate + atomic publish：

- 导入；
- 覆盖更新；
- 编辑保存；
- 应用；
- 删除；
- 导出；
- Schema 迁移；
- Marketplace 更新。

## 4. 推荐技术形态

### 4.1 Desktop Shell

目标推荐：**Tauri 2 + React/TypeScript**。

理由：

- 同一套 UI 覆盖 macOS 与 Windows；
- 安装包和运行体积相对 Electron 更轻；
- 可通过受控命令调用现有平台 Runtime；
- 能提供原生文件选择、拖拽、通知和窗口；
- 前端适合复杂编辑器、主题卡片和实时预览。

但该选择在 Phase 0 必须通过技术 Spike 和 ADR 确认。若 Tauri sidecar、签名或平台发布成本不符合项目条件，可回退为：

- macOS SwiftUI + Windows WinUI/WPF 两套 Shell；或
- Electron 单 Shell。

无论 Shell 技术如何变化，下面的域接口和数据契约不应变化。

### 4.2 App Core

推荐使用 TypeScript 编写跨平台主题域逻辑：

- Schema；
- Normalize/Migrate；
- Compile；
- Package；
- Preview fixtures；
- Theme metadata；
- 操作结果模型。

平台敏感操作由 Tauri/Rust command 或受控 sidecar 进入现有脚本。

### 4.3 Platform Adapter

统一接口示意：

```ts
interface ThemeRuntimeAdapter {
  capabilities(): Promise<PlatformCapabilities>;
  status(): Promise<RuntimeStatus>;
  listThemes(): Promise<ThemeSummary[]>;
  importPackage(path: string, options?: ImportOptions): Promise<ImportResult>;
  applyTheme(id: string): Promise<ApplyResult>;
  beginPreview(idOrDraft: ThemeSource): Promise<PreviewSession>;
  revertPreview(sessionId: string): Promise<void>;
  verify(): Promise<VerifyResult>;
  restore(options: RestoreOptions): Promise<RestoreResult>;
}
```

早期实现不直接重写脚本，而是调用：

- macOS：现有 `switch-theme-macos.sh`、`import-theme-macos.sh`、start/verify/restore 等；
- Windows：现有 `theme-windows.ps1`、start/verify/restore 等。

后续只有在测试覆盖充分时，才将重复域逻辑移入共享 Core。

## 5. 目标模块边界

### 5.1 Theme Repository

职责：

- 枚举主题目录；
- 读取 manifest/theme；
- 生成兼容视图；
- 获取缩略图；
- 检测重复 ID、损坏和不兼容；
- 删除、复制、重命名；
- 不直接控制 Codex。

### 5.2 Theme Package Service

职责：

- 导入 `.codex-theme`；
- 导出 `.codex-theme`；
- 包清单、安全校验和完整性；
- 将来支持签名和远程来源；
- 复用现有纯数据原则。

### 5.3 Theme Normalizer / Migrator

职责：

- v1 → Canonical Model；
- v2 → Canonical Model；
- 默认值和兼容策略；
- 字段级错误和警告；
- 无损保留未知扩展字段。

### 5.4 Theme Compiler

职责：

- 解析 Light/Dark；
- 从主题与图像分析生成 token；
- 生成 Surface、Overlay、Typography、Motion token；
- 生成 Preview 与 Runtime 共用的稳定产物；
- 输出编译诊断。

编译结果示意：

```json
{
  "themeId": "soft-family-calm-v3",
  "mode": "dark",
  "tokens": {
    "color.page": "#0f1b26",
    "surface.card": "rgba(...) ",
    "surface.composer": "rgba(...) ",
    "text.primary": "#eef3f5",
    "shadow.card": "0 8px 28px rgba(...)"
  },
  "art": {
    "position": "79% 46%",
    "homeOverlay": "...",
    "taskOverlay": "..."
  },
  "diagnostics": []
}
```

### 5.5 Preview Service

两级预览：

#### A. Fixture Preview

Studio 内置三套稳定场景：

- Home Light；
- Home Dark；
- Coding Dark/Light。

它们使用模拟 DOM，不依赖 Codex 当前版本，适合编辑时快速反馈。

#### B. Live Preview

把 Draft 编译结果临时发布到独立预览槽位并热应用到 Codex：

```text
当前主题快照
  ↓
临时 Preview Session
  ↓
Apply Draft
  ↓ 用户确认
Commit 或 Revert
```

必须具备：

- session ID；
- 超时；
- Codex/Studio 异常退出后的自动恢复；
- 仅一个活动预览；
- 不覆盖主题库正式版本；
- Preview 与 Apply 明确区分。

### 5.6 Theme Editor

编辑器只编辑 Canonical Model，不直接写 CSS。

首批面板：

- 基础信息；
- 背景图；
- focus/safe area/task mode；
- Light/Dark 基础颜色；
- Card/Composer/Code/Attachment/User Message；
- Overlay、透明度、Blur、Shadow、Radius；
- 实时诊断；
- Undo/Redo；
- 保存副本；
- 导出包。

### 5.7 Asset Library

素材实体与主题引用分离：

```text
assets/<asset-id>/
├── source
├── prepared variants
├── thumbnail
└── metadata.json
```

元数据建议包含：

- hash；
- dimensions；
- mime；
- origin；
- author/license note；
- importedAt；
- derivedFrom；
- AI generated 声明。

### 5.8 AI Authoring

AI 功能必须是可选增强，不作为主题加载的强依赖。

本地能力优先：

- 图像亮度/色彩/焦点分析；
- 对比度检查；
- palette 建议；
- safe area 建议；
- 自动生成初始主题。

外部 AI 可用于：

- 生成背景；
- 扩图与修图；
- 文案；
- 风格变体。

任何上传都必须明确说明数据将发送到哪里，并要求用户确认。

### 5.9 Marketplace

Marketplace 是后期模块，必须建立在稳定 Theme Package、版本、签名和兼容模型之上。

核心能力：

- Catalog；
- Search/Tags；
- Install/Update；
- Hash/Signature；
- Runtime compatibility；
- 作者与授权声明；
- 举报和下架；
- 离线缓存。

## 6. Theme Schema v2 骨架

具体 JSON Schema 在对应阶段细化。总体方向：

```json
{
  "schemaVersion": 2,
  "id": "theme-id",
  "name": "Theme Name",
  "appearance": "auto",
  "art": {
    "image": "background.jpg",
    "focus": { "x": 0.79, "y": 0.46 },
    "safeArea": "left",
    "taskMode": "ambient"
  },
  "modes": {
    "light": {
      "colors": {},
      "surfaces": {},
      "overlays": {}
    },
    "dark": {
      "colors": {},
      "surfaces": {},
      "overlays": {}
    }
  },
  "components": {
    "homeCard": {},
    "composer": {},
    "codeBlock": {},
    "attachment": {},
    "userMessage": {},
    "popover": {}
  },
  "typography": {},
  "motion": {},
  "extensions": {}
}
```

设计约束：

- 不允许任意 JavaScript/CSS 注入；
- 只允许白名单 token；
- 数值设置有边界；
- v1 字段可映射；
- 不认识的未来字段默认忽略并保留；
- 编译器负责将高层 token 映射到 Runtime CSS 变量。

## 7. 目标数据布局

概念布局：

```text
<STATE_ROOT>/
├── runtime/
│   ├── state.json
│   ├── active-theme/
│   ├── preview-session.json
│   └── logs/
├── themes/
│   └── <theme-id>/
├── assets/
│   └── <asset-id>/
├── studio/
│   ├── index.sqlite        # 可选索引，不是主题事实来源
│   ├── thumbnails/
│   ├── drafts/
│   ├── backups/
│   └── preferences.json
└── marketplace/
    ├── catalog-cache.json
    └── packages/
```

现有 `theme/`、`themes/`、`images/` 路径不会在第一阶段强制迁移。Studio Adapter 先兼容旧布局，再通过正式迁移阶段调整。

## 8. 安全模型

### 8.1 Studio 权限最小化

- UI 不直接访问 Codex CDP；
- UI 不拼接 Shell 命令；
- 所有命令使用结构化参数；
- 文件选择后由 Core 重新校验 realpath 和类型；
- 导入包仍为纯数据；
- 外部 URL 和 Marketplace 内容不直接执行。

### 8.2 预览安全

- Preview 只能使用受控 token；
- Preview Session 写入独立临时目录；
- Preview 开始前保存激活快照；
- 失败、超时、崩溃均自动 Revert；
- 不允许多个并发写主题操作。

### 8.3 Marketplace 信任

后期至少支持：

- SHA-256；
- 作者签名或平台签名；
- 内容类型白名单；
- 版本和 Runtime 兼容声明；
- 可撤销 Catalog；
- 用户明确确认第三方素材和人物权利。

## 9. 兼容与演进策略

### 9.1 Runtime API 版本

Studio 与平台 Runtime 通过版本化 JSON 结果通信：

```json
{
  "apiVersion": 1,
  "ok": true,
  "operation": "applyTheme",
  "data": {},
  "warnings": [],
  "error": null
}
```

避免依赖脚本的人类可读 stdout 文案。

### 9.2 Capability Detection

平台 Adapter 返回：

```json
{
  "importPackage": true,
  "livePreview": false,
  "themeSchema": [1],
  "verifyScreenshot": true,
  "platform": "macos"
}
```

UI 根据能力显示，不假设两个平台同步完成所有功能。

### 9.3 渐进替换

```text
阶段 1：Studio 调现有脚本
阶段 2：脚本增加 --json / API 契约
阶段 3：抽取共享 Theme Core
阶段 4：必要时替换重复平台逻辑
```

不进行一次性大重写。

## 10. 非目标

总体架构不包含：

- 修改或分发官方 Codex 二进制；
- 注入任意第三方 JS/CSS；
- 远程控制用户 Codex；
- 将 API 中转配置合并到主题产品；
- 在无用户授权时上传背景图；
- 用静态截图替代真实 Codex 控件；
- 第一阶段就建设完整社区、账号和云同步。

## 11. 关键成功标准

Dream Skin Studio 达到“产品化”至少需要：

1. 新用户通过 UI 完成导入、预览、应用、切换和恢复；
2. 主题库操作不依赖终端；
3. Preview 与 Runtime 共享 Theme Compiler；
4. v1 主题不损坏；
5. macOS 与 Windows 有一致操作语义；
6. 任何失败均不留下半写主题或无法恢复的 Codex 状态；
7. Theme Editor 能导出标准 `.codex-theme`；
8. 实机 Verify 成为发布门禁，而不是人工可选项。
