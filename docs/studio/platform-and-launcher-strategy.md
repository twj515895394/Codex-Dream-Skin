# Dream Skin Studio 平台与 Launcher 策略

> 状态：Accepted  
> 生效日期：2026-07-19  
> 适用范围：Dream Skin Studio 全阶段规划与交付

## 1. 决策摘要

Dream Skin Studio 采用 **macOS-first、Launcher-first** 路线：

- 先在 macOS 上完成 Foundation、Theme Manager、Compiler/Preview、Editor、Assets/AI、Marketplace/Trust 和正式发布闭环；
- Windows 保留跨平台域模型与接口兼容性，但不作为当前阶段实现、CI、发布或验收门禁；
- macOS 全阶段产品稳定后，再单独启动 Windows Adapter、Windows Launcher、Windows Installer、Windows Verify 和 Windows Release 适配阶段；
- `Dream Skin.app` 是面向普通用户的独立启动入口，`Dream Skin Studio.app` 是主题管理与创作入口，二者共享同一个无 UI Runtime。

## 2. 产品组件

```text
Dream Skin.app                独立 Launcher / Codex 启动入口
Dream Skin Studio.app         主题管理、预览、编辑、市场与诊断界面
Dream Skin Runtime            无 UI 执行面
    ├── Runtime API
    ├── Theme Repository
    ├── Import / Apply / Verify / Restore
    ├── Operation Lock / Transaction Journal
    └── Managed Runtime Lifecycle
```

### 2.1 Launcher 职责

- 检查 Runtime 安装、版本和健康状态；
- 检查当前主题、未完成事务和 operation lock；
- 启动、连接或在明确授权下重启官方 Codex；
- Apply 当前主题并执行 Verify；
- 在失败时提供结构化错误和安全 Restore；
- 可打开 Studio，但不承载复杂主题编辑界面。

### 2.2 Studio 职责

- Theme Library、Theme Detail 和 Runtime Status；
- Import、Apply、Verify、Restore、Export 和 Delete；
- Fixture Preview、Live Preview 和 Theme Editor；
- Asset Library、AI Authoring 和 Theme Marketplace；
- 日志摘要、诊断、更新和恢复入口。

### 2.3 Runtime 职责

Launcher、Studio、CLI、SwiftBar 和未来 Codex Skill 必须通过同一个结构化 Runtime API 工作。安全、授权、锁、事务、验证和恢复逻辑不得下放到 UI 或 Skill。

## 3. 平台顺序

### 当前主平台

```yaml
primaryPlatform: macOS
currentDeliveryGate: macOS only
windowsStatus: deferred implementation
crossPlatformDomainModel: retained
```

### macOS 全阶段

1. Phase 00：Runtime API、operation lock、transaction journal、managed runtime、macOS Launcher/Shell Spike；
2. Phase 01：Theme Manager 与无终端管理闭环；
3. Phase 02：Compiler、Fixture Preview 与 Live Preview；
4. Phase 03：Theme Editor；
5. Phase 04：Assets 与 AI Authoring；
6. Phase 05：Marketplace、Trust、更新与 macOS 正式发布。

### Windows 后续适配阶段

在 macOS 全阶段达到稳定发布条件后，新增独立 Windows 适配阶段，至少包含：

- Windows Runtime Adapter；
- Windows Launcher；
- Windows Installer / Updater；
- Windows Verify / Restore；
- Windows 实机矩阵与正式发布。

## 4. 工程约束

- Theme Schema、Canonical Theme Model、Runtime API envelope、错误码和包格式继续保持跨平台设计；
- 当前实现不得为了未来 Windows 抽象而阻塞 macOS 交付；
- 当前 Definition of Done、CI 和 release evidence 只要求 macOS；
- Windows 现有脚本和托盘能力继续保留，但不进入当前 Studio 阶段门禁；
- 后续 Windows 适配应复用稳定契约，而不是复制 macOS UI 或重写核心域模型。

## 5. 与现有文档的关系

本决策优先修正此前文档中“macOS 与 Windows 同阶段同步实现、同步验收”的表述。遇到冲突时：

1. 本策略与 ADR-0005；
2. MASTER-PLAN 的安全与事务原则；
3. 当前 Phase 设计；
4. 旧 Roadmap 和 Blueprint。

旧文档中的“跨平台”应解释为**架构和数据契约保持可移植**，不是当前开发周期必须双平台同时交付。