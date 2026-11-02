import { readPublishedContents, readStories, writePublishedContents, writeStories } from "@/lib/publication-store";
import { isFeedEligible } from "@/lib/feed-policy";
import { getRegulationsForZone } from "@/lib/regulations";

const articleUrl = "https://www.csrc.gov.cn/csrc/c101954/c7667691/content.shtml";
const contents = readPublishedContents();
const item = contents.find((entry) => entry.articleUrl === articleUrl);
if (!item) throw new Error("未找到证监会可持续发展报告电子化规范条目");
if (!item.pipeline) throw new Error("证监会规范条目缺少评分元数据");
const stories = readStories();
const story = stories.find((entry) => entry.memberIds.includes(item.id));

item.title = "【第13号公告】《〈上市公司可持续发展报告电子化规范〉等3项行业标准》";
item.titleZh = "证监会发布《上市公司可持续发展报告电子化规范》等3项行业标准";
item.summary = "China Securities Regulatory Commission Announcement No. 13 of 2026 publishes the Electronic Format Specification for Listed Companies' Sustainability Reports (JR/T 0356-2026) and two other financial industry standards, effective on the date of publication.";
item.summaryZh = "中国证监会发布公告〔2026〕13号，公布《上市公司可持续发展报告电子化规范》（JR/T 0356—2026）等3项金融行业推荐性标准，自2026年10月26日公布之日起施行。该规范对上市公司可持续发展报告的数据元素、分类编码、实例文档生成和文件格式作出统一规定，为ESG报告数据的机器读取、采集和比较提供标准基础。";
item.bodyZh = "中国证监会于2026年10月26日发布公告〔2026〕13号，公布《上市公司可持续发展报告电子化规范》（JR/T 0356—2026）及《证券期货业基础大模型选型评估指引》《证券期货业业务域数据元规范 第3部分：期货公司》两项配套标准，均自公布之日起施行。电子化规范以XBRL等电子化披露技术为基础，对可持续发展报告的数据元素、分类编码、实例文档生成、数据类型和文件命名等作出统一规定，使报告能够被机器稳定读取、采集和跨平台比较。该标准本身不新增企业披露义务，后续仍需关注交易所是否配套开放实例文档报送要求。";
item.sourceName = "中国证监会公告";
item.sourceUrl = "https://www.csrc.gov.cn/";
item.publishedAt = "2026-10-26T00:00:00.000Z";
item.esgTopic = "可持续披露";
item.pipeline.fact = {
  title: item.titleZh,
  subject: "中国证监会",
  action: "发布",
  object: "《上市公司可持续发展报告电子化规范》等3项行业标准",
  occurredAt: "2026-10-26",
};

contents.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
writePublishedContents(contents);
if (story) {
  story.title = item.titleZh || item.title;
  story.digest = item.summaryZh || item.summary;
  story.latest = item.summaryZh || item.summary;
  writeStories(stories);
}
const inDisclosureZone = getRegulationsForZone("esg-disclosure", 100).some((entry) => entry.id === item.id);
process.stdout.write(
  `updated ${item.id} | ${item.publishedAt} | score=${item.pipeline.score} `
  + `| public=${isFeedEligible(item)} | disclosure-zone=${inDisclosureZone}\n`,
);
