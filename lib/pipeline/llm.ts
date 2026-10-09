import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RawMaterial, ScoreRun } from "@/lib/contracts/pipeline";
import { promptText } from "./prompt";
import { runHeuristicScores } from "./score";

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

function loadEnvFile(): void {
  const path = resolve(process.cwd(), ".env.local");
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^\r\n]*)\s*$/);
      if (match && !(match[1] in process.env)) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {
    // .env.local 不存在时忽略
  }
}

export function getLlmConfig(): LlmConfig | null {
  loadEnvFile();
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.LLM_BASE_URL || "https://api.deepseek.com/v1").trim(),
    model: (process.env.LLM_MODEL || "deepseek-chat").trim(),
  };
}

async function attentionScore(system: string, user: string, config: LlmConfig): Promise<number | null> {
  try {
    const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        temperature: 1,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content || "";
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    const score = Number((JSON.parse(json) as { attentionScore?: unknown }).attentionScore);
    if (!Number.isFinite(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  } catch {
    return null;
  }
}

const EMPTY_AXES = { significance: 0, novelty: 0, credibility: 0, resonance: 0, actionability: 0 };

export async function scoreMaterialWithLlm(material: RawMaterial): Promise<[ScoreRun, ScoreRun]> {
  const config = getLlmConfig();
  const fallback = runHeuristicScores(material, material.sourceTier || "T2");
  if (!config) return fallback;
  const system = promptText("selection-score", { siteName: "ESG Compass" });
  const user = `标题：${material.title}\n正文：${material.summary || ""}\n${material.body || ""}`;
  const first = await attentionScore(system, user, config);
  const second = await attentionScore(system, user, config);
  if (first === null || second === null) return fallback;
  return [
    { score: first, axes: EMPTY_AXES },
    { score: second, axes: EMPTY_AXES },
  ];
}
