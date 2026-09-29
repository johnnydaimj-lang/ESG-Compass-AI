// 专区地区 → 世界地图国家/地区编码映射（@svg-maps/world 使用小写 ISO alpha-2）。

export const REGION_LABELS = ["全球", "欧盟", "美国", "英国", "新加坡", "日本", "韩国", "印度", "澳大利亚", "中国", "亚洲", "国际", "巴西", "加拿大"];

export const REGION_COUNTRY_IDS: Record<string, string[]> = {
  全球: [],
  国际: [],
  欧盟: [
    "at", "be", "bg", "hr", "cy", "cz", "dk", "ee", "fi", "fr",
    "de", "gr", "hu", "ie", "it", "lv", "lt", "lu", "mt", "nl",
    "pl", "pt", "ro", "sk", "si", "es", "se",
  ],
  美国: ["us"],
  英国: ["gb"],
  新加坡: ["sg"],
  日本: ["jp"],
  韩国: ["kr"],
  印度: ["in"],
  澳大利亚: ["au"],
  中国: ["cn"],
  亚洲: ["cn", "hk", "in", "id", "jp", "kr", "my", "ph", "sg", "th", "vn", "tw"],
  巴西: ["br"],
  加拿大: ["ca"],
};

export function normalizeRegion(value?: string): string {
  const v = String(value || "").trim();
  if (!v) return "全球";
  if (v.includes("欧盟") || /^eu\b/i.test(v)) return "欧盟";
  if (v.includes("美国")) return "美国";
  if (v.includes("英国") || /^uk\b/i.test(v)) return "英国";
  if (v.includes("新加坡")) return "新加坡";
  if (v.includes("日本")) return "日本";
  if (v.includes("韩国")) return "韩国";
  if (v.includes("印度")) return "印度";
  if (v.includes("澳大利亚") || v.includes("澳洲")) return "澳大利亚";
  if (v.includes("中国")) return "中国";
  if (v.includes("亚洲")) return "亚洲";
  if (v.includes("巴西")) return "巴西";
  if (v.includes("加拿大")) return "加拿大";
  return v;
}

export function regionCountryIds(region: string): string[] {
  return REGION_COUNTRY_IDS[region] || [];
}