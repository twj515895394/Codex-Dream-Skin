# Dream Skin Studio 多阶段开发路线

> 文档级别：L0 路线骨架  
> 主控入口：[`MASTER-PLAN.md`](./MASTER-PLAN.md)  
> 详细实施：[`project-implementation-plan.md`](./project-implementation-plan.md)  
> 原则：每个阶段进入开发前，必须在 `docs/studio/phases/` 下完成 L1 细化设计并通过阶段门禁。

## 1. 路线总览

```text
Phase 00  Foundation、Runtime API 与 Desktop Shell Spike
    ↓
Phase 01  Theme Manager MVP
    ↓
Phase 02  统一主题编译与可信预览
    ↓
Phase 03  可视化 Theme Editor
    ↓
Phase 04  Asset Library 与 AI Authoring
    ↓
Phase 05  Marketplace、更新与信任体系
```

这是依赖链，不建议跳过 Phase 02 直接开发复杂 Editor，也不建议在 Theme Package、Schema、版本、兼容和回滚稳定前建设 Marketplace。

## 2. 上游策略

当前 Studio 分支不以“消除与 `main` 的分叉”为阶段目标，也不要求定期 merge/rebase `main`。

统一流程：

```text
读取 upstream-baseline.md
    ↓
比较 lastReviewedMainCommit..<current-main>
    ↓
分析新增 commit 和文件
    ↓
分类 direct-adopt / adapt-adopt / concept-rewrite / defer / reject
    ↓
登记 UPA Action 和 Work Item
    ↓
独立实施、测试和验收
```

每个 Phase 进入 Ready 前必须完成一次上游检查，但“已审查并决策”不等于“已合并 main”。

## 3. Phase 00：Foundation、Runtime API 与 Desktop Shell Spike

### 目标

建立可安全开发 Studio 的工程基线，证明 Studio 可以通过结构化接口读取 Runtime 状态、列出主题、执行一次安全 Apply、Verify 和 Restore。

### 核心交付

- `.codex-theme` importer 自动化回归；
- Runtime JSON API v1；
- 统一错误模型和 capability；
- Studio、SwiftBar、Tray、CLI operation lock；
- 受管 Runtime 分发、升级和回滚模型；
- Tauri/Electron/Native Shell 技术 Spike；
- Desktop Shell ADR；
- 最小 status → list → apply → verify → restore Vertical Slice；
- macOS 和 Windows 基线验收。

### 上游采用重点

- CI 和跨平台编码规则；
- PowerShell 5.1 stderr/exit code 保真；
- 配置文件和 Appx 包身份；
- staging/hash/backup/rollback 受管 Runtime；
- 原子替换提交前后失败语义；
- 原生 Header、侧面板和深色菜单兼容。

### 阶段门禁

- Runtime API 契约已评审；
- UI 无任意 Shell 字符串执行；
- importer 自动测试存在；
- Desktop Shell ADR 已接受；
- 双平台核心 Contract Test 可执行；
- 现有 Runtime 能力不回退。

## 4. Phase 01：Theme Manager MVP

### 目标

让普通用户不打开终端即可完成：

```text
查看主题 → 导入 → 查看详情 → 应用 → 切换 → 导出 → 删除 → Verify → Restore
```

### 核心交付

- Theme Repository；
- Theme Library 卡片、搜索、筛选和状态；
- 兼容无 manifest/preview 的旧主题；
- 导入、应用、复制、重命名、导出和删除；
- 当前主题、损坏和不兼容状态；
- Runtime Status、Doctor、Verify、日志摘要；
- SwiftBar/Tray/Studio 状态一致性。

### 约束

- 文件系统继续是主题事实来源；
- 删除当前主题前必须切换或 Restore；
- 同 ID 导入提供覆盖、保留副本或取消；
- Package preview 不冒充完整实机预览；
- Runtime 不可用时只暴露安全可执行操作。

## 5. Phase 02：统一主题编译与可信预览

### 目标

建立设计、预览和实机之间的单一来源，解决概念效果与真实渲染不一致的问题。

