# ADR-0002：跨入口 operation lock 与 transaction journal

- 状态：Accepted
- 日期：2026-07-19
- 决策者：`twj515895394`
- 关联 Phase：Phase 00
- 关联 Work Item：`DS-FND-005`

## 背景

Studio、SwiftBar、Tray、CLI、installer 和 recovery tool 都可能修改主题、Runtime、Codex 启动状态或配置。Windows 已有部分 named Mutex，macOS importer/switch 仍没有统一锁；两端都缺少统一事务恢复事实。

## 约束

- 锁必须跨入口、跨进程；
- 崩溃后必须判断 stale，不能永久阻塞；
- TTL 不能作为唯一 stale 依据；
- 写操作必须区分 commit 前失败与 commit 后 cleanup 失败；
- rollback 失败后必须阻止后续写操作；
- 文件系统是恢复事实来源；
- Windows Mutex 和 macOS 文件原语可以不同，但语义一致。

## 备选方案

### A. 每个平台仅使用原生内存锁

优点：快速。

缺点：崩溃后证据弱、不同入口可能不共享实现、无法独立恢复。拒绝作为唯一方案。

### B. 只使用超时 lock file

优点：简单。

缺点：长操作可能被误判 stale，PID reuse 和身份伪造风险。拒绝。

### C. 原子 lock directory + owner identity + transaction journal

优点：持久、跨入口、可审计、可恢复；平台可叠加原生锁。

缺点：实现和测试更复杂。

## 决策

采用方案 C：

- `STATE_ROOT/locks/operation.lock/owner.json` 是持久锁事实；
- 通过原子创建目录获取锁；
- owner 记录 PID、process start time、runtime executable、operationId 和 requestId；
- Windows named Mutex 作为快速 guard，不能替代持久锁；
- stale 判断必须验证进程生存、启动时间和 executable；
- stale 锁先归档再恢复，不直接删除证据；
- 每个写操作建立 `transactions/<operationId>/journal.json`；
- journal 状态机覆盖 stage、backup、publish、verify、commit、cleanup、rollback；
- committed 后 cleanup 失败返回 warning；
- rollbackFailed/recoveryRequired 阻止新写操作。

## 原因

锁只解决并发，不解决中途崩溃；journal 只记录过程，不阻止并发。两者必须作为一个统一基础能力设计。

## 正面影响

- 多入口串行化；
- 崩溃后可以恢复；
- 错误响应能说明失败阶段和 rollback；
- importer、Apply、Runtime update、未来 Preview/Editor 可复用；
- cleanup 失败不会错误撤销已提交状态。

## 负面影响

- state root 增加锁、transaction 和证据清理；
- 测试需要 PID reuse、身份不匹配和每阶段故障注入；
- read-only status 必须理解 busy 和 recovery 状态。

## 迁移和回滚

迁移：

1. 实现锁/journal library；
2. 先接入 Runtime API 写操作；
3. legacy SwiftBar/Tray/CLI 改调同一 Runtime Host；
4. 未迁移的 legacy 入口暂时在 wrapper 层获取同一锁。

回滚：

- 若新 coordinator 有缺陷，停止 Studio 写操作；
- 使用 emergency Restore；
- 保留旧主题库和 legacy entrypoints；
- 不删除非终态 journal，人工确认后处理。

## 后续动作

- 定义 failure injection hooks；
- 建立 stale lock 归档和 retention；
- 完成 macOS/Windows Contract Test；
- Phase 02 Preview session 复用此决策，不另建旁路锁。
