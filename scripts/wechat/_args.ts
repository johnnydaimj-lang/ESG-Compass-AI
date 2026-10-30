import { redactSensitiveText } from "../../lib/wechat/sanitize";

export function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

export function requireIssueKey(): string {
  const issue = readArg("issue") || process.env.WECHAT_ISSUE_KEY;
  if (!issue) {
    throw new Error("缺少 --issue=YYYY-wNN，例如 --issue=2026-w43");
  }
  return issue;
}

export function printJson(value: unknown): void {
  console.log(redactSensitiveText(JSON.stringify(value, null, 2)));
}

export function printError(error: unknown): void {
  console.error(redactSensitiveText(error));
}
