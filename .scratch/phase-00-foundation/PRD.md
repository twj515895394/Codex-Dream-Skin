Status: ready-for-agent

# Phase 00 · Foundation、Runtime API 与 Desktop Shell Spike

> 源设计文档：`docs/studio/phases/phase-00-foundation-and-shell-spike/`
> 状态登记表：`docs/studio/work-register.md`
> 分支：`feat/codex-theme-import-mvp`

## 问题陈述

当前 Codex Dream Skin 已能通过脚本和菜单栏完成安装、启动、主题切换、验证和恢复，但缺乏支撑桌面 Studio 应用的工程底座：无统一的 Runtime JSON API、无跨入口互斥锁、无事务日志、无受管 Runtime 分发、无 Desktop Shell 选型证据。Phase 00 解决"能否安全建设 Studio"的问题。

## 解决方案

建立版本化 JSON 契约（Runtime API v1）、跨平台 Adapter、Operation Lock、Transaction Journal 和 Managed Runtime 生命周期，通过 Desktop Shell Spike 选定桌面客户端技术栈，最终交付一个最小 Vertical Slice 证明端到端链路可工作。

## Issues 索引

### 可立即开始（无依赖）

| # | 标题 | 类型 |
|---|---|---|
| [01](./issues/01-importer-safety-fixture-generator.md) | Importer 安全 Fixture 生成器与单元测试 | AFK |
| [03](./issues/03-runtime-api-v1-schema-envelope.md) | Runtime JSON API v1 Schema 与 Request/Response Envelope | AFK |

### 第二层（依赖 #01 或 #03）

| # | 标题 | 类型 | 依赖 |
|---|---|---|---|
| [02](./issues/02-importer-regression-test-suite.md) | Importer 自动化回归测试套件 | AFK | #01 |
| [04](./issues/04-reference-runner-contract-test.md) | Runtime Host Reference Runner 与 Contract Test 框架 | AFK | #03 |

### 第三层（依赖 #04）

| # | 标题 | 类型 | 依赖 |
|---|---|---|---|
| [05](./issues/05-capabilities-status-operation.md) | capabilities 与 status Operation 实现 | AFK | #04 |
| [06](./issues/06-list-themes-operation.md) | listThemes Operation 实现 | AFK | #04 |
| [07](./issues/07-operation-lock.md) | 跨入口 Operation Lock 实现 | AFK | #04 |

### 第四层

| # | 标题 | 类型 | 依赖 |
|---|---|---|---|
| [08](./issues/08-transaction-journal-crash-recovery.md) | Transaction Journal 与 Crash Recovery | AFK | #07 |
| [14](./issues/14-desktop-shell-spike-adr.md) | Desktop Shell 技术 Spike 与 ADR 决策 | **HITL** | #05 |

### 第五层

| # | 标题 | 类型 | 依赖 |
|---|---|---|---|
| [09](./issues/09-import-theme-operation.md) | importTheme Operation 端到端实现 | AFK | #02, #06, #08 |
| [10](./issues/10-apply-verify-restore-operations.md) | applyTheme + verify + restore 端到端实现 | AFK | #06, #08 |

### 第六层

| # | 标题 | 类型 | 依赖 |
|---|---|---|---|
| [11](./issues/11-macos-platform-adapter.md) | macOS Platform Adapter | AFK | #05, #06, #09, #10 |
| [12](./issues/12-windows-platform-adapter.md) | Windows Platform Adapter | AFK | #05, #06, #09, #10 |

### 第七层

| # | 标题 | 类型 | 依赖 |
|---|---|---|---|
| [13](./issues/13-managed-runtime-lifecycle.md) | Managed Runtime 分发、校验与升降级 | AFK | #08, #11, #12 |

### 最终交付

| # | 标题 | 类型 | 依赖 |
|---|---|---|---|
| [15](./issues/15-vertical-slice-e2e.md) | 最小 Vertical Slice 端到端集成 | AFK | #11, #12, #13, #14 |

## 依赖关系图

```
#01 Fixture Generator ──→ #02 Regression Tests ──────────────────────→ #09 importTheme ──→ #11 macOS Adapter ──→ #13 Managed Runtime ──→ #15 Vertical Slice
                                                                          ↑                   ↑                       ↑                       ↑
#03 API Schema ──→ #04 Reference Runner ──→ #05 capabilities/status ──┤   ├───────────────────┤                       │                       │
                                        │                             │   │                   │                       │                       │
                                        ├──→ #06 listThemes ──────────┤   │                   │                       │                       │
                                        │                             ↓   ↓                   ↓                       │                       │
                                        └──→ #07 Operation Lock ──→ #08 Journal ──→ #10 apply/verify/restore ──→ #12 Windows Adapter ────────┘
                                                                                                                      │
                                             #05 ──→ #14 Desktop Shell Spike (HITL) ─────────────────────────────────→ #15
```

## UI 设计方针

Vertical Slice (#15) 的 UI 遵循 Apple Design 原则：
- 半透明材质层次（`backdrop-filter`）
- Spring 动画（critically damped 默认，momentum 时 under-damped）
- 即时 pointer-down 反馈
- 光学字体排印（size-specific tracking + leading）
- 空间一致性（同路径进出）
- Rubber-banding 软边界
- 支持 reduced-motion / reduced-transparency / increased-contrast
- 颜色 + 图标 + 文字多重编码状态
