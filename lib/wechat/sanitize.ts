const SENSITIVE_KEY =
  "(?:access[_-]?token|refresh[_-]?token|app[_-]?secret|client[_-]?secret|" +
  "cron[_-]?secret|callback[_-]?token|callback[_-]?aes[_-]?key|" +
  "api[_-]?key|password|passwd|app[_-]?id|open[_-]?id|union[_-]?id|" +
  "media[_-]?id|publish[_-]?id|article[_-]?id|secret)";

const KEYED_VALUE_PATTERN = new RegExp(
  `((?:["']?)[A-Za-z0-9_.-]*${SENSITIVE_KEY}[A-Za-z0-9_.-]*(?:["']?)\\s*[:=]\\s*)(?:"[^"]*"|'[^']*'|[^\\s,;&}]+)`,
  "gi",
);

const QUERY_VALUE_PATTERN = new RegExp(
  `([?&](?:${SENSITIVE_KEY}|encoding[_-]?aes[_-]?key)=)[^&#\\s]*`,
  "gi",
);

function configuredSensitiveValues(): string[] {
  const values: string[] = [];
  for (const [name, value] of Object.entries(process.env)) {
    if (!value || value.length < 6) continue;
    if (/(?:APP_ID|SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|AES_KEY)$/i.test(name)) {
      values.push(value);
    }
  }
  return values;
}

export function redactSensitiveText(value: unknown, additionalSecrets: string[] = []): string {
  let text =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : String(value);

  const secrets = [...new Set([...configuredSensitiveValues(), ...additionalSecrets])]
    .filter((secret) => secret.length >= 6)
    .sort((left, right) => right.length - left.length);

  for (const secret of secrets) {
    text = text.split(secret).join("[REDACTED]");
  }

  return text
    .replace(/\b(Bearer)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [REDACTED]")
    .replace(QUERY_VALUE_PATTERN, "$1[REDACTED]")
    .replace(KEYED_VALUE_PATTERN, "$1[REDACTED]");
}

export function safeErrorMessage(error: unknown): string {
  return redactSensitiveText(error) || "未知错误";
}
