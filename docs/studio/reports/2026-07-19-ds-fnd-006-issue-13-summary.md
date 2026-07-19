# Summary Report: DS-FND-006 (Issue 13) Managed Runtime Lifecycle

- **完成时间**: 2026-07-19T06:08:35Z
- **工作项**: DS-FND-006 (Issue 13)
- **分支**: feat/codex-theme-import-mvp

## 1. 概述与修改内容

本工作项落地了受管 Runtime（Managed Runtime）的生命周期管理组件 (`managed-runtime.js`)，脱离对源码 checkout 或系统 `$PATH` 中任意 Node.js 的依赖。

### 新增与修改模块

1. `core/runtime-api/managed-runtime.js` (NEW):
   - 维持 `STATE_ROOT/runtime/` 标准规范目录结构（`current/`, `previous/`, `staging/`, `runtime.json`）。
   - 实现全量受管接口：`installManagedRuntime`, `upgradeManagedRuntime`, `downgradeManagedRuntime`, `verifyManagedRuntime`, `recoverRuntimeTransaction`, `getRuntimeMetadata`。
   - 实现 Manifest 及文件全量 SHA256 哈希比对检验，硬防线拦截包含 Symlink / Junction / Reparse Point 的恶意 Payload。
   - 实现双版本（`current` 与 `previous`）原子切换升级与一键降级恢复。
   - 实现崩坏暂存（`staging`）及中断事务的自动化 Crash Recovery 清理机制。

2. `macos/tests/managed-runtime-lifecycle.test.mjs` (NEW):
   - 编写包含 7 个独立测试场景的契约测试套件，全面覆盖零安装、版本升级、版本降级、哈希篡改拦截、符号链接拒绝与中断恢复。

3. `macos/tests/run-tests.sh` (MODIFY):
   - 挂载 `managed-runtime-lifecycle.test.mjs` 到全量自动化回归测试中。

## 2. 验证与测试结果

- **Managed Runtime 契约测试**:
  - `node macos/tests/managed-runtime-lifecycle.test.mjs`: **7 / 7 PASS** (100%)
- **全量平台回归测试**:
  - `./tests/run-tests.sh`: **100% PASS**（包含 Importer 17 场景安全回归、Reference Runner、Lock、Journal、SchemaEnvelope、macOS Adapter、Windows Adapter 及 Managed Runtime 等全量 11 个测试脚本）。

## 3. 风险与后续注意

- Payload 打包时必须保证 `manifest.json` 包含相对路径下所有文件的标准 SHA256 哈希。哈希不匹配或变动会导致安装直接被拒，保障版本绝对完整性。
