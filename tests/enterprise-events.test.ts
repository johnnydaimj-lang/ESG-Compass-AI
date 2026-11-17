import assert from "node:assert/strict";
import test from "node:test";

import type { ContentItem } from "../lib/contracts/content";
import type { RawMaterial } from "../lib/contracts/pipeline";
import { classifyContentType } from "../lib/pipeline/classify";
import { prefilterMaterial } from "../lib/pipeline/prefilter";

function item(title: string, summary = "", sourceName = "测试信源"): ContentItem {
  return {
    id: title,
    title,
    summary,
    contentType: "观点",
    region: "全球",
    publishedAt: "2026-11-17T00:00:00.000Z",
    importanceLevel: "中",
    sourceName,
    sourceUrl: "https://example.com",
    esgTopic: "合规与监管",
  };
}

function material(title: string, summary = ""): RawMaterial {
  const content = item(title, summary);
  return {
    id: title,
    title,
    summary,
    sourceName: content.sourceName,
    sourceUrl: content.sourceUrl,
    publishedAt: content.publishedAt,
    contentType: content.contentType,
    region: content.region,
    content,
  };
}

test("具体企业 ESG 行动归入行业", () => {
  const cases = [
    "Holcim completes acquisition to expand construction waste recycling",
    "罗技启动供应链减碳计划，首批覆盖17家制造供应商",
    "Ahold Delhaize signs long-term power purchase agreement",
    "谷歌投资1.6亿美元建设马来西亚水资源设施",
    "Pellenc ST launches AI optical sorting system for plastic recycling",
    "某制造商投产废水回用系统以降低水资源消耗",
    "Global retailer signs renewable energy PPA for its distribution centres",
    "某汽车集团与供应商合作启动强迫劳动尽调计划",
    "Mining company builds biodiversity restoration project near operating site",
    "包装企业收购再生材料公司扩大循环经济业务",
  ];
  for (const title of cases) {
    assert.equal(classifyContentType(item(title)), "行业", title);
  }
});

test("对具体企业的执法事件归入行业", () => {
  const cases = [
    "监管机构对某制造公司违规排污处以500万元罚款",
    "US regulator fines chemical manufacturer for worker safety violations",
    "法院判决某矿业集团构成环境犯罪",
    "Construction contractor prosecuted after illegal waste dumping investigation",
    "某工厂因破坏栖息地被责令停工整改",
    "Retail company sued over alleged supply-chain human rights violations",
  ];
  for (const title of cases) {
    assert.equal(classifyContentType(item(title)), "行业", title);
  }
});

test("一般监管规则仍归入政策", () => {
  const cases = [
    "欧盟通过环境违法处罚新规，统一执法标准",
    "Regulator publishes climate disclosure enforcement guidance",
    "立法机构提出企业人权尽责调查法案",
  ];
  for (const title of cases) {
    assert.equal(classifyContentType(item(title)), "政策", title);
  }
});

test("企业循环经济、水资源和安全风险通过确定性预筛", () => {
  const cases = [
    "建材企业扩大建筑废弃物回收利用业务",
    "数据中心投资建设水资源设施",
    "Factory fined after occupational safety violations caused worker injuries",
    "企业基地因极端天气停产并遭受损失",
    "Mining operator investigated after pollution damaged a protected river",
    "制造企业对供应链强迫劳动指控展开整改",
    "Wildfire damages company facility and disrupts regional supply chain",
    "化工企业启动废水污染修复工程",
  ];
  for (const title of cases) {
    assert.equal(prefilterMaterial(material(title)).label, "PASS", title);
  }
});

test("普通企业新闻不因企业身份自动通过预筛", () => {
  const cases = [
    "某公司发布年度财务业绩并宣布股息",
    "Technology company appoints new regional sales director",
    "某集团收购软件初创企业扩大市场份额",
    "Retailer launches seasonal loyalty campaign",
    "制造企业获得年度最佳雇主奖",
  ];
  for (const title of cases) {
    assert.equal(prefilterMaterial(material(title)).label, "UNKNOWN", title);
  }
});

test("周期性 ESG 汇编不进入事件时间线", () => {
  const cases = [
    "ESG Today: Week in Review",
    "ESG与可持续发展周报：本周五项重要政策进展",
    "本周ESG新闻盘点",
    "Climate Weekly Roundup: regulations, deals and research",
  ];
  for (const title of cases) {
    const result = prefilterMaterial(material(title, "包含气候、碳排放和供应链等多项 ESG 动态"));
    assert.equal(result.label, "BLOCK", title);
    assert.equal(result.reason, "周期性汇总不进入事件时间线", title);
  }
});

test("含周度措辞的单一新增事实不被误伤", () => {
  const result = prefilterMaterial(material("监管机构公布企业气候披露新规", "规则将于下周正式生效"));
  assert.equal(result.label, "PASS");
});
