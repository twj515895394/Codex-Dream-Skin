# ADR-0005：采用 macOS-first 与 Launcher-first 交付策略

- 状态：Accepted
- 日期：2026-07-19
- 关联：`DS-FND-007`、`DS-FND-008`、后续 Windows Adaptation Phase

## 背景

原 Phase 00 设计默认 macOS 与 Windows Adapter、Desktop Shell、CI 和实机验收同步推进。这会使安装、签名、Runtime 分发、Launcher、回滚和测试矩阵同时翻倍，并阻塞产品主流程验证。

同时，Dream Skin 的正常使用需要一个能够受控启动官方 Codex、加载主题、执行 Verify 并在失败时恢复的独立入口。单纯的 Studio 管理界面不能替代 Launcher。

## 决策

1. 当前产品开发与交付以 macOS 为唯一主平台；
2. 先完成 macOS 全阶段产品，再启动 Windows 适配；
3. 继续保持 Theme Schema、Runtime API、错误码、包格式和核心域模型可跨平台；
4. `Dream Skin.app` 作为独立 Launcher，负责启动、连接、Apply、Verify、Restore 和打开 Studio；
5. `Dream Skin Studio.app` 负责管理、预览、编辑、素材、AI 和 Marketplace；
6. Launcher、Studio、CLI、SwiftBar 和未来 Skill 必须共享无 UI Runtime，不得各自实现安全和事务逻辑。

## 结果

### 正面

- 可先验证完整产品闭环，而不是维护两个半成品平台；
- macOS 安装、签名、Launcher 和 Runtime 生命周期可以形成单一可靠基线；
- 后续 Windows 适配基于已稳定契约，减少重构；
- Launcher 与 Studio 职责清晰。

### 代价

- Windows Studio 版本延后；
- 当前双平台 Contract Test 和 Windows 实机矩阵不再是 Phase 00 Done 门禁；
- 旧文档中同步双平台交付的描述需要逐步修正。

## 实施约束

- Phase 00 的 Shell Spike 以 macOS Launcher + Studio Shell 为主；
- Windows Adapter、Windows Shell、Windows Installer 和 Windows 实机验收移动到后续独立适配阶段；
- 不删除现有 Windows Runtime 与托盘代码；
- 不允许以“未来跨平台”为理由把当前 macOS 实现耦合到 PowerShell 或 Windows 文件语义；
- 任何 UI 入口都必须遵守 operation lock、transaction journal 和 Runtime API 契约。

## 后续动作

- 更新 Phase 00 范围、Work Register 和 Definition of Done；
- 更新 MASTER-PLAN、Roadmap 和 Blueprint 中的平台交付表述；
- Desktop Shell Spike 明确评估 Launcher 与 Studio 的组合形态；
- macOS 全阶段稳定后创建 Windows Adaptation Phase 详细设计。