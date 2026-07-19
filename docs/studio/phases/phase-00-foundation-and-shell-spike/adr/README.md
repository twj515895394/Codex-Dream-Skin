# Phase 00 ADR 索引

本目录保存 Phase 00 的架构决策。状态含义：

- `Accepted`：实施必须遵守；改变需要新 ADR；
- `Proposed`：方案和评估方法已明确，但仍需 Spike/实现证据；
- `Rejected`：保留否决原因；
- `Superseded`：由后续 ADR 取代。

| ADR | 标题 | 状态 | 关联 Work Item |
| --- | --- | --- | --- |
| [0001](./0001-runtime-api-process-boundary.md) | Runtime API 使用单请求子进程与 stdin/stdout JSON 边界 | Accepted | `DS-FND-002/003/004` |
| [0002](./0002-operation-lock-and-transaction-journal.md) | 跨入口 operation lock 与 transaction journal | Accepted | `DS-FND-005` |
| [0003](./0003-versioned-managed-runtime.md) | 使用版本化受管 Runtime 与 current/previous 指针 | Accepted | `DS-FND-006` |
| [0004](./0004-desktop-shell-selection.md) | Desktop Shell 选型必须经过双平台 Spike | Proposed | `DS-FND-007/008` |

## 约束

- ADR 不把设计描述成已实现；
- Desktop Shell 不凭偏好直接 Accepted；
- 安全、锁、事务和恢复决策不允许由 UI 框架绕过；
- 任何改变 API major、journal schema 或受管 Runtime 信任边界的方案需要新 ADR；
- 实现完成后必须在 ADR 后续动作中链接 commit、测试和实机证据。
