import assert from "node:assert/strict";
import test from "node:test";

import {
  isTitleEcho,
  isUsableGeneratedSummary,
} from "../lib/pipeline/summary-quality";

test("detects summaries that only repeat the title", () => {
  const title = "香港证监会完成有关进一步限制不受规管实体使用误导性名称以保护投资者的咨询";
  const summary = "香港证监会完成有关进一步限制不受规管实体使用误导性名称以保护投资者的咨询。";

  assert.equal(isTitleEcho(title, summary), true);
});

test("accepts summaries that add concrete facts beyond the title", () => {
  const title = "香港证监会完成有关限制误导性名称的咨询";
  const summary = "香港证监会公布咨询总结，计划修订《证券及期货条例》和《打击洗钱条例》，扩大受限名称清单并将相关安排覆盖虚拟资产交易平台。咨询获得业界广泛支持，证监会将根据意见允许清单更快更新，并拟向立法会提交修例草案。";

  assert.equal(isTitleEcho(title, summary), false);
  assert.equal(isUsableGeneratedSummary(title, summary), true);
});

test("rejects an LLM result that restates the title or is incomplete", () => {
  const title = "香港证监会完成有关进一步限制不受规管实体使用误导性名称以保护投资者的咨询";

  assert.equal(isUsableGeneratedSummary(title, `${title}。`), false);
  assert.equal(isUsableGeneratedSummary(title, "香港证监会公布咨询总结，计划扩大受限名称清单，并将向立法会提交修例草案"), false);
});
