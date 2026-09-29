import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ContentItem } from "@/lib/contracts/content";
import type {
  DailyReport,
  HeatHistory,
  PipelineStatus,
  PublicationBundle,
  StoryCluster,
} from "@/lib/contracts/pipeline";

const PUBLICATION_DIR = resolve(process.cwd(), "data", "publication");
const CONTENTS_FILE = resolve(PUBLICATION_DIR, "contents.json");
const STORIES_FILE = resolve(PUBLICATION_DIR, "stories.json");
const HOTSPOTS_FILE = resolve(PUBLICATION_DIR, "hotspots.json");
const STATUS_FILE = resolve(PUBLICATION_DIR, "status.json");
const DAILY_FILE = resolve(PUBLICATION_DIR, "daily.json");
const HEAT_HISTORY_FILE = resolve(PUBLICATION_DIR, "heat-history.json");

function readJson<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(PUBLICATION_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export function readPublishedContents(): ContentItem[] {
  return readJson<ContentItem[]>(CONTENTS_FILE, []);
}

export function readStories(): StoryCluster[] {
  return readJson<StoryCluster[]>(STORIES_FILE, []);
}

export function readHotspots(): StoryCluster[] {
  return readJson<StoryCluster[]>(HOTSPOTS_FILE, []);
}

export function readDaily(): DailyReport | null {
  return readJson<DailyReport | null>(DAILY_FILE, null);
}

export function readHeatHistory(): HeatHistory | null {
  return readJson<HeatHistory | null>(HEAT_HISTORY_FILE, null);
}

export function readPipelineStatus(): PipelineStatus | null {
  return readJson<PipelineStatus | null>(STATUS_FILE, null);
}

export function readPublicationBundle(): PublicationBundle | null {
  const status = readPipelineStatus();
  if (!status) return null;
  return {
    version: status.pipelineVersion,
    generatedAt: status.finishedAt,
    contents: readPublishedContents(),
    stories: readStories(),
    hotspots: readHotspots(),
    status,
  };
}

export function writePublishedContents(contents: ContentItem[]): void {
  writeJson(CONTENTS_FILE, contents);
}

export function writeDaily(report: DailyReport): void {
  writeJson(DAILY_FILE, report);
}

export function writeHeatHistory(history: HeatHistory): void {
  writeJson(HEAT_HISTORY_FILE, history);
}

export function writePublicationBundle(bundle: PublicationBundle): void {
  writeJson(CONTENTS_FILE, bundle.contents);
  writeJson(STORIES_FILE, bundle.stories);
  writeJson(HOTSPOTS_FILE, bundle.hotspots);
  writeJson(STATUS_FILE, bundle.status);
  writeJson(resolve(PUBLICATION_DIR, "version.json"), {
    pipelineVersion: bundle.version,
    generatedAt: bundle.generatedAt,
  });
}

export function hasPublicationSnapshot(): boolean {
  return existsSync(CONTENTS_FILE);
}
