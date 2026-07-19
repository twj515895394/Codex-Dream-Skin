/**
 * Launcher First Architecture Verification Test Suite (DS-FIX-006)
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/technical-design.md
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/code-review-fix-round/README.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getJsFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getJsFilesRecursively(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

test("Launcher First Architecture Verification Test Suite (DS-FIX-006)", async (t) => {
  await t.test("1. 架构隔离断言：core/runtime-api 核心层绝无任何 UI 库或 DOM/Window 耦合", async () => {
    const apiCoreDir = fileURLToPath(new URL("../../core/runtime-api", import.meta.url));
    const jsFiles = getJsFilesRecursively(apiCoreDir);

    for (const filePath of jsFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      const relativeName = path.relative(apiCoreDir, filePath);

      assert.equal(
        /window\./.test(content),
        false,
        `Core file ${relativeName} must not reference window object`
      );
      assert.equal(
        /document\./.test(content),
        false,
        `Core file ${relativeName} must not reference document object`
      );
      assert.equal(
        /react|vue|electron|tauri/.test(content),
        false,
        `Core file ${relativeName} must not import UI framework dependencies`
      );
    }
  });

  await t.test("2. Vertical Slice 与 Launcher 第一级入口的边界符合分层原则", async () => {
    const appJsPath = fileURLToPath(new URL("../../vertical-slice/app.js", import.meta.url));
    assert.equal(fs.existsSync(appJsPath), true);

    const appJsContent = fs.readFileSync(appJsPath, "utf8");
    assert.ok(appJsContent.includes("handleCapabilities"));
    assert.ok(appJsContent.includes("handleStatus"));
  });
});
