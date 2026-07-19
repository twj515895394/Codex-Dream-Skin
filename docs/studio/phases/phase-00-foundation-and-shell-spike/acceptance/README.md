# Phase 00 验收证据入口

> 当前状态：设计完成，尚未进入实现与实机验收。本文定义证据目录和提交要求，不表示测试已经通过。

## 1. 证据目录

```text
acceptance/
├── README.md
├── test-report.md
├── known-issues.md
├── contract/
│   ├── macos/
│   ├── windows-powershell-5.1/
│   └── windows-powershell-7/
├── shell-spike/
│   ├── tauri2/
│   ├── electron/
│   └── native/
├── real-device/
│   ├── macos/
│   └── windows/
├── rollout/
│   ├── clean-install/
│   ├── upgrade/
│   ├── downgrade/
│   └── emergency-restore/
└── screenshots/
```

空目录不提交时，可在实际执行阶段按此结构创建 `.gitkeep` 或报告文件。

## 2. 每份测试证据必须包含

- Work Item ID；
- test ID；
- 日期；
- 分支与 commit；
- artifact hash；
- App/Runtime/Adapter/API 版本；
- 平台、OS、架构；
- Codex 版本；
- fixture 或主题 ID/revision；
- 前置状态；
- 操作步骤；
- expected/actual；
- requestId/operationId；
- 自动测试日志位置；
- 截图或录屏（适用时）；
- Verify 结果；
- Restore/rollback 结果；
- Known Issue 链接。

## 3. `test-report.md` 结构

```md
# Phase 00 Test Report

- Status: Draft | Verification | Passed | Failed
- Baseline commit:
- Release artifact:
- Runtime version:
- Upstream review:

## Automated Summary
## Contract Matrix
## macOS Real-device
## Windows Real-device
## Install / Upgrade / Downgrade
## Rollback / Emergency Restore
## Accessibility
## Security
## Regressions
## Known Issues
## Final Decision
```

不得只粘贴“all tests passed”；必须可定位到 workflow、日志或实机记录。

## 4. `known-issues.md` 结构

每项：

```yaml
id: DS-P00-KI-xxx
status: open | mitigated | fixed | accepted
severity: P0 | P1 | P2 | P3
platform:
affectedVersions:
workItem:
owner:
```

正文说明：

- 用户表现；
- 数据和安全影响；
- 重现步骤；
- workaround；
- 是否阻断发布、升级或降级；
- 修复和验证证据。

P0/P1 安全、数据损坏、Restore 失败或任意命令问题不能通过 Known Issue 接受为 Phase Done。

## 5. Contract 证据

每个平台保存：

- contract runner 版本；
- API fixture revision；
- stdout JSON 检查；
- stderr 摘要；
- exit-code matrix；
- capabilities/status/list/import/apply/verify/restore 结果；
- operation busy、restart required、rollback 和 recoveryRequired；
- PowerShell 5.1/7 差异（Windows）。

通过标准：核心 Contract 集合在 macOS、Windows PowerShell 5.1 和 PowerShell 7 具有相同业务语义。

## 6. Desktop Shell Spike 证据

每个候选必须提交：

- prototype commit；
- macOS/Windows artifact；
- build/install instructions；
- sidecar/Runtime 调用方式；
- security configuration；
- signing/notarization/installer；
- updater/rollback 实验；
- source checkout 删除后的运行结果；
- PATH 无 Node 的运行结果；
- 包体、启动和内存数据；
- keyboard、screen reader、200% scaling；
- scorecard；
- blockers 和 Known Issues。

无法满足硬条件的候选也要记录失败证据和淘汰原因。

## 7. 实机截图要求

截图文件名建议：

```text
<test-id>_<platform>_<codex-version>_<theme-id>_<state>.png
```

截图旁的 Markdown 必须标注：

- `Package Preview Image` 或 `Real Device Screenshot`；
- 平台、OS、Codex 版本；
- commit/artifact；
- 测试场景；
- 是否通过 Verify；
- Restore 是否已执行。

概念图不得放入实机证据目录。

## 8. 发布与回滚证据

必须至少覆盖：

- clean install；
- existing legacy install；
- App/Runtime upgrade；
- Runtime smoke test failure；
- current → previous rollback；
- App downgrade；
- interrupted transaction recovery；
- emergency Restore；
- App 卸载但保留主题；
- 全量删除的明确确认流程。

## 9. Phase 00 最终签署

Phase 00 从 `Verification` 进入 `Done` 前，由维护者在 `test-report.md` 记录：

- 自动测试通过；
- 双平台 Contract 通过；
- Desktop Shell ADR 已 Accepted；
- signed artifacts 通过；
- Vertical Slice 通过；
- upgrade/downgrade/rollback 通过；
- emergency Restore 通过；
- SwiftBar/Tray/CLI 无回退；
- 无开放 P0/P1；
- Work Register、Changelog、用户文档和上游采用日志已更新。
