# Handoff · Phase 00 macOS-first / Issue 07 Current

Date: 2026-07-19

## Decision baseline

- Architecture remains cross-platform.
- Current implementation, testing and release target is macOS.
- Windows is deferred to a future adaptation phase and does not block Phase 00.
- `Dream Skin.app` is the primary Launcher entry.
- `Dream Skin Studio.app` is the management and authoring UI.
- Both share the no-UI Dream Skin Runtime API.

## Implementation state

Completed with tests:

- Issue 01 importer fixture generator;
- Issue 02 importer regression, 17 scenarios;
- Issue 03 Runtime API Schema/Envelope;
- Issue 04 Reference Runner/Contract Test;
- Issue 05 capabilities/status;
- Issue 06 listThemes.

Current:

- Issue 07 operation lock.

Next:

- Issue 08 transaction journal and crash recovery;
- Issue 09 importTheme, blocked by Issue 08;
- applyTheme/verify/restore;
- managed runtime;
- macOS Launcher and Studio Vertical Slice;
- macOS real-device release acceptance.

## Documents aligned in this update

- `docs/studio/MASTER-PLAN.md`
- `docs/studio/work-register.md`
- `docs/studio/phases/phase-00-foundation-and-shell-spike/README.md`
- `.handoff/phases/phase00/current.md`
- `.handoff/current.md`

## Guardrails

- Do not call Issue 09 complete merely because its issue document exists.
- Do not bypass operation lock or journal for write operations.
- Do not let Launcher, Studio, CLI, SwiftBar or Skill orchestrate shell scripts independently.
- Do not restore Windows work as a current Phase blocker.
- Do not operate on real user state in automated tests.