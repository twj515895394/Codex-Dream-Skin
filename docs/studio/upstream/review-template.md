# `main` 上游审查模板

> 文件名：`reviews/YYYY-MM-DD-main-review.md`

## 1. 审查元数据

```yaml
reviewId: UPR-YYYYMMDD-NNN
reviewDate: YYYY-MM-DD
repository: twj515895394/Codex-Dream-Skin
upstreamRef: main
startCommit: <上一次 baseline SHA>
endCommit: <本次 main SHA>
studioBranch: feat/codex-theme-import-mvp
studioCommitAtReviewStart: <SHA>
status: complete
```

## 2. 比较范围

- 比较：`<startCommit>..<endCommit>`
- 新增提交数量：
- 变更文件数量：
- 是否包含 merge commit：
- 是否包含安全修复：
- 是否包含 Theme/Runtime/Installer/CI/Docs 变化：

若起点与终点一致，明确写“本次无新增提交”，不要生成虚假的变更分析。

## 3. Commit 清单

| Commit | 主题 | 影响模块 | 风险等级 | 初步分类 |
| --- | --- | --- | --- | --- |
| `<sha>` |  |  | 低/中/高 | direct-adopt/adapt-adopt/concept-rewrite/defer/reject/observe |

## 4. 重点变化分析

每项至少说明：

- 上游解决的问题；
- 实现方式；
- 设计上值得借鉴的点；
- 与 Studio 当前架构的关系；
- 可否直接迁移；
- 需要哪些测试；
- 回滚边界。

## 5. 安全与可靠性检查

逐项检查：

- 文件路径和目录边界；
- 原子写入、备份和回滚；
- 符号链接/重解析点；
- 进程身份和锁；
- 配置编码与字节保真；
- 安装后源码目录独立性；
- CDP 绑定与目标验证；
- 主题包和图片校验；
- 日志和隐私。

## 6. 对 Studio Roadmap 的影响

| Phase | 影响 | 是否修改阶段设计 |
| --- | --- | --- |
| Phase 0 |  | 是/否 |
| Phase 1 |  | 是/否 |
| Phase 2+ |  | 是/否 |

## 7. 采用决策

### 7.1 立即迁移候选

### 7.2 适配迁移候选

### 7.3 借鉴后重写

### 7.4 延期观察

### 7.5 明确不采用

## 8. 后续动作

每个动作必须有：

- Action ID；
- Owner；
- 目标 Phase；
- 依赖；
- 测试；
- 状态。

## 9. Baseline 更新

报告完成并提交后，把 `upstream-baseline.md` 更新为：

```yaml
previousReviewedUpstreamCommit: <startCommit>
lastReviewedUpstreamCommit: <endCommit>
lastReviewId: <reviewId>
lastReviewReport: reviews/YYYY-MM-DD-main-review.md
```

Baseline 必须最后更新；若报告未完成，不能推进游标。
