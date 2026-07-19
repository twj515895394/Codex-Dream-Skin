# Dream Skin Studio 阶段文档入口

本目录用于保存每个阶段开发前的细化设计、开发过程 ADR、验收记录和已知问题。

## 阶段导航

所有 Phase 的总览入口：

```text
PHASE-INDEX.md
```

它负责回答：

- 当前有哪些 Phase；
- 每个 Phase 的目标；
- 当前状态；
- 设计文档入口；
- 进入下一阶段的条件。

## 状态来源

所有阶段状态和 Work Item 以：

- `../MASTER-PLAN.md`
- `../work-register.md`

为主控来源。

本文件负责阶段目录规范和设计入口。

## 阶段目录

阶段真正开始设计时创建：

```text
phases/
├── phase-00-foundation-and-shell-spike/
├── phase-01-theme-manager-mvp/
├── phase-02-compiler-and-preview/
├── phase-03-theme-editor/
├── phase-04-ai-authoring-and-assets/
└── phase-05-marketplace-and-trust/
```

每个阶段目录使用：

```text
README.md
product-requirements.md
ux-and-interaction.md
technical-design.md
contracts-and-data-model.md
security-and-privacy.md
test-and-acceptance-plan.md
rollout-and-rollback.md
adr/
acceptance/
```

作为基础结构。

## 阶段推进规则

每个 Phase 开始前必须：

1. 创建对应阶段设计目录；
2. 创建 `.handoff/phases/phaseXX/current.md`；
3. 登记 Work Item；
4. 完成 main 上游 Review；
5. 完成详细设计和验收计划。

Phase 完成后：

1. 生成阶段完成 handoff；
2. 更新 MASTER-PLAN；
3. 更新 Work Register；
4. 创建下一阶段设计入口。

## 当前阶段

| Phase | 名称 | 状态 |
| --- | --- | --- |
| 00 | Foundation、Runtime API 与 Desktop Shell Spike | Planned |
| 01 | Theme Manager MVP | Planned |
| 02 | 统一主题编译与可信预览 | Planned |
| 03 | 可视化 Theme Editor | Planned |
| 04 | AI Authoring 与素材工作流 | Planned |
| 05 | Marketplace、更新与信任体系 | Planned |
