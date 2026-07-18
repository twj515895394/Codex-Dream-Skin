# 当前项目基线与能力梳理

> 基线分支：`feat/codex-theme-import-mvp`  
> 基线日期：2026-07-18  
> 目的：在设计 Dream Skin Studio 前，明确当前项目已经具备什么、哪些能力应复用、哪些问题不能被 UI 掩盖。

## 1. 项目定位

Codex Dream Skin 是面向官方 Codex Desktop 的外部主题系统：

```text
用户工具 / 脚本
    ↓ 启动官方 Codex，并仅在本机回环地址开放 CDP
官方 Codex Desktop
    ↓ 注入 CSS、主题变量和少量装饰 DOM
原生侧栏、页面、卡片、输入框继续可交互
```

当前实现的核心原则是：

- 不修改官方 `.app`、`app.asar`、WindowsApps 或代码签名；
- 不把截图伪装成可交互 UI；
- 不把主题功能与 API Key、Base URL 或模型中转配置耦合；
- 通过 Restore 随时撤销注入并恢复官方外观；
- 主题运行时只接受可信的本地数据和经过校验的 Codex 进程。

Dream Skin Studio 必须继承这些边界，而不是重新发明一套更弱的实现。

## 2. 当前仓库分层

### 2.1 文档与发布层

仓库根目录提供：

- 中英文 README；
- 平台能力对照；
- 背景图生成规范和示例；
- Issue / PR 模板；
- macOS 客户 ZIP 构建脚本；
- 平台独立的安装与恢复说明。

当前分支新增：

- `.codex-theme` 主题包规范；
- macOS 导入设计文档；
- macOS 实机使用指南。

### 2.2 macOS 运行层

安装后引擎位于：

```text
~/.codex/codex-dream-skin-studio
```

用户状态位于：

```text
~/Library/Application Support/CodexDreamSkinStudio/
├── state.json
├── theme/                  # 当前激活主题的发布目录
├── themes/                 # 已保存主题库
├── images/                 # 图片库
├── logs...
└── menubar/                # SwiftBar 插件
```

主要能力：

- 发现并验证官方 Codex App；
- 验证 Codex 自带签名 Node.js、Team ID、架构和最低版本；
- 通过 `launchd` 启动带回环 CDP 的 Codex；
- 校验 CDP 端口属于 Codex 或合法子进程；
- 持续 injector watcher，支持重载和路由切换；
- 热应用主题，失败时回退到完整启动路径；
- Verify、截图、Doctor、Restore；
- SwiftBar 菜单栏入口。

### 2.3 Windows 运行层

Windows 运行状态位于：

```text
%LOCALAPPDATA%\CodexDreamSkin
```

当前 Windows 具备：

- Store 包动态发现；
- Node 和包身份校验；
- CDP 启动、注入、验证与恢复；
- 系统托盘；
- 主题保存、切换、图片导入、暂停；
- 配置 UTF-8 安全备份与原子恢复；
- 路径重解析点、进程身份和状态锁等安全控制。

当前 `.codex-theme` 导入器只在 macOS 分支落地，尚未形成跨平台统一入口。

## 3. 当前主题域模型

### 3.1 主题目录

已保存主题采用目录模型：

```text
themes/<theme-id>/
├── theme.json
└── background.jpg|png|webp
```

导入后的主题还可保留：

```text
manifest.json
preview.jpg
```

激活主题不是通过引用主题库目录直接运行，而是由切换流程将主题和背景图安全 staging 后发布到：

```text
STATE_ROOT/theme/
```

`theme.json` 最后写入，作为提交标记，避免 watcher 观察到只复制了一半的主题。

### 3.2 Theme Schema v1

当前主题主要字段：

```json
{
  "schemaVersion": 1,
  "id": "theme-id",
  "name": "主题名",
  "brandSubtitle": "...",
  "tagline": "...",
  "projectPrefix": "...",
  "projectLabel": "...",
  "statusText": "...",
  "quote": "...",
  "image": "background.jpg",
  "appearance": "auto",
  "art": {
    "focusX": 0.72,
    "focusY": 0.45,
    "safeArea": "left",
    "taskMode": "ambient"
  },
  "colors": {
    "background": "#...",
    "panel": "#...",
    "panelAlt": "#...",
    "accent": "#...",
    "accentAlt": "#...",
    "secondary": "#...",
    "highlight": "#...",
    "text": "#...",
    "muted": "#...",
    "line": "rgba(...)"
  }
}
```

当前 Schema 是一套扁平颜色。Renderer 会根据原生 light/dark shell、图像分析和显式颜色共同生成 CSS 变量。

### 3.3 图像自适应

Renderer 在本地 Canvas 中分析背景图：

- 亮度；
- 主要强调色；
- 左右信息密度；
- 视觉焦点；
- 图片比例；
- 推荐 safe area 和 task mode。

图片像素不上传外部服务。显式的 `appearance`、`art` 和颜色字段优先于自动推断。

### 3.4 `.codex-theme` 包

