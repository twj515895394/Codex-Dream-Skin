# Codex Dream Skin Theme System Evolution Design

> Version: v1.0
>
> Goal: 将 Codex Dream Skin 从单主题注入工具演进为可扩展的 Theme Platform。

## 1. 背景与问题

当前版本主要围绕 macOS 下 Codex 主题注入能力设计，存在以下问题：

1. 主题没有统一交换格式。
2. 使用 `.command` / `.sh` 安装主题，不符合 macOS 普通用户体验，容易触发 Gatekeeper 安全提示。
3. 缺少主题生命周期管理能力：导入、列表、切换、删除、恢复。
4. Theme Authoring 与 Runtime 职责边界不清晰。

## 2. 演进目标

升级为：

```
Codex Dream Skin Studio
        |
        +-- Theme Runtime
        |      - Import
        |      - Validate
        |      - Apply
        |      - Restore
        |
        +-- Theme Authoring
               - Design
               - Generate
               - Package
```

两个模块通过统一格式 `.codex-theme` 连接。

## 3. 核心设计原则

### 3.1 Theme Package First

所有主题必须以 `.codex-theme` 作为分发格式。

主题包只包含数据：

- 图片资源
- JSON 配置
- 元数据

禁止包含：

- shell script
- executable
- app bundle

### 3.2 Runtime 与 Authoring 分离

Runtime 负责主题运行。

Authoring 负责主题创造。

## 4. .codex-theme 标准

```
Soft-Family-Calm.codex-theme
|
+-- manifest.json
+-- theme.json
+-- assets/
|      +-- wallpaper.png
|      +-- preview.png
|
+-- metadata/
|      +-- design.json
|
+-- README.md
```

## 5. manifest.json 职责

记录：

- theme id
- name
- version
- author
- preview
- assets
- compatibility

## 6. theme.json 职责

负责 Runtime 使用的主题配置：

- colors
- appearance mode
- branding
- wallpaper

支持：

- light
- dark

## 7. Runtime 改造计划

新增 Theme Registry：

```
~/Library/Application Support/CodexDreamSkinStudio/
|
+-- themes/
|      +-- soft-family/
|      +-- cyberpunk/
|
+-- active-theme.json
```

新增能力：

```
theme-manager

list
install
remove
apply
current
```

## 8. Theme Import 流程

```
.codex-theme
    |
    v
validate
    |
extract
    |
register
    |
apply
```

校验内容：

- manifest schema
- theme schema
- asset integrity
- security rules

## 9. Authoring Skill 改造

旧流程：

```
需求 -> theme.json
```

新流程：

```
需求
 |
v
Theme Brief
 |
v
Artwork
 |
v
theme.json
 |
v
manifest.json
 |
v
.codex-theme
```

## 10. Soft Family 迁移计划

废弃：

```
Codex-Dream-Skin-Soft-Family-Mac.zip
```

升级：

```
Soft-Family-Calm.codex-theme
```

拆分：

- Soft Family Light
- Soft Family Night

## 11. 开发阶段

### Phase 1

完成 `.codex-theme` schema。

### Phase 2

实现 Theme Validator。

### Phase 3

实现 Import / Registry。

### Phase 4

Runtime 适配。

### Phase 5

升级 Theme Authoring Skill。

### Phase 6

重新制作 Soft Family 官方主题。

## 12. 验收目标

最终用户流程：

```
下载主题
   |
打开 Dream Skin Studio
   |
Import Theme
   |
Preview
   |
Apply
   |
完成
```

不再依赖用户执行未知来源脚本。