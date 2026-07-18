# PRD: macOS `.codex-theme` 导入缺陷修复与自动化测试补充

Status: `ready-for-agent`

## 问题陈述

在 `.codex-theme` 导入功能 MVP (`feat/codex-theme-import-mvp` 分支) 开发完成后，项目存在以下三个关键问题：
1. **未初始化环境下的 Doctor 校验崩溃**：在未运行过安装脚本或没有全局 active theme (`$STATE_ROOT/theme/theme.json`) 的干净系统上，直接运行 `doctor-macos.sh` 或 `npm test` 会因找不到 `theme.json` 而终止执行，阻碍新环境搭建与 CI 自动化测试。
2. **主题包元数据控制字符安全风险**：`import-theme-macos.sh` 在读取 `manifest.json` 的 `name` 字段时，未过滤换行符（`\n`/`\r`）等控制字符。由于后续 shell 逻辑依赖 `sed` 按行解析 Node 的多行输出，包含换行符的名称会导致 `THEME_PREVIEW` 等元数据变量错位。
3. **导入流程测试覆盖缺失**：自动化测试脚本 `macos/tests/run-tests.sh` 缺少针对 `import-theme-macos.sh` 导入逻辑、`--no-apply` 参数以及各类非法/恶意主题包拦截的安全校验测试。

## 解决方案

1. **增强 `doctor-macos.sh` 的自愈诊断能力**：在执行 `--check-payload` 之前，先调用 `seed_bundled_presets` 确保预设库准备就绪；当 `$THEME_DIR/theme.json` 不存在时，自动调用 `switch-theme-macos.sh --id preset-midnight-aurora --no-apply` 初始化基础主题，保证诊断健康度测试顺畅完成。
2. **加固 `import-theme-macos.sh` 元数据安全过滤**：在 Node 内联校验脚本中对 `manifest.name` 增加控制字符（`[\u0000-\u001f\u007f-\u009f\u2028\u2029]`）校验，若存在控制字符或换行符则拒绝导入，确保 shell 行提取的安全性。
3. **全面补充 `run-tests.sh` 的导入测试**：在自动化测试中加入对 `.codex-theme` 的打包、合法导入、同 ID 原子覆盖、`--no-apply` 延迟应用以及各类非法包（包含可执行脚本、符号链接、绝对路径、ID不匹配、缺少文件等）的拦截测试。

## 用户故事

1. 作为开发者，我想在未初始化 Dream Skin 的全新 Mac 上运行 `npm test`，以便顺畅跑通所有单元测试和健康检查，而不会因缺失全局配置文件报错。
2. 作为用户，我想导入合法的 `.codex-theme` 主题包，以便直接在 Codex 应用中看到并体验新主题。
3. 作为安全人员，我想阻止带有脚本/恶意换行元数据的非法 `.codex-theme` 包被导入，以便保障本机运行环境的安全与系统稳定性。
4. 作为维护者，我想在每次提交代码时由 `npm test` 自动回归校验导入器的安全规则，以便防止后续改动造成功能回退。

## 实现决策

- **`doctor-macos.sh` 改进**：在 `require_macos_runtime` 后调用 `seed_bundled_presets`。检查 `[ -f "$THEME_DIR/theme.json" ]`，若不成立则调用 `"$SCRIPT_DIR/switch-theme-macos.sh" --id preset-midnight-aurora --no-apply >/dev/null`。
- **`import-theme-macos.sh` 改进**：在内联 Node 的 `manifest.name` 校验中添加 `if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(manifest.name)) throw new Error('Manifest name contains invalid control characters');`。
- **`run-tests.sh` 改进**：在测试用例尾部增加 `.codex-theme` 打包与导入断言段落，使用临时 `$TMP` 目录测试成功导入、覆盖安装、`--no-apply`、恶意 `.sh` 脚本拒绝、`manifest.id` 与 `theme.id` 冲突拒绝等。

## 测试决策

- **行为驱动与边缘测试**：不依赖外部环境，全部测试运行在隔离的 `$TMP` 临时目录下。
- **模块测试点**：
  - `doctor-macos.sh` 独立运行能力测试
  - `import-theme-macos.sh` 元数据控制字符拦截测试
  - `.codex-theme` 打包与解压安全测试
  - `run-tests.sh` 100% 成功通过

## 超出范围

- 本 PRD 不包含 Windows 平台的 `.codex-theme` 导入器实现。
- 本 PRD 不包含 GUI 界面下的拖拽导入或主题商店。

## 进一步说明

问题追踪器已配置为本地 Markdown 存储，路径为 `.scratch/codex-theme-import-mvp-fixes/`。
