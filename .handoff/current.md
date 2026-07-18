# Dream Skin Studio 当前交接入口

> 本文件是新会话的唯一最新入口。历史上下文保存在不可覆盖的 handoff 快照中。

```yaml
repository: twj515895394/Codex-Dream-Skin
branch: feat/codex-theme-import-mvp
headRecordedAtHandoffBootstrap: f73ee2c7d27872d398a14dac86a84037fa816f54
pullRequest: 2
pullRequestState: open
pullRequestMerged: false
currentPhase: Phase 00
phaseStatus: Planned
currentWorkItem: DS-FND-001
lastReviewedMainCommit: 19fa0342846219fb0476bfd648aa7f0f0019bb0b
upstreamReviewId: UPR-20260718-001
currentHistoricalHandoff: handoff-20260718-dream-skin-studio-phase-design.md
currentPhaseHandoff: phases/phase00/current.md
```

> 注意：本文件中的 HEAD 是 handoff 系统规范化前的记录节点。新会话开始时必须读取 GitHub 当前分支 HEAD，并将实际 SHA 写入 Phase 00 设计基线；不要把上述 SHA 当作永远不变的当前 HEAD。

## 当前任务

```text
DS-FND-001
创建并完成 Phase 00 细化设计目录和全部设计文档。
先完成设计与 Ready 门禁，不进入正式功能代码开发。
```

Phase 00 设计目录：

```text
docs/studio/phases/phase-00-foundation-and-shell-spike/
```

必须覆盖 Runtime JSON API v1、双平台 Adapter、operation lock、事务与受管 Runtime、Desktop Shell Spike、CI、Contract Test、实机矩阵、发布与回滚。

## 必读文档

按顺序读取：

1. [`handoff-20260718-dream-skin-studio-phase-design.md`](./handoff-20260718-dream-skin-studio-phase-design.md)
2. [`../docs/studio/MASTER-PLAN.md`](../docs/studio/MASTER-PLAN.md)
3. [`../docs/studio/work-register.md`](../docs/studio/work-register.md)
4. [`../docs/studio/project-implementation-plan.md`](../docs/studio/project-implementation-plan.md)
5. [`../docs/studio/engineering-rulebook.md`](../docs/studio/engineering-rulebook.md)
6. [`../docs/studio/phase-design-and-delivery-template.md`](../docs/studio/phase-design-and-delivery-template.md)
7. [`../docs/studio/phases/README.md`](../docs/studio/phases/README.md)
8. [`../docs/studio/upstream/upstream-baseline.md`](../docs/studio/upstream/upstream-baseline.md)
9. [`../docs/studio/upstream/upstream-adoption-log.md`](../docs/studio/upstream/upstream-adoption-log.md)
10. [`phases/phase00/current.md`](./phases/phase00/current.md)

## 开始前检查

新会话必须先确认：

- 当前分支仍为 `feat/codex-theme-import-mvp`；
- 当前分支真实 HEAD；
- PR #2 是否仍 Open、未合并；
- `main` 当前 SHA 是否已超过已审查节点；
- 若 `main` 有新变化，只做续接 Review，不自动 merge/rebase；
- 当前 Work Item 仍为 `DS-FND-001`；
- 本轮只做 Phase 00 细化设计。

## 禁止提前进行

在 Phase 00 达到 `Ready` 前，不进行：

- Theme Manager 大规模 UI 开发；
- Theme Schema v2 正式实现；
- Theme Compiler 正式实现；
- Live Preview；
- Theme Editor；
- AI Authoring；
- Marketplace；
- 批量合并或 rebase `main`。

## 新会话启动 Prompt

```text
请读取 feat/codex-theme-import-mvp 分支下的 .handoff/current.md，并按照其中的必读文档顺序恢复项目上下文。

然后确认：
1. 当前分支真实 HEAD；
2. PR #2 当前状态；
3. main 当前 SHA；
4. docs/studio/upstream/upstream-baseline.md 中的已审查游标。

不要自动 merge/rebase main。若 main 有新增变化，先从记录游标续接 Review 并形成采用决策。

接下来执行 DS-FND-001：建立并完成 docs/studio/phases/phase-00-foundation-and-shell-spike/ 下的 Phase 00 细化设计文档。严格使用 docs/studio/phase-design-and-delivery-template.md，更新 work-register.md 和必要的主控文档。先做设计，不进入正式功能代码开发。
```

## 当前交接 Checklist

- [x] 当前分支已记录；
- [x] PR #2 已记录；
- [x] 当前 Phase 与 Work Item 已记录；
- [x] 上游 Review 与游标已记录；
- [x] 当前历史 handoff 已链接；
- [x] Phase 00 current 已规划；
- [x] 下一步单一且可执行；
- [x] 新会话 Prompt 已提供；
- [ ] 新会话确认实际最新 HEAD；
- [ ] Phase 00 细化设计完成；
- [ ] `DS-FND-001` 达到 Done。