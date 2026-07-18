# Issue 02: import-theme-macos.sh 增加 manifest.name 控制字符防护

Status: `completed`

## 父问题

[.scratch/codex-theme-import-mvp-fixes/PRD.md](../PRD.md)

## 要构建什么

在 `macos/scripts/import-theme-macos.sh` 内联 Node 元数据解析代码中，增加对 `manifest.name` 包含控制字符（`[\u0000-\u001f\u007f-\u009f\u2028\u2029]`，含 `\n`/`\r`）的严格拦截。如果检测到控制字符，立即抛出 `Manifest name contains invalid control characters` 错误并终止导入，消除后续 shell `sed` 按行解析时变量错位的隐患。

## 验收标准

- [x] 含有多行 `name` 或换行控制字符的 `.codex-theme` 主题包导入时被拒绝
- [x] 抛出清晰具体的异常信息 `Manifest name contains invalid control characters`
- [x] 正常的单行包含空格或中文字符的 `manifest.name` 保持正常导入

## 被阻塞于

无 - 可以立即开始。

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- 2026-07-18T14:14:30+08:00: 已在 `macos/scripts/import-theme-macos.sh` 内联 Node 逻辑中增加对 `manifest.name` 控制字符（含换行符）的校验规则。若 `manifest.name` 包含 `\n`/`\r` 等控制字符，抛出异常终止，彻底消除 `sed` 按行提取字段错位的隐患。因无对外 API 接口或可观测数据格式变更，无需独立 API 总结报告。
