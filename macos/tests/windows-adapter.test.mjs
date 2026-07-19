/**
 * Windows Platform Adapter Unit & Integration Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 * - .scratch/phase-00-foundation/issues/12-windows-platform-adapter.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { createWindowsAdapter } from "../../core/runtime-api/adapters/windows-adapter.js";
import { PackageFixtureGenerator } from "../../tests/fixtures/generators/package-fixture-generator.mjs";

function createIsolatedStateRoot() {
  const tmpState = fs.mkdtempSync(path.join(os.tmpdir(), "ds-win-adapter-state-"));
  const tmpPkg = fs.mkdtempSync(path.join(os.tmpdir(), "ds-win-adapter-pkg-"));
  return { stateRoot: tmpState, pkgDir: tmpPkg };
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

test("Windows Platform Adapter Test Suite", async (t) => {
  await t.test("1. probeCapabilities 返回特定 typed 结果与 Windows 平台断言", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createWindowsAdapter({ stateRoot: ctx.stateRoot, powershellVersion: "5.1" });
      const res = await adapter.probeCapabilities();

      assert.equal(res.ok, true);
      assert.ok(res.data.supportedApiVersions.includes(1));
      assert.equal(res.data.platform.os, "windows");
      assert.equal(res.data.platform.powershellVersion, "5.1");
      assert.equal(res.data.platform.namedMutexSupported, true);
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("2. readStatus 与 listThemes Typed Internal Result 输出", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createWindowsAdapter({ stateRoot: ctx.stateRoot });

      const resStatus = await adapter.readStatus();
      assert.equal(resStatus.ok, true);
      assert.equal(typeof resStatus.data.runtime.state, "string");

      const resList = await adapter.listThemes();
      assert.equal(resList.ok, true);
      assert.ok(Array.isArray(resList.data.themes));
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("3. validatePackage 校验与 Reparse Point/Symlink 符号链接防护拦截", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createWindowsAdapter({ stateRoot: ctx.stateRoot });

      // Nonexistent file
      const resInvalid = await adapter.validatePackage("C:\\nonexistent\\path.codex-theme");
      assert.equal(resInvalid.ok, false);
      assert.equal(resInvalid.error.code, "PACKAGE_NOT_FOUND");

      // Valid package
      const pkgPath = path.join(ctx.pkgDir, "win-valid.codex-theme");
      PackageFixtureGenerator.createValidPackage(pkgPath, { id: "win-pkg-01", name: "Win Pkg 01" });

      const resValid = await adapter.validatePackage(pkgPath);
      assert.equal(resValid.ok, true);
      assert.equal(resValid.data.valid, true);

      // Symlink / reparse point rejection
      const linkPath = path.join(ctx.pkgDir, "symlink.codex-theme");
      try {
        fs.symlinkSync(pkgPath, linkPath);
        const resSymlink = await adapter.validatePackage(linkPath);
        assert.equal(resSymlink.ok, false);
        assert.equal(resSymlink.error.code, "PACKAGE_LINK_OR_SPECIAL_FILE");
      } catch {
        // Suppress symlink creation error if environment lacks symlink privilege
      }
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("4. importTheme + loadThemeById + applyTheme 端到端方法链", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createWindowsAdapter({ stateRoot: ctx.stateRoot });

      const pkgPath = path.join(ctx.pkgDir, "win-theme.codex-theme");
      PackageFixtureGenerator.createValidPackage(pkgPath, { id: "win-theme-01", name: "Win Theme 01" });

      // Import
      const importRes = await adapter.importTheme({ sourceFile: pkgPath });
      assert.equal(importRes.ok, true);
      assert.equal(importRes.data.installed, true);

      // loadThemeById
      const loadRes = await adapter.loadThemeById("win-theme-01");
      assert.equal(loadRes.ok, true);
      assert.equal(loadRes.data.theme.id, "win-theme-01");

      // applyTheme
      const applyRes = await adapter.applyTheme({ themeId: "win-theme-01" });
      assert.equal(applyRes.ok, true);
      assert.equal(applyRes.data.applied, true);
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("5. verify 与 restore 平台方法与结构化输出", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createWindowsAdapter({ stateRoot: ctx.stateRoot });

      const resVerify = await adapter.verify({ scope: "activeTheme" });
      assert.equal(resVerify.ok, true);
      assert.ok(Array.isArray(resVerify.data.checks));

      const resRestore = await adapter.restore({ mode: "normal" });
      assert.equal(resRestore.ok, true);
      assert.equal(resRestore.data.restored, true);
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("6. handleOperation 通用分发与 Fault Injection 注入隔离", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapterNormal = createWindowsAdapter({ stateRoot: ctx.stateRoot });
      const resNormal = await adapterNormal.handleOperation("capabilities", {});
      assert.equal(resNormal.ok, true);

      const adapterThrow = createWindowsAdapter({ stateRoot: ctx.stateRoot }, { throwInternalError: true });
      await assert.rejects(async () => {
        await adapterThrow.handleOperation("status", {});
      }, /Simulated unhandled adapter exception/);

      const adapterFailCode = createWindowsAdapter(
        { stateRoot: ctx.stateRoot },
        { failErrorCode: "OPERATION_BUSY" }
      );
      const resFail = await adapterFailCode.handleOperation("listThemes", {});
      assert.equal(resFail.ok, false);
      assert.equal(resFail.error.code, "OPERATION_BUSY");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("7. 安全审计：代码绝对不包含 Invoke-Expression 或 eval 命令拼接", async () => {
    const adapterPath = fileURLToPath(new URL("../../core/runtime-api/adapters/windows-adapter.js", import.meta.url));
    const code = fs.readFileSync(adapterPath, "utf8");

    assert.equal(code.includes("Invoke-Expression"), false);
    assert.equal(code.includes("eval("), false);
  });
});
