# Phase Handoff 索引

本目录保存各阶段的当前交接入口和阶段历史快照。

```text
phases/
├── README.md
├── phase00/
│   ├── current.md
│   └── archive/
└── phase01/ ...
```

规则：

- 每个阶段至少有一个 `current.md`；
- 阶段状态、Work Item、设计入口、阻塞和下一步在 `current.md` 聚合；
- 新交接产生后，旧版本复制为带日期的快照并移入 `archive/`；
- 阶段完成后保留最终 `current.md`，根 `.handoff/current.md` 指向下一阶段；
- Phase 目录不能替代 `docs/studio/phases/phase-XX-*/` 的详细设计和验收文档。

当前阶段：[`phase00/current.md`](./phase00/current.md)。