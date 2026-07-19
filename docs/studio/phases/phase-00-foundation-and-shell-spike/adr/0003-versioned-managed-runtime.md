# ADR-0003：使用版本化受管 Runtime 与 current/previous 指针

- 状态：Accepted
- 日期：2026-07-19
- 决策者：`twj515895394`
- 关联 Phase：Phase 00
- 关联 Work Item：`DS-FND-006`

## 背景

当前 macOS 依赖官方 Codex 内置签名 Node，Windows 依赖 PATH 中 Node 22+，且部分入口可能依赖源码 checkout。正式 Studio 必须安装后独立运行，并支持安全升级、降级和恢复。

## 约束

- 不修改官方 Codex 安装；
- 不依赖用户 PATH；
- 不把源码目录当运行时；
- payload 必须可验证完整性和平台身份；
- 更新中断可恢复；
- App/Runtime/API 版本可协商；
- previous 版本可回退；
- 不使用 symlink/junction 作为可信 current 指针。

## 备选方案

### A. 继续使用 Codex 内置 Node / PATH Node

优点：包体小。

缺点：生命周期受外部环境控制、Windows 不可靠、Codex 更新可能改变 runtime。仅保留为 legacy backend，不作为最终方案。

### B. 每次覆盖固定 runtime 目录

优点：目录简单。

缺点：更新中断产生混合版本，难以回退。拒绝。

### C. versioned directories + manifest/hash + current/previous JSON pointer

优点：更新原子、可回退、可并存、易验证。

缺点：占用更多磁盘，需要 retention 和兼容管理。

## 决策

采用方案 C：

```text
STATE_ROOT/runtime/
├── current.json
├── previous.json
├── versions/<version>/
├── staging/
└── rollback/
```

- App/installer 携带 platform-specific Runtime payload；
- payload 有 manifest、文件列表和 SHA-256；
- 平台签名/公证是额外信任条件；
- stage、verify、self-check 后发布 version directory；
- `current.json` 原子切换；
- smoke test 成功后 commit；
- 保留 previous；
- cleanup 失败只 warning；
- legacy Node/脚本只能由固定 Adapter 路径调用。

具体采用打包 Node、编译 sidecar 或框架内 host，由 Desktop Shell Spike 决定；无论选择哪种实现，都必须遵守此布局和更新语义。

## 原因

Runtime Distribution 是跨平台稳定性的基础。版本目录和指针把“安装文件复制”转化为可验证事务，也允许 App 与 Runtime 独立演进。

## 正面影响

- 安装后不依赖源码/PATH；
- 更新不会混合文件；
- 可快速降级；
- artifact 可审计；
- emergency Restore 可固定依赖；
- 支持不同 App/Runtime 版本组合测试。

## 负面影响

- 包体和磁盘增加；
- 需要 Node/sidecar 许可与安全更新策略；
- macOS universal/双架构和 Windows 签名增加发布复杂度；
- current/previous/journal 兼容需要严格测试。

## 迁移和回滚

迁移：

1. 先把现有 scripts/assets 打成可校验 payload；
2. 安装到 versions；
3. Runtime Host 通过 current pointer 调用；
4. legacy engine 保留；
5. 实机确认后逐步让旧入口调用 managed Runtime。

回滚：

- current 切回 previous；
- smoke test；
- 保留失败版本证据；
- previous 也失败则 emergency Restore；
- 不因 Runtime rollback 修改主题库。

## 后续动作

- Desktop Shell Spike 比较 Node bundle、compiled sidecar、Tauri/Electron host；
- 定义签名、SBOM、license 和安全更新流程；
- 完成 clean install、source deleted、PATH without Node、upgrade/downgrade tests；
- Phase 00 Alpha 默认关闭在线 updater。
