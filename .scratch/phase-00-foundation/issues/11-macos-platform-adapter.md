Status: completed

# 11 · macOS Platform Adapter

## 要构建什么

实现 macOS Platform Adapter，将现有 macOS Shell/Node Runtime 封装为统一的 typed internal result 接口，供 Runtime Host 调用。

**Adapter 统一接口**：
```
probeCapabilities()   → 探测 Codex 签名、Team ID、架构、内置 Node、CDP
readStatus()          → 读取 Runtime/Codex/Skin 状态
listThemes()          → 枚举 ~/Library/Application Support/CodexDreamSkinStudio/themes
validatePackage(path) → 复用现有 importer 的安全校验
importTheme(plan)     → 通过 Transaction Coordinator 执行导入
loadThemeById(id)     → 按 ID 重新读取并校验主题
applyTheme(plan)      → 通过 stage-theme.mjs 执行 staging 和 publish
verify(context)       → 复用现有 Verify 逻辑（签名、CDP、Injector、Renderer）
restore(plan)         → 复用现有 Restore 逻辑
installRuntime(plan)  → Managed Runtime 安装
```

**核心原则**：
- Adapter 返回 typed internal result，不返回供 UI 解析的字符串
- stdout JSON 输出，stderr 诊断日志，真实退出码
- 不使用 `bash -c` 拼接任意命令
- 固定 `/usr/bin`/`/bin` 工具路径
- 复用现有脚本但包装为结构化输出
- 现有 importer/switch 的局部原子发布保留并纳入统一事务

**macOS 特有实现**：
- 目录锁（原子创建目录）作为 operation lock
- Codex 官方签名和 Team ID 校验
- 内置 Node 路径探测
- SwiftBar 集成不回退

## 验收标准

- [x] 全部 Adapter 接口实现，返回 typed result
- [x] Contract Test 全部通过（与 reference adapter 同语义）
- [x] stdout 只有 JSON，stderr 只有诊断日志
- [x] 退出码与 error category 映射正确
- [x] 现有 SwiftBar/CLI 主流程使用 Adapter 后无回退
- [x] Codex 签名、CDP 端口归属和 Injector 身份验证正确
- [x] 不使用 `bash -c` 或任意命令拼接

## 被阻塞于

- #05 capabilities 与 status Operation 实现
- #06 listThemes Operation 实现
- #09 importTheme Operation 端到端实现
- #10 applyTheme + verify + restore Operation 端到端实现

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- **[2026-07-19T05:50:35Z] Issue 11 实施完成 Summary 报告**: [`docs/studio/reports/2026-07-19-ds-fnd-003-issue-11-summary.md`](../../../docs/studio/reports/2026-07-19-ds-fnd-003-issue-11-summary.md)
