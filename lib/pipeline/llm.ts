import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RawMaterial, ScoreRun } from "@/lib/contracts/pipeline";
import { promptText } from "./prompt";
import { runHeuristicScores } from "./score";
import { hasEditorialFirstPerson } from "./summary-quality";

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

export interface RecommendationReasonInput {
  id: string;
  title: string;
  summary: string;
  score: number;
  contentType: string;
  region: string;
  sourceName: string;
  fact?: unknown;
}

export async function generateRecommendReasonsWithLlm(
  items: RecommendationReasonInput[],
): Promise<Map<string, string>> {
  const output = new Map<string, string>();
  const config = getLlmConfig();
  if (!config || items.length === 0) return output;
  const llmConfig = config;
  const system = promptText("recommend-reason", { siteName: "ESG Compass" });
  const batches: RecommendationReasonInput[][] = [];
  for (let index = 0; index < items.length; index += 12) {
    batches.push(items.slice(index, index + 12));
  }
  let cursor = 0;
  async function worker() {
    while (cursor < batches.length) {
      const batch = batches[cursor++];
      try {
        const res = await fetch(`${llmConfig.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmConfig.apiKey}` },
          body: JSON.stringify({
            model: llmConfig.model,
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: JSON.stringify({ items: batch }) },
            ],
          }),
          signal: AbortSignal.timeout(120_000),
        });
        if (!res.ok) continue;
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const text = data.choices?.[0]?.message?.content || "";
        const json = text.match(/\{[\s\S]*\}/)?.[0];
        if (!json) continue;
        const parsed = JSON.parse(json) as { items?: Array<{ id?: unknown; reason?: unknown }> };
        for (const entry of parsed.items || []) {
          const id = String(entry.id || "");
          const reason = String(entry.reason || "").trim().replace(/\s+/g, " ");
          if (
            id
            && reason.length >= 20
            && reason.length <= 140
            && /[\u3400-\u9fff]/.test(reason)
            && !hasEditorialFirstPerson(reason)
            && !/综合评分|评分较高|推荐理由|本文|这篇文章/.test(reason)
          ) {
            output.set(id, reason);
          }
        }
      } catch {
        // 单批失败不阻断流水线，调用方会使用确定性理由兜底。
      }
    }
  }
  await Promise.all([worker(), worker()]);
  return output;
}
