export interface JsonCompletionOptions {
  system: string;
  user: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  signal?: AbortSignal;
}

export async function completeJson<T>(options: JsonCompletionOptions): Promise<T> {
  const response = await fetch(`${options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      temperature: options.temperature ?? 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
    }),
    signal: options.signal,
  });
  if (!response.ok) {
    throw new Error(`模型调用失败：HTTP ${response.status}`);
  }
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型未返回 JSON 内容");
  return JSON.parse(content) as T;
}
