# 2026-07-19 · `main` 上游续接审查

## 1. 审查元数据

```yaml
reviewId: UPR-20260719-001
reviewDate: 2026-07-19
repository: twj515895394/Codex-Dream-Skin
upstreamRef: main
startCommit: 19fa0342846219fb0476bfd648aa7f0f0019bb0b
endCommit: dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
studioBranch: feat/codex-theme-import-mvp
studioCommitAtReviewStart: 5d3243c21715080072b4007ac5da10e6d3a7f185
status: complete
mergeOrRebasePerformed: false
```

## 2. 比较结论

比较范围：

```text
19fa0342846219fb0476bfd648aa7f0f0019bb0b
    ..
dfcfa4f0fad33c5df8dd1ca6a8e75866250d602c
```

结果：

- `main` 前进 9 个提交；
- 变化集中在 macOS Runtime 生命周期、状态/暂停、菜单栏、Injector/Renderer、测试，以及预设目录整理；
- Windows 只有少量安装、Runtime、主题和测试修正；
- 本轮不 merge/rebase，不把 Candidate 直接标记为 Adopted。

## 3. 变化分类

| 变化组 | 主要文件 | Phase 00 影响 | 决策 |
| --- | --- | --- | --- |
| macOS 生命周期强化 | `common-macos.sh`、`start-*`、`pause-*`、`status-*`、`restore-*` | 影响 Adapter 状态模型、取消、进程身份和恢复 | `adapt-adopt`，登记 `UPA-012` |
| macOS 菜单栏一致性 | `codex_dream_skin.10s.sh`、`apply-from-menubar-*` | 证明多入口状态和操作冲突必须统一 | 纳入 `DS-FND-005`、`DS-TM-017` |
| Injector/Renderer 扩展 | `injector.mjs`、`renderer-inject.js`、CSS、测试 | 影响 Verify、能力声明和原生控件回归 | 延续 `UPA-007`；Phase 00 只固化契约和验收 |
| 测试增强 | `macos/tests/run-tests.sh`、Windows tests | 可作为 Foundation CI 的增量基线 | 延续 `UPA-002`，不直接复制工作流 |
| 预设目录整理 | presets、README、图片 | 会影响主题枚举、来源和缺失主题处理 | `defer/observe`，登记 `UPA-013` |
| Windows 小幅修正 | common/injector/install/theme/tray/tests | 需在 Windows Adapter 与双 PS 矩阵中覆盖 | 延续 `UPA-002/004/005/006` |

## 4. 对当前分支代码的交叉审查

### 4.1 macOS

当前分支的 `.codex-theme` importer 已具备：

- 64 MB 包大小限制；
- ZIP 路径和可执行内容预检查；
- 解压后 symlink、特殊文件拒绝；
- manifest/theme ID 和图片引用校验；
- 复用 Injector payload 检查；
- 主题目录临时 staging 和同 ID 替换；
- 导入后调用现有 switch 链路。

但它尚未：

- 与 SwiftBar、CLI、未来 Studio 共享 operation lock；
- 输出稳定 JSON envelope 和 error code；
- 记录事务 journal；
- 将“导入成功但 Apply 失败”表达为部分成功；
- 对提交后 cleanup warning 使用结构化语义。

`switch-theme-macos.sh` 使用临时目录 staging，并以 `theme.json` 作为发布提交标记；这是应保留的正确基础。但当前 Apply 仍以人类文本和 `0/1` 退出码表达结果，且没有统一备份与失败后恢复 journal。

### 4.2 Windows

当前分支已有 per-user named Mutex，可阻止 install/start/restore/verify 并发；也有 reparse point 防护、路径 containment、UTF-8 原子写和 Appx 身份校验基础。

但 Windows 与 macOS 的锁语义、状态根目录、active theme 目录命名、Node 来源和错误表达不同。Phase 00 应统一“语义和契约”，而不是强行统一平台底层实现。

### 4.3 Runtime 依赖

- macOS 当前优先使用官方 Codex App 内签名 Node；
- Windows 当前依赖 PATH 中 Node 22+；
- 两者都不满足长期 Studio“安装后不依赖源码 checkout 和用户环境”的目标。

因此 Phase 00 必须设计 versioned managed runtime，保留 legacy adapter 作为过渡后端，但不能把它当作最终分发模型。

## 5. Phase 00 采用决策

### `UPA-012` · macOS Runtime 生命周期与多入口状态强化

- 方式：`adapt-adopt`；
- 目标：`DS-FND-002/003/005`、`DS-QA-003`；
- 采用内容：进程身份验证、状态恢复、暂停语义、菜单栏与 Runtime 状态一致性、相关测试思路；
- 不直接采用：当前 Shell 输出格式和入口耦合；
- 验证：Runtime Contract Test、并发冲突、崩溃恢复、macOS 实机。

### `UPA-013` · 预设目录整理与主题枚举变化

- 方式：`defer/observe`；
- 目标：Phase 01 Theme Repository；
- 原因：Phase 00 只定义 `listThemes` 对缺失、重命名、损坏和来源变化的稳定语义，不锁定具体预设目录。

## 6. 对 Phase 00 设计的强制影响

1. Runtime `status` 必须表达 `active/paused/off/degraded/busy/recoveryRequired`，不能只返回 running/not running。
2. 所有入口共享同一跨进程锁和事务 journal；Windows Mutex 可保留为快速层，但不是跨平台契约本身。
3. stdout 只允许一个 JSON 响应；stderr 保留诊断；退出码按类别稳定映射。
4. `importTheme` 必须区分 installed、applied、verified 三个阶段，避免把部分成功压成单一失败。
5. `applyTheme` 必须保存 active theme 快照，Verify 失败时自动尝试 Restore，并明确 rollback 是否成功。
6. `listThemes` 不假设预设集合固定，文件系统仍是事实来源。
7. Desktop Shell Spike 必须验证 sidecar、签名、安装、升级、降级和离线运行，不允许依赖源码路径。

## 7. 审查结论

本轮上游变化不阻塞 Phase 00 设计，也不要求立即同步代码。Phase 00 设计以当前 Studio 分支 `5d3243c2...` 为实现基线，同时把 `main` 到 `dfcfa4f0...` 的可迁移能力纳入契约、测试和 ADR。
