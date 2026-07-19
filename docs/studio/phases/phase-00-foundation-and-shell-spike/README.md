# Phase 00 · Foundation、Runtime API 与 Desktop Shell Spike

- 状态：Ready
- Owner：`twj515895394`
- 基线分支：`feat/codex-theme-import-mvp`
- 基线 Commit：`5d3243c21715080072b4007ac5da10e6d3a7f185`
- 目标版本：`Dream Skin Studio Foundation v0.1-alpha`
- 依赖阶段：Pre-Phase `.codex-theme` Import MVP 与现有 macOS/Windows Runtime
- 上游 Review ID：`UPR-20260719-001`
- 已审查 main Commit：`dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c`
- 相关 UPA Actions：`UPA-001`～`UPA-008`、`UPA-012`、`UPA-013`
- 设计完成：2026-07-19
- 实际实现完成：未开始

> `Ready` 只表示 Phase 00 的开发前设计门禁已满足，不表示 Runtime API、Desktop Shell 或 Vertical Slice 已实现。

## 1. 阶段目标

建立 Dream Skin Studio 可以安全开发、跨平台验证和失败恢复的工程底座，证明：

1. Studio 能通过版本化 JSON 契约读取 Runtime 状态和本地主题；
2. Studio 能调用平台 Adapter 执行安全 Apply、Verify、Restore；
3. macOS 与 Windows 的底层实现可以不同，但操作、错误、锁、事务和验收语义一致；
4. Desktop Shell 可以可靠分发受管 Runtime，不依赖源码 checkout 或用户自行配置 Node；
5. 写操作发生失败、崩溃或升级中断时可以识别、恢复并留下可诊断证据。

## 2. 用户价值

Phase 00 不交付完整 Theme Manager，而是消除后续 GUI 的高风险基础问题：

- UI 不需要拼接 Shell/PowerShell 命令；
- UI 不需要解析人类日志判断成功；
- 用户操作不会与 SwiftBar、Tray 或 CLI 静默冲突；
- 导入、应用和 Runtime 更新不会因为半写入留下不可恢复状态；
- 安装后的 Studio 不依赖仓库路径或系统 PATH；
- macOS 与 Windows 能用同一组 Contract Test 验证核心语义。

## 3. 当前代码基线

### 3.1 已有资产

- macOS `.codex-theme` importer：包大小、ZIP 路径、可执行内容、symlink、特殊文件、manifest/theme/image 校验；
- macOS theme switch：从稳定文件描述符 staging，校验 staging，最后发布 `theme.json` 作为 commit marker；
- macOS Runtime：官方 Codex 签名、Team ID、架构、Node 版本、CDP 端口归属和 Injector 身份验证；
- Windows Runtime：per-user Mutex、Appx 包身份、路径/reparse point 防护、UTF-8 原子写、主题保存/切换；
- 双平台 Start、Pause、Status、Verify、Doctor、Restore 和现有入口；
- 文件系统主题库和 active theme 发布目录。

### 3.2 已知缺口

- 没有 Runtime JSON API v1；
- macOS 与 Windows 输出和退出码没有统一语义；
- macOS importer/switch 没有跨入口共享 operation lock；
- Windows Mutex 只覆盖部分操作，且不是跨平台持久锁契约；
- 没有统一 transaction journal、recoveryRequired 和 cleanupPending；
- macOS 使用 Codex 内置 Node，Windows 使用 PATH Node，无法作为最终受管分发模型；
- importer 自动化回归不足；
- 没有 Desktop Shell 选型证据和签名/升级/降级 Spike；
- 没有可运行的 Studio Vertical Slice。

## 4. 范围

### 4.1 包含

- `.codex-theme` importer 自动化回归设计与实施；
- Runtime JSON API v1 契约；
- macOS/Windows Platform Adapter；
- capability、status、listThemes、importTheme、applyTheme、verify、restore；
- stdout、stderr、退出码和稳定错误码；
- 跨入口 operation lock、stale lock 和冲突策略；
- transaction journal、staging、backup、publish、verify、commit、cleanup、rollback；
- versioned managed runtime 的安装、验证、升级和降级；
- Tauri 2、Electron、Native Shell 技术 Spike；
- 最小 Studio Vertical Slice；
- Foundation CI、Contract Test、失败注入和双平台实机矩阵；
- Dev/Alpha 发布与回滚流程。

### 4.2 明确不做

- 完整 Theme Manager 信息架构和视觉系统；
- Theme Schema v2 正式实现；
- Canonical Theme Model 和 Compiler；
- Fixture Preview 和 Live Preview；
- Theme Editor；
- Asset Library；
- AI Authoring；
- Marketplace、在线账号、包签名网络信任体系；
- 自动合并或 rebase `main`；
- 重写 Injector/Renderer；
- 把现有 SwiftBar、Tray、CLI 立即移除。

## 5. 目标架构边界

```text
Desktop Shell / Existing Entrypoints
              │ structured request
              ▼
           App Core
              │ typed operation
              ▼
      Runtime Adapter Boundary
        ├── macOS Adapter
        └── Windows Adapter
              │ controlled process/file calls
              ▼
 Existing Runtime + Injector + Official Codex
```

原则：

