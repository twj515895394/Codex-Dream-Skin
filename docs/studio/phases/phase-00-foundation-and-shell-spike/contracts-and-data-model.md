# Phase 00 契约与数据模型

## 1. 契约范围

本文定义 Studio/App Core 与 Runtime Host 之间的 Runtime JSON API v1，以及 Phase 00 所需状态、锁、事务、主题摘要和受管 Runtime 数据模型。

本契约不直接暴露 Shell/PowerShell 参数，也不承诺 Theme Schema v2。

## 2. 传输约定

- 编码：UTF-8，无 BOM；
- 一次进程调用只处理一个 request；
- request 从 stdin 读取；
- stdout 必须只包含一个 JSON object，末尾允许一个换行；
- stderr 只用于诊断，不参与业务解析；
- 最大 request：1 MiB；
- 最大 response：4 MiB；
- 文件内容不以内联 base64 传入；
- 所有时间为 RFC 3339 UTC；
- ID 使用 UUID 或等价的高熵字符串，最大 128 字符；
- 路径默认不返回给普通 UI，只返回 logical path 或脱敏 path。

## 3. 请求 Envelope

```json
{
  "apiVersion": 1,
  "operation": "applyTheme",
  "requestId": "8fa5e96e-8c92-4cc2-afb3-c27f6b146584",
  "input": {
    "themeId": "soft-family-calm-v3"
  },
  "options": {
    "allowCodexRestart": false
  },
  "client": {
    "name": "dream-skin-studio",
    "version": "0.1.0-alpha",
    "entrypoint": "studio"
  }
}
```

### 3.1 必填字段

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `apiVersion` | integer | 必须为 `1` |
| `operation` | string | 必须是 capability 声明的操作 |
| `requestId` | string | 1～128，日志关联键 |
| `input` | object | operation-specific |

### 3.2 可选字段

- `options`：安全开关和用户授权；
- `client`：调用方版本和入口；
- 未知顶层字段：Runtime v1 忽略并可返回 warning；
- 未知 operation input 字段：默认拒绝 `INVALID_REQUEST`，防止拼写错误静默生效。

## 4. 响应 Envelope

```json
{
  "apiVersion": 1,
  "operation": "applyTheme",
  "requestId": "8fa5e96e-8c92-4cc2-afb3-c27f6b146584",
  "operationId": "op_01J2...",
  "ok": true,
  "data": {},
  "warnings": [],
  "error": null,
  "meta": {
    "runtimeVersion": "0.1.0",
    "adapterVersion": "0.1.0",
    "platform": "darwin-arm64",
    "durationMs": 1834
  }
}
```

失败：

```json
{
  "apiVersion": 1,
  "operation": "applyTheme",
  "requestId": "...",
  "operationId": "op_01J2...",
  "ok": false,
  "data": {
    "applied": false,
    "verified": false,
    "rollbackAttempted": true,
    "rollbackSucceeded": true
  },
  "warnings": [],
  "error": {
    "code": "VERIFY_FAILED_ROLLED_BACK",
    "category": "verification",
    "message": "The new theme could not be verified and the previous theme was restored.",
    "recoverable": true,
    "action": "reviewDiagnostics",
    "details": {
      "failedCheck": "rendererMarker"
    }
  },
  "meta": {
    "runtimeVersion": "0.1.0",
    "adapterVersion": "0.1.0",
    "platform": "windows-x64",
    "durationMs": 9421
  }
}
```

### 4.1 响应不变量

- `ok=true` 时 `error=null`；
- `ok=false` 时 `error` 必须存在；
- `warnings` 始终为数组；
- 写操作始终返回 `operationId`；
- 部分成功通过 `data` 明确表达，不用 message 猜测；
- `details` 不包含绝对 home、包路径、环境变量或堆栈；
- Runtime 内部异常也必须尽力输出合法 envelope；无法解析 request 时可使用 `requestId=null`。

## 5. 进程退出码

| Exit | 类别 | 说明 |
| ---: | --- | --- |
| `0` | success | `ok=true`，可含 warning |
| `2` | request | JSON/Schema/参数无效 |
| `3` | compatibility | API 或 operation 不支持 |
| `10` | conflict | 锁冲突、snapshot 变化 |
| `11` | cancelled | 用户或调用方取消，未提交 |
| `20` | validation | 包、主题、图片、路径校验失败 |
| `21` | not-found | 主题、Codex、Runtime payload 不存在 |
| `22` | permission | 权限或受管目录安全失败 |
| `30` | runtime | Runtime/Adapter 不可用或版本不匹配 |
| `31` | codex | Codex 身份、启动、CDP 失败 |
| `32` | authorization | 需要 restart/用户确认 |
| `40` | operation | commit 前操作失败，rollback 成功或无需 rollback |
| `41` | verification | 新状态 Verify 失败，已恢复 |
| `42` | recovery | rollback/restore 失败，需恢复 |
| `50` | internal | 未分类内部错误 |

