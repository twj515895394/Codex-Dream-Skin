/**
 * Runtime Security Hardening Test Suite (DS-FIX-001)
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/security-and-privacy.md
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/code-review-fix-round/README.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateUserIdentityHash, getProcessStartTime } from "../../core/runtime-api/operation-lock.js";

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

test("Runtime Security Hardening Test Suite (DS-FIX-001)", async (t) => {
  await t.test("1. 静态代码审计：core/runtime-api 下所有代码绝不包含 shell 命令拼接", async () => {
    const apiCoreDir = fileURLToPath(new URL("../../core/runtime-api", import.meta.url));
    const jsFiles = getJsFilesRecursively(apiCoreDir);

    assert.ok(jsFiles.length > 5, "Should scan at least 5 JS core files");

    for (const filePath of jsFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      const relativeName = path.relative(apiCoreDir, filePath);

      // Rule 1: No direct exec( string
      assert.equal(
        /child_process.*exec\(/.test(content),
        false,
        `File ${relativeName} must not use string shell exec()`
      );

      // Rule 2: No shell: true in execFileSync / spawn
      assert.equal(
        /shell\s*:\s*true/.test(content),
        false,
        `File ${relativeName} must not specify shell: true`
      );

      // Rule 3: No Invoke-Expression or eval
      assert.equal(
        /Invoke-Expression/.test(content),
        false,
        `File ${relativeName} must not use Invoke-Expression`
      );
      assert.equal(
        /\beval\s*\(/.test(content),
        false,
        `File ${relativeName} must not use eval()`
      );
    }
  });

  await t.test("2. 脱敏隐私与进程检测安全验证", async () => {
    const hash = generateUserIdentityHash();
    assert.ok(hash.startsWith("sha256:"));
    assert.equal(hash.length, 71); // 'sha256:' (7 chars) + 64 hex chars = 71

    const startTime = getProcessStartTime(process.pid);
    assert.ok(startTime === "alive" || typeof startTime === "string");

    const deadTime = getProcessStartTime(9999999);
    assert.equal(deadTime, null);
  });
});
