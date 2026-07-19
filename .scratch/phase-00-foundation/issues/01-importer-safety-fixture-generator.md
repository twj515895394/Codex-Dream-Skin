Status: ready-for-agent

# 01 · Importer 安全 Fixture 生成器与单元测试

## 要构建什么

构建一个可审计的 `.codex-theme` 测试 fixture 生成器，能够按需产出以下类别的测试包：

**正常包**：合法 manifest/theme.json、含有效图片的标准主题包。

**恶意 / 边界包**：
- ZIP 路径穿越（`../`、绝对路径、混合分隔符、Unicode 变体、Windows 保留名）
- symlink / reparse point / 特殊文件
- 可执行内容（脚本、二进制、`.command`、`.ps1`）
- 超大包（超过大小限制）
- 缺少 manifest / theme.json / 图片的残缺包
- Schema 不匹配或版本不支持的包
- ID 冲突包（用于后续冲突策略测试）

生成器本身需有单元测试证明产出的 fixture 符合预期（如恶意包确实包含路径穿越 entry）。Fixture 存放在 `tests/fixtures/packages/` 下，生成脚本存放在 `tests/fixtures/generators/`。

## 验收标准

- [x] 提供至少 8 类 fixture 生成脚本，覆盖上述全部类别
- [x] 每个生成脚本有对应的单元测试，验证产出的 ZIP 内容结构正确
- [x] 恶意 ZIP fixture 通过脚本动态生成，不以原始 ZIP 形式提交到仓库
- [x] Fixture 目录结构符合 `tests/fixtures/` 设计规范
- [x] 所有 fixture 使用隔离 `STATE_ROOT`，不接触真实用户主题
- [x] 生成器支持 macOS 和 Windows（Shell + PowerShell 双实现或跨平台 Node 实现）

## 被阻塞于

无 - 可以立即开始

## 完成总结报告

- [x] 若本 issue 涉及接口、参数、响应字段、校验规则或默认行为变化，完成后已在当前项目约定的 reports 目录生成对应 summary 报告。
- [x] summary 报告已包含新增/修改接口、输入参数变更、输出字段变更、人工验证建议、技术验证结果、风险与注意事项。
- [x] 已在本 issue 的 `## 评论` 中追加 summary 报告路径和生成时间。
- [x] 若本 issue 无接口或可观测行为变化，已在 `## 评论` 中说明无需 summary 报告的原因。

## 评论

- **2026-07-19**: 完成 `PackageFixtureGenerator` (跨平台 Node.js ESM 模块) 及单元测试 `package-fixture-generator.test.mjs`。由于本 issue 仅涉及底层测试 Fixture 动态生成工具与生成器单元测试，不改变任何对外/对内业务 API 接口或可观测行为变化，因此无需生成额外 summary 报告。全部 8 类 9 组生成器单元测试用例及 `npm test` 自动测试已通过。

