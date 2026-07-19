# Phase 00 · Foundation、Runtime API 与 macOS Launcher/Studio Shell

- 状态：`In Progress`
- Owner：`twj515895394`
- 分支：`feat/codex-theme-import-mvp`
- 目标版本：`Dream Skin Foundation v0.1-alpha`
- 当前交付平台：macOS
- Future Platform：Windows
- 设计完成：2026-07-19
- 实施 Issue：`.scratch/phase-00-foundation/issues/01-09`

> Phase 00 已进入实施阶段。Issue 已定义到 09，但每个 Issue 是否完成必须以验收勾选、summary report、测试和提交为准。

## 1. 阶段目标

在 macOS 上建立可供 Launcher、Studio、CLI、SwiftBar 和未来 Skill 共享的可信 Runtime 底座，并证明：

1. Runtime 通过版本化 JSON API 提供结构化操作；
2. 所有入口共享 operation lock、transaction journal 和恢复语义；
3. import/apply/verify/restore 不依赖 UI 拼接 Shell 命令；
4. `Dream Skin.app` 可以作为主启动入口；
5. `Dream Skin Studio.app` 可以作为管理入口；
6. 受管 Runtime 不依赖源码 checkout 或用户 PATH；
7. 安装、升级、降级、崩溃恢复和紧急 Restore 在 macOS 有实机证据。

## 2. 产品边界

```text
Dream Skin.app
  └─ Launcher
       ├─ Runtime/version check
       ├─ recovery check
       ├─ apply/verify
       └─ launch official Codex

Dream Skin Studio.app
  └─ Theme Library / Settings / Logs / minimal operations

Dream Skin Runtime
  └─ Runtime API / Import / Apply / Verify / Restore / Lock / Journal
```

Launcher 与 Studio 不能复制执行逻辑，必须调用同一个 Runtime API。

## 3. 平台策略

- 架构、Schema、错误码、包格式保持跨平台；
- 当前实现、测试、签名、安装和发布只要求 macOS；
- Windows Adapter、PowerShell、Windows Launcher、Installer 和实机矩阵延后；
- Windows 不阻塞 Phase 00 Done；
- 详细决策见 ADR-0005。

## 4. 当前实施 Issue

| Issue | 能力 | 依赖关系 |
| --- | --- | --- |
| 01 | Importer safety fixture generator | 基础 |
| 02 | Importer regression suite | #01 |
| 03 | Runtime API v1 Schema/Envelope | ADR-0001 |
| 04 | Reference Runner / Contract Test | #03 |
| 05 | capabilities/status | #03/#04 |
| 06 | listThemes | #03/#04 |
| 07 | operation lock | ADR-0002 |
| 08 | transaction journal / crash recovery | #07 |
| 09 | importTheme Operation | #02/#06/#08 |

Issue 09 的目标包括安全校验、lock、journal、staging、reject/replace、publish、rollback 和 Contract Test；importTheme 不自动 apply。

## 5. Phase 00 范围

### 包含

- importer fixture 与自动化回归；
- Runtime API v1 Schema、Envelope、Reference Host、Contract Runner；
- capabilities、status、listThemes、importTheme、applyTheme、verify、restore；
- macOS Adapter；
- request ID、稳定错误码、stdout/stderr/exit code 契约；
- operation lock、stale lock、single-flight；
- transaction journal、staging、backup、publish、verify、commit、cleanup、rollback；
- versioned managed runtime；
- macOS Desktop Shell / Launcher Spike；
- `Dream Skin.app` Launcher MVP；
- `Dream Skin Studio.app` 最小 Vertical Slice；
- macOS CI、失败注入、安装和实机验收。

### 不包含

- Windows Adapter、Launcher、Installer 和 Release；
- 完整 Theme Manager；
- Compiler、Schema v2、Fixture/Live Preview；
- Theme Editor、Assets、AI、Marketplace；
- 重写 Injector/Renderer；
- 自动 merge/rebase `main`。

## 6. 目标调用边界

```text
Launcher / Studio / CLI / SwiftBar / Skill
                    │ JSON request
                    ▼
              Runtime API Host
                    │ typed operation
                    ▼
               macOS Adapter
                    │ controlled calls
                    ▼
 Existing Runtime + Injector + Official Codex
```

原则：

- UI 不直接连接 CDP；
- App Core 不拼接任意命令字符串；
- Runtime stdout 只输出单一 JSON 业务结果，日志进入 stderr；
- 文件系统是主题事实来源；
- Runtime 无 UI；
- 所有写操作经过锁和事务协调器。

## 7. Definition of Ready

- [x] 产品目标、范围、失败恢复和数据契约已定义；
- [x] Runtime API、错误码和退出码已定义；
- [x] lock、journal 和 managed runtime ADR 已建立；
- [x] macOS-first / Launcher-first 决策已由 ADR-0005 接受；
- [x] 实施 Issue 已拆分到 Issue 09；
- [x] 安全、测试、发布和回滚计划已建立。

## 8. Definition of Done

Phase 00 进入 Done 必须满足：

- macOS Runtime API 核心操作通过 Contract Test；
- importer、恶意包、锁冲突、失败注入和崩溃恢复测试通过；
- import/apply/verify/restore 形成结构化闭环；
- managed runtime 可安装、升级和降级；
- Desktop Shell ADR 基于 macOS 实测完成；
- `Dream Skin.app` 能完成检查、恢复和启动 Codex；
- Studio 最小 Slice 能读取状态、列出主题并调用安全操作；
- 不依赖源码 checkout 或系统 PATH；
- macOS 实机报告、日志摘要、Known Issues 和 rollback 证据归档；
- Work Register、summary reports 和 handoff 已更新。

Windows Contract/Adapter/实机不属于本阶段 Done 门禁。

## 9. 当前执行顺序

```text
核对 Issue 01-08 完成证据
  → 满足依赖后实施 Issue 09
  → 继续 applyTheme / verify / restore Issues
  → managed runtime
  → macOS Launcher / Studio Shell
  → macOS 实机验收
```

## 10. 文档索引

- [产品需求](./product-requirements.md)
- [UX 与交互](./ux-and-interaction.md)
- [技术设计](./technical-design.md)
- [契约与数据模型](./contracts-and-data-model.md)
- [安全与隐私](./security-and-privacy.md)
- [测试与验收](./test-and-acceptance-plan.md)
- [发布与回滚](./rollout-and-rollback.md)
- [ADR](./adr/README.md)
- [验收证据](./acceptance/README.md)