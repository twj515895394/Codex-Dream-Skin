# ADR-0001：Runtime API 使用单请求子进程与 stdin/stdout JSON 边界

- 状态：Accepted
- 日期：2026-07-19
- 决策者：`twj515895394`
- 关联 Phase：Phase 00
- 关联 Work Item：`DS-FND-002`、`DS-FND-003`、`DS-FND-004`

## 背景

当前 macOS Shell 和 Windows PowerShell 以人类文本、平台参数和 `0/1` 退出码为主。Desktop UI 若直接调用，会被迫拼接命令和解析日志，难以稳定区分错误、取消、冲突、部分成功和回滚结果。

## 约束

- UI 不直接连接 CDP；
- UI 不执行任意 Shell/PowerShell；
- macOS/Windows 必须共享 operation 和错误语义；
- PowerShell 5.1 stderr 与真实退出码必须保真；
- Phase 00 应避免先引入长期 daemon；
- 文件路径和用户输入不能进入命令字符串。

## 备选方案

### A. UI 直接调用现有脚本并解析文本

优点：实现快。

缺点：字符串契约不稳定、命令注入风险、跨平台错误不一致、无法测试部分成功。拒绝。

### B. 长驻本地 daemon + socket/HTTP

优点：可流式进度、启动开销低。

缺点：生命周期、鉴权、端口、升级和崩溃恢复复杂；Phase 00 没有必要。延期评估。

### C. 一次请求一个受管子进程，stdin JSON，stdout JSON

优点：边界小、退出清晰、易测试、无监听端口、可渐进封装 legacy Runtime。

缺点：每次 spawn 有开销，长操作需要轮询 status 或后续扩展流式机制。

## 决策

采用方案 C：

- 调用方启动固定受管 Runtime entrypoint；
- stdin 写一个 Runtime API v1 request；
- stdout 只写一个 response envelope；
- stderr 写诊断；
- 退出码表达错误类别；
- 每次只执行一个 operation；
- UI 不接触平台脚本路径；
- Platform Adapter 负责 legacy command 归一化。

Phase 00 不提供任意 command 字段，不使用 `bash -c` 或动态 PowerShell `-Command`。

## 原因

这是最小且可验证的安全边界，能在不重写现有 Runtime 的情况下先稳定契约，并为未来长驻 host 保留演进空间。

## 正面影响

- UI 与平台脚本解耦；
- Contract Test 可复用；
- stdout/stderr/exit code 清晰；
- 请求参数通过 JSON schema 验证；
- 子进程崩溃不污染 App Core；
- 不需要开放本地网络服务。

## 负面影响

- 频繁 spawn 有性能成本；
- progress 暂时通过 transaction journal + status 轮询；
- Runtime Host 需要可靠地把内部异常转成合法 JSON。

## 迁移和回滚

迁移：

1. 先实现 reference Runtime Host；
2. 包装 macOS legacy scripts；
3. 包装 Windows PowerShell；
4. 现有 SwiftBar/Tray/CLI 逐步改调 Runtime Host；
5. legacy 直接入口暂时保留。

回滚：

- 可回退到 legacy entrypoints；
- 不删除主题和 state；
- Desktop Vertical Slice 在 Runtime Host 不可用时只进入 diagnostics/restore。

## 后续动作

- `DS-FND-002` 定义 schema 和 contract runner；
- `DS-FND-003/004` 实现双 Adapter；
- 测试 stdout 单 JSON、stderr 保真、特殊字符路径和真实退出码；
- 若未来采用 daemon，新增 ADR，保持 API envelope 兼容。
