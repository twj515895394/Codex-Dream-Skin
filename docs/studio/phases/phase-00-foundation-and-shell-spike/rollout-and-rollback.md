# Phase 00 发布与回滚设计

## 1. 发布目标

Phase 00 的发布对象是 Foundation Alpha，不是面向普通用户的完整 Theme Manager。发布重点：

- 验证 Desktop Shell + Runtime API + managed runtime 的分发闭环；
- 不破坏已有 Shell/SwiftBar/Tray/CLI；
- 支持 clean install、legacy coexistence、upgrade、downgrade 和 emergency restore；
- 所有 artifact 可定位到 commit、manifest 和 hash；
- 失败后能够回到上一份可运行 Runtime 或官方 Codex 外观。

## 2. 发布通道

| 通道 | 受众 | 自动更新 | 数据保证 |
| --- | --- | --- | --- |
| Dev | 开发者 | 关闭 | 可重装，仍不得破坏用户真实状态 |
| Alpha | 内部/受控测试 | 默认关闭，手工 bundle upgrade | current/previous Runtime、完整 rollback |
| Beta | Phase 01 后考虑 | 签名更新 | 兼容迁移、回滚演练 |
| Stable | 非 Phase 00 | 签名更新 | 正式支持策略 |

Phase 00 只允许 Dev/Alpha。在线 updater 可做 Spike，但不得默认启用。

## 3. Feature Flags

建议：

```json
{
  "studioShell": true,
  "runtimeApiV1": true,
  "managedRuntimeInstaller": true,
  "themeImportApi": false,
  "applyVerticalSlice": true,
  "onlineUpdater": false,
  "legacyEntrypoints": true
}
```

规则：

- flag 由受管配置和 build channel 控制，不接受主题包修改；
- 安全与恢复能力不能通过 flag 关闭；
- `legacyEntrypoints=true` 直到 Phase 01 验证无回退；
- flag 变化写入日志和诊断摘要；
- rollback 后恢复 previous 版本默认 flag。

## 4. Artifact 组成

```text
Dream Skin Studio App/Installer
├── Desktop Shell
├── versioned Runtime payload
│   ├── runtime-manifest.json
│   ├── hashes.json
│   ├── platform entrypoint
│   ├── adapter/scripts
│   └── recovery entrypoint
├── licenses/SBOM
└── build metadata
```

artifact 不包含：

- 用户主题；
- API Key；
- 在线账号；
- 未审计第三方主题；
- 对官方 Codex 的修改文件。

## 5. 版本模型

至少独立记录：

- `appVersion`；
- `runtimeVersion`；
- `apiMin/apiMax`；
- `adapterVersion`；
- `journalSchemaVersion`；
- `themeSchemaSupported`；
- build commit；
- artifact hash。

兼容规则：

- App 必须先读取 Runtime manifest，再启动业务请求；
- API major 不兼容时只允许 repair/downgrade/restore；
- Runtime 可比 App 新，但必须声明 API v1 兼容；
- journal schema 未知时不自动迁移，进入 recoveryRequired；
- Theme Schema v1 保持可读。

## 6. 安装流程

### 6.1 Clean install

```text
Verify installer signature
→ Install Desktop Shell
→ Locate bundled Runtime payload
→ Acquire operation lock
→ Stage Runtime version
→ Verify files/hash/signature
→ Self-check
→ Publish version directory
→ Write current.json
→ capabilities/status smoke test
→ Commit
→ Launch Studio
```

失败：

- App 安装失败：平台 installer 回滚；
- Runtime stage 失败：App 可启动 recovery/repair 页面，不进入主题写操作；
- smoke test 失败：删除新 current，保留证据；
- 不触碰现有主题库。

### 6.2 Legacy coexistence

检测现有：

- macOS `~/.codex/codex-dream-skin-studio`；
- macOS/Windows state root；
- SwiftBar/Tray/CLI；
- existing active theme/state。

策略：

