# 06 · listThemes Operation 实体实现总结报告

## 概述

**生成时间**：2026-07-19  
**对应 Issue**：[DS-FND-002 (续) / Issue 06](file:///Users/tangwujun/Documents/trae_projects/Codex-Dream-Skin/.scratch/phase-00-foundation/issues/06-list-themes-operation.md)  
**契约文档**：[contracts-and-data-model.md](file:///Users/tangwujun/Documents/trae_projects/Codex-Dream-Skin/docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md)

本报告总结了 `listThemes` 只读 Operation 实体处理、主题扫盘、坏主题隔离、Legacy 旧主题标识及 Hash 修订号计算的落地与验证情况。

---

## 变更明细

### 1. 新增/修改接口与模块
- **`core/runtime-api/handlers/list-themes-handler.js`**：
  - 实现 `listThemes` 动态扫盘逻辑（支持 `includeInvalid` 与 `includeLegacy` 筛选参数）；
  - 实现单主题损坏容错防线：解析非法/损坏的 `theme.json` 时不打断扫盘，隔离并将其记录为 `status: "invalid"` 填入 `diagnostics` 数组；
  - 实现 Legacy 旧主题判定：缺少 `manifest.json` 时判定为 `legacy` 来源并标记 `status: "warning"`；
  - 实现重复 ID 重复拦截与预警（写入 `diagnostics`）；
  - 实现软链接逃逸拦截（对比 `fs.realpathSync`）；
  - 实现单主题稳定修订号 `revision` 与全局快照 `snapshotRevision` sha256 计算。
- **`core/runtime-api/handlers/index.js`**：
  - 导出 `handleListThemes` 并接入 Router。
- **`core/runtime-api/fake-adapter.js`**：
  - 在指定 `stateRoot` 时代理至真实扫盘 handler。
- **`macos/tests/list-themes-operation.test.mjs`**：
  - 编写单元/集成与性能测试套件，包含 7 个独立断言场景。
- **`macos/tests/run-tests.sh`**：
  - 注册 `list-themes-operation.test.mjs` 至主集成测试套件中。

---

## 验证结果

### 自动化测试覆盖场景
1. [x] **空库返回**：空/不存在的 `themes/` 目录返回合法空数组与 `snapshotRevision`；
2. [x] **多主题正常扫盘**：`preset-alpha` 与 `custom-beta` 正常枚举，精准识别 `isCurrent: true`、图片 `mimeType` 与 `bytes`；
3. [x] **单主题损坏隔离**：单个损坏的 `theme.json` 隔离为 `status: "invalid"`，不破坏其余合法主题；
4. [x] **Legacy 旧主题归类**：无 `manifest.json` 归类为 `legacy` + `warning`；
5. [x] **重复 ID 预警**：相同 ID 在 `diagnostics` 中记录冲突预警，扫盘不崩溃；
6. [x] **100 个主题高性能扫盘**：100 个主题扫盘耗时约 38ms，远优于 P95 < 1s 性能指标；
7. [x] **扫盘零副作用防线**：连续扫盘 100% 保持只读，不写入或污染任何文件。

**集成测试结果**：`npm test` 执行全量测试套件通过率 **100% PASS**。

---

## 风险与注意事项

- **高性能保障**：扫盘过程仅进行 JSON 配置解算与 `fs.statSync`，绝不加载解码大图像素，保障百个主题秒级枚举。
- **坚固容错**：即使底层某个主题目录包含极度畸形的文件或错误的路径，主扫盘循环均能捕获并安全降级。
