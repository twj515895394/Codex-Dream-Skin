# 03 · Runtime JSON API v1 Schema 与 Request/Response Envelope 实施总结报告

## 概述

**生成时间**：2026-07-19  
**对应 Issue**：[DS-FND-002 / Issue 03](file:///Users/tangwujun/Documents/trae_projects/Codex-Dream-Skin/.scratch/phase-00-foundation/issues/03-runtime-api-v1-schema-envelope.md)  
**契约文档**：[contracts-and-data-model.md](file:///Users/tangwujun/Documents/trae_projects/Codex-Dream-Skin/docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md)

本报告总结了 Runtime JSON API v1 契约落地、Envelope 解析与构造、退出码映射以及内置 Operation 结构校验的落地情况。

---

## 变更明细

### 1. 新增/修改接口与模块
- **`core/runtime-api/codes.js`**：
  - 定义 15 种标准化进程退出码常量 (`EXIT_CODES`: 0, 2, 3, 10, 11, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50)；
  - 导出退出码到 Category 映射函数 `getCategoryForExitCode(exitCode)`；
  - 导出稳定 Error Code 表与构建函数 `createErrorObject(codeName, message, options)`；
  - 导出 Error Code 到 Exit Code 映射函数 `getExitCodeForError(codeName)`。
- **`core/runtime-api/schema-envelope.js`**：
  - 实现 Request Envelope 校验逻辑 `parseRequestEnvelope(rawInput, opts)`：包含 1 MiB 限制拦截、`apiVersion=1` 规则校验、顶层未知字段警示与 `input` 内未知字段硬拒绝（`INVALID_REQUEST`）；
  - 实现 Response Envelope 不变量强断言 `validateResponseEnvelope(res)`：包含 4 MiB 限制、`ok=true` 时 `error=null`、`ok=false` 时 `error` 必存、`warnings` 数组校验以及写操作 `operationId` 字段断言；
  - 提供辅助函数 `buildSuccessResponse` / `buildErrorResponse`。
- **`core/runtime-api/operations/`**：
  - 定义 `capabilities`、`status`、`listThemes`、`importTheme`、`applyTheme`、`verify`、`restore` 等内置操作的输入 Schema 校验器。
- **`macos/tests/runtime-api-v1-schema.test.mjs`**：
  - 新增全量自动化回归测试套件，共包含 17 个细分断言场景。
- **`macos/tests/run-tests.sh`**：
  - 注册 `runtime-api-v1-schema.test.mjs` 到主集成测试套件中。

---

## 验证结果

### 自动化测试覆盖场景
1. **Request Envelope Validation**：
   - [x] 1.1 合法 `capabilities` Request 解析成功；
   - [x] 1.2 顶层未知字段被忽略并产生 `UNKNOWN_TOPLEVEL_FIELD` warning；
   - [x] 1.3 `input` 内未知字段被硬拒绝并报 `INVALID_REQUEST` (exit code 2)；
   - [x] 1.4 缺失 `apiVersion` 被拒绝为 `INVALID_REQUEST`；
   - [x] 1.5 不支持的 `apiVersion=2` 被拒绝为 `API_VERSION_UNSUPPORTED` (exit code 3)；
   - [x] 1.6 不支持的 `operation` 被拒绝为 `OPERATION_UNSUPPORTED` (exit code 3)；
   - [x] 1.7 请求大小超过 1 MiB 被拒绝为 `PACKAGE_TOO_LARGE` (exit code 20)；
   - [x] 1.8 非法 JSON 语法被拒绝为 `INVALID_JSON` (exit code 2)。
2. **Response Envelope Invariants**：
   - [x] 2.1 `buildSuccessResponse` 产生合法 Envelope，且 `ok=true` 时 `error=null`；
   - [x] 2.2 `buildErrorResponse` 产生合法 Envelope，且 `ok=false` 时 `error` 必存；
   - [x] 2.3 违反不变量：`ok=true` 但 `error!=null` 时 `validateResponseEnvelope` 抛错；
   - [x] 2.4 违反不变量：`ok=false` 但 `error` 缺失时 `validateResponseEnvelope` 抛错；
   - [x] 2.5 响应尺寸超过 4 MiB 时 `validateResponseEnvelope` 抛错。
3. **Exit Codes & Error Mapping Matrix**：
   - [x] 3.1 验证 15 种退出码常量及映射全覆盖；
   - [x] 3.2 验证关键 Error Code 映射与 Exit Code 一致。
4. **Operations Input Validation**：
   - [x] 4.1 `status` 操作的 `includeChecks` 参数校验；
   - [x] 4.2 `listThemes` 操作的 `includeInvalid` 与 `includeLegacy` 参数校验。

**集成测试结果**：`npm test` 执行包含全部现有测试及新 API Schema 测试，通过率 100%。

---

## 风险与注意事项

- **零依赖运行**：核心 API Schema 模块由原生态纯 Node.js ESM 编写，无第三方包依赖，满足双平台受控运行需求。
- **向下兼容与扩展**：新增 Operation 时只需扩展 `core/runtime-api/operations/` 模块，Envelope 结构与基础 Exit Code 映射保持稳定。
