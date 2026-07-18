# 2026-07-18 · `main` 上游审查

## 1. 审查元数据

```yaml
reviewId: UPR-20260718-001
reviewDate: 2026-07-18
repository: twj515895394/Codex-Dream-Skin
upstreamRef: main
startCommit: 31160026800564e0fe228ca44d956479b66d1164
endCommit: 19fa0342846219fb0476bfd648aa7f0f0019bb0b
studioBranch: feat/codex-theme-import-mvp
studioCommitAtReviewStart: 2174f597f38c5c1ea19403480fa88256835b0a33
status: complete
```

## 2. 为什么选择这个起点

这是第一次建立连续上游审查记录。`31160026800564e0fe228ca44d956479b66d1164` 是当前 Studio 功能分支与后续 `main` 变化的共同基线，也是 `.codex-theme` MVP 设计进入仓库时的节点。

从该节点到本次 `main` 终点：

```text
31160026800564e0fe228ca44d956479b66d1164
    ..
19fa0342846219fb0476bfd648aa7f0f0019bb0b
```

比较结果：

- `main` 前进 12 个 commit；
- 变更 27 个文件；
- 变化集中在 Windows 安装与安全、CI、配置保真、渲染兼容和仓库治理；
- `19fa034...` 是将 `Fei-Away:main` 同步到当前 fork `main` 的 merge commit；
- 本次只审查和登记，不向 Studio 分支自动合并代码。

## 3. Commit 清单与初步分类

| Commit | 内容 | 影响模块 | 分类 |
| --- | --- | --- | --- |
| `deb65b8` | 增加 Jinx 主题预览图 | 文档/素材 | `defer` |
| `d229238` | 增加 `.editorconfig`、`.gitattributes`，约束跨平台换行和二进制资产 | 工程治理 | `direct-adopt` |
| `b71316e` | Windows 中英文用户安装与排障文档 | 用户文档 | `defer` |
| `5a0349b` | 中英文贡献指南和验证要求 | 协作治理 | `adapt-adopt` |
| `c6118a7` | PowerShell 5.1 同目录原子替换、备份和提交后清理语义 | Windows/事务 | `direct-adopt` |
| `94c1fe7` | 保留 PowerShell 5.1 原生 stderr 与真实退出码 | Windows/Runtime API | `direct-adopt` |
| `1ab7128` | 配置字节保真、保留非冲突子表、按 Appx 包身份启动 | Windows/配置/启动 | `adapt-adopt` |
| `c2e9f40` | 静态检查和 Windows PowerShell 5.1/7 双矩阵 CI | CI/测试 | `adapt-adopt` |
| `9ab7c09` | 安装自包含受管 Runtime，分阶段复制、hash 校验、失败回滚 | Windows/安装器 | `concept-rewrite` |
| `a8617f4` | 保留原生固定 Header 和侧面板切换控件 | 渲染兼容 | `direct-adopt` |
| `a1c48b3` | 深色模式 Windows 原生菜单栏可读性层 | Windows/UI | `direct-adopt` |
| `19fa034` | 将 `Fei-Away:main` 合并到 fork `main` | 上游同步 | `observe` |

## 4. 重点设计分析

### 4.1 自包含受管 Runtime

上游 Windows 安装器不再让快捷方式依赖源码 checkout，而是把运行所需的 `assets/` 和 `scripts/` 安装到：

```text
%LOCALAPPDATA%\CodexDreamSkin\engine
```

其关键设计不是“复制目录”本身，而是完整的安装事务：

```text
Validate source
    ↓
Stage managed runtime
    ↓
Reject reparse points
    ↓
Hash/structure verification
    ↓
Swap old runtime with backup
    ↓
Commit shortcuts
    ↓
Cleanup after commit
         ↘ failure before commit → rollback
```

#### 值得迁移的设计

