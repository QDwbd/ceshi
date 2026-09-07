import { spawnSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { TAURI_APP_DIR } from "./utils/env";
import { consola } from "./utils/logger";

/**
 * macOS release build (one target triple per invocation).
 *
 * Set MACOS_TARGET to the desired Rust target triple, e.g.:
 *   - x86_64-apple-darwin  -> Intel (x64)
 *   - aarch64-apple-darwin -> Apple Silicon (arm64)
 * Defaults to the host triple (useful when run natively on a Mac).
 *
 * Tauri v1's compile-time codegen reads the *active* `tauri.conf.json`
 * (the file next to the crate), not necessarily the CLI `--config` override.
 * To keep codegen, runtime and bundler consistent we temporarily swap the
 * macOS config into `backend/tauri/tauri.conf.json`, build, then restore the
 * original file (mirroring how `prepare-release.ts` bakes a final config).
 *
 * The produced `.dmg` is copied to `backend/target/macos-release/` with a
 * deterministic, architecture-suffixed name so a single release-upload step
 * can attach both architectures without name collisions.
 */
function defaultTarget(): string {
  const host = execSyncRustcHost();
  // if rustc is unavailable, fall back to the current host's darwin triple
  if (host) return host;
  return os.arch() === "arm64"
    ? "aarch64-apple-darwin"
    : "x86_64-apple-darwin";
}

function execSyncRustcHost(): string | null {
  try {
    const out = spawnSync("rustc", ["-vV"], { encoding: "utf8" });
    if (out.error || out.status !== 0 || !out.stdout) return null;
    return out.stdout.match(/(?<=host: ).+(?=\s*)/g)?.[0] ?? null;
  } catch {
    return null;
  }
}

function archSuffix(target: string): string {
  return target.startsWith("aarch64") ? "arm64" : "x64";
}

async function main() {
  const target = process.env.MACOS_TARGET || defaultTarget();

  const baseConf = path.join(TAURI_APP_DIR, "tauri.conf.json");
  const macosConf = path.join(TAURI_APP_DIR, "tauri.macos.conf.json");

  const original = await fs.readFile(baseConf, "utf-8");
  const macos = await fs.readFile(macosConf, "utf-8");

  let status: number | null = null;
  try {
    consola.debug("Switching active config to macOS profile...");
    await fs.writeFile(baseConf, macos, "utf-8");

    consola.start(`Building macOS application (target ${target})...`);
    const result = spawnSync(
      "tauri",
      ["build", "--target", target, "-c", baseConf],
      { stdio: "inherit", shell: process.platform === "win32" },
    );

    status = result.status;
    if (result.error) throw result.error;

    if (status === 0) {
      // Locate and stage the produced dmg under a deterministic name.
      const dmgDir = path.join(
        TAURI_APP_DIR,
        "..",
        "..",
        "backend",
        "target",
        target,
        "release",
        "bundle",
        "dmg",
      );
      const outDir = path.join(TAURI_APP_DIR, "..", "..", "backend", "target", "macos-release");
      await fs.mkdirp(outDir);

      let entries: string[] = [];
      try {
        entries = await fs.readdir(dmgDir);
      } catch {
        entries = [];
      }
      const dmg = entries.find((f) => f.endsWith(".dmg"));
      if (!dmg) {
        consola.warn(`No .dmg found under ${dmgDir}`);
      } else {
        const dest = path.join(outDir, `lucky-macos-${archSuffix(target)}.dmg`);
        await fs.copy(path.join(dmgDir, dmg), dest, { overwrite: true });
        consola.success(`Staged ${dest}`);
      }
    }
  } finally {
    consola.debug("Restoring original config...");
    await fs.writeFile(baseConf, original, "utf-8");
  }

  if (status !== 0) {
    process.exit(status ?? 1);
  }
}

main();

