import assert from "node:assert/strict";
import test from "node:test";
import { isProceduralConferenceNews } from "../lib/conference-policy";
import { isFeedEligible } from "../lib/feed-policy";
import { prefilterMaterial } from "../lib/pipeline/prefilter";
import type { ContentItem } from "../lib/contracts/content";

const title = "习近平将出席亚太经合组织第三十三次领导人非正式会议及相关活动";
const summary = "会议定于11月18日至19日在深圳举行，主题为建设亚太共同体，领导人将主持会议并发表讲话，出席工商领导人峰会开幕式，还将举行欢迎宴会与双边会晤。";
function content(titleZh = title, summaryZh = summary): ContentItem {
  return { id: "conference", title: titleZh, titleZh, summary: summaryZh, summaryZh,
    contentType: "政策", region: "全球", publishedAt: "2026-11-17", importanceLevel: "高",
    sourceName: "官方来源", sourceUrl: "https://example.com/news", esgTopic: "合规与监管", recommended: true,
    pipeline: { score: 95, scoreThreshold: 75, scorePass: true, sourceTier: "T1", storyId: "conference", heat: 100, tags: [], pipelineVersion: "test" } };
}

test("conference attendance is excluded regardless of leader, official status, score or popularity", () => {
  for (const headline of [title, "某国总统将出席APEC领导人会议", "Minister will attend COP31 climate summit"]) {
    assert.equal(isProceduralConferenceNews(headline, summary), true);
  }
  const item = content();
  assert.equal(isFeedEligible(item), false);
  const raw = { ...item, content: item };
  assert.equal(prefilterMaterial(raw).label, "BLOCK");
});

test("conference themes, proposed discussion, generic calls and unrelated figures are not outcomes", () => {
  for (const text of [
    "会议主题为气候行动，议程包括气候融资争议，各方将讨论碳市场。",
    "与会者强调加强生物多样性保护，呼吁各国推动绿色转型。",
    "约3000人出席会议，会议安排了多个讨论环节和双边会晤。",
  ]) assert.equal(isProceduralConferenceNews("部长出席COP31会议并发表重要讲话", text), true);
});

test("actual ESG mechanisms, financing and concrete negotiating disputes survive attendance-style titles", () => {
  const cases = [
    ["部长出席COP31峰会", "与会国家启动气候资金核查机制，明确年度报告安排与责任机构。"],
    ["副部长出席人民币绿色主权债券发行活动", "财政部在多伦多发行40亿元人民币绿色主权债券，资金支持合格绿色项目。这是首次在加拿大发行人民币绿色主权债券。"],
    ["部长出席COP31会议", "各国就气候融资的出资责任出现分歧，双方尚未达成一致。"],
    ["部长出席APEC会议", "联合声明公布可持续披露标准及过渡期限，列明报告主体和实施要求。"],
  ];
  for (const [headline, text] of cases) {
    assert.equal(isProceduralConferenceNews(headline, text), false, headline);
    assert.equal(isFeedEligible(content(headline, text)), true, headline);
  }
});

test("substantive conference reporting and normal regulations continue through existing scoring", () => {
  for (const headline of ["COP31见证第6.2条国际登记册首个版本启动", "COP31协议草案删除化石燃料转型措辞", "欧盟通过可持续报告披露新规"]) {
    assert.equal(isProceduralConferenceNews(headline), false);
  }
  assert.equal(isProceduralConferenceNews("Conference agenda: minister's attendance", "The summit will discuss climate finance disputes."), true);
  assert.equal(isProceduralConferenceNews("Minister will attend climate conference", "Delegates launched a climate finance fund with annual reporting requirements."), false);
});
