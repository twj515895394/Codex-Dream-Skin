# Dream Skin Studio 阶段文档登记表

本目录用于保存每个阶段开发前的细化设计、开发过程 ADR、验收记录和已知问题。

## 1. 阶段状态

| Phase | 名称 | 当前状态 | 细化设计 | 开发前置条件 |
| --- | --- | --- | --- | --- |
| 00 | 基线整合与技术验证 | Planned | 未开始 | 当前 `.codex-theme` MVP 实机验证完成；确认同步 `main` 方案 |
| 01 | Theme Manager MVP | Planned | 未开始 | Phase 00 Done；Runtime JSON API 可用 |
| 02 | 统一主题编译与可信预览 | Planned | 未开始 | Phase 01 Done；Theme Repository 稳定 |
| 03 | 可视化 Theme Editor | Planned | 未开始 | Phase 02 Done；Schema v2 与 Compiler 稳定 |
| 04 | AI Authoring 与素材工作流 | Planned | 未开始 | Phase 03 Done；Draft 与 Asset Library 稳定 |
| 05 | Marketplace、更新与信任体系 | Planned | 未开始 | Schema、Package、签名、兼容和回滚模型稳定 |

## 2. 计划目录

阶段真正开始设计时创建：

```text
phases/
├── phase-00-foundation-and-shell-spike/
├── phase-01-theme-manager-mvp/
├── phase-02-compiler-and-preview/
├── phase-03-theme-editor/
├── phase-04-ai-authoring-and-assets/
└── phase-05-marketplace-and-trust/
```

每个目录使用 [`../phase-design-and-delivery-template.md`](../phase-design-and-delivery-template.md) 作为基础。

## 3. Phase 00 需要回答的问题

在写代码前必须确认：

1. `feat/codex-theme-import-mvp` 如何同步最新 `main`；
2. `.codex-theme` importer 的自动化测试如何补齐；
3. Tauri 2 是否满足 macOS/Windows 签名、安装、sidecar 和自动更新要求；
4. Studio 如何安全调用现有 Shell/PowerShell；
5. Runtime JSON API 的版本、错误码和 capability 结构；
6. Studio、SwiftBar、Tray 和 CLI 如何共享操作锁；
7. 开发、测试和发布的目录结构；
8. Studio 安装后是否携带 Runtime，还是连接已有安装；
9. macOS 与 Windows 的升级/降级策略；
10. 第一版 Studio 是否先 macOS 可用、Windows 保持 CLI/Tray，还是双平台同时发布。

## 4. Phase 01 需要回答的问题

1. Theme Card 的字段和状态；
2. 无 manifest、无 preview 的旧主题如何展示；
3. 当前主题、损坏主题、不兼容主题如何标记；
4. 删除当前主题的交互；
5. 导出包的 manifest/version/hash；
6. Theme Repository 是实时扫描还是索引缓存；
7. 文件系统外部变更如何刷新；
8. 导入同 ID 主题如何让用户选择覆盖、保留副本或取消；
9. Runtime 不可用时哪些管理操作仍可执行；
10. SwiftBar/Tray 是否保留以及如何与 Studio 同步。

## 5. Phase 02 需要回答的问题

1. Canonical Theme Model 的完整字段；
2. Theme Schema v2 JSON Schema；
3. v1 → v2 的无损映射；
4. 哪些 token 可以开放给主题作者；
5. Preview Fixture 如何跟随 Codex DOM 演进；
6. Compiler 如何被 Studio 与 Runtime 共同使用；
7. Live Preview Session 如何超时、恢复和防并发；
8. 如何量化 Preview 与实机的一致性；
9. Light/Dark/Home/Coding 的视觉回归基线；
10. Schema 和 Compiler 如何版本化。

## 6. Phase 03 需要回答的问题

1. 编辑器属性面板和场景导航；
2. Undo/Redo 命令模型；
3. Draft 自动保存和崩溃恢复；
4. 背景图处理是否原图无损；
5. 组件 token 的可编辑范围；
6. 对比度、可读性和越界诊断；
7. 保存、另存为、版本升级和导出流程；
8. 外部文件变更冲突；
9. 大图和多场景预览性能；
10. Editor 与 Live Preview 的节流和事务边界。

## 7. Phase 04 需要回答的问题

1. 哪些能力完全本地；
2. 哪些能力需要外部 Provider；
3. Provider 配置和密钥存储；
4. 上传前用户确认；
5. 生成结果 provenance；
6. AI 修改如何进入 Undo/Redo；
7. 人物、肖像、IP 和授权提示；
8. 失败或离线时的降级；
9. 本地分析和外部模型结果如何合并；
10. 是否支持可复现生成参数。

## 8. Phase 05 需要回答的问题

1. Catalog 协议；
2. 包签名和作者身份；
3. 主题版本与 Runtime 兼容；
4. 更新、回滚和下架；
5. 搜索、标签和缓存；
6. 内容权利与举报；
7. 第三方主题的信任等级；
8. 离线模式；
9. 网络访问开关；
10. 是否需要账号、同步和发布后台。

## 9. 状态变更规则

```text
Planned
  ↓ 完成阶段详细设计与评审
Ready
  ↓ 开始开发
In Progress
  ↓ 功能冻结并进入验证
Verification
  ↓ CI + 实机 + 文档 + 回滚通过
Done
```

任何阶段若缺少迁移、回滚、安全或测试设计，不得标记为 `Ready`。
