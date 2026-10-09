import type { ContentType } from "@/lib/contracts/content";
import type { SourceTier } from "@/lib/contracts/pipeline";

export const SCORE_WEIGHTS: Record<ContentType, [number, number, number, number, number]> = {
  政策: [3, 2, 2, 2, 1],
  行业: [2, 3, 2, 2, 1],
  观点: [1, 3, 1, 3, 2],
  学术: [4, 3, 2, 1, 0],
  评级: [3, 2, 2, 3, 0],
};

export const SELECTION_THRESHOLDS: Record<SourceTier, number> = {
  T1: 60,
  T1_5: 65,
  T2: 76,
  SIGNAL: 101,
};

export const UNDERSTAND_FLOOR = 45;
export const SOURCE_TIER_WEIGHTS: Record<SourceTier, number> = {
  T1: 3,
  T1_5: 2,
  T2: 1.5,
  SIGNAL: 0.75,
};

export const HOT_WINDOW_HOURS = 48;
export const HOT_HALF_LIFE_HOURS = 24;
export const HOT_MIN_PARTICIPANTS = 2;
export const HOT_MIN_EDITORIAL_SOURCES = 1;

export const STRONG_ESG_TERMS = [
  "esg",
  "可持续",
  "sustainability",
  "climate",
  "气候",
  "carbon",
  "碳",
  "emission",
  "排放",
  "披露",
  "disclosure",
  "issb",
  "csrd",
  "esrs",
  "cbam",
  "csddd",
  "tnfd",
  "biodiversity",
  "生物多样",
  "human rights",
  "人权",
  "forced labour",
  "forced labor",
  "强迫劳动",
  "supply chain",
  "供应链",
  "green finance",
  "绿色金融",
  "transition finance",
  "转型金融",
  "rating",
  "评级",
  "sustainable finance",
  "renewable",
  "新能源",
  "清洁能源",
  "labor rights",
  "劳工",
  "due diligence",
  "尽职调查",
  "deforestation",
  "毁林",
];

export const CLEAR_NOISE_TERMS = [
  "招聘",
  "实习生招募",
  "简历投递",
  "扫码报名",
  "培训班",
  "招生简章",
  "获奖名单",
  "webinar registration",
  "register now",
  "job opening",
  "hiring",
];