- UI 不直接连接 CDP；
- App Core 不拼接任意命令字符串；
- Adapter 不把人类日志作为业务结果；
- Runtime 继续负责 Codex 发现、身份、启动、注入、验证和恢复；
- 文件系统是主题事实来源；
- 受管 Runtime 是版本化执行面，不是数据库或后台云服务。

## 6. 交付物

| 交付物 | 文件/证据 |
| --- | --- |
| 阶段设计 | 本目录全部文档 |
| Runtime API 契约 | `contracts-and-data-model.md` |
| 技术架构与事务 | `technical-design.md` |
| 产品与用户流程 | `product-requirements.md`、`ux-and-interaction.md` |
| 安全与隐私 | `security-and-privacy.md` |
| 测试与实机矩阵 | `test-and-acceptance-plan.md` |
| 发布、升级与回滚 | `rollout-and-rollback.md` |
| ADR | `adr/0001-*`～`0004-*` |
| 验收入口 | `acceptance/README.md` |
| 上游 Review | `UPR-20260719-001` |

## 7. Work Items

| ID | 目标 | 进入实现前置 |
| --- | --- | --- |
| `DS-QA-001` | Importer 自动化回归 | fixture 与失败矩阵评审 |
| `DS-QA-002` | Foundation CI | `DS-QA-001`、跨平台编码规则 |
| `DS-FND-002` | Runtime JSON API v1 | ADR-0001、Contract schema |
| `DS-FND-003` | macOS Adapter | `DS-FND-002`、legacy command mapping |
| `DS-FND-004` | Windows Adapter | `DS-FND-002`、PS 5.1/7 runner |
| `DS-FND-005` | operation lock/journal | ADR-0002 |
| `DS-FND-006` | managed runtime | ADR-0003、签名 Spike |
| `DS-FND-007` | Desktop Shell Spike | scorecard 与双平台实验计划 |
| `DS-FND-008` | Desktop Shell ADR | Spike 证据完成后 Accepted |
| `DS-TM-001` | 状态/主题列表 Vertical Slice | 双 Adapter 可用 |
| `DS-TM-002` | Apply/Verify/Restore Slice | transaction/rollback 可用 |
| `DS-QA-003/004` | macOS/Windows 实机 | 功能冻结与安装包可用 |

## 8. 阶段门禁

### 8.1 Definition of Ready

- [x] 当前真实代码基线已记录；
- [x] 最新 `main` 已从游标续接 Review；
- [x] 目标、范围和非目标明确；
- [x] 用户流程和失败恢复流程明确；
- [x] Runtime API、错误、退出码和数据模型已定义；
- [x] Adapter、operation lock 和 transaction journal 已定义；
- [x] managed runtime 生命周期已定义；
- [x] Desktop Shell Spike 评分和淘汰条件已定义；
- [x] 安全、隐私和日志脱敏已评审；
- [x] CI、Contract Test、实机和回滚计划可执行；
- [x] ADR 已建立为 Accepted 或 Proposed；
- [x] Work Register 与 Phase handoff 已同步。

### 8.2 Definition of Done

Phase 00 只有同时满足以下条件才能进入 `Done`：

- Runtime API v1 在 macOS/Windows 核心集合通过同一 Contract Test；
- importer 回归、失败注入和锁冲突测试通过；
- Desktop Shell ADR 已基于实测从 Proposed 变为 Accepted；
- Vertical Slice 不依赖源码 checkout 和系统 PATH；
- 安装、升级、降级、崩溃恢复和紧急 Restore 有实机证据；
- SwiftBar、Tray、CLI 现有主流程无回退；
- macOS 与 Windows 实机报告、截图、日志摘要和 Known Issues 已归档；
- Work Register、Changelog、用户文档和上游采用日志已更新。

## 9. 当前风险

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| Desktop Shell 选型过早 | 锁死签名、updater 和 sidecar | 先 Spike，ADR-0004 保持 Proposed |
| legacy Runtime 输出不稳定 | Adapter 错误映射脆弱 | 新建 JSON wrapper，不让 UI 解析原日志 |
| macOS/Windows 锁机制差异 | 多入口竞争和误删 stale lock | 文件锁目录为契约，平台原生锁作快速层 |
| 受管 Runtime 体积/许可 | 发布包膨胀 | 对比 Node sidecar、编译单文件和 Shell 原生实现 |
| Codex 更新改变 DOM/CDP | Verify 或渲染失效 | capability/version、实机矩阵、Restore |
| 事务提交后清理失败 | 磁盘残留或错误回滚 | cleanupPending warning，不反向撤销已提交状态 |
| 分支继续落后 main | 实现基线漂移 | 每个 Work Item Ready 前从 `dfcfa4f0...` 续接 Review |

## 10. 设计文档索引

- [产品需求](./product-requirements.md)
- [UX 与交互](./ux-and-interaction.md)
- [技术设计](./technical-design.md)
- [契约与数据模型](./contracts-and-data-model.md)
- [安全与隐私](./security-and-privacy.md)
- [测试与验收](./test-and-acceptance-plan.md)
- [发布与回滚](./rollout-and-rollback.md)
- [ADR](./adr/README.md)
- [验收证据](./acceptance/README.md)
