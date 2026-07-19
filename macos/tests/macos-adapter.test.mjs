/**
 * macOS Platform Adapter Unit & Integration Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 * - .scratch/phase-00-foundation/issues/11-macos-platform-adapter.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { fileURLToPath } from "node:url";

import { createMacosAdapter } from "../../core/runtime-api/adapters/macos-adapter.js";
import { PackageFixtureGenerator } from "../../tests/fixtures/generators/package-fixture-generator.mjs";

function createIsolatedStateRoot() {
  const tmpState = fs.mkdtempSync(path.join(os.tmpdir(), "ds-mac-adapter-state-"));
  const tmpPkg = fs.mkdtempSync(path.join(os.tmpdir(), "ds-mac-adapter-pkg-"));
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

test("macOS Platform Adapter Test Suite", async (t) => {
  await t.test("1. probeCapabilities 返回特定 typed 结果与平台诊断", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createMacosAdapter({ stateRoot: ctx.stateRoot, skipCodesign: true });
      const res = await adapter.probeCapabilities();

      assert.equal(res.ok, true);
      assert.ok(res.data.supportedApiVersions.includes(1));
      assert.equal(res.data.platform.os, "darwin");
      assert.equal(typeof res.data.platform.codesignValid, "boolean");
      assert.equal(typeof res.data.platform.bundledNodeAvailable, "boolean");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("2. readStatus 与 listThemes Typed Internal Result 输出", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createMacosAdapter({ stateRoot: ctx.stateRoot });

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

  await t.test("3. validatePackage 校验非法包与有效包", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createMacosAdapter({ stateRoot: ctx.stateRoot });

      // Nonexistent file
      const resInvalid = await adapter.validatePackage("/tmp/nonexistent-file.codex-theme");
      assert.equal(resInvalid.ok, false);
      assert.equal(resInvalid.error.code, "PACKAGE_NOT_FOUND");

      // Valid package
      const pkgPath = path.join(ctx.pkgDir, "valid.codex-theme");
      PackageFixtureGenerator.createValidPackage(pkgPath, { id: "pkg-01", name: "Pkg 01" });

      const resValid = await adapter.validatePackage(pkgPath);
      assert.equal(resValid.ok, true);
      assert.equal(resValid.data.valid, true);
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("4. importTheme + loadThemeById + applyTheme 端到端方法链", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createMacosAdapter({ stateRoot: ctx.stateRoot });

      const pkgPath = path.join(ctx.pkgDir, "mac-theme.codex-theme");
      PackageFixtureGenerator.createValidPackage(pkgPath, { id: "mac-theme-01", name: "Mac Theme 01" });

      // Import
      const importRes = await adapter.importTheme({ sourceFile: pkgPath });
      assert.equal(importRes.ok, true);
      assert.equal(importRes.data.installed, true);

      // loadThemeById
      const loadRes = await adapter.loadThemeById("mac-theme-01");
      assert.equal(loadRes.ok, true);
      assert.equal(loadRes.data.theme.id, "mac-theme-01");

      // applyTheme
      const applyRes = await adapter.applyTheme({ themeId: "mac-theme-01" });
      assert.equal(applyRes.ok, true);
      assert.equal(applyRes.data.applied, true);
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("5. verify 与 restore 平台方法与结构化输出", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const adapter = createMacosAdapter({ stateRoot: ctx.stateRoot });

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
      // Normal operation route
      const adapterNormal = createMacosAdapter({ stateRoot: ctx.stateRoot, skipCodesign: true });
      const resNormal = await adapterNormal.handleOperation("capabilities", {});
      assert.equal(resNormal.ok, true);

      // Fault injection: throw internal error
      const adapterThrow = createMacosAdapter({ stateRoot: ctx.stateRoot }, { throwInternalError: true });
      await assert.rejects(async () => {
        await adapterThrow.handleOperation("status", {});
      }, /Simulated unhandled adapter exception/);

      // Fault injection: specific fail code
      const adapterFailCode = createMacosAdapter(
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

  await t.test("7. 安全审计：代码绝对不包含 bash -c 或 eval 命令拼接", async () => {
    const adapterPath = fileURLToPath(new URL("../../core/runtime-api/adapters/macos-adapter.js", import.meta.url));
    const code = fs.readFileSync(adapterPath, "utf8");

    assert.equal(code.includes("bash -c"), false);
    assert.equal(code.includes("eval("), false);
  });
});
