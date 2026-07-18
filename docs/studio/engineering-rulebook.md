# Dream Skin Studio 开发与优化统一规则

> 文档角色：所有开发、修复、优化、迁移和发布工作的统一规则  
> 主控入口：[`MASTER-PLAN.md`](./MASTER-PLAN.md)  
> 适用范围：Studio UI、App Core、Theme Domain、macOS Runtime、Windows Runtime、CI、文档与上游迁移。

## 1. 规则目标

本规则用于避免以下问题：

- 需求只存在聊天记录中；
- 代码先写、设计和回滚后补；
- “优化”没有基线和验收指标；
- macOS 和 Windows 行为逐渐分叉；
- Studio Preview 与 Codex 实机不一致；
- 上游代码未经分析整批合入；
- 计划被误写成已完成；
- 修复一个页面却破坏原生控件、恢复或另一平台。

所有正式工作都应登记 Work Item，并按本规则交付。

## 2. 工作登记规则

### 2.1 必填字段

每个 Work Item 至少包含：

```yaml
id: DS-XXX-000
name: 工作名称
phase: 00-05 或 Cross-phase
type: feature | bugfix | optimization | security | migration | docs | upstream-adoption
status: Planned | Ready | In Progress | Verification | Done | Paused | Rejected
owner: 负责人
baselineBranch: feat/codex-theme-import-mvp
baselineCommit: 提交 SHA
upstreamReviewId: 最近一次相关 Review
relatedUpstreamActions: []
scope: []
nonGoals: []
dependencies: []
acceptanceEvidence: []
rollback: 回滚方式
```

### 2.2 不允许的做法

- 仅凭聊天中的一句“顺便优化一下”直接进入正式代码；
- 没有 Work Item ID 的大型提交；
- 将多个无关功能塞进一个 Work Item；
- 状态写 `Done`，但没有测试或实机证据；
- 用未来 commit SHA 填写“已采用”。

## 3. Definition of Ready

进入开发前必须满足：

- 问题和用户价值明确；
- 范围与非目标明确；
- 当前实现和基线 commit 已确认；
- 最近一次 `main` Review 已检查；
- 相关上游能力有采用决策；
- 架构、数据、API 或 CSS token 影响已分析；
- 失败、取消和恢复流程已定义；
- 安全和隐私影响已评审；
- 测试方案可执行；
- 依赖和 Owner 明确。

小型文档修正可以简化设计，但不能省略真实性检查。

## 4. 分支与提交规则

### 4.1 分支

当前长期 Studio 分支：

```text
feat/codex-theme-import-mvp
```

后续实施建议在该分支之上使用短生命周期工作分支：

```text
studio/<work-item-id>-<slug>
fix/<work-item-id>-<slug>
security/<work-item-id>-<slug>
```

在项目明确切换长期分支之前，不擅自将 Studio 工作直接合并到 `main`。

### 4.2 提交信息

建议格式：

```text
feat(studio): add runtime status contract [DS-FND-003]
fix(runtime): preserve preview rollback state [DS-PRV-012]
perf(compiler): cache normalized palette [DS-CMP-021]
docs(studio): update phase 01 acceptance [DS-DOC-006]
feat(runtime): install managed engine transactionally [UPA-003]
```

提交应保持单一目的。上游迁移提交必须包含 UPA ID。

### 4.3 禁止批量“同步”

不允许使用以下理由带入大量未知变化：

```text
sync main
update everything
bring branch up to date
```

必须明确到能力、文件、风险和验证。

## 5. 架构规则

### 5.1 控制面与执行面

- Studio UI 只表达用户意图；
- App Core 负责编排、校验和域模型；
- Platform Adapter 提供稳定结构化接口；
- Runtime 执行平台敏感操作；
- Injector/Renderer 负责 Codex 内部渲染；
- UI 不直接接触 CDP、进程 PID、签名细节或 Shell 命令。

### 5.2 共享 Core

优先放入共享 Core：

- Theme Schema；
- Normalizer / Migrator；
- Compiler；
- Package metadata；
- Theme Repository 纯逻辑；
- Runtime API types；
- error model；
- Fixture definitions。

保留在平台层：

- macOS codesign、launchd、AppleScript；
- Windows Appx、PowerShell、注册包身份；
- 文件权限和平台路径；
- 平台进程所有权验证。

### 5.3 不提前重写 Runtime

Phase 00/01 优先封装现有 Runtime。只有满足以下条件才能把逻辑迁入共享 Core：

- 行为已有测试；
- macOS 与 Windows 语义已比较；
- 迁移和回滚已设计；
- 新实现不降低平台安全边界；
- ADR 已接受。

