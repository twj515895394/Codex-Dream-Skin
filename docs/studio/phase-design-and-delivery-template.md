# 阶段设计与交付模板

> 用途：每个 Phase 开始开发前，复制本模板到 `docs/studio/phases/phase-XX-name/`，补齐所有必需项并通过评审。

## 1. 阶段文档目录模板

```text
phase-XX-name/
├── README.md
├── product-requirements.md
├── ux-and-interaction.md
├── technical-design.md
├── contracts-and-data-model.md
├── security-and-privacy.md
├── test-and-acceptance-plan.md
├── rollout-and-rollback.md
├── adr/
│   ├── 0001-*.md
│   └── ...
└── acceptance/
    ├── test-report.md
    ├── known-issues.md
    └── screenshots/
```

规模较小的阶段可以合并文档，但必须覆盖本文列出的全部内容。

## 2. `README.md` 必需内容

```md
# Phase XX · 名称

- 状态：Draft | Ready | In Progress | Verification | Done | Paused
- Owner：
- Studio 基线分支/Commit：
- 最近上游 Review ID：
- 最近已审查 main Commit：
- 目标版本：
- 依赖阶段：
- 计划开始：
- 实际完成：

## 阶段目标

## 用户价值

## 范围

## 明确不做

## 交付物

## 上游采用决策

## 阶段门禁
```

## 3. 产品需求模板

### 3.1 问题定义

- 当前用户在什么场景遇到什么问题；
- 现有脚本、菜单栏或托盘为什么不能充分解决；
- 这个问题是否需要本阶段解决；
- 不解决的影响。

### 3.2 用户角色

至少区分：

- 普通主题使用者；
- 主题作者；
- 项目维护者；
- Marketplace 作者/审核者（如适用）。

### 3.3 用户故事

示例：

```text
作为普通用户，我希望在主题卡片中点击“试用”，
以便在不覆盖当前主题的情况下查看 Codex 实机效果。
```

每个故事包含：

- 前置条件；
- 主流程；
- 取消/失败流程；
- 数据变化；
- 验收标准。

### 3.4 范围和延期项

必须列出：

- 本阶段包含；
- 本阶段不包含；
- 下阶段候选；
- 不会实现的非目标。

## 4. UX 与交互设计模板

### 4.1 信息架构

说明页面、导航、弹窗、抽屉和系统入口关系。

### 4.2 关键流程

至少覆盖：

- 正常流程；
- 空状态；
- 加载状态；
- 无权限或环境不满足；
- 数据损坏；
- 操作冲突；
- 用户取消；
- Runtime 失败；
- 恢复流程。

### 4.3 状态设计

禁止只画成功页面。每个页面至少定义：

```text
initial / loading / ready / empty / warning / error / disabled / offline
```

### 4.4 Preview 真实性说明

涉及预览时必须明确：

- 这是 Fixture Preview、静态截图还是 Live Preview；
- 哪些效果与实机共用 compiler；
- 哪些 Codex 版本差异无法模拟；
- UI 如何避免把概念效果图误写成实机效果。

### 4.5 可访问性

至少检查：

- 键盘操作；
- 焦点顺序；
- 对比度；
- 屏幕阅读器标签；
- 颜色不是唯一状态表达；
- 动效降级。

## 5. 技术设计模板

### 5.1 当前 Studio 基线

列出本阶段开始时真实存在的：

- 相关文件；
- Runtime 命令；
- Schema 版本；
- 状态目录；
- CI；
- 已知缺口；
- Studio 分支和 commit。

### 5.2 上游 `main` Review

每个 Phase 进入 `Ready` 前，必须读取：

- `docs/studio/upstream/upstream-baseline.md`；
- 最近一份 `docs/studio/upstream/reviews/*-main-review.md`；
- `docs/studio/upstream/upstream-adoption-log.md`。

阶段文档必须记录：

```yaml
upstreamReviewId: UPR-YYYYMMDD-NNN
reviewedMainCommit: <sha>
relevantActions:
  - UPA-XXX
notAdopted:
  - commit: <sha>
    reason: <原因>
```

规则：

1. 若 `main` 已经前进，先完成新的 Review，再进入开发；
2. Review 只要求形成采用决策，不要求 merge/rebase `main`；
3. 计划采用的能力必须进入本阶段技术设计、风险和测试；
4. 上游迁移必须使用独立提交，不能与阶段无关代码混合；
5. `upstream-baseline.md` 的 commit 游标是唯一续接节点，不能用日期替代。

### 5.3 目标架构

包含：

- 模块图；
- 时序图；
- 数据流；
- 写操作事务边界；
- 失败恢复；
- 跨平台差异。

### 5.4 接口契约

所有 Studio → Runtime 调用必须定义结构化输入输出。

示例：

```json
{
  "apiVersion": 1,
  "operation": "applyTheme",
  "requestId": "...",
  "input": {
    "themeId": "soft-family-calm-v3"
  }
}
```

```json
{
  "apiVersion": 1,
  "ok": false,
  "operation": "applyTheme",
  "requestId": "...",
  "data": null,
  "warnings": [],
  "error": {
    "code": "CODEX_RESTART_REQUIRED",
    "message": "...",
    "recoverable": true,
    "action": "confirmRestart"
  }
}
```

禁止 UI 解析不稳定的人类可读日志来判断成功。Adapter 必须保留真实退出码，把 stdout、stderr 和稳定 error code 分开处理。

