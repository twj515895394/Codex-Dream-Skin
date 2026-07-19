Status: complete

# 05 · capabilities 与 status Operation 实现

## 要构建什么

在 Reference Runner 基础上实现 `capabilities` 和 `status` 两个只读 Operation，这是所有 UI 和后续 operation 的前提。

**capabilities Operation**：
- 返回 API 版本、Adapter 版本、平台与架构
- 返回支持的 operation 列表
- 返回可选功能与限制（如 restart 能力、文件选择能力）
- 返回 Codex 安装/运行能力探测结果
- 返回 managed runtime 状态
- 返回 legacy backend 是否启用
- UI 根据 capabilities 决定可用功能，不硬编码平台名称

**status Operation**：
- Runtime 状态：`ready/degraded/unavailable/updating/recoveryRequired`
- Codex 状态：`running/stopped/unknown`
- Skin 状态：`active/paused/off/unknown`
- 当前主题 ID、名称、来源和可验证性
- 当前 operation 或 recovery journal
- 版本兼容摘要
- 脱敏的诊断提示
- 在写操作期间允许读取原子状态和 journal，返回 `busy` 标记

两个 operation 均为只读、不需要写锁、不产生 journal。

## 验收标准

- [x] `capabilities` 返回完整的 capability 对象，通过 Schema 校验
- [x] `status` 返回完整的状态对象，通过 Schema 校验
- [x] P95 本地执行目标 < 500ms
- [x] 在写操作进行中调用 status 返回 `busy` 标记，不读取半发布目录
- [x] Contract Test 覆盖：正常调用、Codex 未安装、Runtime 降级、journal 存在时的 recovery 提示
- [x] 不因 capabilities/status 调用修改任何文件系统状态

## 被阻塞于

- #04 Runtime Host Reference Runner 与 Contract Test 框架

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- **完成总结报告路径**：[`.scratch/phase-00-foundation/reports/05-capabilities-status-operation-summary.md`](../reports/05-capabilities-status-operation-summary.md)
- **生成时间**：2026-07-19T02:28:58Z
- **自动化测试**：7 项单元/集成测试场景（含状态探测、锁 busy 检测、Journal 恢复与零文件污染断言）已 100% PASS。
