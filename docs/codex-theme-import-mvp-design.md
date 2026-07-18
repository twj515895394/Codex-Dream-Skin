# `.codex-theme` 导入能力 MVP 设计文档

## 1. 背景

Codex Dream Skin 已经具备以下能力：

- 保存本地主题；
- 在 `~/Library/Application Support/CodexDreamSkinStudio/themes/<theme-id>/` 中管理主题；
- 通过 `switch-theme-macos.sh` 切换主题；
- 通过现有 injector 校验并应用主题；
- 在 CDP 可用时进行热切换，在 CDP 不可用时走完整启动流程。

本次改造不重做主题系统，而是在现有主题库前增加一个标准化的、纯数据的主题分发格式：

```text
.codex-theme
```

目标是让 AI、设计工具或主题作者可以生成一个可分享的主题包，用户导入后直接复用现有主题切换能力。

---

## 2. 设计目标

本次 MVP 只解决四个问题：

1. 定义 `.codex-theme` 数据包格式；
2. 在 macOS 上安全导入主题包；
3. 将主题安装到现有本地主题库；
4. 复用现有 `switch-theme-macos.sh` 自动应用主题。

本次不实现：

- 在线主题市场；
- 主题签名与远程信任链；
- GUI 主题商店；
- 跨平台统一导入器；
- 新的 Registry、Resolver 或 Runtime 抽象层。

---

## 3. 核心原则

### 3.1 主题包只包含数据

`.codex-theme` 本质上是一个 ZIP 压缩包，但主题包本身不执行任何代码。

主题包禁止包含：

- `.command`
- `.sh` / `.bash` / `.zsh`
- `.js` / `.mjs` / `.cjs`
- `.py` / `.rb` / `.pl`
- `.app` / `.pkg` / `.dmg`
- `.exe` / `.dll` / `.dylib` / `.so`
- 其他明显可执行文件

这样可以把“主题内容”和“运行时程序”彻底分开，降低下载主题时触发 Gatekeeper 或执行未知代码的风险。

### 3.2 不改现有 Injector

现有 injector 已经负责：

- 校验 `theme.json`；
- 校验背景图路径；
- 校验图片大小与尺寸；
- 读取主题并注入 Codex；
- 监听主题变化并热更新。

因此导入器不复制 injector 的逻辑，而是调用：

```bash
injector.mjs --check-payload --theme-dir <package-root>
```

保证导入主题和现有预设主题使用同一套校验规则。

### 3.3 不新建主题运行时

导入后的主题直接安装到现有主题库：

```text
~/Library/Application Support/CodexDreamSkinStudio/themes/<theme-id>/
```

应用时继续调用：

```bash
switch-theme-macos.sh --id <theme-id>
```

---

## 4. 主题包格式

MVP 支持如下结构：

```text
My-Theme.codex-theme
├── manifest.json
├── theme.json
├── background.jpg
├── preview.jpg        # 可选
└── README.md          # 可选
```

主题包也可以多包一层目录：

```text
My-Theme.codex-theme
└── My-Theme/
    ├── manifest.json
    ├── theme.json
    └── background.jpg
```

导入器会自动识别“根目录”或“单一顶层目录”两种形式。

### 4.1 `manifest.json`

示例：

```json
{
  "schemaVersion": 1,
  "id": "soft-family-calm-20260717",
  "name": "柔光相伴",
  "version": "1.0.0",
  "description": "柔和、低刺激、适合长时间创作与编码的主题。",
  "theme": "theme.json",
  "preview": "preview.jpg"
}
```

MVP 必需字段：

- `schemaVersion`：必须为 `1`；
- `id`：只能包含字母、数字、下划线和连字符，长度 1–80；
- `name`：非空字符串；
- `theme`：必须为 `theme.json`。

可选字段：

- `version`
- `description`
- `preview`

`preview` 必须是主题包根目录内的普通文件名，不能包含路径跳转。

### 4.2 `theme.json`

继续沿用项目现有主题格式，例如：

```json
{
  "schemaVersion": 1,
  "id": "soft-family-calm-20260717",
  "name": "柔光相伴",
  "brandSubtitle": "SOFT FAMILY CALM",
  "tagline": "在柔和的光影里，安静地创造美好的事物。",
  "projectPrefix": "选择项目 · ",
  "projectLabel": "◌  选择项目",
  "statusText": "CALM MODE ONLINE",
  "quote": "MAKE SOMETHING GENTLE",
  "image": "soft-family-background.jpg",
  "appearance": "auto",
  "art": {
    "focusX": 0.66,
    "focusY": 0.48,
    "safeArea": "left",
    "taskMode": "ambient"
  }
}
```

