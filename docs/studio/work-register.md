# Dream Skin Studio 工作登记表

> 文档角色：当前工作、状态、依赖和证据的唯一登记表  
> 主控入口：[`MASTER-PLAN.md`](./MASTER-PLAN.md)  
> 最后更新：2026-07-19

## 1. 当前项目状态

```yaml
studioBranch: feat/codex-theme-import-mvp
openPullRequest: 2
pullRequestMerged: false
currentPhase: Phase 00 In Progress
currentDeliveryPlatform: macOS
futurePlatform: Windows
implementationIssueDirectory: .scratch/phase-00-foundation/issues
latestDefinedIssue: 09-import-theme-operation.md
```

说明：

- Phase 00 已经从 `Ready` 进入实施阶段；
- Issue 链已定义到 Issue 09，但“已定义”不等于“已完成”；
- 每个 Issue 的完成状态必须由勾选验收、summary report、测试和提交共同证明；
- Windows 工作保留在 Future Platform，不阻塞当前 Phase。

## 2. 状态定义

| 状态 | 含义 |
| --- | --- |
| `Planned` | 已登记，尚未满足开发门禁 |
| `Ready` | 设计和直接依赖已满足 |
| `In Progress` | 已有实施文件或代码工作正在推进 |
| `Verification` | 功能冻结，正在自动化和实机验收 |
| `Done` | 实现、测试、报告、文档和回滚证据齐全 |
| `Deferred` | 保留但移至后续平台或阶段 |

## 3. Phase 00 实施 Issue 映射

| Issue | 文件 | 对应能力 | 项目状态 |
| --- | --- | --- | --- |
| 01 | `01-importer-safety-fixture-generator.md` | 安全 fixture 生成器 | 以文件验收为准 |
| 02 | `02-importer-regression-test-suite.md` | Importer 回归测试 | 以文件验收为准 |
| 03 | `03-runtime-api-v1-schema-envelope.md` | Runtime API v1 Schema/Envelope | 以文件验收为准 |
| 04 | `04-reference-runner-contract-test.md` | Reference Host / Contract Runner | 以文件验收为准 |
| 05 | `05-capabilities-status-operation.md` | capabilities/status | 以文件验收为准 |
| 06 | `06-list-themes-operation.md` | listThemes | 以文件验收为准 |
| 07 | `07-operation-lock.md` | operation lock | 以文件验收为准 |
| 08 | `08-transaction-journal-crash-recovery.md` | journal / crash recovery | 以文件验收为准 |
| 09 | `09-import-theme-operation.md` | importTheme 端到端写操作 | Ready after #02/#06/#08 |

当前实施必须先检查 Issue 01～08 的真实完成证据，再决定 Issue 09 是进入 `In Progress` 还是仍被阻塞。

## 4. Phase 00 当前优先链

```text
Issue 01/02 Importer Fixtures + Regression
  ↓
Issue 03/04 Runtime API Schema + Contract Runner
  ↓
Issue 05/06 Read Operations
  ↓
Issue 07 Operation Lock
  ↓
Issue 08 Transaction Journal + Crash Recovery
  ↓
Issue 09 importTheme
  ↓
Issue 10+ applyTheme / verify / restore
  ↓
Managed Runtime
  ↓
macOS Launcher
  ↓
macOS Studio Vertical Slice
  ↓
macOS Install / Upgrade / Rollback / Real-device Verification
```

## 5. Work Items

| ID | 工作 | 状态 | 交付平台 | 主要证据/依赖 |
| --- | --- | --- | --- | --- |
| `DS-FND-001` | Phase 00 设计与 ADR | Done | Architecture | Phase 00 文档、ADR-0001～0005 |
| `DS-QA-001` | Importer fixture 与自动化回归 | In Progress | macOS | Issue 01/02、测试报告 |
| `DS-FND-002` | Runtime API v1 Schema、Reference Host、Contract Runner | In Progress | Cross-platform contract | Issue 03/04 |
| `DS-FND-003` | capabilities/status/listThemes | In Progress | macOS first | Issue 05/06 |
| `DS-FND-005` | operation lock 与 transaction journal | In Progress | macOS first | Issue 07/08、ADR-0002 |
| `DS-FND-009` | importTheme Operation | Ready/Blocked | macOS first | Issue 09；依赖 #02/#06/#08 |
| `DS-FND-010` | applyTheme Operation | Planned | macOS | importTheme、lock/journal |
| `DS-FND-011` | verify/restore Operations | Planned | macOS | applyTheme、recovery model |
| `DS-FND-006` | 版本化受管 Runtime | Planned | macOS | ADR-0003、写操作稳定 |
| `DS-FND-007` | macOS Desktop Shell / Launcher Spike | Planned | macOS | Runtime API 可运行 |
| `DS-FND-008` | Desktop Shell 最终 ADR | Planned | macOS | Spike、签名、sidecar、安装证据 |
| `DS-LCH-001` | `Dream Skin.app` Launcher MVP | Planned | macOS | Runtime、Recovery、Launch Codex |
| `DS-TM-001` | `Dream Skin Studio.app` 主题列表 Vertical Slice | Planned | macOS | listThemes、Shell 选型 |
| `DS-TM-002` | Apply/Verify/Restore Vertical Slice | Planned | macOS | Runtime 写操作、Launcher |
| `DS-QA-003` | Phase 00 macOS 实机矩阵 | Planned | macOS | 安装、导入、应用、启动、Verify、Restore、升级/降级 |
| `DS-FND-004` | Windows Runtime Adapter | Deferred | Windows | macOS Runtime API 稳定后 |
| `DS-LCH-WIN-001` | Windows Launcher / Installer | Deferred | Windows | Windows Adapter |
| `DS-QA-004` | Windows 实机矩阵 | Deferred | Windows | Windows 发布阶段 |

## 6. Phase 00 Done 门禁

Phase 00 的 Done 只要求 macOS 产品链满足：

- Runtime API v1 核心 Contract Test 通过；
- Issue 01～后续 Phase 00 核心 Issue 验收完成；
- operation lock、journal、崩溃恢复和幂等语义有测试证据；
- import/apply/verify/restore 形成闭环；
- 受管 Runtime 不依赖源码 checkout 或用户 PATH；
- `Dream Skin.app` Launcher 和最小 Studio Slice 可运行；
- macOS 安装、升级、降级、恢复和实机矩阵完成；
- summary reports、Known Issues、handoff 和用户文档同步。

Windows Adapter、Windows Installer、PowerShell 兼容和 Windows 实机矩阵不再是 Phase 00 Done 条件。

## 7. 后续阶段

| Phase | 平台 | Epic |
| --- | --- | --- |
| 01 | macOS | Theme Repository、Library、管理闭环、Launcher MVP 正式化 |
| 02 | macOS | Compiler、Fixture/Live Preview、Schema v2 |
| 03 | macOS | Theme Editor 与导出 |
| 04 | macOS | Assets、AI、Marketplace、Skill/Plugin、发布成熟度 |
| 05 | Windows | Adapter、Launcher、Installer、Verify、Release |

## 8. 维护规则

- Issue 完成后必须更新本表中的状态和证据；
- 接口或可观测行为变化必须生成 summary report；
- 不得用“已创建 Issue”替代“已完成实现”；
- 不得重新把 Windows 工作加入当前 macOS Phase 的阻塞依赖；
- Launcher、Studio、CLI、Skill 必须共享 Runtime API。