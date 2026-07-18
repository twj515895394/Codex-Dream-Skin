---
schemaVersion: 1
trackingId: studio-upstream-main
repository: twj515895394/Codex-Dream-Skin
upstreamRef: main
studioBranch: feat/codex-theme-import-mvp
previousReviewedUpstreamCommit: 31160026800564e0fe228ca44d956479b66d1164
lastReviewedUpstreamCommit: 19fa0342846219fb0476bfd648aa7f0f0019bb0b
studioCommitAtReviewStart: 2174f597f38c5c1ea19403480fa88256835b0a33
studioCommitAfterReviewArtifacts: 089ac65d36d188a8e5c1b9fa7b73f54abb841065
lastReviewId: UPR-20260718-001
lastReviewDate: 2026-07-18
lastReviewReport: reviews/2026-07-18-main-review.md
reviewStatus: complete
---

# 上游审查基线

本文件是下一次 `main` 对比的唯一连续游标。

## 当前节点

| 字段 | 值 |
| --- | --- |
| 已审查起点 | `31160026800564e0fe228ca44d956479b66d1164` |
| 已审查终点 | `19fa0342846219fb0476bfd648aa7f0f0019bb0b` |
| Review | `UPR-20260718-001` |
| 报告 | [`reviews/2026-07-18-main-review.md`](./reviews/2026-07-18-main-review.md) |
| 状态 | Complete |

## 下一次执行

先读取当前 `main` SHA，随后比较：

```text
19fa0342846219fb0476bfd648aa7f0f0019bb0b..<current-main-sha>
```

只有完成以下步骤后，才能推进 `lastReviewedUpstreamCommit`：

1. 生成 Review 报告；
2. 审查 commit 和变更文件；
3. 完成安全与架构分类；
4. 更新 `upstream-adoption-log.md`；
5. 提交 Review 文档；
6. 最后更新本文件。

## 无变化检查

若当前 `main` 仍为：

```text
19fa0342846219fb0476bfd648aa7f0f0019bb0b
```

则本次没有新的 commit 需要分析。可以记录一次检查日期，但不改变起止节点，也不重复生成同范围报告。

## 禁止事项

- 不以“最近一周”或日期代替 commit 游标；
- 不从 Studio 分支 HEAD 猜测上游起点；
- 不在 Review 未完成时提前移动游标；
- 不因准备开发某个 Phase 而自动 merge/rebase `main`；
- 不把尚未迁移的候选能力写成已采用。
