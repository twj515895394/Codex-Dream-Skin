# Dream Skin Studio 阶段设计与交付模板

> 用途：每个 Phase 开始开发前，复制本模板到 `docs/studio/phases/phase-XX-name/`。  
> 上位规则：[`MASTER-PLAN.md`](./MASTER-PLAN.md) 与 [`engineering-rulebook.md`](./engineering-rulebook.md)。  
> 状态登记：[`work-register.md`](./work-register.md)。

## 1. 阶段目录

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

规模较小的阶段可以合并文件，但必须覆盖所有必填内容。

## 2. 阶段 README 模板

```md
# Phase XX · 名称

- 状态：Planned | Ready | In Progress | Verification | Done | Paused
- Owner：
- 基线分支：feat/codex-theme-import-mvp
- 基线 Commit：
- 目标版本：
- 依赖阶段：
- 上游 Review ID：
- 已审查 main Commit：
- 相关 UPA Actions：
- 计划开始：
- 实际完成：

## 阶段目标

## 用户价值

## 范围

## 明确不做

## 交付物

## Work Items

## 阶段门禁

## 当前风险
```

基线 commit、上游 Review 和 UPA Action 必须填写真实值，不能用“最新”“待定”长期占位。

## 3. 产品需求

### 3.1 问题定义

- 用户在什么场景遇到什么问题；
- 现有脚本、菜单栏、托盘或 Studio 为什么不能解决；
- 本阶段解决什么；
- 不解决的影响；
- 为什么现在做。

### 3.2 用户角色

至少区分：

- 普通主题使用者；
- 主题作者；
- 项目维护者；
- Marketplace 作者/审核者（如适用）。

### 3.3 用户故事

```text
作为普通用户，我希望在主题卡片中点击“试用”，
以便在不覆盖当前主题的情况下查看 Codex 实机效果。
```

每个故事必须包含：

- 前置条件；
- 主流程；
- 用户取消；
- 失败流程；
- 数据变化；
- 恢复流程；
- 验收标准。

### 3.4 范围控制

明确：

- 本阶段包含；
- 本阶段不包含；
- 延期到哪个阶段；
- 永久非目标；
- 哪些需求需要 ADR 才能加入。

## 4. UX 与交互

### 4.1 信息架构

说明页面、导航、弹窗、抽屉、系统托盘/菜单栏和 Codex 之间的关系。

### 4.2 页面状态

每个页面至少定义：

```text
initial / loading / ready / empty / warning / error / disabled / offline
```

### 4.3 关键流程

至少覆盖：

- 正常流程；
- 空状态；
- Runtime 不可用；
- 无权限或环境不满足；
- 数据损坏；
- 操作冲突；
- 用户取消；
- 失败与恢复；
- 外部文件变化；
- Studio/Codex 异常退出。

### 4.4 预览真实性

必须明确预览类型：

- Concept Mockup；
- Package Preview Image；
- Fixture Preview；
- Live Preview；
- Real Device Screenshot。

说明：

- 哪些效果使用共享 Compiler；
- 哪些 Codex 版本差异无法模拟；
- Preview 与实机如何比较；
- UI 如何防止概念图被误认为实机。

### 4.5 可访问性

- 键盘；
- 焦点顺序；
- 屏幕阅读器标签；
- 颜色不是唯一状态；
- 对比度；
- 动效降级；
- 文本缩放与窗口尺寸。

## 5. 技术设计

### 5.1 当前基线

列出：

- 相关文件；
- Runtime 命令；
- Schema/API 版本；
- 状态目录；
- CI；
- 已知缺口；
- 当前分支 commit；
- 最近上游 Review。

### 5.2 目标架构

必须包含：

- 模块图；
- 时序图；
- 数据流；
- 控制面和执行面边界；
- 写事务边界；
- 失败恢复；
- 跨平台差异；
- 版本兼容。

### 5.3 Runtime/API 契约

所有 Studio → Runtime 调用使用结构化输入输出。

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
  "operation": "applyTheme",
  "requestId": "...",
  "ok": false,
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

禁止 UI 解析人类日志判断成功。

### 5.4 数据模型

说明：

- 字段和默认值；
- 唯一键；
- 时间和版本；
- 文件路径与 hash；
- 未知字段策略；
- v1/v2 兼容；
- 数据库与文件系统的事实来源；
- 删除和引用关系；
- 缓存失效。

### 5.5 迁移与事务

```text
Detect → Lock → Backup → Stage → Validate → Publish → Verify → Commit → Cleanup
                                                  ↘ Failure → Restore
```

禁止启动时无提示执行不可逆迁移。

### 5.6 并发

说明：

