import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { handleListThemes } from "../../core/runtime-api/handlers/list-themes-handler.js";
import { validateResponseEnvelope, buildSuccessResponse } from "../../core/runtime-api/schema-envelope.js";

describe("listThemes Operation Unit & Integration Test Suite", () => {
  let tmpStateRoot = "";

  beforeEach(() => {
    tmpStateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codex-listthemes-test-"));
  });

  afterEach(() => {
    if (tmpStateRoot && fs.existsSync(tmpStateRoot)) {
      fs.rmSync(tmpStateRoot, { recursive: true, force: true });
    }
  });

  it("1. 空主题库返回合法空列表与 snapshotRevision", () => {
    const res = handleListThemes({}, { stateRoot: tmpStateRoot });
    assert.equal(res.ok, true);
    assert.ok(res.data.snapshotRevision.startsWith("sha256:"));
    assert.equal(res.data.themes.length, 0);

    const env = buildSuccessResponse({ operation: "listThemes", requestId: "r_list_01" }, res.data);
    assert.equal(validateResponseEnvelope(env), true);
  });

  it("2. 正常多主题枚举与 current 激活主题匹配", () => {
    const themesDir = path.join(tmpStateRoot, "themes");
    const activeDir = path.join(tmpStateRoot, "theme");
    fs.mkdirSync(path.join(themesDir, "preset-alpha"), { recursive: true });
    fs.mkdirSync(path.join(themesDir, "custom-beta"), { recursive: true });
    fs.mkdirSync(activeDir, { recursive: true });

    fs.writeFileSync(
      path.join(themesDir, "preset-alpha", "theme.json"),
      JSON.stringify({ schemaVersion: 1, id: "preset-alpha", name: "Preset Alpha", image: "bg.png" })
    );
    fs.writeFileSync(
      path.join(themesDir, "preset-alpha", "bg.png"),
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    fs.writeFileSync(
      path.join(themesDir, "preset-alpha", "manifest.json"),
      JSON.stringify({ schemaVersion: 1, id: "preset-alpha", name: "Preset Alpha", source: "bundled" })
    );

    fs.writeFileSync(
      path.join(themesDir, "custom-beta", "theme.json"),
      JSON.stringify({ schemaVersion: 1, id: "custom-beta", name: "Custom Beta" })
    );
    fs.writeFileSync(
      path.join(themesDir, "custom-beta", "manifest.json"),
      JSON.stringify({ schemaVersion: 1, id: "custom-beta", name: "Custom Beta", source: "custom" })
    );

    // Active theme is custom-beta
    fs.writeFileSync(
      path.join(activeDir, "theme.json"),
      JSON.stringify({ schemaVersion: 1, id: "custom-beta", name: "Custom Beta" })
    );

    const res = handleListThemes({}, { stateRoot: tmpStateRoot });
    assert.equal(res.ok, true);
    assert.equal(res.data.themes.length, 2);

    const alpha = res.data.themes.find((t) => t.id === "preset-alpha");
    const beta = res.data.themes.find((t) => t.id === "custom-beta");

    assert.ok(alpha);
    assert.equal(alpha.source, "bundled");
    assert.equal(alpha.isCurrent, false);
    assert.equal(alpha.hasPreview, true);
    assert.equal(alpha.image.mimeType, "image/png");

    assert.ok(beta);
    assert.equal(beta.source, "custom");
    assert.equal(beta.isCurrent, true);

    const env = buildSuccessResponse({ operation: "listThemes", requestId: "r_list_02" }, res.data);
    assert.equal(validateResponseEnvelope(env), true);
  });

  it("3. 单主题坏配置隔离：损坏的 theme.json 不影响其他合法主题的枚举", () => {
    const themesDir = path.join(tmpStateRoot, "themes");
    fs.mkdirSync(path.join(themesDir, "valid-one"), { recursive: true });
    fs.mkdirSync(path.join(themesDir, "corrupt-two"), { recursive: true });

    fs.writeFileSync(
      path.join(themesDir, "valid-one", "theme.json"),
      JSON.stringify({ schemaVersion: 1, id: "valid-one", name: "Valid One" })
    );
    fs.writeFileSync(
      path.join(themesDir, "valid-one", "manifest.json"),
      JSON.stringify({ schemaVersion: 1, id: "valid-one", name: "Valid One", source: "imported" })
    );
    fs.writeFileSync(
      path.join(themesDir, "corrupt-two", "theme.json"),
      "{ invalid json syntax error"
    );

    const res = handleListThemes({ includeInvalid: true }, { stateRoot: tmpStateRoot });
    assert.equal(res.ok, true);
    assert.equal(res.data.themes.length, 2);

    const corruptItem = res.data.themes.find((t) => t.id === "corrupt-two");
    assert.ok(corruptItem);
    assert.equal(corruptItem.status, "invalid");
    assert.ok(corruptItem.diagnostics.length > 0);

    const validItem = res.data.themes.find((t) => t.id === "valid-one");
    assert.ok(validItem);
    assert.equal(validItem.status, "ready");
  });

  it("4. Legacy 旧主题标识（缺少 manifest.json 归类为 legacy 与 warning）", () => {
    const themesDir = path.join(tmpStateRoot, "themes");
    fs.mkdirSync(path.join(themesDir, "legacy-theme"), { recursive: true });
    fs.writeFileSync(
      path.join(themesDir, "legacy-theme", "theme.json"),
      JSON.stringify({ schemaVersion: 1, id: "legacy-theme", name: "Legacy Theme" })
    );

    const res = handleListThemes({ includeLegacy: true }, { stateRoot: tmpStateRoot });
    assert.equal(res.ok, true);
    assert.equal(res.data.themes.length, 1);
    assert.equal(res.data.themes[0].source, "legacy");
    assert.equal(res.data.themes[0].status, "warning");
    assert.equal(res.data.themes[0].hasManifest, false);
  });

  it("5. 重复 ID 主题在 diagnostics 中提示冲突预警", () => {
    const themesDir = path.join(tmpStateRoot, "themes");
    fs.mkdirSync(path.join(themesDir, "dir-a"), { recursive: true });
    fs.mkdirSync(path.join(themesDir, "dir-b"), { recursive: true });

    fs.writeFileSync(
      path.join(themesDir, "dir-a", "theme.json"),
      JSON.stringify({ schemaVersion: 1, id: "duplicate-id", name: "Theme A" })
    );
    fs.writeFileSync(
      path.join(themesDir, "dir-b", "theme.json"),
      JSON.stringify({ schemaVersion: 1, id: "duplicate-id", name: "Theme B" })
    );

    const res = handleListThemes({}, { stateRoot: tmpStateRoot });
    assert.equal(res.ok, true);
    assert.ok(res.data.diagnostics.some((d) => d.code === "THEME_ID_CONFLICT"));
  });

  it("6. 100 个主题高性能扫盘 P95 < 1s 验证", () => {
    const themesDir = path.join(tmpStateRoot, "themes");
    fs.mkdirSync(themesDir, { recursive: true });

    for (let i = 0; i < 100; i++) {
      const folder = path.join(themesDir, `theme-perf-${i}`);
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(
        path.join(folder, "theme.json"),
        JSON.stringify({ schemaVersion: 1, id: `theme-perf-${i}`, name: `Perf Theme ${i}` })
      );
    }

    const start = performance.now();
    const res = handleListThemes({}, { stateRoot: tmpStateRoot });
    const duration = performance.now() - start;

    assert.equal(res.ok, true);
    assert.equal(res.data.themes.length, 100);
    assert.ok(duration < 1000, `List 100 themes should be under 1000ms, took ${duration}ms`);
  });

  it("7. 扫盘零副作用：不修改任何磁盘状态", () => {
    const nonExistent = path.join(tmpStateRoot, "ghost-root");
    handleListThemes({}, { stateRoot: nonExistent });
    assert.equal(fs.existsSync(nonExistent), false);
  });
});
