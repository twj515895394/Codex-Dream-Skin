# macOS `.codex-theme` 使用说明

本文说明如何在 macOS 上安装包含 `.codex-theme` 导入功能的 Codex Dream Skin Studio、导入主题包、验证效果，以及出现问题时如何排查。

> 当前功能位于分支：`feat/codex-theme-import-mvp`
>
> 在合并到 `main` 前，请按本文进行实机测试。

---

## 1. 使用前准备

请确认：

- 已安装官方 Codex macOS 应用；
- 至少启动并关闭过一次 Codex，使 `~/.codex/config.toml` 已生成；
- 测试时先关闭正在运行的 Codex；
- 当前用户有权限写入自己的 `~/Library/Application Support` 和 `~/.codex` 目录。

---

## 2. 获取测试分支

首次测试可执行：

```bash
git clone -b feat/codex-theme-import-mvp \
  https://github.com/twj515895394/Codex-Dream-Skin.git

cd Codex-Dream-Skin/macos
```

已经克隆过仓库时：

```bash
cd Codex-Dream-Skin
git fetch origin
git switch feat/codex-theme-import-mvp
git pull
cd macos
```

确认当前分支：

```bash
git branch --show-current
```

预期输出：

```text
feat/codex-theme-import-mvp
```

---

## 3. 安装测试版 Runtime

在 `macos` 目录执行：

```bash
./scripts/install-dream-skin-macos.sh --no-launch
```

安装器会：

- 将项目部署到 `~/.codex/codex-dream-skin-studio`；
- 校验官方 Codex 应用及其签名 Node.js Runtime；
- 初始化 Dream Skin 状态目录；
- 安装已有预设主题；
- 创建桌面启动器。

安装成功后，桌面应出现：

```text
Codex Dream Skin.command
Codex Dream Skin - Customize.command
Codex Dream Skin - Import Theme.command
Codex Dream Skin - Verify.command
Codex Dream Skin - Restore.command
```

本次新增入口是：

```text
Codex Dream Skin - Import Theme.command
```

---

## 4. 导入主题包

### 4.1 桌面入口

双击：

```text
Codex Dream Skin - Import Theme.command
```

系统会打开文件选择窗口。选择一个 `.codex-theme` 文件后，导入器会依次完成：

1. 校验主题包扩展名和大小；
2. 检查 ZIP 文件清单；
3. 拒绝脚本、应用、符号链接和危险路径；
4. 校验 `manifest.json` 与 `theme.json`；
5. 调用现有 injector 做完整主题校验；
6. 安装到本地主题库；
7. 自动应用主题。

### 4.2 命令行入口

```bash
~/.codex/codex-dream-skin-studio/scripts/import-theme-macos.sh \
  --file "$HOME/Downloads/Soft-Family-Calm.codex-theme"
```

只导入、不立即应用：

```bash
~/.codex/codex-dream-skin-studio/scripts/import-theme-macos.sh \
  --file "$HOME/Downloads/Soft-Family-Calm.codex-theme" \
  --no-apply
```

随后手动应用：

```bash
~/.codex/codex-dream-skin-studio/scripts/switch-theme-macos.sh \
  --id soft-family-calm-20260717
```

---

## 5. 主题安装位置

导入成功后，主题会安装到：

```text
~/Library/Application Support/CodexDreamSkinStudio/themes/<theme-id>/
```

例如“柔光相伴”：

```text
~/Library/Application Support/CodexDreamSkinStudio/themes/soft-family-calm-20260717/
```

目录内通常包括：

```text
manifest.json
theme.json
soft-family-background.jpg
preview.jpg
```

实际运行中的当前主题仍位于：

```text
~/Library/Application Support/CodexDreamSkinStudio/theme/
```

导入器不会绕过现有主题切换流程，而是通过 `switch-theme-macos.sh` 将所选主题安全发布到运行目录。

---

## 6. 实机测试建议

### 6.1 基础导入测试

检查：

- 桌面导入入口可以打开；
- 文件选择窗口可以选择 `.codex-theme`；
- 导入过程没有脚本执行提示；
- 主题能够安装到本地主题库；
- Codex 能够应用新背景和主题文案；
- 菜单栏“已保存的主题”中能看到或继续切换该主题。

### 6.2 覆盖安装测试

再次导入同一个主题包，确认：

- 不会留下半写入目录；
- 原主题被完整替换；
- 导入失败时旧主题仍然存在；
- 应用结果与首次导入一致。

### 6.3 冷启动与热切换测试

分别测试：

1. Codex 已由 Dream Skin 启动且 CDP 正常时导入；
2. Codex 未运行时导入；
3. Codex 普通启动、CDP 不可用时导入。

预期：

- CDP 可用时快速热切换；
- CDP 不可用时进入完整启动流程；
- 无法注入时主题仍应被成功导入，并给出明确提示。