### 5.5 数据模型

说明：

- 新增字段和默认值；
- 唯一键、时间字段和版本；
- 文件路径和 hash；
- 未知字段策略；
- v1/v2 兼容；
- 数据库与文件系统谁是事实来源。

### 5.6 迁移与事务策略

每项迁移必须定义：

```text
Detect → Backup → Stage → Validate → Commit → Cleanup
                                  ↘ Failure before commit → Restore
```

必须区分：

- 提交前失败：恢复旧状态；
- 提交后清理失败：记录 warning，不破坏已提交成功状态。

禁止启动时无提示地执行不可逆迁移。

### 5.7 并发与锁

至少说明：

- 导入和应用能否并发；
- Preview 与删除冲突如何处理；
- Studio、SwiftBar、Tray 和 CLI 同时操作时如何串行化；
- 锁超时与 stale lock 处理；
- 应用崩溃后如何恢复。

## 6. 安全与隐私模板

### 6.1 威胁模型

至少考虑：

- 恶意 `.codex-theme`；
- 路径穿越；
- 符号链接、junction 和 reparse point；
- ZIP bomb；
- 恶意图片；
- 命令注入；
- 不可信 Marketplace；
- CDP 被同用户恶意进程访问；
- 预览会话残留；
- Runtime 更新供应链；
- 日志泄露用户路径或项目名。

### 6.2 权限和信任边界

明确：

- UI；
- App Core；
- Platform Adapter；
- Managed Runtime；
- Runtime scripts；
- Codex；
- 外部 Provider；
- Marketplace。

### 6.3 隐私

涉及 AI、日志或截图时说明：

- 数据是否离开本机；
- 发送给谁；
- 保存多久；
- 用户如何删除；
- 是否包含 Codex 对话、项目路径或身份信息。

## 7. 测试与验收模板

### 7.1 单元测试

- Schema；
- Normalizer；
- Compiler；
- Repository；
- Package；
- path safety；
- error mapping；
- Runtime Distribution transaction。

### 7.2 Contract Test

同一套 Adapter contract test 必须能验证 macOS 与 Windows 返回相同语义，包括：

- stdout/stderr/exit code；
- apply/preview/revert/restore；
- restart required；
- recoverable error；
- managed runtime version。

### 7.3 集成测试

至少覆盖：

- 安装；
- 列表；
- 导入；
- 应用；
- 覆盖；
- 删除；
- 导出再导入；
- 重启；
- 恢复；
- 并发冲突；
- 损坏主题；
- Runtime 更新失败回滚；
- 源码 checkout 被移动或删除后仍可运行。

### 7.4 Visual Regression

至少固定场景：

- Home Light；
- Home Dark；
- Coding Light；
- Coding Dark；
- Popover；
- Composer；
- Code Block；
- Attachment；
- User Message；
- 原生 Header 和侧面板切换控件。

### 7.5 实机验收

模拟 Preview 不能替代实机验收。每次渲染层变更需要：

- macOS 实机；
- Windows 实机；
- 至少一个当前 Codex 版本；
- Verify；
- 截图；
- 原生控件交互；
- Restore。

### 7.6 Definition of Done

阶段完成必须满足：

- 代码与文档完成；
- CI 通过；
- 实机验收通过；
- Changelog 更新；
- 升级和回滚验证；
- 已知问题记录；
- 无未说明的破坏性迁移；
- 用户文档更新；
- 上游采用日志更新；
- 下一阶段依赖明确。

## 8. 发布与回滚模板

说明：

- Feature flag；
- Alpha/Beta/Stable；
- 数据备份；
- 旧版兼容；
- 安装包升级；
- Runtime 版本不匹配；
- Studio 降级；
- 主题 Schema 降级；
- 紧急 Restore；
- 如何撤回 Marketplace 包。

## 9. ADR 模板

```md
# ADR-XXXX：决策标题

- 状态：Proposed | Accepted | Rejected | Superseded
- 日期：
- 决策者：
- 关联 Phase：
- 关联上游 Review/Action：

## 背景

## 约束

## 备选方案

## 决策

## 原因

## 正面影响

## 负面影响

## 后续动作
```

必须用 ADR 记录的典型事项：

- Tauri/Electron/Native Shell；
- SQLite 是否使用；
- Theme Schema v2 结构；
- Preview 架构；
- Runtime API；
- Runtime Distribution；
- Marketplace 签名；
- 外部 AI Provider 模型。

## 10. Definition of Ready

一个阶段只有在以下条件满足后才能进入开发：

- 目标和非目标明确；
- 关键用户流程完成；
- 技术方案已评审；
- Schema/API 已定义；
- 迁移和回滚已定义；
- 安全评审完成；
- 测试计划可执行；
- 依赖阶段已完成；
- 当前 `main` 已完成 Review，比较节点已记录；
- 相关上游能力已有采用或不采用决策；
- 不要求 merge/rebase `main`，但不得跳过上游审查；
- 未解决问题有明确 Owner。

## 11. 变更控制

开发中出现范围变化时：

1. 更新阶段 README；
2. 说明新增范围和被延期范围；
3. 若改变总体架构，更新 Blueprint 或新增 ADR；
4. 若影响用户数据，重新评审迁移和回滚；
5. 若来源于新上游变化，更新 Review 和 Adoption Log；
6. 不允许仅在代码或聊天记录里保留关键决策。
