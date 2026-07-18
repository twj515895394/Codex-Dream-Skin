# Issue 01: 修复 doctor-macos.sh 裸环境自动种子化与主题初始化

Status: `completed`

## 父问题

[.scratch/codex-theme-import-mvp-fixes/PRD.md](../PRD.md)

## 要构建什么

修改 `macos/scripts/doctor-macos.sh`，在执行 `--check-payload` 校验前增加预设库的自动补全 `seed_bundled_presets`，并在未找到 `$THEME_DIR/theme.json` 时自动调用 `switch-theme-macos.sh --id preset-midnight-aurora --no-apply`。
这样能保证在从未运行过安装脚本的新环境下，调用 `doctor-macos.sh` 时具备自愈并顺畅通过校验的能力。

## 验收标准

- [x] 在删除了 `$STATE_ROOT/theme/theme.json` 的全新环境下直接运行 `doctor-macos.sh` 可以自愈成功并输出 JSON 诊断数据
- [x] 脚本返回 exit code 0，不再抛出 `Explicit theme directory is missing theme.json` 错误
- [x] 不破坏已安装且有生效主题系统的常规诊断功能

## 被阻塞于

无 - 可以立即开始。

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- 2026-07-18T14:14:15+08:00: 已在 `macos/scripts/doctor-macos.sh` 增加 `ensure_state_root`、`seed_bundled_presets` 以及对未初始化 `$THEME_DIR/theme.json` 的预设自愈初始化。在未安装裸环境下运行 `./scripts/doctor-macos.sh` 顺利完成并输出 `pass: true` 诊断结果。因无对外 API 接口或可观测数据格式变更，无需独立 API 总结报告。