### 6.4 重启持久化测试

应用主题后：

1. 退出 Codex；
2. 重新通过 `Codex Dream Skin.command` 启动；
3. 确认主题仍然生效。

### 6.5 恢复测试

双击：

```text
Codex Dream Skin - Restore.command
```

确认：

- 官方外观可以恢复；
- 已导入主题仍保留在本地主题库；
- 后续仍能重新切换到导入主题。

---

## 7. 测试非法主题包

以下包应被拒绝：

- 扩展名不是 `.codex-theme`；
- 伪装成 `.codex-theme` 的非 ZIP 文件；
- 缺少 `manifest.json`；
- 缺少 `theme.json`；
- `manifest.id` 和 `theme.id` 不一致；
- `theme.image` 指向不存在的文件；
- ZIP 内包含 `../` 路径；
- ZIP 内包含符号链接；
- ZIP 内包含 `.command`、`.sh`、`.js`、`.app` 等执行内容；
- 主题包超过 64 MB；
- 背景图超过现有 injector 限制。

导入失败时不应覆盖已有同 ID 主题。

---

## 8. 常见错误与处理

### 8.1 `Theme package must use the .codex-theme extension.`

原因：文件扩展名不正确。

处理：确认文件名确实以 `.codex-theme` 结尾，而不是：

```text
.codex-theme.zip
```

### 8.2 `Theme package is not a readable ZIP archive.`

原因：主题包不是 ZIP 格式，或文件损坏。

处理：重新下载或重新打包。

### 8.3 `manifest.json is missing from the theme package.`

原因：压缩包结构不正确。

允许：

```text
manifest.json
theme.json
background.jpg
```

或只有一层顶级目录：

```text
MyTheme/manifest.json
MyTheme/theme.json
MyTheme/background.jpg
```

不支持多层无关目录。

### 8.4 `Theme package metadata is invalid.`

重点检查：

- `schemaVersion` 是否为 `1`；
- ID 是否只包含字母、数字、下划线和连字符；
- `manifest.theme` 是否为 `theme.json`；
- `manifest.id` 是否与 `theme.id` 一致；
- `theme.image` 是否只是一个文件名。

### 8.5 `Theme package failed Dream Skin payload validation.`

说明包结构通过了导入器检查，但主题内容没有通过现有 injector 校验。

常见原因：

- 图片格式不受支持；
- 图片尺寸异常；
- 图片超过大小限制；
- `theme.json` 字段格式不符合现有主题 Schema；
- 背景图路径不合法。

### 8.6 导入成功但没有立即显示

先手动执行：

```bash
~/.codex/codex-dream-skin-studio/scripts/switch-theme-macos.sh \
  --id <theme-id>
```

然后运行：

```bash
~/.codex/codex-dream-skin-studio/scripts/start-dream-skin-macos.sh \
  --prompt-restart
```

如果仍失败，查看：

```text
~/Library/Application Support/CodexDreamSkinStudio/injector.log
~/Library/Application Support/CodexDreamSkinStudio/injector-error.log
~/Library/Application Support/CodexDreamSkinStudio/start-error.log
```

---

## 9. 手动检查已导入主题

列出主题库：

```bash
find "$HOME/Library/Application Support/CodexDreamSkinStudio/themes" \
  -maxdepth 2 -type f -print
```

查看主题配置：

```bash
cat "$HOME/Library/Application Support/CodexDreamSkinStudio/themes/soft-family-calm-20260717/theme.json"
```

检查当前运行主题：

```bash
cat "$HOME/Library/Application Support/CodexDreamSkinStudio/theme/theme.json"
```

---

## 10. 反馈实机测试结果

反馈时建议提供：

- Mac 芯片：Apple Silicon 或 Intel；
- macOS 版本；
- Codex 应用版本；
- 使用桌面入口还是命令行；
- 完整终端输出；
- `start-error.log` 或 `injector-error.log`；
- 导入前后截图；
- 是否为首次安装 Dream Skin。

注意在分享日志或截图前检查是否包含本地用户名、路径、项目名称或输入框中的敏感内容。

---

## 11. 制作自己的 `.codex-theme`

准备目录：

```text
MyTheme/
├── manifest.json
├── theme.json
├── background.jpg
└── preview.jpg
```

在该目录内执行：

```bash
zip -r -X ../MyTheme.codex-theme \
  manifest.json theme.json background.jpg preview.jpg
```

检查包内容：

```bash
unzip -l ../MyTheme.codex-theme
```

主题包中不要加入：

- `.DS_Store`
- 脚本
- 应用程序
- 符号链接
- 绝对路径
- 多余的构建缓存

完整格式定义见：

```text
docs/theme-package-specification.md
```

实现设计见：

```text
docs/codex-theme-import-mvp-design.md
```