# `.codex-theme` 主题包规范（MVP）

`.codex-theme` 是一个**仅包含数据的 ZIP 文件**。它不包含也不执行 `.command`、Shell、JavaScript、Python、应用程序或安装器，因此主题包本身不会触发脚本执行。

## 文件结构

主题包根目录可以直接包含文件，也可以额外包一层同名目录：

```text
Soft-Family-Calm.codex-theme
├── manifest.json
├── theme.json
├── background.jpg
└── preview.jpg        # 可选
```

MVP 只允许 `theme.json` 引用主题包根目录中的单个背景文件。背景文件和预览文件不允许使用子目录路径。

## `manifest.json`

```json
{
  "schemaVersion": 1,
  "id": "soft-family-calm",
  "name": "柔光相伴",
  "version": "1.0.0",
  "description": "柔和、低干扰的工作台主题。",
  "theme": "theme.json",
  "preview": "preview.jpg"
}
```

必填字段：

- `schemaVersion`：当前必须为 `1`
- `id`：1–80 个字符，只允许字母、数字、下划线和连字符
- `name`：非空字符串
- `theme`：当前必须为 `theme.json`

可选字段：

- `version`
- `description`
- `preview`：主题包根目录中的普通文件名

## `theme.json`

`theme.json` 继续使用 Codex Dream Skin 现有 schemaVersion 1 格式：

```json
{
  "schemaVersion": 1,
  "id": "soft-family-calm",
  "name": "柔光相伴",
  "brandSubtitle": "SOFT FAMILY CALM",
  "tagline": "在柔和的光影里，安静地创造美好的事物。",
  "projectPrefix": "选择项目 · ",
  "projectLabel": "◌  选择项目",
  "statusText": "CALM MODE ONLINE",
  "quote": "MAKE SOMETHING GENTLE",
  "image": "background.jpg",
  "appearance": "auto",
  "colors": {
    "background": "#243744",
    "panel": "#2d414e",
    "panelAlt": "#38505e",
    "accent": "#7faec5",
    "accentAlt": "#a9cbd9",
    "secondary": "#c7dce5",
    "highlight": "#9b858d",
    "text": "#f3f7f8",
    "muted": "#bdcbd1",
    "line": "rgba(127, 174, 197, .24)"
  }
}
```

`theme.id` 必须和 `manifest.id` 完全一致。`theme.image` 必须是主题包根目录中的普通文件名。

## 安全限制

导入器会拒绝：

- 绝对路径或包含 `..` 的路径
- 符号链接和特殊文件
- 超过 64 MB 的主题包
- `.command`、Shell、JavaScript、Python、应用程序、动态库、安装器等可执行内容
- 缺失或无效的 `manifest.json` / `theme.json`
- 不符合现有 injector 校验规则的背景图和主题配置

## 导入与应用

安装最新版 Runtime 后，可以双击桌面入口：

```text
Codex Dream Skin - Import Theme.command
```

也可以使用命令：

```bash
~/.codex/codex-dream-skin-studio/scripts/import-theme-macos.sh \
  --file ~/Downloads/Soft-Family-Calm.codex-theme
```

导入器会把主题安装到：

```text
~/Library/Application Support/CodexDreamSkinStudio/themes/<theme-id>
```

默认导入后立即复用现有 `switch-theme-macos.sh` 应用主题。仅导入、不立即应用：

```bash
~/.codex/codex-dream-skin-studio/scripts/import-theme-macos.sh \
  --file ~/Downloads/Soft-Family-Calm.codex-theme \
  --no-apply
```

## 打包

在包含 `manifest.json`、`theme.json` 和图片文件的目录内执行：

```bash
/usr/bin/ditto -c -k --sequesterRsrc --keepParent \
  Soft-Family-Calm Soft-Family-Calm.codex-theme
```

主题包扩展名必须保持为 `.codex-theme`。它仍然是标准 ZIP 数据文件，不需要执行权限。