退出码只表达大类；UI 以 `error.code` 决定动作。PowerShell 5.1 必须保留原生子进程真实退出码。

## 6. Error Object

```ts
type RuntimeError = {
  code: ErrorCode;
  category:
    | "request"
    | "compatibility"
    | "conflict"
    | "cancelled"
    | "validation"
    | "permission"
    | "runtime"
    | "codex"
    | "operation"
    | "verification"
    | "recovery"
    | "internal";
  message: string;
  recoverable: boolean;
  action:
    | "none"
    | "retry"
    | "refreshStatus"
    | "reloadTheme"
    | "confirmRestart"
    | "repairRuntime"
    | "openPermissions"
    | "reviewDiagnostics"
    | "restore"
    | "manualRecovery";
  details?: Record<string, string | number | boolean | null>;
};
```

### 6.1 稳定错误码

| Code | Exit | 典型 action |
| --- | ---: | --- |
| `INVALID_JSON` | 2 | none |
| `INVALID_REQUEST` | 2 | none |
| `API_VERSION_UNSUPPORTED` | 3 | repairRuntime |
| `OPERATION_UNSUPPORTED` | 3 | none |
| `OPERATION_BUSY` | 10 | refreshStatus |
| `THEME_CHANGED` | 10 | reloadTheme |
| `CANCELLED` | 11 | none |
| `PACKAGE_NOT_FOUND` | 21 | retry |
| `PACKAGE_TOO_LARGE` | 20 | none |
| `PACKAGE_UNREADABLE` | 20 | none |
| `PACKAGE_UNSAFE_PATH` | 20 | reviewDiagnostics |
| `PACKAGE_EXECUTABLE_CONTENT` | 20 | reviewDiagnostics |
| `PACKAGE_LINK_OR_SPECIAL_FILE` | 20 | reviewDiagnostics |
| `PACKAGE_ZIP_BOMB_SUSPECTED` | 20 | reviewDiagnostics |
| `MANIFEST_INVALID` | 20 | reviewDiagnostics |
| `THEME_INVALID` | 20 | reviewDiagnostics |
| `THEME_NOT_FOUND` | 21 | reloadTheme |
| `THEME_ID_CONFLICT` | 10 | none |
| `IMAGE_INVALID` | 20 | reviewDiagnostics |
| `PERMISSION_DENIED` | 22 | openPermissions |
| `MANAGED_PATH_UNSAFE` | 22 | manualRecovery |
| `RUNTIME_NOT_INSTALLED` | 30 | repairRuntime |
| `RUNTIME_VERSION_MISMATCH` | 30 | repairRuntime |
| `RUNTIME_INTEGRITY_FAILED` | 30 | repairRuntime |
| `CODEX_NOT_FOUND` | 21 | none |
| `CODEX_IDENTITY_INVALID` | 31 | reviewDiagnostics |
| `CDP_NOT_READY` | 31 | retry |
| `CDP_OWNER_INVALID` | 31 | restore |
| `INJECTOR_IDENTITY_INVALID` | 31 | restore |
| `CODEX_RESTART_REQUIRED` | 32 | confirmRestart |
| `PUBLISH_FAILED` | 40 | retry |
| `VERIFY_FAILED_ROLLED_BACK` | 41 | reviewDiagnostics |
| `ROLLBACK_FAILED` | 42 | restore |
| `RECOVERY_REQUIRED` | 42 | restore |
| `RESTORE_PARTIAL` | 42 | manualRecovery |
| `INTERNAL_ERROR` | 50 | reviewDiagnostics |

新增错误码必须向后兼容；客户端遇到未知 code 时按 category/action 退化。

## 7. Warning Object

```json
{
  "code": "CLEANUP_PENDING",
  "message": "The operation succeeded, but old temporary files could not be removed.",
  "action": "retryCleanup",
  "details": {
    "operationId": "op_..."
  }
}
```

稳定 warning：

- `LEGACY_BACKEND_ACTIVE`；
- `MANIFEST_MISSING`；
- `PREVIEW_MISSING`；
- `CODEX_VERSION_UNVERIFIED`；
- `CLEANUP_PENDING`；
- `OLD_RUNTIME_RETAINED`；
- `PARTIAL_SUCCESS`；
- `DIAGNOSTICS_REDACTED`。

## 8. capabilities

Request：

```json
{
  "apiVersion": 1,
  "operation": "capabilities",
  "requestId": "...",
  "input": {}
}
```

Response `data`：

