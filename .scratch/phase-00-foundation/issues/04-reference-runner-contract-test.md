Status: ready-for-agent

# 04 · Runtime Host Reference Runner 与 Contract Test 框架

## 要构建什么

基于 #03 定义的 Schema，构建 Runtime Host 的 Reference Runner（参考实现）和 Contract Test 框架。

**Reference Runner**：
- 一个最小的 Node.js 进程，实现 "一次请求、一个子进程、一个响应" 的调用模型
- stdin 读取 JSON request → 执行 operation → stdout 输出 JSON response → 退出
- stderr 仅写诊断日志，不参与业务解析
- Request Router：严格解析 JSON、验证 apiVersion/operation/requestId/input、拒绝未知 operation、生成 operationId
- 对未实现的 operation 返回 `UNSUPPORTED_OPERATION` 错误和退出码 3
- 内部异常也必须尽力输出合法 envelope

**Contract Test 框架**：
- 使用子进程调用 Reference Runner，通过 stdin 发送请求、从 stdout 接收响应
- 校验 response 符合 JSON Schema
- 校验退出码与错误类别的映射一致性
- 提供 fake/reference adapter 接口，用于隔离测试
- 支持故障注入：模拟 adapter 抛出异常、超时、返回非法数据

## 验收标准

- [ ] Reference Runner 可以作为独立进程启动，接收 stdin JSON，返回 stdout JSON
- [ ] 合法请求返回 `ok=true` + 正确 envelope；非法请求返回 `ok=false` + 正确错误码和退出码
- [ ] Contract Test 至少覆盖 10 个场景：合法/非法 JSON、apiVersion 错误、未知 operation、缺失必填字段、request 超大、内部异常等
- [ ] Contract Test 校验所有 response 通过 JSON Schema 验证
- [ ] 退出码与 error.category 映射一致
- [ ] fake adapter 接口定义清晰，可供后续 operation 实现插入

## 被阻塞于

- #03 Runtime JSON API v1 Schema 与 Request/Response Envelope

## 完成总结报告

- [ ] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [ ] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [ ] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [ ] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论
