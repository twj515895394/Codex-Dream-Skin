# ADR-0004：Desktop Shell 选型必须经过双平台 Spike

- 状态：Proposed
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

## 备选方案

### A. Tauri 2 + React/TypeScript

潜在优势：包体和内存较小、Rust sidecar/control 边界、跨平台 Web UI。

待验证：sidecar 签名、updater rollback、macOS/Windows 构建复杂度、capability scope、团队 Rust 维护成本。

### B. Electron + React/TypeScript

潜在优势：成熟生态、Node/桌面 API、调试和打包工具丰富。

待验证：安全配置、包体/内存、主进程与 Runtime 隔离、updater 供应链、Node 不成为任意执行面。

### C. macOS SwiftUI + Windows WinUI/WPF

潜在优势：原生体验、系统集成和可访问性。

待验证：双端实现成本、业务逻辑重复、统一更新/诊断、长期维护速度。

## 决策

当前不选择最终框架。执行受控 Spike，并按统一 scorecard 和硬淘汰条件评估。

### 评分权重

| 维度 | 权重 |
| --- | ---: |
| 安全进程边界与任意命令防护 | 20 |
| sidecar、签名、公证、安装器 | 20 |
| 自动更新与降级 | 15 |
| macOS/Windows 语义一致 | 15 |
| CI、测试和可调试性 | 10 |
| 包体、启动和内存 | 10 |
| 可访问性与系统集成 | 5 |
| 团队维护复杂度 | 5 |

### 硬淘汰条件

- 需要开放任意 shell command；
- sidecar 可被用户输入替换；
- 无法签名或验证 Runtime；
- 安装后依赖源码/PATH；
- updater 无 rollback；
- 只有单平台 artifact；
- 无法满足 Runtime API stdout/stderr；
- 无法提供 emergency Restore。

### 必做场景

- clean install；
- capabilities/status/listThemes；
- Apply/Verify/Restore；
- operation busy/recoveryRequired；
- file picker/drag drop；
- local preview image；
- stderr 大输出；
- Runtime crash；
- App crash；
- upgrade/downgrade；
- source checkout 删除；
- PATH 无 Node；
- keyboard/200% scale；
- signed artifacts。

## 原因

Desktop Shell 会影响产品未来数年的安全、发布、体积和维护成本。选型必须建立在本项目真实约束和双平台证据上。

## 正面影响

- 避免偏好驱动；
- 提前暴露签名和 updater 风险；
- scorecard 可审计；
- 保持 App Core/Runtime 独立；
- 允许拒绝所有候选并调整架构。

## 负面影响

- Phase 00 增加 Spike 工作量；
- 需要维护最多三个最小 prototype；
- 在 ADR Accepted 前不能开始大规模 Theme Manager UI。

## 迁移和回滚

Spike 不接触真实用户 state，使用隔离测试目录。候选 artifact 不作为正式发布。

最终选择后：

- prototype 代码可重建或删除；
- App Core/Runtime Contract 保持；
- 若实现早期发现阻断，可将 ADR 改为 Rejected/Superseded 并选择次优候选；
- 用户主题和 Runtime 数据不依赖 UI 框架专有格式。

## Accepted 条件

ADR 从 Proposed 变为 Accepted 前必须提交：

- 三候选或明确无法进入测试的证据；
- macOS/Windows artifact；
- scorecard；
- security review；
- signing/install/updater/rollback 结果；
- accessibility notes；
- package/start/memory 数据；
- Known Issues；
- 最终选择、代价和备选回退。

## 后续动作

- `DS-FND-007` 建立 Spike harness；
- `DS-QA-002` 增加候选安全配置检查；
- 证据保存到 `acceptance/shell-spike/`；
- `DS-FND-008` 更新本 ADR 状态和最终决策。
