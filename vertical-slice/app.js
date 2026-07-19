/**
 * Vertical Slice Frontend Controller & Runtime Integration Bridge
 */

import { handleCapabilities } from "../core/runtime-api/handlers/capabilities-handler.js";
import { handleStatus } from "../core/runtime-api/handlers/status-handler.js";
import { handleListThemes } from "../core/runtime-api/handlers/list-themes-handler.js";
import { handleApplyTheme } from "../core/runtime-api/handlers/apply-theme-handler.js";
import { handleVerify } from "../core/runtime-api/handlers/verify-handler.js";
import { handleRestore } from "../core/runtime-api/handlers/restore-handler.js";

class VerticalSliceApp {
  constructor() {
    this.stateRoot = null;
    this.bindEvents();
    this.init();
  }

  bindEvents() {
    document.getElementById("refresh-status-btn")?.addEventListener("click", () => this.refreshStatus());
    document.getElementById("load-themes-btn")?.addEventListener("click", () => this.loadThemes());
    document.getElementById("btn-verify")?.addEventListener("click", () => this.runVerify());
    document.getElementById("btn-restore")?.addEventListener("click", () => this.runRestore());
    document.getElementById("recover-transaction-btn")?.addEventListener("click", () => this.runRestore("emergency"));
  }

  async init() {
    await this.refreshStatus();
  }

  logOutput(title, data) {
    const consoleElem = document.getElementById("console-output");
    if (!consoleElem) return;
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `// [${timestamp}] ${title}\n` + JSON.stringify(data, null, 2);
    consoleElem.textContent = formatted;
  }

  async refreshStatus() {
    const statusRes = await handleStatus({ includeChecks: true }, { stateRoot: this.stateRoot });
    const capRes = await handleCapabilities({}, { stateRoot: this.stateRoot });

    if (statusRes.ok && statusRes.data) {
      const data = statusRes.data;

      // 1. Runtime Status
      const runtimeState = data.runtime.state || "ready";
      const runtimePass = !data.runtime.recoveryRequired;
      this.updateCardStatus("runtime", runtimePass ? "pass" : "warn", runtimePass ? "就绪 (Ready)" : "需恢复 (Recovery Required)", `受管版本: ${data.runtime.version}`);

      // Recovery Banner
      const banner = document.getElementById("recovery-banner");
      if (banner) {
        if (data.runtime.recoveryRequired) {
          banner.classList.remove("hidden");
        } else {
          banner.classList.add("hidden");
        }
      }

      // 2. Codex App Status
      const codexState = data.codex.state || "running";
      this.updateCardStatus("codex", "pass", "已连接 (Connected)", `版本: ${data.codex.version} | 签名: ${data.codex.identity}`);

      // 3. Skin Status
      const skinActive = data.skin.state === "active";
      const currentThemeName = data.skin.currentTheme ? data.skin.currentTheme.name : "未启动/默认主题";
      this.updateCardStatus("skin", skinActive ? "pass" : "warn", skinActive ? "激活中 (Active)" : "默认/未激活", `当前主题: ${currentThemeName}`);

      this.logOutput("System Status Refresh", { status: data, capabilities: capRes.data });
    }
  }

  updateCardStatus(cardId, statusClass, badgeText, descText) {
    const indicator = document.getElementById(`indicator-${cardId}`);
    const badge = document.getElementById(`badge-${cardId}`);
    const desc = document.getElementById(`desc-${cardId}`);

    if (indicator) {
      indicator.className = `status-indicator ${statusClass}`;
    }
    if (badge) {
      badge.className = `badge ${statusClass}`;
      badge.textContent = badgeText;
    }
    if (desc) {
      desc.textContent = descText;
    }
  }

  async loadThemes() {
    const res = await handleListThemes({}, { stateRoot: this.stateRoot });
    const grid = document.getElementById("themes-grid");
    if (!grid) return;

    if (res.ok && res.data && Array.isArray(res.data.themes)) {
      const themes = res.data.themes;
      if (themes.length === 0) {
        grid.innerHTML = '<div class="empty-state">本地主题库无记录，可导入 .codex-theme 包。</div>';
        return;
      }

      grid.innerHTML = "";
      themes.forEach((theme) => {
        const item = document.createElement("div");
        item.className = `theme-item ${theme.isCurrent ? "active" : ""}`;
        item.tabIndex = 0; // Accessibility keyboard focusable
        item.innerHTML = `
          <div class="theme-name">${theme.name || theme.id}</div>
          <div class="theme-meta">ID: ${theme.id} | 来源: ${theme.source}</div>
          <button class="btn btn-primary apply-btn" data-id="${theme.id}">
            ${theme.isCurrent ? "✓ 已激活" : "应用主题 (Apply)"}
          </button>
        `;

        item.querySelector(".apply-btn")?.addEventListener("click", (e) => {
          e.stopPropagation();
          this.applyTheme(theme.id);
        });

        grid.appendChild(item);
      });

      this.logOutput("List Themes Result", res.data);
    }
  }

  async applyTheme(themeId) {
    const res = await handleApplyTheme({ themeId }, { stateRoot: this.stateRoot });
    this.logOutput(`Apply Theme '${themeId}'`, res);
    await this.refreshStatus();
    await this.loadThemes();
  }

  async runVerify() {
    const res = await handleVerify({ scope: "full" }, { stateRoot: this.stateRoot });
    this.logOutput("Deep System Verification (verify)", res);
  }

  async runRestore(mode = "normal") {
    const res = await handleRestore({ mode }, { stateRoot: this.stateRoot });
    this.logOutput(`System Restore (mode: ${mode})`, res);
    await this.refreshStatus();
    await this.loadThemes();
  }
}

// Global initialization
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    window.app = new VerticalSliceApp();
  });
}