- Studio App 与 Runtime Engine 分离；
- 安装完成后不依赖源码仓库位置；
- 受管目录拒绝 junction、symlink 和 reparse point；
- 使用 staging + backup + replace，而不是直接覆盖；
- 提交后的清理失败不反向破坏已成功安装的版本；
- 快捷方式和托盘始终指向同一份受管 Runtime。

#### 对 Studio 的结论

不直接搬运整套 PowerShell 目录安装代码。Dream Skin Studio 应在 Phase 0 采用这一思想，形成统一的 `RuntimeDistribution`/`RuntimeInstaller` 契约：

```text
Studio bundle
    ├── app UI
    └── versioned runtime payload
             ↓ install/verify/rollback
Managed runtime root
    ├── current
    ├── versions/<version>
    └── rollback metadata
```

macOS 和 Windows 由不同 Adapter 实现，但必须共享相同状态语义。

### 4.2 原子替换和提交后清理语义

`c6118a7` 明确区分：

- **提交前失败**：必须恢复旧状态；
- **提交完成后清理失败**：记录 warning，不把成功结果回滚成失败。

这套语义非常适合 Studio 的：

- Runtime 更新；
- 主题覆盖导入；
- Theme Schema 迁移；
- Preview Commit；
- Marketplace 包升级。

建议把它写进统一事务模型，而不是留在平台脚本内部。

### 4.3 PowerShell 5.1 的 stderr 与退出码保真

上游增加原生命令调用包装，避免 PowerShell 5.1 把 stderr 或退出状态处理成不可靠结果。

对 Studio Runtime Adapter 的启示：

- UI 不直接解析人类日志；
- Adapter 必须获得真实退出码；
- stdout 用于结构化 JSON；
- stderr 用于诊断；
- 平台包装器负责把底层差异归一化；
- 失败时保留完整日志，但向 UI 返回稳定 error code。

这与当前 Blueprint 的结构化 Runtime API 方向一致，应优先迁移。

### 4.4 Windows 配置字节保真与包身份启动

上游继续强化：

- 保留 CRLF、引号和非冲突配置子表；
- 不依赖宽松的整文件重写；
- 从已注册 Appx manifest 推导官方 Codex AppUserModelId；
- 启动、失败回滚和恢复都使用包身份，而不是信任静态路径。

Studio 不能把它简化为“读 JSON/TOML 后重新序列化”。平台 Adapter 必须保持现有安全语义，尤其是用户配置不可被无关格式化。

### 4.5 CI 的可迁移结构

新增 CI 包含：

- Shell 语法检查；
- Node.js 语法检查；
- PowerShell 5.1 源码编码检查；
- Runtime 安全断言；
- 版本一致性；
- macOS/Windows 可移植 Node 回归；
- Windows PowerShell 5.1 和 PowerShell 7 双矩阵测试；
- 并发取消和最小权限。

#### 结论

不应原样 cherry-pick 后就结束。Phase 0 应在此基础上增加：

- `.codex-theme` 导入器测试；
- Theme Repository contract tests；
- Studio Runtime Adapter contract tests；
- Theme Compiler 快照；
- Schema v1/v2 migration tests；
- Studio 前端 lint/typecheck/test；
- macOS runner 上的安装脚本与包校验。

### 4.6 渲染兼容修复

`a8617f4` 保护原生固定 Header 和侧面板切换按钮，体现了一个重要原则：

> 主题只能改变视觉层，不能破坏 Codex 原生控件的定位、层级、焦点和可点击性。

该修复改动小、回归明确，适合作为独立迁移候选。未来 Theme Compiler 和 Visual Regression 也要把“原生控件可见可点”作为硬验收。

`a1c48b3` 针对 Windows 深色原生菜单栏增加柔和可读性层。其 CSS 可以按平台适配迁移，但长期应纳入组件级 token，而不是继续堆平台固定值。

### 4.7 工程和协作治理

`.editorconfig`、`.gitattributes`、PowerShell BOM 检查和贡献指南是低耦合、高收益能力。

其中：

