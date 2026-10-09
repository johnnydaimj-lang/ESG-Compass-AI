// 连通性自检：确认 .env.local 的 LLM 配置可用，只打印状态不打印 key。

import { getLlmConfig } from "@/lib/pipeline/llm";

async function main() {
  const config = getLlmConfig();
  if (!config) {
    console.log("NO_KEY: .env.local 里没有配置 LLM_API_KEY");
    return;
  }
  console.log(`config: baseUrl=${config.baseUrl} model=${config.model} keyLength=${config.apiKey.length}`);
  const res = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      temperature: 1,
      messages: [{ role: "user", content: '只返回合法 JSON，不要其他内容：{"attentionScore": 42}' }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  console.log(`status: ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  console.log(`content: ${data?.choices?.[0]?.message?.content ?? "(no content)"}`);
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