约束：

- `schemaVersion` 必须为 `1`；
- `theme.id` 必须与 `manifest.id` 一致；
- `image` 必须是包根目录中的普通文件名；
- 图片必须通过现有 injector 校验。

---

## 5. 导入流程

入口脚本：

```text
macos/scripts/import-theme-macos.sh
```

完整流程：

```text
用户选择 .codex-theme
        ↓
校验扩展名和文件大小
        ↓
读取 ZIP 文件清单
        ↓
拒绝路径穿越和可执行文件
        ↓
解压到 STATE_ROOT 下的临时目录
        ↓
拒绝符号链接和特殊文件
        ↓
定位主题包根目录
        ↓
解析 manifest.json 和 theme.json
        ↓
校验 ID、主题文件、背景图和预览图
        ↓
调用 injector --check-payload
        ↓
复制到 themes/<theme-id>
        ↓
原子替换已有同 ID 主题
        ↓
调用 switch-theme-macos.sh
```

---

## 6. 安全设计

### 6.1 文件大小限制

主题包最大 64 MB：

```text
67,108,864 bytes
```

背景图继续受 injector 和现有主题切换流程的 16 MB 限制。

### 6.2 ZIP 路径检查

解压前读取 ZIP 清单并拒绝：

- 绝对路径；
- `../`；
- 目录末尾的 `/..`；
- 明显可执行文件扩展名。

### 6.3 解压后文件检查

解压完成后再次检查：

- 符号链接；
- 非普通文件；
- 非目录文件类型。

这一步用于防止 ZIP 元数据与解压结果之间存在差异。

### 6.4 使用 Codex 自带签名 Node.js

导入器不依赖用户自行安装 Node.js，而是复用 Codex 应用内置且经过签名验证的 Node.js Runtime。

相关逻辑继续由：

```text
common-macos.sh
```

中的：

```bash
discover_codex_app
require_macos_runtime
```

负责。

### 6.5 原子替换

导入同 ID 主题时：

1. 先将新主题写入临时目录；
2. 将旧主题移动到临时备份位置；
3. 将新主题移动到正式目录；
4. 失败时恢复旧主题；
5. 成功后删除旧主题。

避免用户主题库中出现半写入状态。

---

## 7. 与现有系统的集成

### 7.1 安装器

`install-dream-skin-macos.sh` 新增桌面启动器：

```text
Codex Dream Skin - Import Theme.command
```

启动器只调用已安装在本机的受信任项目脚本：

```bash
import-theme-macos.sh
```

主题包自身不包含任何命令文件。

### 7.2 主题库

导入后的主题目录：

```text
~/Library/Application Support/CodexDreamSkinStudio/themes/<theme-id>/
```

内部保留：

```text
theme.json
背景图
manifest.json
preview 文件（若提供）
```

### 7.3 应用主题

默认导入后立即应用：

```bash
switch-theme-macos.sh --id <theme-id>
```

命令行可使用 `--no-apply` 只导入不切换。

---

## 8. 当前改动文件

```text
macos/scripts/import-theme-macos.sh
macos/scripts/install-dream-skin-macos.sh
docs/theme-package-specification.md
docs/codex-theme-import-mvp-design.md
docs/codex-theme-import-macos-guide.md
```

---

## 9. MVP 验收标准

### 导入成功

- 可以选择 `.codex-theme` 文件；
- 正确主题能够安装到本地主题库；
- 同 ID 主题能够安全覆盖；
- 导入后可自动应用；
- 可在“已保存的主题”中继续切换。

### 非法包被拒绝

至少应拒绝：

- 非 ZIP 文件；
- 非 `.codex-theme` 扩展名；
- 超过 64 MB 的包；
- 缺少 `manifest.json`；
- 缺少 `theme.json`；
- ID 不一致；
- 背景图缺失；
- 路径穿越；
- 符号链接；
- 可执行脚本或应用程序。

### 不破坏现有能力

- 现有预设主题仍然可用；
- `switch-theme-macos.sh` 行为不变；
- Customize、Verify、Restore 入口不受影响；
- injector 不需要新增主题包相关逻辑。

---

## 10. 后续演进建议

MVP 实机验证通过后，再考虑：

1. 将导入入口加入菜单栏，而不仅是桌面 `.command`；
2. 增加主题包拖拽导入；
3. 增加主题预览确认页；
4. 增加导出当前主题为 `.codex-theme`；
5. 增加 Windows 导入器；
6. 增加主题包签名、作者信息和兼容版本字段；
7. 增加 Theme Authoring Skill 自动打包能力。

当前阶段应优先保证 macOS 导入、校验、覆盖和应用流程稳定。