# Phase 00 当前交接

```yaml
phase: 00
name: Foundation, Runtime API and Desktop Shell Spike
status: Planned
currentWorkItem: DS-FND-001
branch: feat/codex-theme-import-mvp
baselineCommitToConfirmAtDesignStart: null
lastReviewedMainCommit: 19fa0342846219fb0476bfd648aa7f0f0019bb0b
upstreamReviewId: UPR-20260718-001
```

## 当前目标

完成 Phase 00 的全部 L1 细化设计，使阶段达到 `Ready`，但本轮不进入正式代码开发。

目标目录：

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

## 当前 Work Item

### DS-FND-001

创建上述目录，完整回答：

- Phase 00 的范围和非目标；
- Runtime JSON API v1；
- macOS/Windows Adapter 统一语义；
- stdout、stderr、退出码和错误码；
- operation lock、stale lock 和并发冲突；
- staging、backup、publish、verify、commit、cleanup、rollback；
- 受管 Runtime 的安装、升级和降级；
- Tauri 2、Electron、Native Shell Spike 方案；
- sidecar、签名、安装包和自动更新；
- 最小 Vertical Slice；
- CI、Contract Test、实机验证和回滚。

## 相关后续 Work Items

Phase 00 设计完成后优先推进：

```text
DS-QA-001  Importer 自动化回归
DS-FND-002 Runtime JSON API v1 契约
```

其余工作顺序以 `docs/studio/work-register.md` 为准。

## 相关上游采用动作

重点检查：

- `UPA-001` portable line endings；
- `UPA-002` CI 与 PowerShell 双矩阵；
- `UPA-003` 受管 Runtime；
- `UPA-004` stderr/退出码保真；
- `UPA-005` 配置保真和 Appx 身份；
- `UPA-006` 原子替换语义；
- `UPA-007` 原生 Header 和侧面板；
- `UPA-008` Windows 深色菜单可读性。

上述项目当前不是 `Adopted`，真实状态见 `docs/studio/upstream/upstream-adoption-log.md`。

## Ready 门禁

Phase 00 只有满足以下条件才能从 `Planned` 进入 `Ready`：

- [ ] 当前真实 HEAD 已写入 Phase README；
- [ ] 最新 `main` 已从上次游标续接审查；
- [ ] 产品目标、范围和非目标明确；
- [ ] Runtime API 和错误模型已定义；
- [ ] Adapter、锁和事务边界已定义；
- [ ] Desktop Shell Spike 评估方法已定义；
- [ ] 安全与隐私评审完成；
- [ ] CI、Contract Test、实机和回滚计划可执行；
- [ ] 依赖、风险、Owner 和 Known Issues 明确；
- [ ] Work Register 已更新；
- [ ] 必要 ADR 已建立为 Proposed 或 Accepted。

## 当前阻塞

目前没有实现层阻塞；阶段处于设计前状态。新会话需要先确认当前分支 HEAD、PR #2 和 `main` 最新 SHA。

## 禁止提前进行

- 不自动 merge/rebase `main`；
- 不直接开始 Theme Manager 大型 UI；
- 不先实现 Runtime API 再补契约；
- 不凭偏好直接确定 Tauri/Electron；
- 不把上游 Candidate 写成 Adopted；
- 不把设计状态写成已实现。

## 下一步

```text
执行 DS-FND-001：建立 Phase 00 设计目录，逐份完成并交叉校验文档，更新 Work Register，然后生成新的 Phase 00 handoff 快照。
```