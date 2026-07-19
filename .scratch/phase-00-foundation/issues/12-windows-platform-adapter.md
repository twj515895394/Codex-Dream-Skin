Status: ready-for-agent

# 12 · Windows Platform Adapter

## 要构建什么

实现 Windows Platform Adapter，将现有 Windows PowerShell/Node Runtime 封装为统一的 typed internal result 接口。与 macOS Adapter 实现同语义的 Adapter 接口。

**Adapter 统一接口**（与 macOS 相同的签名）：
```
probeCapabilities()   → 探测 Appx 包身份、PowerShell 版本、Node 版本
readStatus()          → 读取 Runtime/Codex/Skin 状态
listThemes()          → 枚举 %LOCALAPPDATA%\CodexDreamSkin\themes
validatePackage(path) → 安全校验（路径 containment、reparse point 防护）
importTheme(plan)     → 通过 Transaction Coordinator 执行导入
loadThemeById(id)     → 按 ID 重新读取并校验主题
applyTheme(plan)      → 主题 staging 和 publish
verify(context)       → Codex 进程、CDP、Injector 验证
restore(plan)         → 恢复 Codex 状态
installRuntime(plan)  → Managed Runtime 安装
```

**Windows 特有实现**：
- `Local\CodexDreamSkin.<SID>.Operation` named Mutex 作为快速本地 guard
- 持久锁目录 + owner.json 作为跨平台一致的 operation lock
- Appx 包身份校验
- 路径 containment 和 reparse point 防护
- UTF-8 原子写
- PowerShell 5.1 和 PowerShell 7 双兼容
- PowerShell 5.1 必须保留原生子进程真实退出码

**核心原则**：
- 与 macOS Adapter 同语义
- 不使用 `Invoke-Expression` 或任意 `-Command`
- 返回 typed result，不返回人类文本

## 验收标准

- [ ] 全部 Adapter 接口实现，返回 typed result
- [ ] Contract Test 全部通过（与 macOS adapter 同语义）
- [ ] PowerShell 5.1 和 PowerShell 7 均通过测试
- [ ] stderr/exit code 语义与 macOS 一致
- [ ] Appx 身份校验和路径防护正确
- [ ] 不使用 `Invoke-Expression` 或任意命令拼接
- [ ] 现有 Tray 主流程使用 Adapter 后无回退

## 被阻塞于

- #05 capabilities 与 status Operation 实现
- #06 listThemes Operation 实现
- #09 importTheme Operation 端到端实现
- #10 applyTheme + verify + restore Operation 端到端实现

## 完成总结报告

- [ ] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [ ] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [ ] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [ ] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论
