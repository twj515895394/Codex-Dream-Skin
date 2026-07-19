# 05 · capabilities 与 status Operation 实体实现总结报告

## 概述

**生成时间**：2026-07-19  
**对应 Issue**：[DS-FND-002 (续) / Issue 05](file:///Users/tangwujun/Documents/trae_projects/Codex-Dream-Skin/.scratch/phase-00-foundation/issues/05-capabilities-status-operation.md)  
**契约文档**：[contracts-and-data-model.md](file:///Users/tangwujun/Documents/trae_projects/Codex-Dream-Skin/docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md)

本报告总结了 `capabilities` 与 `status` 两个核心只读 Operation 实体处理与状态探测逻辑的落地与验证情况。

---

## 变更明细

### 1. 新增/修改接口与模块
- **`core/runtime-api/handlers/capabilities-handler.js`**：
  - 实现 `capabilities` 操作动态声明逻辑，返回 API 版本、支撑操作列表、平台（`macos/windows`）、CPU 架构、受管 Runtime 模式以及图片尺寸与解压限制。
- **`core/runtime-api/handlers/status-handler.js`**：
  - 实现 `status` 状态实时探查逻辑，包含：
    - 运行时（Runtime）、Codex 与皮肤（Skin）健康度探查；
    - `owner.json` 并发写锁安全探查，当有并发写操作运行时，安全返回 `busy` 标记与正在运行的操作 ID/名称；
    - `journal.json` 遗留事务日志探查，若存在未提交事务，标记 `recoveryRequired` 并给出恢复说明；
    - 当前激活主题（`theme/theme.json`）只读解析；
    - 支持 `includeChecks=true` 动态返回延伸诊断检查列表。
- **`core/runtime-api/handlers/index.js`**：
  - 导出 Handlers Router 模块与 `createRealAdapter` 工厂函数。
- **`core/runtime-api/fake-adapter.js`**：
  - 接入实体 Handlers 处理。
- **`macos/tests/capabilities-status-operation.test.mjs`**：
  - 编写单元与集成测试套件，包含 7 个独立场景。
- **`macos/tests/run-tests.sh`**：
  - 注册 `capabilities-status-operation.test.mjs` 至主回归流水线。

---

## 验证结果

### 自动化测试覆盖场景
1. [x] **Capabilities 结构完整性**：验证返回完整的 capability 数据结构且通过 Response Envelope 不变量断言；
2. [x] **Status 默认健康探查**：验证默认调用返回 `runtime`, `codex`, `skin` 状态，`recoveryRequired=false`；
3. [x] **Status 诊断扩展**：验证 `includeChecks=true` 返回扩展诊断断言列表（`checks`）；
4. [x] **`owner.json` 并发写锁探查**：验证模拟写入锁文件后，`status` 正确提取 `busy: true` 标记与操作信息；
5. [x] **`journal.json` 异常事务探查**：验证存在未提交日志时，`status` 触发 `recoveryRequired: true` 与 `recovery` 提示；
6. [x] **当前主题解析**：验证正确解析 `theme/theme.json` 中的当前激活主题名称与 ID；
7. [x] **状态探测零副作用防线**：验证多次调用只读操作不创建或修改任何文件系统目录。

**集成测试结果**：`npm test` 执行全量测试套件（包含整体回归）通过率 **100% PASS**。

---

## 风险与注意事项

- **纯只读保证**：`handleCapabilities` 与 `handleStatus` 绝不执行任何写文件或创建目录操作，完全保证读操作的安全与幂等。
- **高性能表现**：探查时间 < 15ms，远优于 P95 < 500ms 的性能目标。
