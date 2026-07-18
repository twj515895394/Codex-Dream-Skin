# 上游能力采用日志

> 本文件记录上游能力从“发现”到“进入 Studio”的完整链路。Review 中的分类只是分析结论；只有本日志记录了目标提交和验证结果，才算真正采用。

## 状态定义

| 状态 | 含义 |
| --- | --- |
| `Candidate` | 已发现，尚未进入阶段设计 |
| `Planned` | 已进入目标 Phase 或 ADR |
| `In Progress` | 正在适配或迁移 |
| `Adopted` | 已提交并通过测试 |
| `Rejected` | 评审后明确不采用 |
| `Superseded` | 已被新的上游或 Studio 方案替代 |

## 采用记录

| Action ID | 上游来源 | 能力 | 采用方式 | 目标 Phase | 状态 | Studio 提交 | 验证 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `UPA-001` | `d2292386258395d24f64006b373a26988728b60f` | portable line endings、二进制资产声明 | `direct-adopt` | Phase 0 | Planned | — | 待执行 |
| `UPA-002` | `c2e9f40571ec98ef84f25298e51f0727e740199a` | 静态检查、Node 回归、Windows PS 5.1/7 CI | `adapt-adopt` | Phase 0 | Planned | — | 需增加 Import/Adapter/Compiler 测试 |
| `UPA-003` | `9ab7c09c850f014fc72fba0116fa41188a9b4e3b` | 自包含受管 Runtime、staging/hash/rollback | `concept-rewrite` | Phase 0 | Planned | — | 需跨平台 contract test |
| `UPA-004` | `94c1fe74e5d815401cad21773f12658783125911` | PowerShell 5.1 stderr 和退出码保真 | `direct-adopt` | Phase 0 | Planned | — | 需 Runtime API 错误映射测试 |
| `UPA-005` | `1ab71283c54eebc43fa298bb4a2183f1704f4795` | config 字节保真、Appx 包身份启动 | `adapt-adopt` | Phase 0 | Planned | — | 需 Windows 实机与回滚测试 |
| `UPA-006` | `c6118a7195a1c0ccfe832fc4b9d36411f0c10125` | 同目录原子替换、提交前后失败语义 | `direct-adopt` | Phase 0/2 | Planned | — | 需失败注入测试 |
| `UPA-007` | `a8617f4873bab8f7a62bf89031a63726849b708f` | 保留原生 Header 和侧面板控件 | `direct-adopt` | Phase 0 | Planned | — | macOS/Windows 视觉与点击回归 |
| `UPA-008` | `a1c48b3a84cc64532196e624fdf33ee1277cb018` | Windows 深色原生菜单可读性层 | `direct-adopt` | Phase 0 | Planned | — | Windows 深色实机截图 |
| `UPA-009` | `5a0349b15549e35350d808bec5afc6137ef3a87c` | 贡献指南和验证要求 | `adapt-adopt` | Phase 0 | Candidate | — | 需改写 Studio/上游跟踪规则 |
| `UPA-010` | `b71316ec8ba98ddbe481118f980c5adfea5be78b` | Windows 用户安装文档 | `defer` | Phase 1/Release | Candidate | — | Studio UI 稳定后重写 |
| `UPA-011` | `deb65b8b58fec7849562198383f4871b62b631f5` | Jinx 主题预览素材 | `defer` | Assets/Marketplace | Candidate | — | 需确认素材权利和产品定位 |

## 使用规则

1. `Studio 提交` 不允许写计划 SHA；只有代码真正提交后才能填写。
2. `Adopted` 必须同时具备：实现提交、测试结果和目标 Phase 记录。
3. 同一能力若采用方式变化，保留原记录并新增勘误，不覆盖历史决策。
4. Review 发现新能力时追加行；不因暂时不做而删除。
5. 迁移代码的提交信息建议包含 Action ID，例如：

```text
feat(runtime): install managed engine transactionally [UPA-003]
```

6. 若上游后来提供更成熟方案，把旧项标记为 `Superseded`，并引用新的 Review/Action ID。
