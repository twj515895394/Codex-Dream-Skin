# 04 · Runtime Host Reference Runner 与 Contract Test 框架实施总结报告

## 概述

**生成时间**：2026-07-19  
**对应 Issue**：[DS-FND-002 (续) / Issue 04](file:///Users/tangwujun/Documents/trae_projects/Codex-Dream-Skin/.scratch/phase-00-foundation/issues/04-reference-runner-contract-test.md)  
**契约文档**：[contracts-and-data-model.md](file:///Users/tangwujun/Documents/trae_projects/Codex-Dream-Skin/docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md)

本报告总结了 Runtime Host 参考运行器 (Reference Runner) 和端到端子进程 Contract Test (契约测试) 框架的落地与验证情况。

---

## 变更明细

### 1. 新增/修改接口与模块
- **`core/runtime-api/fake-adapter.js`**：
  - 实现基础 Fake / Reference Adapter 逻辑，支持 `capabilities`、`status`、`listThemes` 等内置操作的数据响应；
  - 引入故障注入（Fault Injection）机制，支持模拟内部未捕获异常（`throwInternalError`）、特定错误码响应（`failErrorCode`）以及畸形数据输出（`returnMalformedData`）。
- **`core/runtime-api/reference-runner.js`**：
  - 落地独立的 Runtime API CLI Host 进程模型，遵循“一次请求、单子进程、stdin 输入 -> stdout 单 JSON 响应 -> Exit Code 退出”的交互模式；
  - 实现 1 MiB 缓冲区安全防线，严格分流 stdout (JSON) 与 stderr (诊断日志)；
  - 集成全局未捕获异常兜底处理，确保任何故障都能输出合法 JSON 响应并返回 Exit Code 50。
- **`macos/tests/contract-test-runner.test.mjs`**：
  - 构建端到端子进程 Contract Test 框架，包含 13 个子进程测试场景。
- **`macos/tests/run-tests.sh`**：
  - 注册 `contract-test-runner.test.mjs` 至集成测试套件中。

---

## 验证结果

### 端到端子进程 Contract Test 场景
1. [x] **Scenario 1**：合法 `capabilities` 请求返回 `ok=true`、`exitCode=0` 且通过 Envelope 不变量验证；
2. [x] **Scenario 2**：合法 `status` 请求返回 `ok=true`、`exitCode=0`；
3. [x] **Scenario 3**：合法 `listThemes` 请求返回 `ok=true`、`exitCode=0`；
4. [x] **Scenario 4**：非法 JSON 输入返回 `INVALID_JSON` (Exit Code 2)；
5. [x] **Scenario 5**：缺失必填字段 `apiVersion` 返回 `INVALID_REQUEST` (Exit Code 2)；
6. [x] **Scenario 6**：不支持的 `apiVersion=99` 返回 `API_VERSION_UNSUPPORTED` (Exit Code 3)；
7. [x] **Scenario 7**：未知 operation (`unknownOp`) 返回 `OPERATION_UNSUPPORTED` (Exit Code 3)；
8. [x] **Scenario 8**：请求流 >1 MiB 返回 `PACKAGE_TOO_LARGE` (Exit Code 20)；
9. [x] **Scenario 9**：`input` 内拼写错误字段返回 `INVALID_REQUEST` (Exit Code 2)；
10. [x] **Scenario 10**：故障注入（Adapter 崩溃）返回 `INTERNAL_ERROR` (Exit Code 50)；
11. [x] **Scenario 11**：故障注入（Adapter 输出非 Object 畸形数据）返回 `INTERNAL_ERROR` (Exit Code 50)；
12. [x] **Scenario 12**：故障注入（Adapter 报 `PERMISSION_DENIED`）返回 Exit Code 22；
13. [x] **Scenario 13**：验证 stderr 输出诊断日志，且 stdout 严密保持有且仅有一行合法 JSON 响应。

**集成测试结果**：`npm test` 执行全量测试套件通过率 **100% PASS**。

---

## 风险与注意事项

- **进程流隔离与安全性**：Reference Runner 在任何异常情况下都不会污染 stdout，确保上层客户端不会遭遇 JSON 语法解析错误。
- **零依赖架构**：完整遵循 Pure ESM Node.js 架构设计，为后续 macOS/Windows 平台原生 Adapter 的集成打下基础。