```json
{
  "supportedApiVersions": [1],
  "operations": {
    "capabilities": { "supported": true },
    "status": { "supported": true },
    "listThemes": { "supported": true },
    "importTheme": {
      "supported": true,
      "conflictPolicies": ["reject", "replace"],
      "maxPackageBytes": 67108864
    },
    "applyTheme": {
      "supported": true,
      "mayRequireCodexRestart": true
    },
    "verify": { "supported": true },
    "restore": { "supported": true }
  },
  "platform": {
    "os": "macos",
    "arch": "arm64",
    "osVersion": "..."
  },
  "runtime": {
    "mode": "managed",
    "version": "0.1.0",
    "adapterVersion": "0.1.0",
    "legacyBackend": true
  },
  "limits": {
    "maxImageBytes": 16777216,
    "maxImageDimension": 16384,
    "maxImagePixels": 50000000
  }
}
```

## 9. status

Input：空对象，可选 `includeChecks=false`。

Data：

```json
{
  "runtime": {
    "state": "ready",
    "version": "0.1.0",
    "integrity": "verified",
    "recoveryRequired": false,
    "cleanupPending": false
  },
  "codex": {
    "state": "running",
    "version": "26.7.0",
    "identity": "verified",
    "cdp": "ready"
  },
  "skin": {
    "state": "active",
    "currentTheme": {
      "id": "soft-family-calm-v3",
      "name": "Soft Family Calm"
    },
    "injector": "running",
    "renderer": "verified"
  },
  "operation": null,
  "recovery": null
}
```

Enums：

- Runtime：`ready/degraded/unavailable/updating/recoveryRequired/unknown`；
- Codex：`running/stopped/unknown`；
- Skin：`active/paused/off/unknown`；
- identity：`verified/invalid/unavailable/unknown`。

## 10. listThemes

Input：

```json
{
  "includeInvalid": true,
  "includeLegacy": true
}
```

Data：

```json
{
  "snapshotRevision": "sha256:...",
  "themes": [
    {
      "id": "soft-family-calm-v3",
      "name": "Soft Family Calm",
      "schemaVersion": 1,
      "source": "imported",
      "status": "ready",
      "isCurrent": true,
      "hasManifest": true,
      "hasPreview": true,
      "image": {
        "fileName": "background.jpg",
        "mimeType": "image/jpeg",
        "bytes": 1234567
      },
      "diagnostics": [],
      "revision": "sha256:..."
    }
  ],
  "diagnostics": []
}
```

Theme status：`ready/warning/invalid`。

`revision` 至少覆盖 `theme.json` 和引用图片的稳定元数据/hash；Apply 可带 expected revision 防止 TOCTOU，但 Runtime 仍重新打开和验证文件。

## 11. importTheme

Input：

```json
{
  "sourceFile": "/selected/path/My.codex-theme",
  "conflictPolicy": "reject",
  "applyAfterImport": false,
  "expectedConflictThemeRevision": null
}
```

约束：

- sourceFile 必须为绝对本地文件路径；
- destination 不可由调用方指定；
- `conflictPolicy`: `reject/replace`；
- `applyAfterImport` 默认 false；
- restart 授权仍放在 `options.allowCodexRestart`。

Data：

```json
{
  "installed": true,
  "replaced": false,
  "theme": { "id": "...", "name": "...", "revision": "..." },
  "applied": false,
  "verified": false,
  "rollbackAttempted": false,
  "rollbackSucceeded": null,
  "transaction": {
    "state": "completed",
    "committed": true,
    "cleanupPending": false
  }
}
```

导入成功、Apply 失败：`ok=false` 或 `ok=true + warning` 由请求语义决定。Phase 00 定义：若 `applyAfterImport=true` 且 Apply 失败，`ok=false`，但 `data.installed=true`，并返回 `PARTIAL_SUCCESS` warning。

## 12. applyTheme

Input：

```json
{
  "themeId": "soft-family-calm-v3",
  "expectedThemeRevision": "sha256:..."
}
```

Options：

```json
{
  "allowCodexRestart": false
}
```

Data：

```json
{
  "themeId": "soft-family-calm-v3",
  "applied": true,
  "verified": true,
  "usedHotPath": true,
  "codexRestarted": false,
  "rollbackAttempted": false,
  "rollbackSucceeded": null,
  "previousThemeId": "...",
  "transaction": {
    "state": "completed",
    "committed": true,
    "cleanupPending": false
  }
}
```

若 restart 未授权：不进入 publish，返回 `CODEX_RESTART_REQUIRED`。

## 13. verify

Input：

```json
{
  "scope": "activeTheme"
}
```

Scope Phase 00：`runtime/activeTheme/full`。

Data：

