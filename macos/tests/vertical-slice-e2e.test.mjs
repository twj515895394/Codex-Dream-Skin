/**
 * Vertical Slice End-to-End & Apple Design UI Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 * - .scratch/phase-00-foundation/issues/15-vertical-slice-e2e.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { handleCapabilities } from "../../core/runtime-api/handlers/capabilities-handler.js";
import { handleStatus } from "../../core/runtime-api/handlers/status-handler.js";
import { handleListThemes } from "../../core/runtime-api/handlers/list-themes-handler.js";
import { handleApplyTheme } from "../../core/runtime-api/handlers/apply-theme-handler.js";
import { handleVerify } from "../../core/runtime-api/handlers/verify-handler.js";
import { handleRestore } from "../../core/runtime-api/handlers/restore-handler.js";

function createIsolatedStateRoot() {
  const tmpState = fs.mkdtempSync(path.join(os.tmpdir(), "ds-vs-e2e-state-"));
  return { stateRoot: tmpState };
}

function cleanupIsolatedStateRoot(ctx) {
  try {
    if (ctx.stateRoot && fs.existsSync(ctx.stateRoot)) {
      fs.rmSync(ctx.stateRoot, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}

function createDummyTheme(stateRoot, themeId, themeName) {
  const themeDir = path.join(stateRoot, "themes", themeId);
  fs.mkdirSync(themeDir, { recursive: true });
  fs.writeFileSync(
    path.join(themeDir, "theme.json"),
    JSON.stringify({
      schemaVersion: 1,
      id: themeId,
      name: themeName,
      version: "1.0.0",
      image: "background.png",
    }),
    "utf8"
  );
  fs.writeFileSync(path.join(themeDir, "background.png"), "bytes");
}

test("Vertical Slice End-to-End Test Suite", async (t) => {
  await t.test("1. 全流程端到端链路：Capabilities → Status → ListThemes → Apply → Verify → Restore 贯通", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createDummyTheme(ctx.stateRoot, "vs-theme-01", "VS Theme 01");

      // 1. Capabilities & Initial Status
      const capRes = await handleCapabilities({}, { stateRoot: ctx.stateRoot });
      assert.equal(capRes.ok, true);

      const statusRes1 = await handleStatus({}, { stateRoot: ctx.stateRoot });
      assert.equal(statusRes1.ok, true);
      assert.equal(statusRes1.data.skin.state, "off");

      // 2. List Themes
      const listRes = await handleListThemes({}, { stateRoot: ctx.stateRoot });
      assert.equal(listRes.ok, true);
      assert.equal(listRes.data.themes.length, 1);
      assert.equal(listRes.data.themes[0].id, "vs-theme-01");

      // 3. Apply Theme
      const applyRes = await handleApplyTheme({ themeId: "vs-theme-01" }, { stateRoot: ctx.stateRoot });
      assert.equal(applyRes.ok, true);
      assert.equal(applyRes.data.applied, true);

      // 4. Status After Apply
      const statusRes2 = await handleStatus({}, { stateRoot: ctx.stateRoot });
      assert.equal(statusRes2.ok, true);
      assert.equal(statusRes2.data.skin.state, "active");
      assert.equal(statusRes2.data.skin.currentTheme.id, "vs-theme-01");

      // 5. Verify
      const verifyRes = await handleVerify({ scope: "full" }, { stateRoot: ctx.stateRoot });
      assert.equal(verifyRes.ok, true);
      assert.equal(verifyRes.data.overall, "pass");

      // 6. Restore
      const restoreRes = await handleRestore({ mode: "emergency" }, { stateRoot: ctx.stateRoot });
      assert.equal(restoreRes.ok, true);
      assert.equal(restoreRes.data.restored, true);

      // Final Status Check
      const statusRes3 = await handleStatus({}, { stateRoot: ctx.stateRoot });
      assert.equal(statusRes3.ok, true);
      assert.equal(statusRes3.data.skin.state, "off");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("2. UI 设计与 Accessibility 静态断言符合 Apple Design 规范", async () => {
    const cssPath = fileURLToPath(new URL("../../vertical-slice/app.css", import.meta.url));
    const htmlPath = fileURLToPath(new URL("../../vertical-slice/index.html", import.meta.url));

    assert.equal(fs.existsSync(cssPath), true);
    assert.equal(fs.existsSync(htmlPath), true);

    const cssContent = fs.readFileSync(cssPath, "utf8");
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    // 1. Materials & Depth (backdrop-filter blur)
    assert.ok(cssContent.includes("backdrop-filter: blur"));
    // 2. Response (scale 0.97)
    assert.ok(cssContent.includes("scale(0.97)"));
    // 3. Accessibility: prefers-reduced-motion & prefers-reduced-transparency
    assert.ok(cssContent.includes("prefers-reduced-motion"));
    assert.ok(cssContent.includes("prefers-reduced-transparency"));

    // 4. Multi-encoding (status-indicator + badge + text)
    assert.ok(htmlContent.includes("status-indicator"));
    assert.ok(htmlContent.includes("badge"));
  });
});
