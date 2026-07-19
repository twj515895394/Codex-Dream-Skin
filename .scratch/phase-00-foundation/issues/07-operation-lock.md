Status: ready-for-agent

# 07 · 跨入口 Operation Lock 实现

## 要构建什么

实现跨入口（Studio / SwiftBar / Tray / CLI / installer / recovery tool）的 Operation Lock 机制，确保所有可能修改主题、Runtime、Codex 启动或配置的入口共享互斥锁。

**锁位置**：
```
STATE_ROOT/locks/operation.lock/
└── owner.json
```

**owner.json 内容**：
- `lockSchemaVersion`、`operationId`、`requestId`、`operation`
- `entrypoint`（studio/swiftbar/tray/cli/installer/recovery）
- `pid`、`processStartedAt`、`runtimeExecutable`、`runtimeVersion`
- `userIdentityHash`、`createdAt`、`heartbeatAt`（可选）
- 不写原始用户名、项目路径或包路径

**获取策略**：
- 通过原子创建目录获取锁
- 默认 non-blocking，已占用返回 `OPERATION_BUSY`（退出码 10）
- Windows 可先获取 named Mutex 再创建持久锁目录
- updater 与 restore 使用同一锁

**Stale 判断**（按顺序验证）：
1. owner.json 是否存在且可解析
2. PID 是否存活
3. process start time 是否一致（防 PID reuse）
4. 可选 heartbeat 超时作为辅助
- 不提供普通用户"强制删除锁"

**释放**：
- 正常完成和异常退出都必须释放
- 进程注册退出 handler 确保清理

## 验收标准

- [ ] 原子锁获取和释放在 macOS（目录锁）和 Windows（Mutex + 目录锁）上均可工作
- [ ] 并发获取测试：两个进程同时尝试获取锁，仅一个成功
- [ ] Stale lock 检测：模拟进程崩溃后，新进程能正确识别并回收 stale lock
- [ ] PID reuse 防护：通过 processStartedAt 验证
- [ ] owner.json 不泄露敏感路径或用户名
- [ ] Contract Test 覆盖：获取、释放、busy、stale 回收、异常退出清理

## 被阻塞于

- #04 Runtime Host Reference Runner 与 Contract Test 框架

## 完成总结报告

- [ ] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [ ] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [ ] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [ ] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论
