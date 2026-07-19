Status: ready-for-agent

# 02 · Importer 自动化回归测试套件

## 要构建什么

基于 #01 生成的 fixture，构建完整的 `.codex-theme` importer 自动化回归测试套件。测试必须覆盖现有 macOS importer 的全部安全边界和业务逻辑。

**正常流程测试**：
- 合法包完整导入、staging → 发布 → 主题目录可枚举
- 导入后主题 manifest/theme.json/图片完整性验证

**安全边界测试**：
- 路径穿越 ZIP 在预检阶段被拒绝
- symlink / 特殊文件在预检阶段被拒绝
- 可执行内容在 payload 校验阶段被拒绝
- 超大包在大小检查阶段被拒绝

**失败恢复测试**：
- staging 阶段失败不产生库变化
- 替换（replace）失败恢复原有主题目录
- 用户取消返回 `CANCELLED`，无写入

**冲突策略测试**：
- 同 ID 主题 `reject` 策略拒绝导入
- 同 ID 主题 `replace` 策略覆盖并保留旧目录备份

**边界条件**：
- 中文/非 ASCII 主题名和路径
- 缺少 manifest / theme.json 的残缺包
- Schema 版本不支持的包

## 验收标准

- [x] 至少 15 个独立测试用例，覆盖上述全部类别
- [x] 测试使用隔离 `STATE_ROOT` 临时目录，不接触真实用户数据
- [x] 每个安全边界测试验证拒绝发生在正确的阶段（预检 / payload / staging）
- [x] 失败恢复测试验证失败后文件系统状态干净
- [x] 测试可通过 `npm test` 或等价命令一键运行
- [x] 测试在 macOS 上通过；Windows 可选但需标记 skip 原因

## 被阻塞于

- #01 Importer 安全 Fixture 生成器与单元测试

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- **2026-07-19**: 完成 `macos/tests/importer-regression.test.mjs` 自动化回归测试套件（含 17 组 18 项安全、异常、恢复与覆盖导入断言）。提升了 `common-macos.sh` 中 `STATE_ROOT` 的环境变量覆写能力，同时补全了 `import-theme-macos.sh` 中对 Windows `..\` 路径穿越及 `.ps1`/`.bat`/`.cmd` 可执行防护。全量 `npm test` 自动测试已通过。

