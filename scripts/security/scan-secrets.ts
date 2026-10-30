import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const sensitiveNamePattern = /(?:APP_ID|SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|AES_KEY)$/i;
const runtimeExtensions = new Set([".log", ".json", ".txt", ".md", ".out", ".err"]);
const genericCredentialPattern =
  /(?:app[_-]?secret|client[_-]?secret|cron[_-]?secret|callback[_-]?token|access[_-]?token|password|passwd|api[_-]?key)\s*[:=]\s*["']([A-Za-z0-9_./+=-]{16,})["']/i;
const genericAppIdPattern = /\bwx[0-9a-f]{16}\b/i;

interface SensitiveValue {
  name: string;
  value: string;
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function readLocalSensitiveValues(): SensitiveValue[] {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return [];
  const values: SensitiveValue[] = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || !sensitiveNamePattern.test(match[1])) continue;
    const value = match[2].replace(/^["']|["']$/g, "").trim();
    if (value.length >= 6) values.push({ name: match[1], value });
  }
  return values;
}

function localSensitiveValues(): SensitiveValue[] {
  const local = readLocalSensitiveValues();
  const seen = new Set(local.map((item) => item.value));
  for (const [name, value] of Object.entries(process.env)) {
    if (!value || value.length < 6 || !sensitiveNamePattern.test(name) || seen.has(value)) continue;
    local.push({ name, value });
    seen.add(value);
  }
  return local;
}

function isScannable(path: string): boolean {
  try {
    if (!statSync(path).isFile() || statSync(path).size > 2 * 1024 * 1024) return false;
    return !readFileSync(path).subarray(0, 8000).includes(0);
  } catch {
    return false;
  }
}

function filesUnder(path: string): string[] {
  if (!existsSync(path)) return [];
  const result: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) result.push(...filesUnder(child));
    else if (entry.isFile()) result.push(child);
  }
  return result;
}

function containsSensitiveValue(path: string, values: SensitiveValue[]): boolean {
  if (!isScannable(path)) return false;
  const content = readFileSync(path, "utf8");
  return values.some((item) => content.includes(item.value));
}

function genericFinding(path: string): boolean {
  if (!isScannable(path)) return false;
  const relativePath = relative(root, path).replaceAll("\\", "/");
  if (
    relativePath === ".env.example" ||
    relativePath.startsWith("tests/") ||
    relativePath.startsWith("docs/") ||
    relativePath === "scripts/security/scan-secrets.ts"
  ) {
    return false;
  }
  const content = readFileSync(path, "utf8");
  return genericCredentialPattern.test(content) || genericAppIdPattern.test(content);
}

function safeRelative(path: string): string {
  return relative(root, path).replaceAll("\\", "/");
}

const trackedFiles = git(["ls-files", "-z"])
  .split("\0")
  .filter(Boolean)
  .map((path) => resolve(root, path));
const untrackedFiles = git(["ls-files", "--others", "--exclude-standard", "-z"])
  .split("\0")
  .filter(Boolean)
  .map((path) => resolve(root, path));
const runtimeRoots = [
  resolve(root, "data", "wechat", "logs"),
  resolve(root, ".codex-artifacts"),
];
const runtimeFiles = runtimeRoots.flatMap(filesUnder);
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && [".log", ".out", ".err"].includes(extname(entry.name))) {
    runtimeFiles.push(resolve(root, entry.name));
  }
}

const values = localSensitiveValues();
const trackedLeaks = trackedFiles.filter((path) => containsSensitiveValue(path, values));
const runtimeLeaks = runtimeFiles.filter((path) => containsSensitiveValue(path, values));
const untrackedLeaks = untrackedFiles.filter((path) => containsSensitiveValue(path, values));
const genericFindings = [...new Set([...trackedFiles, ...untrackedFiles, ...runtimeFiles])].filter(
  genericFinding,
);

const ignoredPaths = [
  ".env.local",
  "data/.admin-session-secret",
  "data/wechat/state/access-token.json",
];
const ignoredChecks = ignoredPaths.map((path) => {
  const ignored = spawnSync("git", ["check-ignore", "-q", "--", path], {
    cwd: root,
    stdio: "ignore",
  }).status === 0;
  return { path, ignored };
});

const trackedSensitiveFiles = git(["ls-files", "-z"])
  .split("\0")
  .filter(
    (path) =>
      path !== ".env.example" &&
      (/(^|\/)\.env(?:\.|$)/.test(path) ||
        basename(path) === ".admin-session-secret" ||
        path.endsWith("/access-token.json")),
  );

const checks = {
  localSensitiveValuesLoaded: values.length,
  trackedFilesScanned: trackedFiles.length,
  untrackedFilesScanned: untrackedFiles.length,
  runtimeFilesScanned: [...new Set(runtimeFiles)].length,
  configuredSecretsInTrackedFiles: trackedLeaks.length,
  configuredSecretsInUntrackedFiles: untrackedLeaks.length,
  configuredSecretsInRuntimeFiles: runtimeLeaks.length,
  genericCredentialIndicators: genericFindings.length,
  trackedSensitiveFiles: trackedSensitiveFiles.length,
  requiredIgnoredPaths: ignoredChecks,
};
const ok =
  trackedLeaks.length === 0 &&
  untrackedLeaks.length === 0 &&
  runtimeLeaks.length === 0 &&
  genericFindings.length === 0 &&
  trackedSensitiveFiles.length === 0 &&
  ignoredChecks.every((item) => item.ignored);

console.log(
  JSON.stringify(
    {
      ok,
      affectedFiles: [
        ...new Set([...trackedLeaks, ...untrackedLeaks, ...runtimeLeaks, ...genericFindings]),
      ].map(safeRelative),
      checks,
    },
    null,
    2,
  ),
);

if (!ok) process.exitCode = 1;