当前分支定义 `.codex-theme` 为纯数据 ZIP：

```text
My-Theme.codex-theme
├── manifest.json
├── theme.json
├── background.jpg
├── preview.jpg    # 可选
└── README.md      # 可选
```

macOS 导入器已经实现：

- 扩展名与 64 MB 包大小限制；
- ZIP 清单预检查；
- 路径穿越拒绝；
- 可执行文件拒绝；
- 解压后符号链接和特殊文件拒绝；
- manifest/theme ID 一致性；
- 复用 injector payload 校验；
- 原子覆盖同 ID 主题；
- 导入后复用 `switch-theme-macos.sh` 应用。

这意味着 Studio 不需要重新设计“主题如何导入和生效”，而应把现有能力封装为稳定的应用服务。

## 4. 当前用户入口

### macOS

- Desktop `.command`：安装、启动、定制、导入、验证、恢复；
- SwiftBar：应用、暂停、换图、已保存主题、图片文件夹、恢复；
- CLI：供维护者、自动化和故障排查使用。

### Windows

- PowerShell 安装/启动/恢复/验证；
- Windows Forms 系统托盘；
- CLI 与状态目录。

这些入口能完成任务，但存在明显问题：

- 分散；
- 不可视；
- 缺少主题卡片和预览；
- 删除、导出、复制、编辑不完整；
- 用户需要理解脚本、文件夹或菜单项；
- macOS 与 Windows 体验不一致。

## 5. 已有安全与可靠性资产

Studio 必须直接复用或等价保留：

1. Codex 官方签名和包身份校验；
2. CDP 只绑定 `127.0.0.1`；
3. 端口所有权和 Browser ID/renderer marker 校验；
4. injector 进程身份、启动时间和命令行匹配；
5. 主题路径 realpath containment；
6. 16 MB、16384px 单边和 50MP 图片限制；
7. staging 与原子发布；
8. 配置 UTF-8、操作锁和字节级备份；
9. Verify/Doctor/截图验收；
10. Decoration `pointer-events: none`，不破坏原生控件。

Studio UI 不能绕过这些保护直接复制文件或控制 Codex。

## 6. 当前缺口

### 6.1 没有统一控制面

目前没有一个应用可以集中提供：

- 主题列表；
- 搜索、筛选和排序；
- 预览；
- 应用与临时试用；
- 删除、复制、重命名和导出；
- 主题详情和兼容性状态；
- Runtime 状态和诊断。

### 6.2 预览和实机缺少统一编译链

当前主题效果由 Renderer 内部动态推导，而设计图通常由外部工具单独制作。结果是：

- 设计稿可能表达了当前 Schema 无法控制的组件；
- 浅色与深色共用扁平颜色，难以精确匹配；
- 首页、Coding 页面、代码块、附件卡片和输入框无法独立配置；
- Studio 如果只做一张静态 mockup，会再次出现“预览好看、实机不同”。

这是 Studio 架构中最重要的技术缺口。

### 6.3 Theme Schema v1 表达力不足

当前缺少：

- 独立 light/dark token；
- 组件 surface token；
- 首页与任务页独立 overlay；
- 阴影、圆角、模糊、透明度；
- 代码块、用户消息、附件、composer 的独立样式；
- 版本迁移、能力声明和兼容范围。

### 6.4 主题元数据不完整

当前主题库不保证每个目录都存在：

- manifest；
- preview；
- author；
- tags；
- createdAt/updatedAt；
- source provenance；
- compatible runtime range；
- integrity hash。

Studio 需要在不破坏旧主题的前提下补齐规范化视图。

### 6.5 跨平台实现重复

macOS Shell、Windows PowerShell、SwiftBar 和 Tray 各自读取主题目录并执行操作。长期需要统一域操作语义，但不应强行统一底层进程实现。

## 7. 对 Studio 设计的直接结论

1. **Studio 是控制面，不是新的 injector。**
2. **现有平台脚本先封装为 Adapter，早期不重写。**
3. **主题库目录仍是事实来源，数据库只做索引或缓存。**
4. **必须建立 Theme Normalizer/Compiler，预览和实机共同消费同一编译结果。**
5. **Theme Schema v2 必须向后兼容 v1。**
6. **临时预览必须可回滚，不能直接覆盖用户当前主题。**
7. **跨平台统一的是命令和数据契约，不是所有底层代码。**
8. **Studio 开发前先同步 main 并恢复 CI 基线。**

## 8. 分支集成风险

当前功能分支相对 `main` 已分叉：ahead 6、behind 12。`main` 后续包含 CI、Windows 安全加固和少量 Renderer 修复。

进入 Studio 实现前的强制动作：

```text
同步 main
  ↓
解决 import/installer/docs 冲突
  ↓
执行 macOS 与 Windows 测试
  ↓
确认 .codex-theme 导入器仍通过实机测试
  ↓
再创建 Studio 开发分支
```

总体设计可以继续在当前分支落地，但任何生产代码不得以“忽略 main 的 12 个提交”为前提。
