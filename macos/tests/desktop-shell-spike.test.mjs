/**
 * Desktop Shell Spike & ADR-0004 Verification Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/adr/0004-desktop-shell-selection.md
 * - .scratch/phase-00-foundation/issues/14-desktop-shell-spike-adr.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runSpikeEvaluation, CANDIDATES_SCORECARD } from "../../spikes/desktop-shell-spike/runner.mjs";
import { simulateTauriSidecarIPC } from "../../spikes/desktop-shell-spike/tauri2-demo/sidecar.mjs";
import { simulateElectronMainIPC } from "../../spikes/desktop-shell-spike/electron-demo/main.mjs";
import { simulateNativeHostPipe } from "../../spikes/desktop-shell-spike/native-demo/host.mjs";

test("Desktop Shell Spike & ADR-0004 Test Suite", async (t) => {
  await t.test("1. Scorecard 评分矩阵验证：Tauri 2 获最高分且无硬淘汰项", async () => {
    assert.ok(CANDIDATES_SCORECARD.tauri2);
    assert.ok(CANDIDATES_SCORECARD.electron);
    assert.ok(CANDIDATES_SCORECARD.native);

    assert.equal(CANDIDATES_SCORECARD.tauri2.disqualification, false);
    assert.ok(CANDIDATES_SCORECARD.tauri2.score > CANDIDATES_SCORECARD.electron.score);
    assert.ok(CANDIDATES_SCORECARD.tauri2.score > CANDIDATES_SCORECARD.native.score);
    assert.equal(CANDIDATES_SCORECARD.tauri2.score, 92);
  });

  await t.test("2. 三候选 Spike Demo 成功通过 stdio IPC 调用 Runtime Host capabilities", async () => {
    // Runner evaluation
    const evalRes = await runSpikeEvaluation("tauri2");
    assert.equal(evalRes.ipcValid, true);
    assert.ok(evalRes.capabilities.supportedApiVersions.includes(1));

    // Tauri 2 sidecar IPC demo
    const tauriRaw = await simulateTauriSidecarIPC(JSON.stringify({ operation: "capabilities" }));
    const tauriParsed = JSON.parse(tauriRaw);
    assert.equal(tauriParsed.ok, true);
    assert.ok(tauriParsed.data.operations.capabilities.supported);

    // Electron IPC demo
    const electronRes = await simulateElectronMainIPC({ operation: "capabilities" });
    assert.equal(electronRes.ok, true);

    // Native Pipe demo
    const nativeRaw = await simulateNativeHostPipe();
    const nativeParsed = JSON.parse(nativeRaw);
    assert.equal(nativeParsed.ok, true);
  });

  await t.test("3. ADR-0004 决策文件状态已置为 Accepted", async () => {
    const adrPath = fileURLToPath(new URL("../../docs/studio/phases/phase-00-foundation-and-shell-spike/adr/0004-desktop-shell-selection.md", import.meta.url));
    const content = fs.readFileSync(adrPath, "utf8");

    assert.ok(content.includes("- 状态：Accepted"));
    assert.ok(content.includes("Tauri 2 + React/TypeScript"));
  });
});
