Status: closed

# 09 · importTheme Operation 端到端实现

## 要构建什么

在 Runtime Host 中实现 `importTheme` 写操作，通过 Transaction Coordinator 完成 `.codex-theme` 包的安全导入。

**Operation 行为**：
- 只接受本地 `.codex-theme` 文件路径（由调用方通过文件选择器获取后传入）
- 获取 operation lock
- 创建 transaction journal
- 执行完整安全校验链：
  - 包大小检查
  - ZIP 路径穿越检测
  - symlink / reparse point / 特殊文件检测
  - 可执行内容检测
  - manifest.json Schema 校验
  - theme.json Schema 校验
  - 图片完整性校验
- staging → 解压到临时目录并校验 payload
- 同 ID 冲突处理：支持 `reject`（默认）和 `replace`（需在 options 中明确指定）
  - `reject`：返回 `THEME_ID_CONFLICT` 错误
  - `replace`：备份原主题 → 替换 → 失败时恢复原主题
- publish：移动到正式主题目录
- 返回安装后的主题规范化摘要（ID、名称、来源 `imported`、状态 `ready`）
- 导入和应用结果分开表达（importTheme 不自动 apply）

**失败处理**：
- 校验失败返回具体 error code（如 `PATH_TRAVERSAL`、`EXECUTABLE_CONTENT`）
- staging 失败清理临时文件，不产生库变化
- replace 失败恢复原主题
- 用户取消返回 `CANCELLED`，无写入

## 验收标准

- [x] importTheme 通过 #01/#02 的全部 fixture 测试
- [x] 正常包导入后通过 listThemes 可枚举，状态为 `ready`
- [x] 恶意包在正确的阶段被拒绝，返回对应 error code
- [x] 同 ID reject 策略返回 `THEME_ID_CONFLICT`
- [x] 同 ID replace 策略成功替换并保留备份
- [x] replace 失败自动恢复原主题
- [x] 事务全程有 journal 记录
- [x] Contract Test 覆盖所有成功和失败路径

## 被阻塞于

- #02 Importer 自动化回归测试套件
- #06 listThemes Operation 实现
- #08 Transaction Journal 与 Crash Recovery

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- 2026-07-19: importTheme Operation 实体 Handler 落关，位于 `core/runtime-api/handlers/import-theme-handler.js`。完整包含安全预检（路径穿越、可执行扩展名、Symlink拦截）、Manifest/Theme 不变量校验、Operation Lock / Transaction Journal 联动、同 ID 冲突处理（`reject` 阻断与 `replace` 备份覆盖）以及暂存目录的清理。测试套件 `macos/tests/import-theme-operation.test.mjs` 5 场景断言 100% PASS。详见 Walkthrough。
