# Hand-off: Phase 00 Issues 03-06 (Runtime JSON API v1 Core Operations) 完成快照

- **生成时间**：2026-07-19
- **工作区分支**：`feat/codex-theme-import-mvp`
- **代码提交 SHA**：`800d38c6c90426d2d5896ca00c044480c3651d18`
- **设计基线 SHA**：`5d3243c21715080072b4007ac5da10e6d3a7f185`
- **最新 `main` Review SHA**：`dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c`

---

## 阶段进展摘要

在 Phase 00 Foundation 中，针对 **DS-FND-002** 对应的 4 个核心 Issue（Issue 03 ~ 06）已经全部完成高质量代码落地与自动化测试强力断言：

1. **Issue 03 · Runtime JSON API v1 Schema 与 Request/Response Envelope**：
   - 落地 `codes.js` 15 种退出码常量、Error Code 与 Exit Code 归一化映射；
   - 落地 `schema-envelope.js` 请求/响应 Envelope 校验、不变量强制断言与 1 MiB / 4 MiB 限制拦截。
   - 测试：`runtime-api-v1-schema.test.mjs`（17 场景 100% PASS）。
2. **Issue 04 · Runtime Host Reference Runner 与 Contract Test 框架**：
   - 落地 `reference-runner.js` 单请求/单进程 CLI 框架与 stderr 诊断流隔离；
   - 落地 `fake-adapter.js` 假适配器与故障注入测试接口；
   - 测试：`contract-test-runner.test.mjs`（13 端到端子进程场景 100% PASS）。
3. **Issue 05 · capabilities 与 status Operation 实体实现**：
   - 落地 `capabilities-handler.js` 平台与极限能力声明；
   - 落地 `status-handler.js` 状态实时探测、`owner.json` 写锁探查与 `journal.json` 残留崩溃探查；
   - 测试：`capabilities-status-operation.test.mjs`（7 场景 100% PASS）。
4. **Issue 06 · listThemes Operation 实体实现**：
   - 落地 `list-themes-handler.js` 主题扫盘、坏主题隔离防线、Legacy 旧主题标识与 Revision sha256 计算；
   - 测试：`list-themes-operation.test.mjs`（7 场景 100% PASS，100 主题扫盘耗时仅 ~38ms）。

整体回归命令 `npm test` 执行全部已建立的测试套件通过率 **100% PASS**。

---

## 下一步任务

```text
DS-FND-005 / Issue 07
落地 Operation Lock (owner.json) 原子锁、死锁 (Stale Lock) 识别与抢占机制。
```

问题文件：[`.scratch/phase-00-foundation/issues/07-operation-lock.md`](../.scratch/phase-00-foundation/issues/07-operation-lock.md)

---

## 建议技能

- **`karpathy-guidelines`**：防止过度复杂化，保持单文件纯粹性与精简外科手术式修改。
- **`tdd`**：在落地锁机制与死锁清理时先写测试再补充实现。
- **`codereview`**：审阅并发文件读写逻辑与跨平台锁语义。
