# 上游审查记录

本目录保存每次对 `main` 的不可变审查报告。

## 命名规则

```text
YYYY-MM-DD-main-review.md
```

同一天执行多次时使用：

```text
YYYY-MM-DD-main-review-02.md
```

## 当前记录

| Review ID | 日期 | 比较范围 | 状态 | 报告 |
| --- | --- | --- | --- | --- |
| `UPR-20260718-001` | 2026-07-18 | `31160026800564e0fe228ca44d956479b66d1164..19fa0342846219fb0476bfd648aa7f0f0019bb0b` | Complete | [`2026-07-18-main-review.md`](./2026-07-18-main-review.md) |

## 规则

- 历史报告只追加，不覆盖；
- 修正历史事实时，在原报告增加勘误说明，并在下一次 Review 中引用；
- 下一次对比起点以 `../upstream-baseline.md` 为准；
- Review 只做分析和决策，不夹带 Runtime 或 Studio 代码迁移。
