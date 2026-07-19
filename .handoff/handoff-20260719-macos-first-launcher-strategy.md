# Dream Skin Studio · macOS-first / Launcher-first 策略交接

```yaml
handoffDate: 2026-07-19
repository: twj515895394/Codex-Dream-Skin
branch: feat/codex-theme-import-mvp
headAtHandoffStart: 1c6fa76b5030a3397dfc6c5bb37a4fd9462aed81
phase: Phase 00
phaseStatus: Ready
strategyStatus: Accepted
primaryPlatform: macOS
windowsDelivery: deferred-until-macos-full-product-complete
launcherModel: independent-dream-skin-app
studioModel: independent-dream-skin-studio-app
runtimeModel: shared-headless-runtime
adr: ADR-0005
```

## 本轮完成

- 新增 `docs/studio/platform-and-launcher-strategy.md`；
- 新增 ADR-0005，正式接受 macOS-first 与 Launcher-first；
- 更新 Phase 00 ADR 索引；
- 明确 `Dream Skin.app` 是独立 Launcher，负责 Runtime 检查、Codex 启动/连接、Apply、Verify、Restore；
- 明确 `Dream Skin Studio.app` 负责主题管理、预览、编辑、素材、AI、Marketplace 与诊断；
- 明确 Launcher、Studio、CLI、SwiftBar 和未来 Skill 共享同一无 UI Runtime；
- 明确当前实现、CI、验收和发布只以 macOS 为门禁；
- Windows 保留跨平台契约与现有代码，但移动到 macOS 全阶段完成后的独立适配阶段。

## 对旧文档的解释修正

旧文档中“跨平台”继续表示 Theme Schema、Runtime API、错误码、包格式和核心域模型可移植，不再表示 macOS 与 Windows 必须同步开发、同步验收或同步发布。

遇到冲突时优先读取：

1. `docs/studio/platform-and-launcher-strategy.md`；
2. `docs/studio/phases/phase-00-foundation-and-shell-spike/adr/0005-macos-first-launcher-first-delivery.md`；
3. MASTER-PLAN 的安全、事务和事实来源规则；
4. 当前 Phase 设计；
5. 旧 Blueprint / Roadmap。

## 后续文档校准

后续实施前继续把以下旧表述逐项校准：

- MASTER-PLAN 平台目标与阶段表；
- Phase 00 README 的双平台范围和 DoD；
- Work Register 中 Windows Adapter、Windows 实机矩阵和双平台 Shell Spike；
- project implementation plan、roadmap、blueprint；
- Phase current 与 root current。

这些校准不得改变本轮已接受决策。

## 下一步开发方向

- `DS-QA-001`：macOS importer 自动化回归；
- `DS-FND-002`：Runtime JSON API v1 Schema 与 Contract Runner；
- 后续 Adapter、managed runtime、Launcher/Shell Spike 和 Vertical Slice 均先完成 macOS；
- 不启动 Windows Studio 适配工作。