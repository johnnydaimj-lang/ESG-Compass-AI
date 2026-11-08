import assert from "node:assert/strict";
import test from "node:test";

import {
  hasEditorialFirstPerson,
  hasMetaSummaryCommentary,
  isTitleEcho,
  isUsableGeneratedSummary,
  stripMetaSummaryCommentary,
  toThirdPersonVoice,
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

test("rejects first-person and newsroom voice in summaries", () => {
  const title = "某机构发布企业人权风险追踪报告";
  const firstPerson = "私营部门的作用受到关注。阅读我们记录的企业涉嫌侵权行为。";
  const newsroomVoice = "本文梳理2023年至2025年记录的企业涉嫌侵权行为。";
  const thirdPerson = "该机构梳理2023年至2025年记录的企业涉嫌侵权行为，并按行业和侵权类型归纳核心发现。";

  assert.equal(hasEditorialFirstPerson(firstPerson), true);
  assert.equal(hasEditorialFirstPerson(newsroomVoice), true);
  assert.equal(isUsableGeneratedSummary(title, firstPerson), false);
  assert.equal(isUsableGeneratedSummary(title, newsroomVoice), false);
  assert.equal(isUsableGeneratedSummary(title, thirdPerson), true);
});

test("rewrites editorial voice without changing the stated facts", () => {
  const source = "私营部门在破坏与损失中的角色受到关注。阅读我们关于2023年10月至2025年10月记录的企业涉嫌侵权行为的核心发现。";
  const rewritten = toThirdPersonVoice(source);

  assert.equal(hasEditorialFirstPerson(rewritten), false);
  assert.match(rewritten, /2023年10月至2025年10月/);
  assert.match(rewritten, /相关材料梳理了/);
});

test("removes commentary about the source summary itself", () => {
  const source = "智利森蒂内拉铜矿工人将争取同工同酬的抗议升级为绝食抗议。现有中文摘要仅说明抗议形式升级，未提供参与人数、诉求细节或矿方回应等信息。";
  const cleaned = stripMetaSummaryCommentary(source);

  assert.equal(hasMetaSummaryCommentary(source), true);
  assert.equal(hasMetaSummaryCommentary(cleaned), false);
  assert.equal(cleaned, "智利森蒂内拉铜矿工人将争取同工同酬的抗议升级为绝食抗议。");
});
