# Summary Report: DS-TM-002 (Issue 10) applyTheme + verify + restore Operation

- **完成时间**: 2026-07-19T05:47:00Z
- **工作项**: DS-TM-002 (Issue 10)
- **分支**: feat/codex-theme-import-mvp

## 1. 概述与修改内容

本工作项落地了 Runtime API v1 中 `applyTheme`、`verify` 和 `restore` 三个核心 Operation 的实体 Handler。

### 新增与修改模块

1. `core/runtime-api/handlers/apply-theme-handler.js` (NEW):
   - 支持 `themeId` 二次检验与安全防范（严禁路径穿越）。
   - 集成 `operation-lock`（写锁排他）与 `transaction-journal` 事务状态追溯。
   - 自动备份现有激活主题 (`backup`) 至 `backup/active-theme`，并在隔离暂存区 (`staging`) 完成新主题原子写入（`theme.json` 最后提交）。
   - 集成重启授权拦截：未提供 `allowCodexRestart: true` 且处于须重启环境时，优雅返回 `CODEX_RESTART_REQUIRED` 并带有 `confirmRestart` action 指引，不强制静默终止 Codex。
   - 注入或验证异常时，自动触发 `performRollback` 进行状态还原。

2. `core/runtime-api/handlers/verify-handler.js` (NEW):
   - 提供只读系统诊断，支持 `runtime` / `activeTheme` / `full` 三种作用域。
   - 结构化返回 `codexIdentity`, `cdpOwnership`, `injectorIdentity`, `rendererMarker`, `activePayload` 判定点状态。
   - 锁探测非阻塞，遇锁定安全报告 `OPERATION_BUSY`。

3. `core/runtime-api/handlers/restore-handler.js` (NEW):
   - 停止 Dream Skin 执行面，清理与还原官方配置，绝对不破坏官方 Codex 安装。
   - 支持 `normal` / `emergency` / `recoverTransaction` 恢复模式。
   - 容错处理损坏 JSON 格式的 `state.json` 或崩溃遗留 `journal`，避免抛错死锁。

4. `core/runtime-api/handlers/index.js` (MODIFY):
   - 注册并导出新增 Handler 到 `createRealAdapter` 路由分发器中。

5. `macos/tests/apply-verify-restore-operations.test.mjs` (NEW):
   - 包含 10 个针对成功应用、参数校验、写锁冲突、失败自动回滚、回滚失败报警、重启决策拦截、verify 诊断输出、restore 复原及损坏 Journal 抗崩的自动化测试用例。

6. `macos/tests/run-tests.sh` (MODIFY):
   - 挂载新增测试套件到全量回归流程。

## 2. 验证与测试结果

- **单元与契约测试结果**:
  - `node macos/tests/apply-verify-restore-operations.test.mjs`: **10 / 10 PASS** (100%)
- **全量平台回归测试**:
  - `./tests/run-tests.sh`: **100% PASS** (覆盖 Importer、Journal、Lock、SchemaEnvelope、ReferenceRunner 及图像安全完整套件)。

## 3. 风险与后续注意

- `applyTheme` 在复杂 UI 环境下进行热注入或版本重启时，依赖桌面 Adapter 层正确传递 `allowCodexRestart`。
- `restore` 在 `emergency` 模式下会清空 `activeTheme` 并将配置重置为极简初始态，符合安全降级与紧急修复预期。
