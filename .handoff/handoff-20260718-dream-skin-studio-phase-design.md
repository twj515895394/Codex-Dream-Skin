# Dream Skin Studio 阶段设计会话交接

> 交接日期：2026-07-18  
> 目标：在新会话中开始 Phase 00 及后续各阶段的细化设计  
> 仓库：`twj515895394/Codex-Dream-Skin`  
> 工作分支：`feat/codex-theme-import-mvp`  
> 交接时分支 HEAD：`852a245859b1be4baefe6090002a1d5bab56a5c8`  
> PR：#2，Open，未合并  
> 已审查上游 `main` 节点：`19fa0342846219fb0476bfd648aa7f0f0019bb0b`

## 1. 新会话首先要做什么

新会话不要重新从聊天记录推断项目状态，先按以下顺序读取仓库文档：

1. `docs/studio/MASTER-PLAN.md`
2. `docs/studio/work-register.md`
3. `docs/studio/project-implementation-plan.md`
4. `docs/studio/engineering-rulebook.md`
5. `docs/studio/dream-skin-studio-blueprint.md`
6. `docs/studio/current-project-baseline.md`
7. `docs/studio/phase-design-and-delivery-template.md`
8. `docs/studio/phases/README.md`
9. `docs/studio/upstream/upstream-baseline.md`
10. `docs/studio/upstream/upstream-adoption-log.md`
11. `docs/studio/upstream/reviews/2026-07-18-main-review.md`

随后确认分支 HEAD、PR 状态和 `main` 当前 SHA 是否变化。

## 2. 项目目标

Dream Skin Studio 的最终形态是一个本地优先、可恢复、跨平台的 Codex 主题工作台，覆盖：

- 主题管理；
- 可信预览；
- 可视化创作；
- 快速切换；
- 导入与导出；
- 素材管理；
- AI 辅助；
- 诊断与恢复；
- 可选 Marketplace。

产品不是简单的脚本包装，而是稳定的控制面。现有 macOS Shell/Node 和 Windows PowerShell/Node Runtime 在早期继续作为执行面复用。

## 3. 当前已经完成的能力

### 3.1 现有项目基础

- macOS 和 Windows 均已有外部 CDP 注入 Runtime；
- 不修改官方 Codex 二进制、`app.asar`、WindowsApps 或代码签名；
- 已有主题目录、激活主题、预设主题和图片导入能力；
- macOS 有 SwiftBar 菜单栏入口；
- Windows 有托盘入口；
- 已有 Start、Apply、Pause、Verify、Doctor、Restore 等链路；
- 已有主题热切换与失败后完整启动路径。

### 3.2 当前功能分支新增

- `.codex-theme` 纯数据主题包规范；
- macOS 主题包导入器；
- ZIP 路径、脚本、符号链接和特殊文件安全检查；
- `manifest.json`、`theme.json`、背景图和预览校验；
- 复用现有 injector `--check-payload`；
- 原子安装到本地主题库；
- 导入后自动调用现有主题切换链路；
- 桌面导入启动器；
- macOS 实机导入验证已完成。

### 3.3 已完成的项目治理

- Dream Skin Studio 总体 Blueprint；
- 多阶段 Roadmap；
- 全项目实施计划；
- 开发与优化统一规则；
- Work Item 登记表；
- 阶段细化设计模板；
- `main` 连续上游审查机制；
- 首次上游 Review；
- 上游能力采用日志。

## 4. 当前尚未实现

- 正式 Dream Skin Studio 桌面应用；
- Runtime JSON API；
- Theme Manager GUI；
- 统一 Theme Repository；
- Canonical Theme Model；
- Theme Compiler；
- Fixture Preview；
- Live Preview Session；
- Theme Schema v2；
- Theme Editor；
- Asset Library；
- AI Authoring；
- Marketplace、签名和在线更新。

这些能力不得在文档或会话中描述为已完成。

## 5. 当前阶段与下一工作

当前阶段：

```text
Phase 00 · Foundation、Runtime API 与 Desktop Shell Spike
状态：Planned
```

当前下一项正式工作：

```text
DS-FND-001：创建 Phase 00 细化设计目录并完成阶段设计
```

随后优先准备：

```text
DS-QA-001：.codex-theme importer 自动化回归
DS-FND-002：Runtime JSON API v1 契约
```

在这些项目满足 Ready 门禁前，不启动 Theme Manager 大规模 UI 开发。

## 6. Phase 00 细化设计应落地的目录

建议新建：

```text
docs/studio/phases/phase-00-foundation-and-shell-spike/
├── README.md
├── product-requirements.md
├── ux-and-interaction.md
├── technical-design.md
├── contracts-and-data-model.md
├── security-and-privacy.md
├── test-and-acceptance-plan.md
├── rollout-and-rollback.md
├── adr/
│   └── README.md
└── acceptance/
    └── README.md
```

Phase 00 设计必须覆盖：

