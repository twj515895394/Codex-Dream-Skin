# Dream Skin Studio 当前交接指针

> 状态：Active  
> 分支：`feat/codex-theme-import-mvp`  
> 最后更新：2026-07-19  
> 当前 Phase：`Phase 00 In Progress`

## 当前真实状态

Phase 00 已完成设计并进入实施。当前代码与测试进度：

- Issue 01：Importer Safety Fixture Generator，完成；
- Issue 02：Importer Regression Suite，17 场景通过；
- Issue 03：Runtime API v1 Schema / Envelope，完成；
- Issue 04：Reference Runner / Contract Test，完成；
- Issue 05：`capabilities` / `status`，完成；
- Issue 06：`listThemes`，完成；
- Issue 07：operation lock，当前任务；
- Issue 08：transaction journal / crash recovery，下一任务；
- Issue 09：`importTheme`，已定义，依赖 #02/#06/#08。

不得把 Issue 09 已创建描述为 Issue 09 已完成。

## 当前产品路线

```yaml
architecture: cross-platform
currentImplementation: macOS
currentTestingAndRelease: macOS
futurePlatform: Windows
entryArchitecture: launcher-first
```

```text
Dream Skin.app
  └─ Launcher：Runtime 检查、恢复、Apply/Verify、启动 Codex

Dream Skin Studio.app
  └─ Studio：主题管理、预览、编辑、素材、市场、设置、日志

Dream Skin Runtime
  └─ 无 UI：共享 Runtime API、Lock、Journal、Import、Apply、Verify、Restore
```

Windows Adapter、Launcher、Installer 和实机矩阵已延后，不阻塞 Phase 00。

## 当前任务

```text
DS-FND-005 / Issue 07
实现 operation lock、owner.json、stale lock 识别、安全抢占和 single-flight。
```

文件：`.scratch/phase-00-foundation/issues/07-operation-lock.md`

完成 Issue 07 后：

```text
Issue 08 transaction journal / crash recovery
  → Issue 09 importTheme
  → applyTheme / verify / restore
  → managed runtime
  → macOS Launcher / Studio Vertical Slice
  → macOS 实机验收
```

## 当前状态矩阵

```yaml
importerFixtures: done
importerRegression: done-17-scenarios
runtimeApiSchema: done
referenceRunner: done
capabilitiesStatus: done
listThemes: done
operationLock: current-issue07
transactionJournal: pending-issue08
importTheme: blocked-by-issue08
applyVerifyRestore: not-started
managedRuntime: not-started
macosLauncher: not-started
studioVerticalSlice: not-started
macosRealDeviceMatrix: not-started
windowsPlatformWork: deferred
```

## 必读顺序

1. 本文件；
2. `.handoff/phases/phase00/current.md`；
3. `docs/studio/MASTER-PLAN.md`；
4. `docs/studio/work-register.md`；
5. `docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`；
6. `.scratch/phase-00-foundation/PRD.md`；
7. Issue 07、08、09；
8. Phase 00 contracts、technical design、ADR-0001～0005。

## 上游策略

- 不自动 merge/rebase `main`；
- 上游续接游标：`dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c`；
- 新变化先 Review，再决定 adopt/adapt/rewrite/defer/reject。

## 禁止事项

- 不绕过 Issue 07/08 直接实施事务写操作；
- 不让 UI、Launcher 或 Skill 直接编排 Shell；
- 不让 UI 直接连接 CDP；
- 不提前开始大规模 Theme Manager UI；
- 不依赖源码 checkout 或用户 PATH 作为正式 Runtime；
- 不把 Windows 放回当前 Phase 阻塞链；
- 测试必须使用隔离 state root，不操作真实用户主题或 Codex 状态。

## 新会话启动 Prompt

```text
读取 .handoff/current.md 与 .handoff/phases/phase00/current.md。确认分支 HEAD 和 Issue 01-06 测试证据。当前续接 Issue 07 operation lock，之后 Issue 08 journal，再实施 Issue 09 importTheme。项目已经确定 macOS-first、Launcher-first；Windows 延后，不阻塞 Phase 00。Launcher、Studio、CLI、SwiftBar 和 Skill 必须共享 Runtime API。
```