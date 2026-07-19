# Phase 00 Code Review Fix Round

## 1. Purpose

Phase 00 已完成 Foundation Core Implementation 后，进入一次独立的 Code Review Fix Round。

目标不是扩展新功能，而是：

- 对齐已实现代码与 Phase 00 PRD / Architecture Design；
- 修复实现过程中产生的架构偏差；
- 补齐生产级 Runtime 基础能力；
- 为 Phase 01 Theme Manager Architecture 建立稳定底座。

原则：

> 不增加业务能力，只修正基础设施质量、边界契约、安全模型和可靠性。

---

# 2. Review 输入

本轮 Review 基于：

- Phase 00 PRD
- Runtime API v1 Contract
- Security & Privacy Design
- Transaction / Lock Design
- Managed Runtime Design
- Launcher First Architecture
- Phase 00 实际代码实现

重点检查：

```text
App Core
    |
Runtime API
    |
Adapter
    |
Platform
```

是否保持设计边界。

---

# 3. Fix Round Goals

## Goal 01 - Runtime Security Hardening

修复安全实现偏差。

范围：

- 消除 shell command string 拼接；
- 所有系统调用统一参数化；
- 保持 Runtime 不执行任意 shell；
- 增加安全回归测试。

重点文件：

```text
core/runtime-api/operation-lock.js
core/runtime-api/adapters/*
```

验收：

- grep 无危险 shell 拼接；
- security test 全部通过。

---

# Goal 02 - Transaction Atomicity Hardening

强化写操作事务一致性。

当前风险：

部分 publish 使用 copy 覆盖模型，异常情况下可能产生半完成状态。

目标：

统一：

```text
prepare
 ↓
stage
 ↓
validate
 ↓
backup
 ↓
atomic publish
 ↓
commit
 ↓
cleanup
```

要求：

- publish 使用原子替换策略；
- journal 始终可以恢复；
- crash 后状态可预测。

重点：

```text
importTheme
applyTheme
restore
managed-runtime upgrade
```

---

# Goal 03 - Operation Lock Production Hardening

完善并发控制模型。

当前能力：

- owner.json
- PID 校验
- stale lock recovery

需要补充：

## Heartbeat

增加：

```text
owner.json
    |
    heartbeatAt
```

运行期间周期刷新。

## Stale 判断升级

从：

```text
process dead
```

升级为：

```text
process dead
OR
heartbeat timeout
OR
runtime mismatch
```

验收：

- 长任务不会误判；
- 崩溃后可以恢复；
- 多入口竞争稳定。

---

# Goal 04 - Adapter Contract Review

重新审查 Platform Adapter 边界。

目标：

保证：

```text
macOS Adapter
        |
Typed Internal Result
        |
Runtime API Response

Windows Adapter
        |
Typed Internal Result
        |
Runtime API Response
```

统一：

- error code
- recoverability
- retry semantics
- diagnostic metadata

---

# Goal 05 - Managed Runtime Hardening

检查 Runtime 生命周期模型。

目标：

最终保证：

```text
runtime package
        |
manifest verify
        |
sha256 verify
        |
signature verify
        |
stage
        |
activate
        |
health check
        |
rollback
```

重点：

- current/previous pointer；
- upgrade interruption recovery；
- rollback evidence。

---

# Goal 06 - Launcher First Architecture Verification

确认 Desktop Shell 没有偏离产品方向。

目标结构：

```text
Dream Skin.app
        |
        +-- Launcher
        |
        +-- Runtime
        |
        +-- Dream Skin Studio.app
```

检查：

- Vertical Slice 是否体现 Launcher First；
- Studio 是否只是管理层；
- Runtime 是否保持无 UI。

---

# Goal 07 - Failure Injection Matrix

增加生产异常验证。

覆盖：

## Import

- unzip 中断；
- validation failure；
- disk full。

## Apply

- publish interruption；
- verify failure；
- rollback failure。

## Runtime

- crash recovery；
- stale lock；
- upgrade interruption。

---

# 4. 建议 Issue 拆分

建议拆分：

```text
DS-FIX-001 Runtime Security Hardening

DS-FIX-002 Transaction Atomic Publish

DS-FIX-003 Operation Lock Heartbeat

DS-FIX-004 Adapter Contract Alignment

DS-FIX-005 Managed Runtime Hardening

DS-FIX-006 Launcher Architecture Verification

DS-QA-005 Failure Injection Matrix
```

---

# 5. 完成标准

Phase 00 Code Review Fix Round 完成条件：

- [ ] 无 shell string concat；
- [ ] Runtime API Contract 不变；
- [ ] Lock/Journaling 满足生产恢复要求；
- [ ] Adapter Result Contract 完全统一；
- [ ] Managed Runtime 可升级/降级恢复；
- [ ] Launcher First 架构验证通过；
- [ ] Failure Injection Matrix 通过。

完成后进入：

```text
Phase 01 Production Theme Manager Architecture
```
