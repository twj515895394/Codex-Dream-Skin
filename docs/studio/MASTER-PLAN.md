# Dream Skin Studio 主控文档

> 文档角色：项目最高层执行入口与规则索引  
> 状态：Active  
> 适用分支：`feat/codex-theme-import-mvp`  
> 最后校准：2026-07-19

## 1. 项目定位

Dream Skin Studio 是本地优先、可恢复、架构跨平台的 Codex 主题产品。当前产品实施、测试、签名、安装和发布目标只聚焦 **macOS**；Windows 仅保留 API、数据模型和 Adapter 边界，待 macOS 产品成熟后进入独立适配阶段。

产品由三个组件组成：

```text
Dream Skin.app
  └─ Launcher：用户主入口、Runtime 检查、启动 Codex、Apply、Verify、Recovery

Dream Skin Studio.app
  └─ Studio：Theme Library、Editor、Preview、Assets、Marketplace、Settings、Logs

Dream Skin Runtime
  └─ 无 UI 执行层：Runtime API、Theme Engine、Import、Apply、Verify、Restore、Lock、Journal
```

Launcher 和 Studio 必须调用同一个 Runtime API。Skill、CLI、SwiftBar 等入口也只能通过 Runtime API，不得各自编排 Shell 脚本。

## 2. 文档权威顺序

发生冲突时按以下顺序处理：

1. 本文件中的当前执行策略与不可变原则；
2. 已接受 ADR，特别是 ADR-0001～0005；
3. 当前 Phase 的细化设计与验收文档；
4. `work-register.md`；
5. `project-implementation-plan.md` 与 `engineering-rulebook.md`；
6. Blueprint、Roadmap、历史 handoff 和旧说明。

平台与 Launcher 决策的详细依据见：

- [`platform-and-launcher-strategy.md`](./platform-and-launcher-strategy.md)
- [`phases/phase-00-foundation-and-shell-spike/adr/0005-macos-first-launcher-first-delivery.md`](./phases/phase-00-foundation-and-shell-spike/adr/0005-macos-first-launcher-first-delivery.md)

## 3. 当前真实状态

### 已完成

- macOS `.codex-theme` 纯数据包导入 MVP 与安全校验；
- importer fixture 与回归测试基础；
- Runtime API v1、operation lock、transaction journal 等 Phase 00 设计；
- Phase 00 实施 Issue 已拆分至 Issue 09：`importTheme Operation 端到端实现`；
- macOS-first、Launcher-first 架构决策已接受。

### 当前阶段

```yaml
phase: Phase 00
status: In Progress
implementationTrack: .scratch/phase-00-foundation/issues/
latestDefinedIssue: 09-import-theme-operation.md
currentDeliveryPlatform: macOS
futurePlatform: Windows
```

Issue 编号表示实施链已定义到该位置，不代表 Issue 01～09 全部完成。真实完成状态必须以 issue 文件、summary report、测试证据和提交记录为准。

### 尚未完成

- 完整 Runtime API Host 与所有操作实现；
- Launcher 原型和正式 `Dream Skin.app`；
- Studio Vertical Slice 和正式 `Dream Skin Studio.app`；
- macOS 签名、安装、升级、回滚和实机发布矩阵；
- Theme Manager、Compiler、Preview、Editor、Assets、AI、Marketplace；
- Windows Adapter、Launcher、Installer 和发布矩阵。

## 4. 不可变工程原则

### 4.1 macOS-first，不等于 macOS-only

- 域模型、Theme Schema、Runtime API、错误码和包格式保持跨平台；
- Phase 00～产品功能成熟阶段只要求 macOS 实现和验收；
- Windows 不阻塞当前 Phase Done；
- 禁止为了未来 Windows 提前复制尚未稳定的 Runtime 逻辑。

### 4.2 Launcher-first

用户正常启动入口是 `Dream Skin.app`，而不是直接运行脚本或先打开 Studio。Launcher 必须负责：

```text
Runtime Check → Recovery Check → Apply/Verify when needed → Launch Codex → Surface Result
```

Studio 是管理和创作入口，不承担启动可靠性兜底。

### 4.3 控制面与执行面分离

- UI 不直接连接 CDP；
- UI 不拼接 Shell/PowerShell；
- Launcher、Studio、CLI、Skill 共享 Runtime API；
- Runtime 无 UI，负责 Codex 发现、进程身份、注入、验证和恢复。

### 4.4 写操作事务化

```text
Detect → Lock → Stage → Validate → Backup → Publish → Verify → Commit → Cleanup
                                             ↘ Failure → Restore
```

import、replace、apply、restore、runtime update 等操作必须具备 request ID、operation lock、journal、幂等和崩溃恢复语义。

### 4.5 主题包只包含数据

`.codex-theme` 不允许携带脚本、应用、动态库或任意可执行 CSS/JavaScript。Marketplace 也不得绕过 importer、Schema 和 Compiler。

### 4.6 预览与实机同源

```text
Theme Source → Canonical Model → Compiler → Preview / Codex Runtime
```

不得维护两套不一致的主题规则。

### 4.7 文档描述真实状态

未实现、未测试、仅设计、仅 macOS 验证或仅定义到某 Issue，必须明确标注。

## 5. 当前阶段路线

| Phase | 平台 | 目标 |
| --- | --- | --- |
| 00 | macOS | Runtime API、Lock/Journal、Importer/Apply/Verify/Restore、Managed Runtime、Launcher/Studio Shell Spike |
| 01 | macOS | Theme Repository、Theme Library、导入/应用/恢复管理闭环、正式 Launcher MVP |
| 02 | macOS | Compiler、Fixture Preview、Live Preview、Schema v2 |
| 03 | macOS | Theme Editor、导出和创作工作流 |
| 04 | macOS | Assets、AI Authoring、Marketplace、Skill/Plugin 集成与发布成熟度 |
| 05 | Windows | Adapter、Launcher、Installer、Verify、签名与发布适配 |

阶段编号以 `project-implementation-plan.md` 最终拆分为准，但 Windows 必须作为 macOS 产品成熟后的独立阶段，不能重新成为当前 Phase 的同步门禁。

## 6. Phase 00 当前执行顺序

```text
Importer Regression / Safety Fixtures
  ↓
Runtime API Schema + Reference Host + Contract Runner
  ↓
Capabilities / Status / listThemes
  ↓
Operation Lock
  ↓
Transaction Journal + Crash Recovery
  ↓
Issue 09 importTheme Operation
  ↓
applyTheme / verify / restore
  ↓
Managed Runtime
  ↓
macOS Launcher + Studio Vertical Slice
  ↓
macOS Installation / Upgrade / Rollback / Real-device Acceptance
```

Windows Adapter 和 Windows 实机矩阵移动到 Future Platform，不阻塞上述链路。

## 7. 统一工作流

```text
登记 Work Item / Issue
  → 确认当前分支基线和依赖
  → 设计、Contract 或 ADR
  → 实现
  → 自动测试与失败注入
  → macOS 实机验收
  → summary report / Known Issues
  → 更新 Work Register 和 handoff
```

## 8. 当前执行入口

1. `.handoff/current.md`
2. `.handoff/phases/phase00/current.md`
3. `docs/studio/work-register.md`
4. `.scratch/phase-00-foundation/PRD.md`
5. `.scratch/phase-00-foundation/issues/`
6. Phase 00 contracts、technical design 与 ADR

下一步开发必须根据 Issue 01～09 的真实完成证据续接，不能仅根据旧 Work Register 中的 `Ready` 状态倒退执行。