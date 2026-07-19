Status: ready-for-agent

# 03 · Runtime JSON API v1 Schema 与 Request/Response Envelope

## 要构建什么

根据 Phase 00 契约设计文档（`contracts-and-data-model.md`），落地机器可执行的 Runtime JSON API v1 Schema 和 Envelope 实现：

**Request Envelope**：
- `apiVersion`（必须为 1）、`operation`、`requestId`、`input`（必填）
- `options`、`client`（可选）
- 未知顶层字段忽略并产生 warning
- 未知 input 字段默认拒绝 `INVALID_REQUEST`
- 最大 request 1 MiB 限制

**Response Envelope**：
- `apiVersion`、`operation`、`requestId`、`operationId`、`ok`、`data`、`warnings`、`error`、`meta`
- 响应不变量：`ok=true` 时 `error=null`；`ok=false` 时 `error` 必须存在
- `warnings` 始终为数组
- 写操作始终返回 `operationId`
- 最大 response 4 MiB

**Error Object**：
- `code`、`category`、`message`、`recoverable`、`action`、`details`
- 错误码表按设计文档定义

**退出码**：
- 0/2/3/10/11/20/21/22/30/31/32/40/41/42/50 全部类别映射

Schema 使用 JSON Schema Draft 2020-12 或 TypeScript 类型定义，供 Contract Test 校验。

## 验收标准

- [ ] JSON Schema 文件（或等价 TypeScript 类型）覆盖 Request/Response/Error 全部字段
- [ ] Schema 校验工具能对合法/非法 JSON 给出明确通过/拒绝
- [ ] 退出码常量表和映射函数已实现
- [ ] Error code 枚举和 category 映射已实现
- [ ] 单元测试验证 Envelope 序列化/反序列化的正确性
- [ ] 单元测试验证 request 大小限制、未知字段处理、apiVersion 校验
- [ ] 文档与代码中的 Schema 定义保持一致

## 被阻塞于

无 - 可以立即开始

## 完成总结报告

- [ ] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [ ] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [ ] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [ ] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论
