import { readPublishedContents, readStories, writeDaily } from "@/lib/publication-store";
import { buildDailyReport } from "@/lib/pipeline/daily";

const generatedAt = new Date();
const contents = readPublishedContents();
const stories = readStories();
const report = buildDailyReport(contents, stories, generatedAt);

writeDaily(report);
process.stdout.write(
  `daily rebuilt: ${report.date} | highlights=${report.highlights.length} `
  + `sections=${report.sections.length} stories=${report.stories.length}\n`,
);
