# Dream Skin Studio Handoff 规范

> 角色：项目状态交接中心  
> 主控文档：[`docs/studio/MASTER-PLAN.md`](../docs/studio/MASTER-PLAN.md)  
> 当前入口：[`current.md`](./current.md)

`.handoff/` 用于在不同会话、阶段、维护者和开发周期之间传递**可执行的当前状态**。它不替代产品设计、ADR、Work Register 或上游 Review，而是将这些事实聚合成新会话可以立即读取的启动入口。

## 1. 目录结构

```text
.handoff/
├── README.md
├── current.md
├── handoff-YYYYMMDD-<topic>.md
├── phases/
│   ├── README.md
│   └── phase00/
│       ├── current.md
│       └── archive/
│           └── README.md
└── archive/
    └── README.md
```

规则：

- `current.md` 是跨阶段、跨会话的唯一最新入口；
- 根目录 `handoff-YYYYMMDD-*.md` 是不可覆盖的历史快照；
- `phases/phaseXX/current.md` 是该阶段的当前状态入口；
- `phases/phaseXX/archive/` 保存该阶段已经被替代的交接快照；
- `archive/` 保存项目级、发布级或已结束阶段的旧交接文件。

Git 不跟踪空目录，因此每个 archive 目录保留 `README.md`。

## 2. 必须生成新 Handoff 的节点

以下情况必须新增一个不可覆盖的 handoff 文件，并更新 `current.md`：

1. Phase 开始设计；
2. Phase 从 `Ready` 进入 `In Progress`；
3. Phase 进入 `Verification` 或 `Done`；
4. 重大架构决策、Runtime 重构或数据迁移；
5. Release、Rollback、紧急安全修复；
6. 长会话结束且存在未完成工作；
7. 当前分支、长期开发策略或上游跟踪策略发生变化。

小型文字修正不要求创建新快照，但必须保持 `current.md` 真实。

## 3. 文件命名

```text
handoff-YYYYMMDD-<scope>-<state>.md
```

示例：

```text
handoff-20260718-studio-bootstrap.md
handoff-20260725-phase00-design-ready.md
handoff-20260810-phase00-complete.md
handoff-20260811-phase01-design-start.md
handoff-20260901-runtime-migration.md
```

文件名只描述事件，不使用 `latest`、`final2`、`new` 等不可追踪名称。

## 4. Handoff 必填内容

每份历史快照至少包含：

```yaml
handoffDate:
repository:
branch:
headAtHandoff:
pullRequest:
currentPhase:
phaseStatus:
currentWorkItem:
lastReviewedMainCommit:
upstreamReviewId:
relatedUpstreamActions: []
currentPhaseHandoff:
```

正文必须覆盖：

- 当前真实能力与未实现能力；
- 本轮完成内容；
- 当前阻塞、风险和 Known Issues；
- 必读文档顺序；
- 下一项可执行工作；
- 禁止提前进行的工作；
- 测试、实机和回滚状态；
- 新会话启动 Prompt；
- 交接 Checklist。

## 5. `current.md` 规则

`current.md` 只保存最新状态和指针，不复制所有设计细节。必须包含：

- 当前分支、当前 HEAD、PR；
- 当前 Phase、状态和 Work Item；
- 当前历史 handoff 文件；
- 当前 Phase handoff；
- 必读文档；
- 下一步；
- 新会话启动 Prompt。

更新顺序：

```text
完成工作与验证
    ↓
更新 Work Register / Phase 文档 / ADR
    ↓
生成新的历史 Handoff
    ↓
更新 Phase current.md
    ↓
最后更新根 current.md
```

不得先更新 `current.md` 再补历史快照。

## 6. 与其他文档的关系

| 内容 | 事实来源 |
| --- | --- |
| 产品和工程原则 | `docs/studio/MASTER-PLAN.md` |
| 当前工作状态 | `docs/studio/work-register.md` |
| 阶段详细设计 | `docs/studio/phases/phase-XX-*/` |
| ADR | 对应 Phase 的 `adr/` |
| 上游比较游标 | `docs/studio/upstream/upstream-baseline.md` |
| 上游采用状态 | `docs/studio/upstream/upstream-adoption-log.md` |
| 会话启动和状态聚合 | `.handoff/current.md` |
| 历史交接快照 | `.handoff/handoff-*.md` 与 archive |

若 handoff 与上述事实来源冲突，必须先修正事实来源，再生成新的 handoff；不得只改 handoff 掩盖冲突。

## 7. 交接 Checklist

每次生成新快照前确认：

- [ ] 当前分支和 HEAD 已记录；
- [ ] PR 状态已确认；
- [ ] 当前 Phase 和 Work Item 已记录；
- [ ] 最近一次 `main` Review 和游标已记录；
- [ ] 相关 UPR、UPA、ADR 已记录；
- [ ] 已完成项有提交和验证证据；
- [ ] 未完成项没有写成 Done；
- [ ] Known Issues 和恢复方式已记录；
- [ ] 下一步是单一、可执行的工作；
- [ ] 新会话 Prompt 已更新；
- [ ] Phase `current.md` 已更新；
- [ ] 根 `current.md` 最后更新。

## 8. 新会话最小读取方式

任何新会话首先读取：

```text
.handoff/current.md
```

随后按照其中的“必读文档”继续，不再从聊天记录推断项目状态。