- Studio、SwiftBar、Tray、CLI 如何共享锁；
- Import/Apply/Delete/Preview 是否可并发；
- stale lock 如何验证；
- 锁超时；
- 崩溃恢复；
- 提交后清理失败如何处理。

### 5.7 上游影响

填写：

```yaml
upstreamReviewId:
reviewedRange:
relevantActions:
  - id: UPA-xxx
    decision: adopt | adapt | rewrite | defer | reject
    reason:
notAdopted:
```

不要求 merge/rebase `main`，但必须形成决策。

## 6. 安全与隐私

### 6.1 威胁模型

至少考虑：

- 恶意 `.codex-theme`；
- 路径穿越；
- 符号链接/junction/reparse point；
- ZIP bomb 和恶意图片；
- 命令注入；
- Runtime 更新替换；
- CDP 同用户风险；
- Preview 会话残留；
- 不可信 Marketplace；
- AI 上传；
- 日志泄露项目路径或对话。

### 6.2 信任边界

明确：

- Studio UI；
- App Core；
- Platform Adapter；
- Runtime；
- Injector/Renderer；
- Codex；
- AI Provider；
- Marketplace。

### 6.3 隐私

- 数据是否离开本机；
- 发送给谁；
- 保存多久；
- 用户如何删除；
- 是否包含路径、项目名、身份或对话；
- 密钥存储方式。

## 7. 测试与验收

### 7.1 单元测试

- Schema；
- Normalizer；
- Compiler；
- Package；
- Repository；
- error mapping；
- path safety；
- state journal；
- transaction failure injection。

### 7.2 Contract Test

同一套测试验证 macOS 与 Windows：

- capabilities；
- status；
- listThemes；
- import；
- apply；
- preview/revert；
- verify；
- restore；
- 错误码和 recoverable。

### 7.3 集成测试

- 安装；
- 导入；
- 覆盖；
- 应用；
- 删除；
- 导出再导入；
- 重启；
- 并发冲突；
- Runtime 更新；
- 损坏主题；
- Restore。

### 7.4 视觉回归

- Home Light；
- Home Dark；
- Coding Light；
- Coding Dark；
- Popover；
- Composer；
- Code Block；
- Attachment；
- User Message；
- 原生 Header/侧面板控件。

### 7.5 实机验收

涉及渲染、启动、安装、签名、CDP 或恢复时，模拟测试不能替代：

- macOS 实机；
- Windows 实机；
- 当前 Codex 版本；
- 原生控件点击；
- Verify；
- 截图；
- Restore。

## 8. 发布与回滚

说明：

- Feature flag；
- Dev/Alpha/Beta/Stable；
- 数据备份；
- Runtime 版本不匹配；
- Studio 升级和降级；
- Schema 升级和降级；
- 安装失败回滚；
- Preview 恢复；
- 紧急 Restore；
- Marketplace 撤回。

## 9. ADR 模板

```md
# ADR-XXXX：决策标题

- 状态：Proposed | Accepted | Rejected | Superseded
- 日期：
- 决策者：
- 关联 Phase：
- 关联 Work Item：

## 背景

## 约束

## 备选方案

## 决策

## 原因

## 正面影响

## 负面影响

## 迁移和回滚

## 后续动作
```

典型 ADR：

- Desktop Shell；
- Runtime API；
- operation lock；
- managed runtime；
- SQLite 是否使用；
- Theme Schema v2；
- Compiler；
- Preview；
- Marketplace 签名；
- 外部 AI Provider。

## 10. Definition of Ready

阶段进入 Ready 前：

- 目标和非目标明确；
- 用户流程完成；
- 技术方案评审；
- Schema/API 定义；
- 迁移和回滚定义；
- 安全评审完成；
- 测试计划可执行；
- 依赖阶段完成；
- 当前 `main` 已从记录节点完成 Review；
- 相关 UPA 已形成采用或不采用决策；
- 基线 commit 和 Owner 明确。

**不要求为了进入 Ready 而合并或 rebase `main`。**

## 11. Definition of Done

- 实现提交可定位；
- 自动测试通过；
- 必要实机通过；
- 视觉基线和截图存在；
- 错误、取消和回滚验证；
- 文档与 Changelog 更新；
- Work Register 更新；
- 上游采用项更新；
- Known Issues 记录；
- 用户文档更新；
- 没有未说明的破坏性迁移。

## 12. 变更控制

开发中范围变化时：

1. 更新 Phase README 和 Work Register；
2. 说明新增、取消和延期范围；
3. 影响总体架构时更新 Master Plan、Blueprint 或 ADR；
4. 影响数据时重新评审迁移和回滚；
5. 影响安全时更新威胁模型和测试；
6. 不允许只在代码、Issue 或聊天中保留关键决策。