## 6. Runtime API 规则

- 所有 Studio → Runtime 调用必须结构化；
- stdout 仅用于机器可读结果；
- stderr 和日志保留诊断；
- 必须保留真实退出码；
- API 有 `apiVersion`、`operation`、`requestId`；
- 错误有稳定 `code`、`recoverable` 和推荐动作；
- UI 不解析自然语言日志判断成功；
- 参数使用 argv、JSON 文件或受控 IPC，不拼接命令字符串；
- capability 不存在时返回明确状态，不静默模拟成功。

## 7. 主题与 Package 规则

### 7.1 主题包

`.codex-theme` 必须：

- 只包含数据；
- 无脚本、应用和动态库；
- 无路径穿越；
- 无符号链接/重解析点；
- 有大小、尺寸和像素限制；
- 经过 Package 校验和 Runtime payload 校验；
- 使用 staging 和原子发布；
- 同 ID 覆盖可恢复。

### 7.2 Theme Schema

- Schema 必须版本化；
- v1 继续兼容；
- v2 不允许任意 CSS/JS；
- 只暴露白名单 token；
- 数值有范围；
- 未知未来字段默认保留并忽略；
- 迁移不丢失原字段；
- Runtime compatibility 可显式判断。

### 7.3 Theme Repository

- 文件系统是主题事实来源；
- 索引数据库可重建；
- 损坏主题不能阻塞全部列表；
- 删除前检查当前主题和引用；
- 外部文件变化必须被发现；
- 不允许静默覆盖用户外部修改。

## 8. Preview 与视觉规则

### 8.1 单一 Compiler

Fixture Preview、Live Preview 和正式 Apply 必须使用同一个 compiler 产物。

禁止：

- 在设计图中展示 Runtime 不支持的效果而不标注；
- Preview 单独推导颜色、阴影或 Overlay；
- 为了截图好看临时修改 Preview，却不进入 Compiler；
- 用静态 Codex 截图作为可交互预览底层。

### 8.2 Preview 类型标识

UI 和文档必须区分：

- Concept Mockup；
- Package Preview Image；
- Fixture Preview；
- Live Preview；
- Real Device Screenshot。

### 8.3 Live Preview

- 使用独立 session；
- 开始前保存当前主题快照；
- 只允许一个活动 session；
- 有超时和 journal；
- Studio 或 Codex 异常退出后恢复；
- Preview 不写入正式主题库；
- Commit 与 Revert 明确分离。

### 8.4 视觉验收

至少覆盖：

- Home Light；
- Home Dark；
- Coding Light；
- Coding Dark；
- Popover；
- Composer；
- Code Block；
- Attachment；
- User Message；
- 原生 Header 和侧面板控制。

视觉通过不代表功能通过，必须同时检查点击、焦点、键盘和原生控件层级。

## 9. UI/UX 规则

- 所有页面定义 initial/loading/ready/empty/warning/error/disabled/offline；
- 错误必须说明用户下一步；
- 危险操作需要确认和恢复；
- Preview、Apply、Save、Export 不使用模糊同义词；
- 当前主题、Draft、Preview 和已保存版本必须清楚区分；
- Runtime 不可用时显示能力降级，不伪装可操作；
- 不要求用户理解状态目录或命令行；
- 键盘、焦点、对比度和屏幕阅读器标签进入验收；
- 颜色不是唯一状态表达。

## 10. 安全规则

### 10.1 官方应用边界

禁止：

- 修改官方 `.app`、`app.asar` 或 WindowsApps；
- 替换官方签名文件；
- 静默写入第三方 API Base URL 或 Key；
- 以主题功能名义改变模型提供商；
- 在主题包中执行代码。

### 10.2 文件系统

- 所有路径重新解析 realpath/full path；
- 所有受管目录拒绝符号链接、junction 和 reparse point；
- 删除前验证路径位于受管根目录；
- 临时目录使用随机 token；
- 临时文件使用独占创建；
- 关键替换使用同目录 staging/backup；
- 文件权限最小化。

### 10.3 CDP

- 仅绑定 loopback；
- 验证端口所有者和 Codex 进程关系；
- 验证 renderer target；
- Restore 关闭不必要的调试会话；
- Studio 明确显示 Runtime 活跃状态；
- 不把 CDP 端口暴露给 Marketplace 或外部 Provider。

### 10.4 日志与隐私

- 默认不记录 Codex 对话内容；
- 项目路径和用户名尽量脱敏；
- 诊断包由用户确认生成；
- 外部 AI 上传前明确 Provider、文件和用途；
- Marketplace 不获取本地主题或项目清单；
- 密钥使用平台安全存储。

