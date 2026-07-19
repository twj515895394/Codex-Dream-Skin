# Phase 00 当前交接

```yaml
phase: 00
name: Foundation, Runtime API and macOS Launcher/Studio Shell
status: In Progress
branch: feat/codex-theme-import-mvp
completedIssues: 01-06
currentIssue: 07-operation-lock.md
nextIssues:
  - 08-transaction-journal-crash-recovery.md
  - 09-import-theme-operation.md
currentDeliveryPlatform: macOS
futurePlatform: Windows
lastReviewedMainCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
upstreamReviewId: UPR-20260719-001
```

## 当前真实状态

Phase 00 已进入实施阶段，不再是“设计 Ready、功能未开始”。

已完成并有回归证据：

- Issue 01：Importer Safety Fixture Generator；
- Issue 02：Importer Regression Test Suite，17 场景通过；
- Issue 03：Runtime API v1 Schema 与 Envelope；
- Issue 04：Reference Runner 与 Contract Test；
- Issue 05：`capabilities` / `status`；
- Issue 06：`listThemes`，包含坏主题隔离和性能验证。

当前工作：

- Issue 07：operation lock、`owner.json`、stale lock 识别与安全抢占。

后续已定义：

- Issue 08：transaction journal 与 crash recovery；
- Issue 09：`importTheme` 端到端写操作，依赖 #02/#06/#08。

Issue 09 已存在不代表可以绕过 #07/#08 直接实施。

## 已接受的新路线

### macOS-first

- 当前实现、测试、签名、安装和发布只聚焦 macOS；
- API、Schema、错误码和包格式继续保持跨平台；
- Windows Adapter、Launcher、Installer 和实机矩阵延后；
- Windows 不阻塞 Phase 00 Done。

### Launcher-first

```text
Dream Skin.app
  └─ Runtime check / recovery / apply / verify / launch Codex

Dream Skin Studio.app
  └─ Theme Library / management / preview / editor

Dream Skin Runtime
  └─ shared no-UI execution layer
```

Launcher、Studio、CLI、SwiftBar 和未来 Skill 必须共享 Runtime API。

## 当前 Work Item

### `DS-FND-005 / Issue 07` · In Progress / Ready to implement

目标：

- 原子获取 operation lock；
- 写入并校验 `owner.json`；
- 识别活跃 owner 与 stale owner；
- 防止误抢占；
- 为 transaction journal 和所有写操作提供 single-flight；
- Contract Test 覆盖并发、冲突、stale、释放和异常退出。

## 下一步

```text
完成 Issue 07 operation lock
  ↓
完成 Issue 08 transaction journal / crash recovery
  ↓
实施 Issue 09 importTheme
  ↓
继续 applyTheme / verify / restore
  ↓
managed runtime
  ↓
macOS Launcher + Studio Vertical Slice
  ↓
macOS installation / upgrade / rollback / real-device acceptance
```

## 测试状态

```yaml
importerFixtures: done
importerRegression: done-17-scenarios
runtimeApiSchema: done
referenceRunner: done
capabilitiesStatus: done
listThemes: done
operationLock: pending-issue07
transactionJournal: pending-issue08
importTheme: blocked-by-issue08
applyVerifyRestore: not-started
managedRuntime: not-started
macosLauncher: not-started
studioVerticalSlice: not-started
macosRealDeviceMatrix: not-started
windowsWork: deferred
```

## 必读顺序

1. `.handoff/current.md`
2. 本文件
3. `docs/studio/MASTER-PLAN.md`
4. `docs/studio/work-register.md`
5. `.scratch/phase-00-foundation/PRD.md`
6. `.scratch/phase-00-foundation/issues/07-operation-lock.md`
7. `.scratch/phase-00-foundation/issues/08-transaction-journal-crash-recovery.md`
8. `.scratch/phase-00-foundation/issues/09-import-theme-operation.md`
9. Phase 00 Contract、Technical Design 和 ADR-0001～0005

## 禁止事项

- 不自动 merge/rebase `main`；
- 不绕过 Issue 07/08 直接做写操作；
- 不让 UI 或 Skill 直接编排 Shell；
- 不开始大规模 Theme Manager UI；
- 不把 Windows 工作重新放回当前 Phase 阻塞链；
- 不把 Issue 已定义写成 Issue 已完成；
- 不让测试操作真实用户主题或真实 Codex 状态。

## 新会话启动 Prompt

```text
读取 .handoff/current.md 和 .handoff/phases/phase00/current.md，确认当前分支 HEAD 和 Issue 01-06 的测试证据。Phase 00 正在实施，当前应续接 Issue 07 operation lock；完成后进入 Issue 08 journal，再进入 Issue 09 importTheme。当前产品路线是 macOS-first、Launcher-first，Windows 已延后且不阻塞 Phase 00。不要让 Launcher、Studio、CLI 或 Skill 绕过 Runtime API。
```