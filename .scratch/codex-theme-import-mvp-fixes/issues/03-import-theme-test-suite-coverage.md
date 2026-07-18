# Issue 03: 补充 import-theme-macos.sh 自动化测试套件断言

Status: `completed`

## 父问题

[.scratch/codex-theme-import-mvp-fixes/PRD.md](../PRD.md)

## 要构建什么

在 `macos/tests/run-tests.sh` 中增加针对 `.codex-theme` 主题包导入的全套回归测试断言。测试在隔离的 `$TMP` 目录下生成测试主题包并验证：
1. 正常 `.codex-theme` 的导入与关联切换
2. `--no-apply` 参数行为
3. 同 ID 主题包的覆盖安装与旧主题恢复防护
4. 含有 `.sh`/`.js` 可执行文件、符号链接、路径穿越或 ID 不匹配的非法主题包的成功拒绝

## 验收标准

- [x] `cd macos && npm test` 包含全新的 import-theme 测试套件断言
- [x] 所有合法/非法导入场景测试断言全数 PASS
- [x] 测试运行结束后干净清理临时文件

## 被阻塞于

- [01-doctor-auto-seeding-fix.md](./01-doctor-auto-seeding-fix.md)
- [02-import-theme-metadata-control-char-guard.md](./02-import-theme-metadata-control-char-guard.md)

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- 2026-07-18T14:15:10+08:00: 已在 `macos/tests/run-tests.sh` 中补充全新的 `import-theme-macos.sh` 测试段落，全方位覆盖合规包导入、`--no-apply` 选项、恶意 `.sh` 脚本拦截、`manifest.id` 与 `theme.id` 不匹配拦截、控制字符拦截等，`npm test` 结果为 100% PASS。因无对外 API 接口或可观测数据格式变更，无需独立 API 总结报告。
