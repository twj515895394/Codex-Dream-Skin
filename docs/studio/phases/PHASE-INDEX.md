# Dream Skin Studio Phase Index

> 文档角色：阶段导航中心
>
> 用途：快速定位所有 Phase 的目标、状态和设计入口。

## Phase 总览

| Phase | 名称 | 状态 | 目标 |
|---|---|---|---|
| Phase 00 | Foundation、Runtime API 与 Desktop Shell Spike | Planned | 建立 Studio 可信工程基础 |
| Phase 01 | Theme Manager MVP | Waiting | 无终端完成主题管理闭环 |
| Phase 02 | Theme Compiler 与可信 Preview | Waiting | 统一预览和实机生成链路 |
| Phase 03 | Theme Editor | Waiting | 可视化创建和编辑主题 |
| Phase 04 | Assets 与 AI Authoring | Waiting | 素材管理与 AI 辅助创作 |
| Phase 05 | Marketplace 与 Trust | Waiting | 安全分发、更新和信任体系 |

---

## Phase 00

目录：

```text
.handoff/phases/phase00/
docs/studio/phases/phase00-foundation-and-shell-spike/
```

重点：

- Runtime JSON API v1
- Desktop Shell 技术验证
- Runtime Adapter
- Lock / Transaction / Restore
- 最小 Vertical Slice

进入 Phase 01 条件：

- Phase 00 设计完成
- Runtime Contract 固化
- 基础测试通过
- Work Register 更新

---

## Phase 01

目录规划：

```text
docs/studio/phases/phase01-theme-manager-mvp/
.handoff/phases/phase01/
```

目标：

- Theme Repository
- 主题列表
- 导入
- 应用
- 删除
- 导出
- Verify / Restore

---

## Phase 02

目录规划：

```text
docs/studio/phases/phase02-theme-compiler-preview/
.handoff/phases/phase02/
```

目标：

- Theme Schema v2
- Canonical Theme Model
- Theme Compiler
- Fixture Preview
- Live Preview

---

## Phase 03

目录规划：

```text
docs/studio/phases/phase03-theme-editor/
.handoff/phases/phase03/
```

目标：

- 可视化编辑器
- Token 调整
- 实时预览
- 草稿和导出

---

## Phase 04

目录规划：

```text
docs/studio/phases/phase04-assets-ai-authoring/
.handoff/phases/phase04/
```

目标：

- Asset Library
- 图片分析
- AI 生成主题
- 风格迁移

---

## Phase 05

目录规划：

```text
docs/studio/phases/phase05-marketplace-trust/
.handoff/phases/phase05/
```

目标：

- Marketplace
- 签名
- 更新
- 第三方主题安全体系

---

## 阶段推进规则

每个 Phase 开始前必须：

1. 创建对应 phase 设计目录；
2. 创建 `.handoff/phases/phaseXX/current.md`；
3. 登记 Work Item；
4. 完成 main 上游 Review；
5. 完成详细设计和验收计划。

Phase 完成后：

1. 生成阶段完成 handoff；
2. 更新 MASTER-PLAN；
3. 更新 Work Register；
4. 创建下一阶段设计入口。
