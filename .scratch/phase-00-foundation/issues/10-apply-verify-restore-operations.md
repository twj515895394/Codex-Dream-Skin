Status: ready-for-agent

# 10 · applyTheme + verify + restore Operation 端到端实现

## 要构建什么

在 Runtime Host 中实现 `applyTheme`、`verify` 和 `restore` 三个核心 Operation。

### applyTheme

- 仅接受枚举得到的稳定 theme ID（不接受任意路径）
- 重新读取并校验实际文件，不信任 UI 缓存路径
- 获取 operation lock，创建 journal
- 快照当前 active theme（backup）
- staging 新主题和图片
- 发布 commit marker（`theme.json` 最后写入）
- 调用热应用（inject），必要时返回 `CODEX_RESTART_REQUIRED` + `confirmRestart` action
- 默认不得无提示强制结束 Codex
- Verify 失败自动尝试 Restore
- 返回 `applied/verified/rollbackAttempted/rollbackSucceeded` 状态矩阵

**失败分支**：
- 锁冲突 → `OPERATION_BUSY`，不修改
- validation 失败 → 不 publish
- publish 失败 → 恢复 active snapshot
- inject/verify 失败 → 自动 rollback
- rollback 失败 → `recoveryRequired`，突出 Restore

### verify

- 区分：Runtime 可用 / CDP 端口合法 / Injector 身份匹配 / Renderer 已加载 / 当前主题与发布目录一致
- 不修改主题
- 与写操作冲突时返回 `OPERATION_BUSY`
- 使用 inspection guard（非写锁）

### restore

- 关闭或停止 Dream Skin 执行面
- 恢复配置和 Codex 启动状态
- 不修改官方 Codex 安装文件
- 处理损坏 state/journal
- 支持紧急恢复模式
- 返回恢复了哪些资源、跳过了哪些资源和后续人工动作

## 验收标准

- [ ] applyTheme 成功路径：theme applied + verified，journal 完成
- [ ] applyTheme inject 失败：自动 rollback 到旧主题，journal 记录恢复
- [ ] applyTheme rollback 失败：status 显示 `recoveryRequired`
- [ ] applyTheme 需要 restart：返回 action `confirmRestart` 而非自动 kill
- [ ] verify 返回结构化检查结果，不仅仅是 pass/fail
- [ ] restore 成功清理 Dream Skin 状态，Codex 恢复正常
- [ ] restore 处理损坏 journal 不崩溃
- [ ] Contract Test 覆盖所有成功和失败路径

## 被阻塞于

- #06 listThemes Operation 实现
- #08 Transaction Journal 与 Crash Recovery

## 完成总结报告

- [ ] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [ ] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [ ] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [ ] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论
