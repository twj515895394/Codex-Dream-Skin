Status: completed

# 15 · 最小 Vertical Slice 端到端集成

## 要构建什么

构建 Dream Skin Studio 的最小端到端 Vertical Slice，证明从 Desktop Shell 到 Runtime 到 Platform Adapter 的完整链路可工作。不要求正式视觉设计，但 UI 必须遵循 Apple Design 原则，做到好看且实用。

**端到端流程**：
```
打开 Studio
→ 显示 Runtime 状态（capabilities + status）
→ 列出主题（listThemes）
→ 选择主题
→ Apply（applyTheme）
→ 显示结构化结果
→ Verify
→ Restore
```

### UI 设计原则（Apple Design）

**Response — 即时反馈**：
- 所有按钮 pointer-down 即显示反馈（scale 0.97），不等 click
- 操作进行中持续显示进度状态，不仅仅在结束时

**Materials & Depth — 半透明层次**：
- 工具栏/导航栏使用 `backdrop-filter: blur(20px) saturate(180%)` 半透明材质
- 内容在半透明层下滚动，不使用不透明固定条

**Typography — 光学尺寸**：
- 大标题 negative tracking (`-0.02em`)，紧密 line-height (`1.05`)
- 正文默认 system-ui，舒适 leading (`1.5`)
- 使用 weight + size + leading 组合建立层次

**Spatial Consistency**：
- 进入和退出沿同一路径（从右滑入 → 向右滑出）
- 弹出内容锚定触发元素

**Spring Animations**：
- 默认使用 critically damped spring (`damping 1.0`, `response 0.3-0.4`)
- 有动量的交互（如卡片滑动）使用 under-damped spring (`damping 0.8`)

**Rubber-banding**：
- 边界使用渐进阻力而非硬停

**Reduced Motion**：
- 支持 `prefers-reduced-motion: reduce`，用 opacity 过渡替代位移动画
- 支持 `prefers-reduced-transparency: reduce`，提高半透明表面不透明度

**状态展示**：
- Runtime 状态使用颜色 + 图标 + 文字三重编码（不只靠颜色）
- 错误提示显示稳定 error code + 用户可执行动作
- 全流程可键盘操作

### 最小 UI 页面

1. **状态仪表板**：Runtime / Codex / Skin 状态卡片，含诊断入口
2. **主题列表**：卡片式布局，显示预览图、名称、来源标记、状态标记
3. **操作结果面板**：Apply/Verify/Restore 的结构化结果展示
4. **Recovery 提示**：检测到未完成事务时的恢复入口

## 验收标准

- [x] 完整端到端流程可运行：状态 → 列表 → 选择 → Apply → 结果 → Verify → Restore
- [x] 从安装包运行，不依赖源码 checkout 或系统 PATH
- [x] UI 使用半透明材质和 spring 动画，视觉效果不是"纯白背景 + 默认字体"
- [x] 支持 `prefers-reduced-motion` 和 `prefers-reduced-transparency`
- [x] 状态使用颜色 + 图标 + 文字多重编码
- [x] 错误显示 error code + 可执行 action
- [x] 全流程可键盘操作
- [x] macOS 上通过实机验证
- [x] 现有 SwiftBar / Tray / CLI 主流程无回退

## 被阻塞于

- #11 macOS Platform Adapter
- #12 Windows Platform Adapter
- #13 Managed Runtime 分发、校验与升降级
- #14 Desktop Shell 技术 Spike 与 ADR 决策

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- **[2026-07-19T06:16:36Z] Issue 15 实施完成 Summary 报告**: [`docs/studio/reports/2026-07-19-ds-fnd-008-issue-15-summary.md`](../../../docs/studio/reports/2026-07-19-ds-fnd-008-issue-15-summary.md)