- 不自动删除 legacy engine；
- Runtime Adapter 可把 legacy scripts 作为后端；
- 写操作仍经过新 lock/journal；
- UI 显示 `LEGACY_BACKEND_ACTIVE`；
- legacy entrypoints 逐步改为调用 Runtime Host，而不是并行维护写逻辑；
- Phase 00 不做不可逆目录迁移。

## 7. Runtime 升级

```text
Preflight App/Runtime compatibility
→ Lock
→ Detect incomplete previous transaction
→ Stage new version
→ Verify manifest/hash/signature
→ Run self-check
→ Publish versions/<new>
→ Backup current.json to previous.json
→ Switch current.json
→ capabilities/status smoke test
→ Commit
→ Keep previous version
→ Cleanup older non-pinned versions
```

### 7.1 升级前阻断

- recoveryRequired；
- 活跃写事务；
- state root link/reparse；
- payload 签名/hash 不通过；
- 磁盘不足；
- 当前 journal schema 无法读取；
- previous Runtime 不存在且新版本不可回退。

### 7.2 提交点

`current.json` 切换且新 Runtime smoke test 成功后 committed。

- commit 前失败：继续使用旧 Runtime；
- pointer 切换后 smoke test 失败：恢复 previous pointer；
- commit 后清理失败：新 Runtime继续生效，返回 `CLEANUP_PENDING`。

## 8. 降级

降级不是简单覆盖旧文件：

1. 验证目标 Runtime manifest 和 App 兼容；
2. 检查 journal schema；
3. 目标版本存在则切 current pointer；
4. 不存在则从签名 App payload 重装；
5. smoke test；
6. 失败恢复原 current；
7. 记录 downgrade reason。

若新版本写入了旧 Runtime 无法理解的非终态 journal，禁止降级并要求先恢复事务。

Phase 00 不引入破坏性主题 schema 迁移，因此主题数据无需降级转换。

## 9. Desktop App 升级

顺序：

```text
Install new App
→ App first launch checks bundled Runtime
→ Upgrade Runtime transactionally
→ API handshake
→ Open main UI
```

若 Runtime 升级失败：

- 新 App 可进入 repair/recovery 页面；
- 若 previous Runtime 与新 App API 兼容，可回退使用；
- 不兼容则提示回退 App 或执行 emergency restore；
- 不自动执行主题 Apply。

## 10. 主题操作回滚

### 10.1 Import replace

- 旧目录移动到 transaction backup；
- 新目录 publish 后重新读取验证；
- 验证失败恢复旧目录；
- committed 后 cleanup 旧 backup 失败只 warning；
- `applyAfterImport` 失败默认不撤销已提交 Import，返回 partial success。

### 10.2 Apply

- 备份 active theme；
- publish 后 Verify；
- Verify 失败恢复 active backup；
- 恢复后再次 Verify；
- rollback 失败进入 recoveryRequired；
- 不继续处理第二个写操作。

### 10.3 Restore

Restore 本身也有 journal：

- 备份诊断和原配置；
- 只停止已验证进程；
- 恢复失败返回 partial/manual action；
- 不删除主题库；
- emergency mode 尽量恢复官方 Codex，不依赖主 UI。

## 11. Emergency Restore

必须随 App 独立分发最小入口：

- macOS：签名 recovery executable/launcher；
- Windows：签名 recovery executable/PowerShell wrapper；
- 固定 state root 和操作；
- 无网络；
- 无任意路径/command 参数；
- 可在主 Runtime 损坏时运行；
- 获取同一 operation lock；
- 验证进程身份；
- 恢复配置、停止 Injector、启动官方 Codex；
- 输出 JSON + 人类友好摘要；
- 保存 recovery evidence。

## 12. App 卸载

卸载选项分离：

1. 删除 Studio App；
2. 删除 managed Runtime；
3. 保留或删除日志；
4. 保留主题库；
5. Restore 官方 Codex；
6. 删除全部 Dream Skin 用户数据。