- 换行和二进制规则适合直接迁移；
- 贡献指南应改写为 Studio 分支工作流，明确不允许自动合并 `main`；
- Preview 图和普通用户文档不影响当前 Studio Phase 0，先延期。

## 5. 安全与可靠性结论

本次上游变化中，优先级最高的是：

1. 受管 Runtime 安装和源码目录解耦；
2. 原子替换和失败回滚；
3. reparse point 防护；
4. 配置字节保真；
5. PowerShell 5.1 退出码保真；
6. Appx 包身份启动；
7. CI 中的静态安全断言。

这些都属于 Studio Platform Adapter 和 Runtime Distribution 的基础，不应等到 Theme Manager UI 做完后再补。

## 6. 对 Roadmap 的影响

| Phase | 影响 | 处理 |
| --- | --- | --- |
| Phase 0 | 增加 Runtime Distribution、受管安装、结构化进程调用、双 PowerShell CI | 必须纳入细化设计 |
| Phase 1 | Theme Manager 的 Apply/Restore 需调用受管 Runtime，而非源码脚本路径 | 修改技术设计 |
| Phase 2 | Preview Commit/Revert 复用统一事务语义 | 纳入 Compiler/Preview 设计 |
| Phase 3 | Editor 保存和覆盖也必须 staging/validate/commit | 纳入 Repository 设计 |
| Phase 4/5 | Marketplace 更新可复用 hash 校验和版本化受管目录 | 延期采用 |

## 7. 采用决策

### 7.1 计划直接迁移

- `d229238`：`.editorconfig`、`.gitattributes`；
- `c6118a7`：PowerShell 5.1 原子替换语义及回归；
- `94c1fe7`：原生命令 stderr/exit code 保真包装；
- `a8617f4`：原生 Header/侧面板控件兼容修复；
- `a1c48b3`：Windows 深色标题栏兼容修复。

这些仍需单独提交和测试，不在本 Review 中自动迁移。

### 7.2 计划适配迁移

- `c2e9f40`：以现有 CI 为基线扩展 Studio 测试矩阵；
- `1ab7128`：保留配置和包身份启动能力，通过 Runtime Adapter 暴露；
- `5a0349b`：重写为 Studio 分支贡献和上游跟踪流程。

### 7.3 借鉴后重写

- `9ab7c09`：抽象成跨平台 Runtime Distribution，而不是复制 Windows 专用实现到 Studio Core。

### 7.4 延期

- Windows 普通用户文档；
- Jinx 主题预览素材；
- 与 Studio Phase 0 无关的宣传性内容。

### 7.5 明确不执行

- 不 merge `main`；
- 不 rebase 当前 Studio 分支；
- 不把全部上游提交一次性 cherry-pick；
- 不让 Studio UI 直接依赖源码 checkout 或平台脚本的人类日志。

## 8. 后续动作

| Action ID | 动作 | 目标 Phase | 状态 |
| --- | --- | --- | --- |
| `UPA-001` | 迁移 portable line-ending 和 binary asset 规则 | Phase 0 | Planned |
| `UPA-002` | 以 `c2e9f40` 为基线设计 Studio CI | Phase 0 | Planned |
| `UPA-003` | 定义跨平台 Runtime Distribution contract | Phase 0 | Planned |
| `UPA-004` | 将 stderr/exit code 保真写入 Runtime JSON API | Phase 0 | Planned |
| `UPA-005` | 保留 Windows config/Appx 安全语义 | Phase 0 | Planned |
| `UPA-006` | 迁移 Header/侧面板和暗色菜单兼容修复 | Phase 0 | Planned |
| `UPA-007` | 为主题覆盖、Preview 和 Runtime 更新统一事务状态 | Phase 0/2 | Planned |

## 9. 下一次审查起点

本报告完成后，下一次 Review 必须从以下 commit 开始：

```text
19fa0342846219fb0476bfd648aa7f0f0019bb0b
```

比较形式：

```text
19fa0342846219fb0476bfd648aa7f0f0019bb0b..<future-main-sha>
```
