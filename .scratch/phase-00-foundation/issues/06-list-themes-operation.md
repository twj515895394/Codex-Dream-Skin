Status: ready-for-agent

# 06 · listThemes Operation 实现

## 要构建什么

实现 `listThemes` 只读 Operation，枚举文件系统主题库中的所有主题。

**核心行为**：
- 枚举 `STATE_ROOT/themes` 和 `STATE_ROOT/theme`（active）
- 每个主题返回：ID、名称、来源（`bundled/custom/imported/legacy/unknown`）、状态（`ready/warning/invalid`）、预览图路径、manifest 摘要
- 兼容缺少 manifest 或 preview 的旧主题（标记为 `legacy` + `warning`）
- 不因单个损坏主题中断整个列表（隔离失败，该主题标记 `invalid` 并带诊断信息）
- 对重复 ID 给出 warning（包含冲突双方的来源和路径摘要）
- 对缺图、无权限和外部修改给出诊断
- 不假设预设集合固定（动态枚举目录内容）

**性能**：
- 100 个主题 P95 < 1s
- 不强制解码全部大图，仅读取 manifest 和 theme.json

**并发**：
- 只读 operation，不需要写锁
- 在写操作期间调用返回已提交的原子状态 + `busy` 标记

## 验收标准

- [ ] 返回的 theme 列表通过 JSON Schema 校验
- [ ] 单主题损坏不影响其他主题的枚举
- [ ] 重复 ID 生成 warning 而不是报错
- [ ] legacy 主题（无 manifest）标记正确的来源和状态
- [ ] Contract Test 覆盖：空库、单主题、多主题、含损坏主题、含重复 ID、100 主题性能
- [ ] 不修改任何文件系统状态

## 被阻塞于

- #04 Runtime Host Reference Runner 与 Contract Test 框架

## 完成总结报告

- [ ] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [ ] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [ ] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [ ] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论