### 核心交付

- Canonical Theme Model；
- v1 Normalizer；
- Theme Schema v2；
- Theme Compiler；
- Light/Dark 独立 token；
- Home/Coding Fixture Preview；
- Surface、Overlay、Blur、Shadow、Radius tokens；
- Live Preview Session；
- Commit / Revert / timeout / crash recovery；
- Preview 与实机一致性基线。

### 不可违反

```text
Theme Source
    ↓ normalize / migrate
Canonical Model
    ↓ compile
Compiled Artifact
    ├── Fixture Preview
    ├── Live Preview
    └── Runtime Apply
```

禁止 Studio Preview 和 Runtime 分别推导主题。

## 6. Phase 03：可视化 Theme Editor

### 目标

用户能够从图片或已有主题创建、编辑、试用、保存和导出主题，不手写 JSON。

### 核心交付

- 新建主题向导；
- 背景图、焦点和 safe area；
- Light/Dark 调色；
- Home/Coding 与组件级样式；
- Overlay、Blur、Shadow、Radius；
- Undo/Redo；
- Draft 自动保存和崩溃恢复；
- 可读性诊断；
- Live Preview；
- 保存副本、版本和 `.codex-theme` 导出。

### 阶段门禁

- Schema v2 稳定；
- Compiler 版本化；
- Fixture 和 Live Preview 可用；
- Draft 与正式主题事务隔离；
- 外部文件变化不会被静默覆盖。

## 7. Phase 04：Asset Library 与 AI Authoring

### 目标

建立素材资产管理和本地优先的 AI 辅助创作，让 AI 生成可靠 Draft，但不成为主题运行依赖。

### 核心交付

- source、prepared variants、thumbnail 和 metadata；
- hash、尺寸、来源、授权、derivedFrom 和 AI 声明；
- 本地图像分析；
- palette、focus、safe area 和 Light/Dark 建议；
- 对比度修复；
- 主题变体；
- 可选外部 Provider；
- 上传确认、密钥安全存储和 provenance；
- 所有 AI 修改进入 Draft 并可撤销。

## 8. Phase 05：Marketplace、更新与信任体系

### 目标

安全浏览、安装、更新、回滚和撤回第三方主题。

### 前置条件

- Package、Schema v2 和 Compiler 稳定；
- Runtime compatibility 稳定；
- 签名和作者身份模型完成；
- 更新、删除和回滚可靠；
- 素材权利字段稳定。

### 核心交付

- Catalog；
- 搜索、标签和排序；
- 作者、授权和截图；
- Install / Update / Rollback；
- Hash / Signature；
- 兼容性过滤；
- 撤销、下架和举报；
- 离线缓存；
- Marketplace 网络总开关。

Marketplace 下载包仍必须经过本地 importer，Catalog 不能授予执行权限。

## 9. 跨阶段基础工程

每个阶段持续维护：

- 双平台 CI；
- Schema / Package / Compiler 测试；
- Runtime Adapter Contract Test；
- Import/Export round-trip；
- path safety；
- operation lock 和事务失败注入；
- Fixture visual regression；
- macOS/Windows 实机 Verify；
- 日志脱敏；
- 文档、Changelog 和 Work Register；
- 安装、升级、降级和 Restore。

## 10. 状态与执行来源

路线只表达阶段依赖，不记录每天的执行状态。

- 当前 Work Item：[`work-register.md`](./work-register.md)；
- 详细实施计划：[`project-implementation-plan.md`](./project-implementation-plan.md)；
- 统一规则：[`engineering-rulebook.md`](./engineering-rulebook.md)；
- 阶段设计：[`phases/README.md`](./phases/README.md)；
- 上游节点：[`upstream/upstream-baseline.md`](./upstream/upstream-baseline.md)。

阶段状态统一：

```text
Planned → Ready → In Progress → Verification → Done
```

任何阶段缺少安全、迁移、回滚、测试、实机或上游采用决策时，不得进入 Ready 或 Done。
