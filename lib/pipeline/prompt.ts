import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface PromptLoadOptions {
  promptDir?: string;
  siteName?: string;
}

const TOKEN = /\{\{(>\s*)?([A-Za-z][\w.-]*)\s*\}\}/g;

function promptDir(options: PromptLoadOptions = {}): string {
  return options.promptDir ?? resolve(process.cwd(), "prompts");
}

function promptPath(name: string, options: PromptLoadOptions = {}): string {
  return resolve(promptDir(options), `${name}.md`);
}

export function loadPrompt(name: string, options: PromptLoadOptions = {}): string {
  const path = promptPath(name, options);
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`prompt ${name}: cannot read ${path}: ${detail}`);
  }
}

function expandPrompt(
  name: string,
  options: PromptLoadOptions = {},
  seen: string[] = []
): { text: string; used: string[] } {
  if (seen.includes(name)) {
    throw new Error(`prompt include cycle: ${[...seen, name].join(" -> ")}`);
  }

  const used = [name];
  const text = loadPrompt(name, options).replace(
    TOKEN,
    (token, include: string | undefined, key: string) => {
      if (!include) return token;
      const inner = expandPrompt(key, options, [...seen, name]);
      used.push(...inner.used);
      return inner.text;
    }
  );

  return { text, used };
}

export function promptText(
  name: string,
  values: Record<string, string | number> = {},
  options: PromptLoadOptions = {}
): string {
  const expanded = expandPrompt(name, options);
  return renderPrompt(expanded.text, {
    siteName: options.siteName ?? "ESG Compass",
    ...values,
  });
}

export function promptVersion(
  names: string | string[],
  options: PromptLoadOptions = {}
): string {
  const entries = Array.isArray(names) ? names : [names];
  const used = [...new Set(entries.flatMap((name) => expandPrompt(name, options).used))].sort();
  const hash = createHash("sha256");
  for (const name of used) {
    hash.update(`${name}\n${loadPrompt(name, options)}\n`);
  }
  return `${entries.join("+")}@${hash.digest("hex").slice(0, 12)}`;
}

export function promptVersions(
  names: string[],
  options: PromptLoadOptions = {}
): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, promptVersion(name, options)]));
}

export function renderPrompt(template: string, values: Record<string, string | number>): string {
  return template.replace(TOKEN, (_token, include: string | undefined, key: string) => {
    if (include) throw new Error(`prompt include was not expanded: {{> ${key}}}`);
    if (!Object.prototype.hasOwnProperty.call(values, key)) {
      throw new Error(`prompt: no value for {{${key}}}`);
    }
    return String(values[key]);
  });
}