## 11. 事务与并发规则

所有写操作统一：

```text
Acquire Lock
  ↓
Read Current State
  ↓
Validate Preconditions
  ↓
Stage
  ↓
Validate Staged Result
  ↓
Backup Current
  ↓
Atomic Publish
  ↓
Post-publish Verify
  ↓
Commit State
  ↓
Cleanup
```

要求：

- 同一用户只有一个写事务；
- 只读操作可并发，但不能读取半发布状态；
- lock 有 owner、operation、start time 和 timeout；
- stale lock 不能只凭文件年龄删除，需检查进程身份；
- Preview 与 Apply/Delete/Import 冲突时显式拒绝或排队；
- 提交前失败恢复旧状态；
- 提交后 cleanup 失败记录 warning，不回滚正确结果。

## 12. 优化规则

### 12.1 所有优化必须有基线

优化 Work Item 必须回答：

- 当前问题是什么；
- 如何复现；
- 当前指标或截图是什么；
- 修改什么层；
- 成功指标是什么；
- 会影响哪些平台和场景；
- 如何回滚。

### 12.2 性能优化

至少记录：

- 启动时间；
- listThemes 延迟；
- import/apply 延迟；
- preview 首帧；
- compiler 时间；
- 内存；
- 大图处理；
- watcher 重复工作。

没有测量前不进行复杂缓存。缓存必须可失效、可重建，并不能成为主题事实来源。

### 12.3 视觉优化

必须基于：

- 原始主题；
- 编译 token；
- Fixture；
- 实机截图；
- Light/Dark/Home/Coding 场景。

调整应进入 Theme Schema/Compiler/CSS token，而不是只处理背景图或概念图来掩盖 Runtime 问题。

### 12.4 代码优化

重构必须保持：

- API 语义；
- 退出码；
- 日志；
- 回滚；
- 平台安全检查；
- 测试覆盖。

“减少代码行数”不是充分理由。

## 13. 测试规则

### 13.1 单元测试

- Schema；
- Normalizer；
- Compiler；
- Package；
- Repository；
- error mapping；
- path safety；
- state journal。

### 13.2 Contract Test

同一测试集验证 macOS 和 Windows：

- capabilities；
- status；
- listThemes；
- import；
- apply；
- preview/revert；
- verify；
- restore；
- 错误码和 recoverable。

### 13.3 Integration Test

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

### 13.4 实机测试

任何渲染、启动、签名、CDP、安装和恢复变化都不能只依赖模拟测试。

## 14. 上游采用规则

- 每次读取 `upstream-baseline.md`；
- 使用 commit SHA 范围；
- 生成 Review；
- 分类；
- 更新 Adoption Log；
- 迁移代码使用独立 Work Item/UPA ID；
- 不直接把上游 `main` 当作可合并补丁包；
- `direct-adopt` 仍需测试，不代表无条件 cherry-pick；
- `concept-rewrite` 必须记录保留了什么设计、改变了什么实现；
- 下一次 Review 只从上一次终点继续。

## 15. 文档规则

### 15.1 必须同步更新

- 能力变化：Baseline、Phase、用户文档；
- 架构变化：Blueprint、ADR、Master Plan；
- 状态变化：Work Register；
- 上游变化：Review、Baseline、Adoption Log；
- API/Schema：Contract、测试和示例；
- 视觉变化：token 文档、截图和验收；
- 安全变化：Threat Model 和测试；
- 发布变化：Rollout、Rollback、Changelog。

### 15.2 文档真实性

使用以下标签：

```text
Implemented
Verified on macOS
Verified on Windows
Designed
Planned
Experimental
Deprecated
```

禁止使用“已完成”“可用”“支持”而不说明代码和验证范围。

## 16. Definition of Done

Work Item 标记 Done 前必须：

- 代码/文档提交可定位；
- 自动测试通过；
- 需要的实机测试通过；
- 安全和回滚验证；
- Work Register 更新；
- 相关 Phase 文档更新；
- Known Issue 有记录；
- 上游采用项更新；
- 用户可见变化有说明；
- 没有遗留临时调试入口或敏感数据。

## 17. 例外处理

紧急安全问题可以跳过完整设计，但必须：

1. 明确风险和临时措施；
2. 保留最小回滚；
3. 增加回归测试；
4. 补 Work Item；
5. 补 ADR 或安全记录；
6. 在后续 Iteration 清理临时实现。

非紧急事项不得以“先做出来再说”为理由绕过规则。