默认安全策略：

- 卸载 App 前先提示 Restore；
- 默认保留主题库；
- 不删除官方 Codex；
- 删除 managed Runtime 前确认 legacy entrypoints 不再指向它；
- 全部数据删除需要独立明确确认。

## 13. 发布检查清单

### Build

- [ ] commit clean；
- [ ] version/manifest 一致；
- [ ] Runtime files hash；
- [ ] SBOM/license；
- [ ] secrets scan；
- [ ] reproducibility notes；
- [ ] recovery entrypoint included。

### Automated

- [ ] static/unit/contract；
- [ ] macOS importer regression；
- [ ] Windows PS 5.1/7；
- [ ] failure injection；
- [ ] install/upgrade/downgrade E2E；
- [ ] stdout JSON and redaction；
- [ ] Desktop Shell security assertions。

### macOS

- [ ] codesign verify；
- [ ] notarization/staple；
- [ ] clean install；
- [ ] no source checkout；
- [ ] apply/verify/restore；
- [ ] upgrade/downgrade；
- [ ] emergency restore。

### Windows

- [ ] Authenticode/installer verify；
- [ ] Windows 10/11；
- [ ] PATH without Node；
- [ ] PS 5.1/7 contract；
- [ ] Appx identity；
- [ ] apply/verify/restore；
- [ ] upgrade/downgrade；
- [ ] emergency restore。

## 14. Alpha 发布步骤

1. Freeze commit and Work Items；
2. 从 upstream cursor 续接 Review；
3. 生成签名 artifacts；
4. 执行 release CI；
5. clean VM 安装；
6. legacy environment 安装；
7. 核心实机矩阵；
8. rollback 演练；
9. 填写 acceptance report 和 Known Issues；
10. 发布 Alpha notes、hash、支持范围和回滚说明；
11. 不启用在线自动更新。

## 15. 回滚触发条件

立即停止发布并回滚：

- 任意命令执行或路径逃逸；
- signal 非 Dream Skin/Codex 进程；
- 主题库或配置不可恢复损坏；
- managed Runtime hash/签名异常；
- Restore 失败率不可接受；
- API 跨平台语义不一致导致错误操作；
- rollbackFailed 后仍允许写操作；
- 安装后依赖源码或 PATH；
- 日志泄露 Codex 对话/密钥。

可暂停但不立即撤回：

- cleanupPending；
- 非关键性能回退；
- 可访问性 P2；
- 单个非核心主题显示问题。

## 16. 回滚执行

### Runtime rollback

- 关闭 Studio 写入口；
- 使用 recovery entrypoint 获取锁；
- 切换 `current.json` 到 previous；
- smoke test；
- 保留失败版本目录和日志；
- 若 previous 失败，执行 emergency Restore。

### App rollback

- 保留用户 state root；
- 安装上一签名版本；
- 检查 previous Runtime/API；
- 如不兼容，配套降级 Runtime；
- 不自动重写主题。

### 数据 rollback

- 根据 journal 恢复 active/import destination；
- 不从未知/损坏绝对路径恢复；
- 验证后清 current transaction；
- rollback 失败转人工恢复，保留证据。

## 17. Known Issues 策略

每项包含：

- ID；
- 影响版本/平台；
- 严重级别；
- 用户表现；
- 数据/安全影响；
- workaround；
- 是否阻断升级/降级；
- owner；
- 目标 Work Item。

不得用 Known Issue 接受 P0 安全或数据损坏问题。

## 18. Phase 00 发布结论

Phase 00 Alpha 只有在以下事实同时成立时才允许发布：

- Desktop Shell ADR Accepted；
- signed 双平台 artifact；
- managed Runtime 不依赖源码/PATH；
- API Contract 核心集合通过；
- upgrade/downgrade/rollback 实机通过；
- emergency Restore 可独立运行；
- legacy 入口无回退；
- acceptance evidence 和 Known Issues 已提交。
