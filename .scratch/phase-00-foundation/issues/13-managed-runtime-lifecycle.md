Status: completed

# 13 · Managed Runtime 分发、校验与升降级

## 要构建什么

实现 Managed Runtime 生命周期管理，使 Studio 安装后不依赖源码 checkout 或用户 PATH 中的 Node。

**核心能力**：
- 版本化 Runtime payload 的安装和验证
- manifest/hash/签名校验
- `current` / `previous` 版本切换
- 升级中断可恢复
- App 和 Runtime 兼容范围可检测

**安装流程**（通过 Transaction Coordinator）：
1. 下载/复制 Runtime payload 到 staging
2. 校验 manifest 和文件 hash
3. 如有已安装版本，备份为 `previous`
4. 发布为 `current`
5. 验证可执行性
6. commit + cleanup

**升级/降级**：
- 升级：新版 staging → 校验 → 当前版本变为 previous → 新版变为 current
- 降级：previous 变为 current（如果存在）
- 中断恢复：journal 记录的阶段信息足够判断恢复策略

**目录结构**：
```
STATE_ROOT/runtime/
├── current/          ← 当前活跃版本
│   ├── manifest.json
│   └── ...
├── previous/         ← 上一个版本（降级用）
├── staging/          ← 安装/升级中的临时目录
└── runtime.json      ← 版本元信息
```

**安全**：
- 受管目录拒绝 symlink/junction/reparse
- manifest hash 校验失败拒绝使用
- 不把 Codex 内置 Node 当作长期唯一依赖

## 验收标准

- [x] 从零安装 Runtime payload 成功，可执行
- [x] 升级流程：current → previous，新版 → current
- [x] 降级流程：previous → current
- [x] manifest/hash 校验失败拒绝安装
- [x] 安装中断后（模拟 kill），新进程检测到 incomplete journal 并恢复
- [x] 不依赖源码 checkout 或系统 PATH 中的 Node
- [x] Contract Test 覆盖安装、升级、降级、校验失败、中断恢复

## 被阻塞于

- #08 Transaction Journal 与 Crash Recovery
- #11 macOS Platform Adapter
- #12 Windows Platform Adapter

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- **[2026-07-19T06:08:35Z] Issue 13 实施完成 Summary 报告**: [`docs/studio/reports/2026-07-19-ds-fnd-006-issue-13-summary.md`](../../../docs/studio/reports/2026-07-19-ds-fnd-006-issue-13-summary.md)
