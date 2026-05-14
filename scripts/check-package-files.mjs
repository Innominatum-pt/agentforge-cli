import { execSync } from "node:child_process";

const forbiddenPatterns = [
  /^src\//,
  /^documents\//,
  /^\.github\//,
  /^AGENTS\.md$/,
  /^agentforge\.json$/,
  /^agentforge\.yml$/,
  /^agentforge\.local\.json$/,
  /^agentforge\.local\.yml$/,
  /^\.env$/,
  /^\.env\./,
  /^tsconfig/,
  /^vitest\.config/,
  /\.test\.ts$/,
];

function isForbidden(filePath) {
  return forbiddenPatterns.some((pattern) => pattern.test(filePath));
}

function main() {
  const output = execSync("npm pack --dry-run --json", { encoding: "utf-8" });
  const packs = JSON.parse(output);
  const pack = Array.isArray(packs) ? packs[0] : packs;
  const files = pack.files || [];

  const forbidden = files.filter((f) => isForbidden(f.path));

  if (forbidden.length > 0) {
    console.error("❌ Forbidden paths found in package:");
    for (const f of forbidden) {
      console.error(`  - ${f.path}`);
    }
    process.exit(1);
  }

  console.log("✅ Package contents look clean.");
}

main();
