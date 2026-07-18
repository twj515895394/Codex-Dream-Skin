# Studio 上游主分支跟踪机制

> 目标：持续观察 `main` 的演进，记录每次对比节点，选择性吸收优秀设计，但不自动合并、rebase 或覆盖 Dream Skin Studio 的独立架构。

## 1. 跟踪对象

- 仓库：`twj515895394/Codex-Dream-Skin`
- 上游参考分支：`main`
- Studio 演进分支：`feat/codex-theme-import-mvp`
- 上游来源：当前 fork 的 `main` 会同步 `Fei-Away:main`；以 fork `main` 已落地的提交为可审计比较对象。

## 2. 核心原则

1. **观察不等于合并。** 定期做 `fetch/compare/review`，默认不执行 `merge main`、`rebase main` 或自动 cherry-pick。
2. **每次必须记录起点和终点。** 下一次比较必须从 `upstream-baseline.md` 中的 `lastReviewedUpstreamCommit` 开始，不能凭日期猜测。
3. **先分析，再迁移。** 上游变化按“直接迁移、适配迁移、借鉴重写、延期、拒绝”分类。
4. **迁移单独提交。** Review 文档提交不夹带代码迁移；任何迁移必须有独立提交、测试和回滚说明。
5. **Studio 架构优先。** 上游脚本实现即使有效，也不能绕过 Studio 的 Theme Repository、Compiler、Runtime Adapter 与结构化 API 边界。
6. **安全修复优先级最高。** 涉及路径、原子替换、进程身份、配置保真、签名、CDP 或包校验的变化必须优先评估。
7. **无变化也要留痕。** 检查时若 `main` SHA 未变化，仍记录检查日期，但不伪造新的差异范围。

## 3. 目录结构

```text
docs/studio/upstream/
├── README.md
├── upstream-baseline.md
├── upstream-adoption-log.md
├── review-template.md
└── reviews/
    ├── README.md
    └── YYYY-MM-DD-main-review.md
```

- `upstream-baseline.md`：唯一的连续对比游标，保存上一次已审查的 `main` commit。
- `reviews/`：每次上游审查的完整报告，不覆盖历史文件。
- `upstream-adoption-log.md`：记录哪些上游能力最终被采用、如何采用、落到哪个 Studio 提交。
- `review-template.md`：固定审查字段，避免下一次遗漏比较节点或迁移决策。

## 4. 标准执行流程

```text
读取 baseline
    ↓
解析 main 当前 SHA
    ↓
比较 lastReviewedUpstreamCommit..main
    ↓
审查 commit、文件、测试、安全和架构影响
    ↓
生成不可变 review 报告
    ↓
更新 adoption log 中的候选决策
    ↓
最后更新 baseline 的游标
```

### 4.1 第一次执行

首次没有历史游标时，选择一个可解释的起始节点：

- Studio 分支的共同祖先；或
- Studio 设计正式开始时记录的 `main` SHA。

首次报告必须明确说明为什么使用该节点。

### 4.2 后续执行

后续比较严格使用：

```text
<baseline.lastReviewedUpstreamCommit>..main
```

完成报告后，才把 `lastReviewedUpstreamCommit` 更新为本次 `main` 的终点 SHA。这样即使中间隔了数周，也不会漏审或重复审查。

## 5. 变更分类

| 分类 | 含义 | 默认处理 |
| --- | --- | --- |
| `direct-adopt` | 独立且与 Studio 架构无冲突 | 单独 cherry-pick 或等价移植 |
| `adapt-adopt` | 价值明确，但需改造成 Studio 接口 | 在目标 Phase 内适配实现 |
| `concept-rewrite` | 思路优秀，原代码与旧脚本架构耦合 | 保留设计思想，在 Studio 中重写 |
| `defer` | 有价值但不属于当前阶段 | 登记目标 Phase，不立即迁移 |
| `reject` | 与 Studio 目标、安全或维护策略冲突 | 记录原因，不采用 |
| `observe` | 信息不足或尚无实机验证 | 继续跟踪 |

## 6. Review 触发条件

- 固定周期检查；
- 每个 Phase 进入 `Ready` 前；
- Studio Alpha/Beta/Stable 发布前；
- `main` 出现安全修复、Runtime 重构或主题 Schema 变化时；
- Codex Desktop 更新导致渲染或启动行为变化时。

本机制不要求每次检查都迁移代码，也不要求 Studio 分支与 `main` 保持提交图同步。

## 7. 阶段开发门禁

每个 Phase 开发前必须确认：

- `upstream-baseline.md` 已指向最近一次审查完成的 `main` SHA；
- 最近 Review 覆盖了本阶段相关模块；
- 候选迁移已在 `upstream-adoption-log.md` 分类；
- 被采用的上游能力已进入该阶段技术设计和测试计划；
- 未采用的变化有明确理由。

“上游已评审”是门禁；“上游已合并”不是门禁。
