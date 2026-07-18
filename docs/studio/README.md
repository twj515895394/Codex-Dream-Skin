# Dream Skin Studio 文档中心

> 状态：**总体骨架已建立，阶段细化设计按开发门禁逐步补齐**  
> 基线分支：`feat/codex-theme-import-mvp`  
> 基线日期：2026-07-18

本目录用于把 Codex Dream Skin 从“平台脚本 + 菜单栏/托盘换肤工具”演进为完整的 **Dream Skin Studio**：一个可以管理、预览、创作、导入、导出、切换和诊断主题的跨平台桌面产品。

## 1. 文档目录

```text
docs/studio/
├── README.md
├── current-project-baseline.md
├── dream-skin-studio-blueprint.md
├── multi-stage-roadmap.md
├── phase-design-and-delivery-template.md
└── phases/
    └── README.md
```

### 核心文档

| 文档 | 用途 | 稳定性 |
| --- | --- | --- |
| [`current-project-baseline.md`](./current-project-baseline.md) | 梳理当前分支的代码、能力、数据路径、安全边界与缺口 | 随当前实现更新 |
| [`dream-skin-studio-blueprint.md`](./dream-skin-studio-blueprint.md) | Dream Skin Studio 的产品骨架、目标架构、模块边界和长期数据模型 | 总体骨架，原则上稳定 |
| [`multi-stage-roadmap.md`](./multi-stage-roadmap.md) | 从当前版本到 Studio 的阶段拆分、依赖、验收门槛和延期项 | 每个阶段结束时校准 |
| [`phase-design-and-delivery-template.md`](./phase-design-and-delivery-template.md) | 每个阶段开发前必须完成的细化设计模板与 Definition of Ready/Done | 开发治理规范 |
| [`phases/README.md`](./phases/README.md) | 各阶段文档入口、状态和计划产物 | 持续更新 |

### 已有基础文档

Studio 设计直接继承当前分支已经落地的主题包与导入能力：

- [`../theme-package-specification.md`](../theme-package-specification.md)
- [`../codex-theme-import-mvp-design.md`](../codex-theme-import-mvp-design.md)
- [`../codex-theme-import-macos-guide.md`](../codex-theme-import-macos-guide.md)

这些文档定义的 `.codex-theme` 纯数据、安全校验、原子导入和复用现有 Runtime 的原则，继续作为 Studio 的基础约束。

## 2. 文档分层

### L0：总体骨架

回答“产品最终是什么、边界在哪里、模块如何协作”。对应本目录中的 Blueprint 与 Roadmap。

### L1：阶段设计

每个阶段开始开发前，在 `phases/phase-XX-*/` 下补充：

- 产品需求与用户流程；
- UI 信息架构和交互稿；
- 技术设计与接口契约；
- 数据迁移与兼容方案；
- 安全、测试、发布和回滚方案。

### L2：实现记录

开发过程中维护：

- ADR（架构决策记录）；
- 变更日志；
- 测试记录；
- 实机截图与验收报告；
- 已知问题和后续债务。

## 3. 维护原则

1. **先细化设计，再进入阶段开发。** Roadmap 只定义阶段目标，不替代阶段详细设计。
2. **现有 Runtime 优先复用。** Studio 首先作为控制面，不在早期重写 injector、启动、验证和恢复链路。
3. **预览与实机必须共享同一主题编译结果。** 禁止再次出现“概念图能做到、实际主题引擎做不到”的脱节。
4. **保持跨平台域模型，允许平台适配器不同。** macOS 与 Windows 的进程、安装和安全实现可以不同，但主题库、包格式、编译 token 和 Studio 操作语义应统一。
5. **所有破坏性操作都必须可恢复。** 删除、覆盖、预览、应用、迁移和升级均需备份或事务边界。
6. **文档必须描述真实状态。** 未实现的能力标为“规划”或“待验证”，不得写成已经可用。

## 4. 当前分支说明

截至基线日期，`feat/codex-theme-import-mvp` 相对 `main`：

- ahead 6 commits；
- behind 12 commits；
- 已包含 macOS `.codex-theme` 导入器及配套文档；
- 尚未吸收 `main` 上后续 CI、Windows 安全加固和少量渲染修复。

因此 **Studio 实现阶段开始前必须先同步 `main`、解决冲突并重新执行双平台测试**。本目录的架构设计基于当前分支功能语义，但不会把分支暂时落后的代码状态固化为长期架构。
