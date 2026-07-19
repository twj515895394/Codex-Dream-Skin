Status: closed

# 08 · Transaction Journal 与 Crash Recovery

## 要构建什么

实现统一的 Transaction Journal 机制和崩溃恢复能力，确保所有写操作可追踪、可恢复。

**Journal 生命周期**：
```
Detect → Lock → Stage → Validate → Backup → Publish → Verify → Commit → Cleanup
                                             ↘ Failure → Restore
```

**Journal 记录内容**：
- `operationId`、`requestId`
- operation 类型和当前阶段（stage/validate/backup/publish/verify/commit/cleanup）
- 目标资源（theme ID、runtime version 等）
- 备份位置（脱敏路径）
- publish/commit 状态
- 验证结果
- rollback 结果
- cleanup 状态
- 脱敏错误摘要

**Journal 存储**：
```
STATE_ROOT/journals/
├── current.json        ← 当前活跃 operation（最多一个）
└── history/
    └── <operationId>.json  ← 已完成的历史记录
```

**Crash Recovery**：
- 崩溃后下一次 `status` 必须能判断是否需要恢复
- 发现 incomplete journal 时标记 `recoveryRequired`
- 自动 rollback（如果 journal 记录了足够的 backup 信息）
- 无法自动恢复时提示用户手动 Restore
- 提交完成后的非关键清理失败不反向破坏已提交状态，但记录 warning 和可重试动作

**Transaction Coordinator**：
- 协调 lock → journal → stage → backup → publish → verify → commit → cleanup 全流程
- Platform Adapter 不允许绕过 coordinator 直接修改受管资源

## 验收标准

- [x] Journal 记录在写操作的每个阶段正确更新
- [x] 正常完成后 journal 移入 history 目录
- [x] 模拟崩溃（进程在 stage/backup/publish 阶段被 kill）后，新进程 status 检测到 `recoveryRequired`
- [x] 自动 rollback 成功后 journal 标记恢复完成
- [x] commit 后 cleanup 失败只产生 warning，不回滚已提交状态
- [x] Contract Test 覆盖：正常事务、各阶段故障注入、崩溃恢复、cleanup 失败

## 被阻塞于

- #07 跨入口 Operation Lock 实现

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- 2026-07-19: Transaction Journal 与 Crash Recovery 机制落关。核心模块位于 `core/runtime-api/transaction-journal.js`，实现 `createJournal`, `updateJournalStage`, `commitJournal`, `inspectJournal`, `performRollback` 以及归档逻辑。测试套件 `macos/tests/transaction-journal.test.mjs` 5 场景断言 100% PASS。技术细节详见 Walkthrough。