```json
{
  "overall": "pass",
  "checks": [
    { "id": "codexIdentity", "status": "pass", "code": null },
    { "id": "cdpOwnership", "status": "pass", "code": null },
    { "id": "injectorIdentity", "status": "pass", "code": null },
    { "id": "rendererMarker", "status": "pass", "code": null },
    { "id": "activePayload", "status": "pass", "code": null }
  ]
}
```

Check status：`pass/warn/fail/notApplicable`。

## 14. restore

Input：

```json
{
  "mode": "normal",
  "restartOfficialCodex": true
}
```

Mode：`normal/emergency/recoverTransaction`。

Data：

```json
{
  "restored": true,
  "partial": false,
  "resources": [
    { "id": "injector", "result": "stopped" },
    { "id": "config", "result": "restored" },
    { "id": "officialCodex", "result": "started" }
  ],
  "manualActions": [],
  "verified": true
}
```

## 15. Operation Lock 数据模型

`owner.json`：

```json
{
  "lockSchemaVersion": 1,
  "operationId": "op_...",
  "requestId": "...",
  "operation": "applyTheme",
  "entrypoint": "studio",
  "pid": 12345,
  "processStartedAt": "2026-07-19T10:00:00Z",
  "runtimeExecutable": "$RUNTIME/current/bin/dream-skin-runtime",
  "runtimeVersion": "0.1.0",
  "userIdentityHash": "sha256:...",
  "createdAt": "2026-07-19T10:00:00Z",
  "heartbeatAt": "2026-07-19T10:00:02Z"
}
```

## 16. Transaction Journal 数据模型

```json
{
  "journalSchemaVersion": 1,
  "operationId": "op_...",
  "requestId": "...",
  "operation": "applyTheme",
  "state": "published",
  "committed": false,
  "createdAt": "...",
  "updatedAt": "...",
  "target": {
    "kind": "activeTheme",
    "logicalId": "soft-family-calm-v3"
  },
  "stage": {
    "relativePath": "stage",
    "verified": true
  },
  "backup": {
    "relativePath": "backup/active-theme",
    "exists": true,
    "revision": "sha256:..."
  },
  "publish": {
    "started": true,
    "commitMarkerWritten": true
  },
  "verification": {
    "attempted": false,
    "passed": null
  },
  "rollback": {
    "attempted": false,
    "succeeded": null
  },
  "cleanup": {
    "pending": false,
    "warnings": []
  },
  "error": null
}
```

Journal 只保存相对 transaction/state 路径。任何绝对 source path 只存在于受保护、脱敏或短期文件中。

## 17. Runtime Manifest

```json
{
  "manifestSchemaVersion": 1,
  "runtimeVersion": "0.1.0",
  "apiMin": 1,
  "apiMax": 1,
  "platform": "windows-x64",
  "entrypoint": "bin/dream-skin-runtime.exe",
  "minimumOs": "Windows 10",
  "buildCommit": "...",
  "files": [
    { "path": "bin/dream-skin-runtime.exe", "sha256": "...", "bytes": 123 }
  ],
  "legacyBackend": {
    "supported": true,
    "version": "1.2.0"
  }
}
```

规则：

- path 必须为规范相对路径；
- 不允许 `..`、绝对路径、链接和特殊文件；
- 文件集合与 manifest 完全匹配；
- hash 在 publish 前后校验；
- 签名是平台层额外条件，不以 JSON 自声明替代。

## 18. 文件系统事实来源

- 主题内容：`themes/<id>/`；
- active 内容：平台映射目录；
- Runtime 版本：`runtime/versions/<version>`；
- current Runtime：`runtime/current.json`；
- 恢复事实：transaction journal；
- UI 索引/缓存：可删除和重建；
- 不使用 SQLite 保存唯一主题正文或唯一恢复状态。

## 19. 未知字段和版本策略

- Envelope 未知字段：忽略；
- operation input 未知字段：拒绝；
- response data 未知字段：客户端忽略；
- 未知 enum：客户端显示 `unknown`，不崩溃；
- API major 不支持：拒绝；
- journal schema 不支持：不自动修改，进入 recoveryRequired；
- Theme Schema v1 未知字段尽量保留，Phase 00 不做破坏性 normalize。

## 20. Contract Test 规范

每个 Adapter 必须对同一 fixture 执行：

- request/response schema；
- stdout 单 JSON；
- stderr 不污染 stdout；
- exit code/category 对应；
- capabilities；
- status 各状态；
- listThemes 单坏主题隔离；
- import 安全矩阵；
- apply restart authorization；
- operation busy；
- failure before commit；
- verify fail + rollback success；
- rollback failure；
- cleanup pending；
- restore normal/emergency；
- unknown field/version compatibility。