- Runtime JSON API v1；
- macOS 和 Windows Adapter 语义；
- stdout/stderr/退出码规则；
- capability、status、listThemes、importTheme、applyTheme、verify、restore；
- operation lock；
- staging、backup、publish、rollback；
- managed runtime 分发；
- Tauri 2 / Electron / Native Shell 技术 Spike；
- sidecar、签名、安装、升级与降级；
- 最小 Vertical Slice；
- CI、Contract Test 和双平台实机矩阵。

## 7. 不可违反的工程原则

### 7.1 预览与实机同源

```text
Theme Source
    ↓ normalize / migrate
Canonical Theme Model
    ↓ compile
Compiled Theme Tokens
    ├── Studio Preview
    └── Codex Runtime
```

禁止为 Preview 单独制作一套比 Runtime 更漂亮的 CSS。

### 7.2 控制面与执行面分离

- Studio UI 不直接连接 CDP；
- UI 不拼接 Shell/PowerShell 命令；
- App Core 通过结构化 Adapter 调用 Runtime；
- Runtime 负责平台敏感操作。

### 7.3 主题包只包含数据

`.codex-theme` 不允许携带脚本、应用、动态库或任意 CSS/JavaScript 执行能力。

### 7.4 所有写操作事务化

```text
Detect → Lock → Stage → Validate → Backup → Publish → Verify → Commit → Cleanup
                                            ↘ Failure → Restore
```

### 7.5 文件系统是主题事实来源

索引数据库可以重建，不能成为主题唯一存储。

### 7.6 可恢复优先

任何影响主题、Runtime、配置、Codex 启动或用户素材的操作都必须定义失败和恢复路径。

### 7.7 跨平台语义一致

平台实现可以不同，但操作、错误码、Schema、Compiler 和验收语义必须一致。

### 7.8 文档必须描述真实状态

未实现、未测试、单平台验证、概念预览必须明确标注。

## 8. 上游 `main` 策略

当前不自动 merge/rebase `main`。

每次审查从以下文件读取唯一游标：

```text
docs/studio/upstream/upstream-baseline.md
```

当前已审查终点：

```text
19fa0342846219fb0476bfd648aa7f0f0019bb0b
```

下一次比较范围：

```text
19fa0342846219fb0476bfd648aa7f0f0019bb0b..<current-main-sha>
```

分类方式：

- `direct-adopt`；
- `adapt-adopt`；
- `concept-rewrite`；
- `defer`；
- `reject`；
- `observe`。

任何上游能力只有写入采用日志、落地真实提交并通过验证后，才能标记为 Adopted。

## 9. 首次上游 Review 中的重要候选

优先关注：

- `UPA-001`：portable line endings；
- `UPA-002`：CI 与 PowerShell 5.1/7 双矩阵；
- `UPA-003`：自包含受管 Runtime；
- `UPA-004`：stderr 和真实退出码保真；
- `UPA-005`：配置字节保真和 Appx 身份启动；
- `UPA-006`：原子替换与提交前后失败语义；
- `UPA-007`：保留原生 Header 和侧面板控件；
- `UPA-008`：Windows 深色原生菜单可读性。

真实采用状态以：

```text
docs/studio/upstream/upstream-adoption-log.md
```

为准。

## 10. Work Item 规则

每项正式开发、修复、优化、迁移或大型文档工作都需要 Work Item ID。

常用前缀：

- `DS-FND-*`：Foundation / Runtime / Desktop Shell；
- `DS-QA-*`：测试与验收；
- `DS-TM-*`：Theme Manager；
- `DS-CMP-*`：Theme Compiler；
- `DS-PRV-*`：Preview；
- `DS-EDT-*`：Editor；
- `DS-AST-*`：Assets；
- `DS-AI-*`：AI；
- `DS-MKT-*`：Marketplace；
- `DS-DOC-*`：文档和治理。

状态：

```text
Planned → Ready → In Progress → Verification → Done
```

`Done` 必须同时具备：实现、自动测试、实机证据、文档和回滚验证。

## 11. 新会话建议开场指令

可以直接使用以下内容开启新会话：

```text
请读取当前仓库 feat/codex-theme-import-mvp 分支下：
1. .handoff/handoff-20260718-dream-skin-studio-phase-design.md
2. docs/studio/MASTER-PLAN.md
3. docs/studio/work-register.md
4. docs/studio/phase-design-and-delivery-template.md
5. docs/studio/upstream/upstream-baseline.md

然后确认当前分支 HEAD 和 main 最新 SHA。不要自动 merge/rebase main。
接下来执行 DS-FND-001：建立并完成 Phase 00 的细化设计文档，所有文档提交到当前分支。先做设计，不进入正式代码开发。
```

## 12. 交接验收

新会话在开始 Phase 00 设计前，应明确回复：

- 已读取本交接文件；
- 当前工作分支和 HEAD；
- PR #2 是否仍未合并；
- 已审查 `main` 游标；
- 当前 Work Item 为 `DS-FND-001`；
- 本轮只完成 Phase 00 细化设计，不提前进行大规模 Theme Manager 开发；
- 新产生的设计文档将更新 Work Register 和必要的主控文档。
