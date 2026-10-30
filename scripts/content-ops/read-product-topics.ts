import { readPublishedContents, readStories } from "@/lib/publication-store";
import {
  buildProductTopicResult,
  productTopicMarkdown,
} from "@/lib/content-ops/product-topics";
import { hasFlag, readArg } from "./_args";

function numberArg(name: string): number | undefined {
  const value = readArg(name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const options = {
  days: numberArg("days") ?? 30,
  limit: numberArg("limit") ?? 40,
  query: readArg("query"),
  contentTypes: readArg("content-type")?.split(",").map((value) => value.trim()).filter(Boolean),
  minScore: numberArg("min-score"),
  includeWeekly: hasFlag("include-weekly"),
};

const result = buildProductTopicResult(readPublishedContents(), readStories(), options);
const format = readArg("format") || "json";

if (format === "markdown" || format === "md") {
  console.log(productTopicMarkdown(result));
} else if (format === "json") {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.error(`不支持的格式：${format}。请使用 json 或 markdown。`);
  process.exitCode = 1;
}
