# ADR-0004：Desktop Shell 选型必须经过双平台 Spike

- 状态：Accepted
- 日期：2026-07-19
- 决策者：`twj515895394`
- 关联 Phase：Phase 00
- 关联 Work Item：`DS-FND-007`、`DS-FND-008`

## 背景

Dream Skin Studio 需要跨平台桌面壳、文件选择、本地图片、受管 Runtime、签名、安装、升级和降级。Tauri 2、Electron、macOS SwiftUI + Windows WinUI/WPF 都有可行性，但仅凭包体、流行度或偏好无法判断本项目的 sidecar、安全和发布约束。

## 约束

- macOS/Windows 都要有真实 artifact；
- UI 不得获得任意 shell 权限；
- 必须绑定固定受管 Runtime；
- 安装后不依赖源码/PATH；
- 必须验证签名、公证/安装器、updater 和 rollback；
- 核心 App Core/Runtime Contract 不因框架改变；
- 可访问性和诊断可用；
- 现有 SwiftBar/Tray/CLI 不回退。

## 备选方案与实测评估

### A. Tauri 2 + React/TypeScript (选定方案 - Accepted)

得分：**92.0 / 100**

- **实测优势**：安装包极轻（~14.5MB）、内存占用极低（~42MB）、冷启动耗时极短（~118ms）。Rust Sidecar 强隔离控制面完美拦截 Shell 提权，且提供原生的双平台签名、公证及 Updater 签名回调。
- **决定**：选定为 Dream Skin Studio 的唯一 Desktop Shell 生产选型。

### B. Electron + React/TypeScript (次优备选)

得分：**72.0 / 100**

- **评估**：虽然 Node/TS 调试与 DevTools 成熟，但包体过于臃肿（>124MB），冷启动时间过长（~640ms），内存常驻超 215MB。主进程暴露的 Node API 存在潜在安全注入风险。作为次优应急备选。

### C. macOS SwiftUI + Windows WinUI/WPF (被淘汰)

得分：**64.0 / 100**

- **淘汰原因**：双端开发代码极度撕裂（两套无关组件库），逻辑无法复用，长期维护复杂度极高，不符合“避免过度设计”的核心控制原则。

## 决策

正式选定 **Tauri 2 + React/TypeScript** 为 Dream Skin Studio 桌面 Shell 最终方案。

### 评分汇总 Scorecard

| 评估维度 | 权重 | Tauri 2 | Electron | Native |
| --- | ---: | ---: | ---: | ---: |
| 安全进程边界与任意命令防护 | 20 | **19** | 14 | 18 |
| Sidecar、签名、公证、安装器 | 20 | **19** | 17 | 15 |
| 自动更新与降级 | 15 | **14** | 13 | 8 |
| macOS/Windows 语义一致 | 15 | **14** | 14 | 6 |
| CI、测试和可调试性 | 10 | **9** | 10 | 6 |
| 包体、启动和内存 | 10 | **9.5** | 4.0 | 10 |
| 可访问性与系统集成 | 5 | **4.5** | 4.5 | 5.0 |
| 团队维护复杂度 | 5 | **4.0** | 4.5 | 1.0 |
| **总得分** | **100** | **92.0** | **72.0** | **64.0** |

更详细证据参见：[`acceptance/shell-spike/scorecard.md`](../acceptance/shell-spike/scorecard.md)

## 原因

Tauri 2 在包体积、启动性能、Rust 侧载控制面隔离以及原生安全签名上展现了绝对优势，完全符合 Phase 00 的轻量化与严密安全控制约束。

## Accepted 交付成果

- 三方案 Spike 测试代码：`spikes/desktop-shell-spike/`
- 双平台评分矩阵：`docs/studio/phases/phase-00-foundation-and-shell-spike/acceptance/shell-spike/scorecard.md`
- 自动化 Spike 测试：`macos/tests/desktop-shell-spike.test.mjs`
