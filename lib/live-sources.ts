// 真实信源解析：mock 阶段维护信源注册表，同步动作返回模拟结果

export interface LiveSource {
  id: string;
  name: string;
  url: string;
  format: "rss" | "web";
  region: string;
  enabled: boolean;
}

export const LIVE_SOURCES: LiveSource[] = [
  {
    id: "src-eu-commission",
    name: "欧盟委员会司法与消费者总司",
    url: "https://commission.europa.eu/",
    format: "web",
    region: "欧盟",
    enabled: true,
  },
  {
    id: "src-apple-supplier",
    name: "Apple 供应商责任",
    url: "https://www.apple.com/supplier-responsibility/",
    format: "web",
    region: "全球",
    enabled: true,
  },
  {
    id: "src-mas",
    name: "新加坡金融管理局 (MAS)",
    url: "https://www.mas.gov.sg/development/sustainable-finance",
    format: "web",
    region: "新加坡",
    enabled: true,
  },
  {
    id: "src-ecovadis",
    name: "EcoVadis",
    url: "https://ecovadis.com/",
    format: "web",
    region: "全球",
    enabled: true,
  },
];

export interface SyncResult {
  syncedAt: string;
  sourcesChecked: number;
  newItems: number;
  message: string;
}

// mock 阶段：不真正抓取信源，返回模拟同步结果，便于后台流程先跑通
export function syncLiveSources(): SyncResult {
  const enabled = LIVE_SOURCES.filter((s) => s.enabled);
  return {
    syncedAt: new Date().toISOString(),
    sourcesChecked: enabled.length,
    newItems: 0,
    message: `已检查 ${enabled.length} 个信源（模拟同步）：当前为 mock 数据阶段，未拉取到需要入库的新事件。接入真实抓取后，新事件将以"待校对"状态进入后台。`,
  };
}
