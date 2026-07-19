Status: ready-for-human

# 14 · Desktop Shell 技术 Spike 与 ADR 决策

## 要构建什么

在 macOS 和 Windows 上实测 Tauri 2、Electron 和 Native 三种 Desktop Shell 方案，产出可量化的技术评估报告，最终将 ADR-0004 从 Proposed 变为 Accepted。

**Spike 覆盖维度（每个候选方案）**：
- build / install / start / 冷启时间
- sidecar 或受管 Runtime 调用（stdin/stdout JSON 通信）
- 文件选择和拖拽（.codex-theme 导入场景）
- 本地图片缩略图加载性能
- 签名 / 公证 / 安装器（macOS notarization + Windows Authenticode）
- updater / rollback 机制
- 无源码路径运行验证
- 键盘和辅助功能基础测试
- 崩溃日志和诊断信息
- 双平台安装包体积

**评分标准（Scorecard）**：
| 维度 | 权重 |
|---|---|
| 双平台签名与分发 | 高 |
| sidecar/Runtime 集成 | 高 |
| 安装包体积 | 中 |
| 冷启性能 | 中 |
| 辅助功能 | 中 |
| 自动更新 | 中 |
| 社区 / 生态成熟度 | 低 |

**淘汰条件**：
- 无法在任一平台完成签名和分发
- 无法调用 sidecar / 子进程 JSON 通信
- 安装包体积 > 200MB（不含 Runtime）
- 无辅助功能 (a11y) 支持

**输出**：
- 每个方案的 Spike 代码（最小可运行 demo）
- Scorecard 量化对比表
- ADR-0004 更新为 Accepted（附决策理由和替代方案代价）

## 验收标准

- [ ] Tauri 2、Electron、Native 三个方案均有 macOS + Windows 可运行 demo
- [ ] 每个 demo 能通过 stdin/stdout 调用 Runtime Host 的 capabilities operation
- [ ] Scorecard 量化数据完整（体积、冷启、签名结果）
- [ ] ADR-0004 从 Proposed 更新为 Accepted，包含决策理由和证据链接
- [ ] 被淘汰方案有明确的淘汰原因记录
- [ ] Spike 代码不合入主分支，存放在独立的 spike 目录

## 被阻塞于

- #05 capabilities 与 status Operation 实现（需要真实的 Runtime Host 可调用）

## 完成总结报告

- [ ] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [ ] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [ ] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [ ] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论
