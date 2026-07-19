# Dream Skin Studio 文档路线校准记录

日期：2026-07-19

## 背景

Phase 00 已进入实现准备阶段，当前 `.scratch/phase-00-foundation` 已推进到 issue 09 `importTheme Operation 端到端实现`，因此此前仅有架构策略说明不足以覆盖后续实施约束。

## 新路线决策

### 平台策略

- 当前产品交付目标：macOS first。
- Phase 00～Phase 05 优先完成 macOS 全生命周期能力。
- Windows 保持架构兼容设计，但不参与当前阶段功能门禁、CI 主矩阵和发布节奏。
- Windows 在 macOS 产品稳定后作为独立适配阶段推进。

### 应用结构

最终产品入口调整为：

```
Dream Skin.app
    |
    +-- Launcher
    |      - Runtime 检查
    |      - Codex 启动
    |      - Apply / Verify / Restore
    |
    +-- Dream Skin Studio.app
    |      - Theme Library
    |      - Editor
    |      - Preview
    |      - Marketplace
    |
    +-- Runtime
           - JSON API
           - Transaction
           - Theme Engine
```

## Phase 00 实施影响

当前优先级：

1. DS-QA-001 Importer Regression
2. DS-FND-002 Runtime API v1
3. macOS Runtime Adapter
4. operation lock / transaction journal
5. managed Runtime
6. macOS Desktop Shell Spike
7. macOS Vertical Slice

Windows Adapter 不取消，但调整为后续适配工作，不阻塞 macOS 交付。

## 当前 Issue 状态

Phase 00 已进入 `.scratch/phase-00-foundation` issue 实施阶段，当前 issue 已推进至：

- #09 importTheme Operation

该阶段开始后，文档校准必须同步反映真实开发顺序，避免 Roadmap 与 Implementation Plan 出现双平台同步开发误导。

## 校准范围

待同步更新：

- MASTER-PLAN.md
- project-implementation-plan.md
- multi-stage-roadmap.md
- dream-skin-studio-blueprint.md
- work-register.md
- phase-00 README
- Phase handoff/current
- root handoff/current

原则：

架构跨平台，交付 macOS 优先。