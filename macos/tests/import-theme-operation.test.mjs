/**
 * importTheme Operation Unit & Integration Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 11)
 * - .scratch/phase-00-foundation/issues/09-import-theme-operation.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { handleImportTheme } from "../../core/runtime-api/handlers/import-theme-handler.js";
import { handleListThemes } from "../../core/runtime-api/handlers/list-themes-handler.js";
import { acquireLock, releaseLock } from "../../core/runtime-api/operation-lock.js";
import { PackageFixtureGenerator } from "../../tests/fixtures/generators/package-fixture-generator.mjs";

function createIsolatedStateRoot() {
  const tmpState = fs.mkdtempSync(path.join(os.tmpdir(), "ds-import-state-"));
  const tmpPkgDir = fs.mkdtempSync(path.join(os.tmpdir(), "ds-import-pkg-"));
  return { stateRoot: tmpState, pkgDir: tmpPkgDir };
}

function cleanupIsolatedStateRoot(ctx) {
  try {
    if (ctx.stateRoot && fs.existsSync(ctx.stateRoot)) {
      fs.rmSync(ctx.stateRoot, { recursive: true, force: true });
    }
    if (ctx.pkgDir && fs.existsSync(ctx.pkgDir)) {
      fs.rmSync(ctx.pkgDir, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}

test("importTheme Operation Test Suite", async (t) => {
  await t.test("1. 正常包导入：解压暂存、校验并写入主题库且可被 listThemes 枚举", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const pkgPath = path.join(ctx.pkgDir, "valid-theme.codex-theme");
      PackageFixtureGenerator.createValidPackage(
        pkgPath,
        { id: "imported-theme-01", name: "Imported Theme 01" },
        { name: "Imported Theme 01" }
      );

      const res = await handleImportTheme({ sourceFile: pkgPath }, { stateRoot: ctx.stateRoot });

      assert.equal(res.ok, true);
      assert.equal(res.data.installed, true);
      assert.equal(res.data.replaced, false);
      assert.equal(res.data.theme.id, "imported-theme-01");
      assert.equal(res.data.theme.status, "ready");
      assert.equal(res.data.applied, false);
      assert.equal(res.data.transaction.committed, true);

      // Verify listThemes integration
      const listRes = handleListThemes({}, { stateRoot: ctx.stateRoot });
      assert.equal(listRes.ok, true);
      const matched = listRes.data.themes.find((item) => item.id === "imported-theme-01");
      assert.ok(matched);
      assert.equal(matched.name, "Imported Theme 01");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("2. 安全拦截：阻断恶性可执行脚本条目", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const pkgPath = path.join(ctx.pkgDir, "malicious-script.codex-theme");
      PackageFixtureGenerator.createExecutableContentPackage(pkgPath);

      const res = await handleImportTheme({ sourceFile: pkgPath }, { stateRoot: ctx.stateRoot });

      assert.equal(res.ok, false);
      assert.equal(res.error.code, "PACKAGE_EXECUTABLE_CONTENT");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("3. 安全拦截：缺失 manifest.json 报 MANIFEST_INVALID", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const pkgPath = path.join(ctx.pkgDir, "missing-manifest.codex-theme");
      PackageFixtureGenerator.createMissingManifestPackage(pkgPath);

      const res = await handleImportTheme({ sourceFile: pkgPath }, { stateRoot: ctx.stateRoot });

      assert.equal(res.ok, false);
      assert.equal(res.error.code, "MANIFEST_INVALID");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("4. 同 ID 冲突策略：默认 reject 拒绝 vs 明确 replace 替换并留存备份", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const pkgPath1 = path.join(ctx.pkgDir, "theme-v1.codex-theme");
      const pkgPath2 = path.join(ctx.pkgDir, "theme-v2.codex-theme");

      PackageFixtureGenerator.createValidPackage(pkgPath1, { id: "conflict-theme-id", name: "Version 1" }, { name: "Version 1" });
      PackageFixtureGenerator.createValidPackage(pkgPath2, { id: "conflict-theme-id", name: "Version 2" }, { name: "Version 2" });

      // 1. First import
      const res1 = await handleImportTheme({ sourceFile: pkgPath1 }, { stateRoot: ctx.stateRoot });
      assert.equal(res1.ok, true);

      // 2. Default conflictPolicy = reject
      const resReject = await handleImportTheme(
        { sourceFile: pkgPath2, conflictPolicy: "reject" },
        { stateRoot: ctx.stateRoot }
      );

      assert.equal(resReject.ok, false);
      assert.equal(resReject.error.code, "THEME_ID_CONFLICT");

      // 3. conflictPolicy = replace
      const resReplace = await handleImportTheme(
        { sourceFile: pkgPath2, conflictPolicy: "replace" },
        { stateRoot: ctx.stateRoot }
      );

      assert.equal(resReplace.ok, true);
      assert.equal(resReplace.data.installed, true);
      assert.equal(resReplace.data.replaced, true);

      // Check backups directory created
      const backupsDir = path.join(ctx.stateRoot, "backups");
      assert.ok(fs.existsSync(backupsDir));
      const backupEntries = fs.readdirSync(backupsDir);
      assert.ok(backupEntries.length > 0);

      // Check updated theme name in listThemes
      const listRes = handleListThemes({}, { stateRoot: ctx.stateRoot });
      const matched = listRes.data.themes.find((item) => item.id === "conflict-theme-id");
      assert.equal(matched.name, "Version 2");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("5. 写锁争抢：锁占用时返回 OPERATION_BUSY", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const pkgPath = path.join(ctx.pkgDir, "valid-lock-test.codex-theme");
      PackageFixtureGenerator.createValidPackage(pkgPath, { id: "lock-theme-01" });

      // Pre-acquire lock
      const lockRes = acquireLock({
        stateRoot: ctx.stateRoot,
        operationId: "op_holder_active",
        operation: "applyTheme",
      });
      assert.equal(lockRes.acquired, true);

      // Attempt importTheme
      const importRes = await handleImportTheme({ sourceFile: pkgPath }, { stateRoot: ctx.stateRoot });

      assert.equal(importRes.ok, false);
      assert.equal(importRes.error.code, "OPERATION_BUSY");

      releaseLock({ stateRoot: ctx.stateRoot, operationId: "op_holder_active" });
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });
});
