// Conference attendance is context, not an ESG event. Only block clearly procedural coverage;
// ambiguous or substantive conference reporting still goes through normal scoring/review.
const CONFERENCE = /(?:APEC|COP\s*\d+|亚太经合组织|会议|峰会|大会|论坛|仪式|发行活动|\b(?:summit|conference|forum|ceremony)\b)/i;
const PROCEDURAL = /(?:将|拟|计划|应邀)?(?:出席|主持|参加).{0,80}(?:会议|峰会|大会|论坛|仪式|活动)|(?:会议|峰会|大会|论坛).{0,30}(?:将于|定于|将举行|将召开)|(?:会议|峰会)(?:日程|议程|安排|预告)|发表(?:重要讲话|主旨演讲)|纪念.{0,40}(?:大会|仪式)|\b(?:will|to|scheduled to|plans? to)\s+(?:attend|host|address)\b|\b(?:summit|conference)\s+(?:agenda|schedule)\b/i;
const ESG_SUBJECT = /气候|减排|碳排放|碳市场|碳价|碳交易|化石燃料|清洁能源|可再生能源|绿电|绿色.{0,4}(?:债券|融资|基金)|可持续.{0,6}(?:披露|金融|融资)|环境|环保|生物多样性|森林|劳工|人权|强迫劳动|供应链|水资源|塑料|回收|\b(?:climate|emissions?|carbon|fossil fuels?|renewables?|biodiversity|human rights|forced labou?r|green bond)\b/i;
const SPECIFIC_ACTION = /(?:通过|批准|发布|公布|签署|达成|启动|设立|宣布|发行|修订|撤回|删除|取消|落实|执行|确立).{0,70}(?:规则|标准|准则|协议|条款|文本|措辞|登记册|核查|机制|基金|债券|投资|项目|时间表|期限|补贴|禁令)|(?:规则|标准|条款|文本|措辞|承诺).{0,50}(?:删除|撤回|取消|修改|落空)|要求.{0,40}(?:披露|核查|整改|备案)|\b(?:adopted|approved|launched|signed|issued|removed|dropped|withdrew|established)\b.{0,100}\b(?:rule|standard|agreement|text|registry|fund|bond|mechanism|deadline|subsidy)\b/i;
const CONCRETE_DISPUTE = /(?:资金|融资|出资|化石燃料|减排|碳价|碳边境|人权|劳工|森林).{0,45}(?:分歧|争议|僵局|反对|拒绝|未能达成)|(?:分歧|争议|僵局).{0,45}(?:资金|融资|化石燃料|减排|碳价|碳边境|人权|劳工|森林)|\b(?:dispute|deadlock|disagreement)\b.{0,70}\b(?:finance|funding|fossil fuels?|emissions?|carbon)\b/i;
const AGENDA_ONLY = /将(?:重点)?(?:讨论|探讨|聚焦|围绕)|计划(?:讨论|探讨)|议程(?:包括|涵盖)|主题(?:为|是)|\b(?:will discuss|plans? to discuss|agenda includes|theme is)\b/i;

export function isProceduralConferenceNews(title: string, summary = "", body = ""): boolean {
  if (!CONFERENCE.test(title) || !PROCEDURAL.test(title)) return false;
  const clauses = `${title}。${summary}。${body}`.split(/[。！？!?\n；;]/);
  const substantive = clauses.some((clause) => !AGENDA_ONLY.test(clause) && ESG_SUBJECT.test(clause)
    && (SPECIFIC_ACTION.test(clause) || CONCRETE_DISPUTE.test(clause)));
  return !substantive;
}
