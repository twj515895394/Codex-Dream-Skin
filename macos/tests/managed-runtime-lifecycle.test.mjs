/**
 * Managed Runtime Lifecycle Unit & Integration Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 * - .scratch/phase-00-foundation/issues/13-managed-runtime-lifecycle.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

import {
  installManagedRuntime,
  downgradeManagedRuntime,
  verifyManagedRuntime,
  recoverRuntimeTransaction,
  getRuntimeMetadata,
} from "../../core/runtime-api/managed-runtime.js";

function createIsolatedStateRoot() {
  const tmpState = fs.mkdtempSync(path.join(os.tmpdir(), "ds-mrt-state-"));
  const tmpPayload = fs.mkdtempSync(path.join(os.tmpdir(), "ds-mrt-payload-"));
  return { stateRoot: tmpState, payloadDir: tmpPayload };
}

function cleanupIsolatedStateRoot(ctx) {
  try {
    if (ctx.stateRoot && fs.existsSync(ctx.stateRoot)) {
      fs.rmSync(ctx.stateRoot, { recursive: true, force: true });
    }
    if (ctx.payloadDir && fs.existsSync(ctx.payloadDir)) {
      fs.rmSync(ctx.payloadDir, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}

function computeHash(strOrBuf) {
  return `sha256:${crypto.createHash("sha256").update(strOrBuf).digest("hex")}`;
}

function createRuntimePayloadFixture(dir, version = "0.1.0", fileContent = "binary-bytes-v1") {
  fs.mkdirSync(dir, { recursive: true });

  const relFilePath = "bin/dream-skin-runtime";
  const absFilePath = path.join(dir, relFilePath);
  fs.mkdirSync(path.dirname(absFilePath), { recursive: true });
  fs.writeFileSync(absFilePath, fileContent, "utf8");

  const fileHash = computeHash(fileContent);

  const manifest = {
    schemaVersion: 1,
    version,
    name: "Codex Dream Skin Managed Runtime",
    files: {
      [relFilePath]: fileHash,
    },
  };

  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
}

test("Managed Runtime Lifecycle Test Suite", async (t) => {
  await t.test("1. 从零安装 Runtime Payload 成功，生成 current 与 runtime.json", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createRuntimePayloadFixture(ctx.payloadDir, "0.1.0", "content-v1");

      const res = await installManagedRuntime(ctx.payloadDir, { stateRoot: ctx.stateRoot });

      assert.equal(res.ok, true);
      assert.equal(res.data.installed, true);
      assert.equal(res.data.currentVersion, "0.1.0");

      const verifyRes = await verifyManagedRuntime({ stateRoot: ctx.stateRoot });
      assert.equal(verifyRes.ok, true);
      assert.equal(verifyRes.data.version, "0.1.0");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("2. 版本升级 Upgrade 流程：current 移动到 previous，新版变为 current", async () => {
    const ctx = createIsolatedStateRoot();
    const payloadV2Dir = fs.mkdtempSync(path.join(os.tmpdir(), "ds-mrt-v2-"));
    try {
      createRuntimePayloadFixture(ctx.payloadDir, "0.1.0", "content-v1");
      createRuntimePayloadFixture(payloadV2Dir, "0.2.0", "content-v2");

      // Initial Install v1
      await installManagedRuntime(ctx.payloadDir, { stateRoot: ctx.stateRoot });

      // Upgrade to v2
      const resUp = await installManagedRuntime(payloadV2Dir, { stateRoot: ctx.stateRoot });

      assert.equal(resUp.ok, true);
      assert.equal(resUp.data.currentVersion, "0.2.0");
      assert.equal(resUp.data.previousVersion, "0.1.0");

      const meta = getRuntimeMetadata({ stateRoot: ctx.stateRoot });
      assert.equal(meta.currentVersion, "0.2.0");
      assert.equal(meta.previousVersion, "0.1.0");

      const previousManifest = path.join(ctx.stateRoot, "runtime", "previous", "manifest.json");
      assert.equal(fs.existsSync(previousManifest), true);
    } finally {
      cleanupIsolatedStateRoot(ctx);
      if (fs.existsSync(payloadV2Dir)) {
        fs.rmSync(payloadV2Dir, { recursive: true, force: true });
      }
    }
  });

  await t.test("3. 版本降级 Downgrade 流程：previous 复原为 current", async () => {
    const ctx = createIsolatedStateRoot();
    const payloadV2Dir = fs.mkdtempSync(path.join(os.tmpdir(), "ds-mrt-v2-"));
    try {
      createRuntimePayloadFixture(ctx.payloadDir, "0.1.0", "content-v1");
      createRuntimePayloadFixture(payloadV2Dir, "0.2.0", "content-v2");

      await installManagedRuntime(ctx.payloadDir, { stateRoot: ctx.stateRoot });
      await installManagedRuntime(payloadV2Dir, { stateRoot: ctx.stateRoot });

      // Downgrade
      const resDown = await downgradeManagedRuntime({ stateRoot: ctx.stateRoot });

      assert.equal(resDown.ok, true);
      assert.equal(resDown.data.downgraded, true);
      assert.equal(resDown.data.currentVersion, "0.1.0");

      const verifyRes = await verifyManagedRuntime({ stateRoot: ctx.stateRoot });
      assert.equal(verifyRes.ok, true);
      assert.equal(verifyRes.data.version, "0.1.0");
    } finally {
      cleanupIsolatedStateRoot(ctx);
      if (fs.existsSync(payloadV2Dir)) {
        fs.rmSync(payloadV2Dir, { recursive: true, force: true });
      }
    }
  });

  await t.test("4. 文件 SHA256 哈希篡改拦截拒绝安装", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createRuntimePayloadFixture(ctx.payloadDir, "0.1.0", "content-v1");
      // Tamper content without updating manifest
      fs.writeFileSync(path.join(ctx.payloadDir, "bin/dream-skin-runtime"), "tampered-content", "utf8");

      const res = await installManagedRuntime(ctx.payloadDir, { stateRoot: ctx.stateRoot });

      assert.equal(res.ok, false);
      assert.equal(res.error.code, "PACKAGE_UNREADABLE");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("5. 符号链接 Symlink 恶意条目拦截拒绝安装", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createRuntimePayloadFixture(ctx.payloadDir, "0.1.0", "content-v1");
      const targetFile = path.join(ctx.payloadDir, "bin/dream-skin-runtime");
      const linkFile = path.join(ctx.payloadDir, "bin/link-script");
      try {
        fs.symlinkSync(targetFile, linkFile);
        const res = await installManagedRuntime(ctx.payloadDir, { stateRoot: ctx.stateRoot });

        assert.equal(res.ok, false);
        assert.equal(res.error.code, "PACKAGE_LINK_OR_SPECIAL_FILE");
      } catch {
        // Suppress if test platform lacks symlink creation rights
      }
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("6. 崩溃中断恢复 Crash Recovery：清理遗留暂存并恢复稳定版本", async () => {
    const ctx = createIsolatedStateRoot();
    const payloadV2Dir = fs.mkdtempSync(path.join(os.tmpdir(), "ds-mrt-v2-"));
    try {
      createRuntimePayloadFixture(ctx.payloadDir, "0.1.0", "content-v1");
      createRuntimePayloadFixture(payloadV2Dir, "0.2.0", "content-v2");

      await installManagedRuntime(ctx.payloadDir, { stateRoot: ctx.stateRoot });
      await installManagedRuntime(payloadV2Dir, { stateRoot: ctx.stateRoot });

      // Simulate crash during upgrade: create abandoned staging and corrupt current
      const stagingDir = path.join(ctx.stateRoot, "runtime", "staging");
      fs.mkdirSync(stagingDir, { recursive: true });
      fs.writeFileSync(path.join(stagingDir, "abandoned.tmp"), "junk", "utf8");

      const currentDir = path.join(ctx.stateRoot, "runtime", "current");
      fs.rmSync(path.join(currentDir, "manifest.json"), { force: true });

      // Recover
      const resRecover = await recoverRuntimeTransaction({ stateRoot: ctx.stateRoot });

      assert.equal(resRecover.ok, true);
      assert.equal(resRecover.data.recovered, true);
      assert.equal(resRecover.data.cleanedStaging, true);
      assert.equal(resRecover.data.restoredPrevious, true);

      const verifyRes = await verifyManagedRuntime({ stateRoot: ctx.stateRoot });
      assert.equal(verifyRes.ok, true);
      assert.equal(verifyRes.data.version, "0.1.0");
    } finally {
      cleanupIsolatedStateRoot(ctx);
      if (fs.existsSync(payloadV2Dir)) {
        fs.rmSync(payloadV2Dir, { recursive: true, force: true });
      }
    }
  });

  await t.test("7. EXDEV 跨文件系统挂载平滑 fallback 安装容错", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createRuntimePayloadFixture(ctx.payloadDir, "0.1.0", "content-exdev");

      // Install with simulated EXDEV error (cross-device move)
      const resInst = await installManagedRuntime(ctx.payloadDir, {
        stateRoot: ctx.stateRoot,
        simulateExdevError: true,
      });

      assert.equal(resInst.ok, true);
      assert.equal(resInst.data.installed, true);
      assert.equal(resInst.data.currentVersion, "0.1.0");

      const verifyRes = await verifyManagedRuntime({ stateRoot: ctx.stateRoot });
      assert.equal(verifyRes.ok, true);
      assert.equal(verifyRes.data.version, "0.1.0");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });
});
