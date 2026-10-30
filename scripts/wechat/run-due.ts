import { hasFlag, printJson, readArg, printError } from "./_args";
import { getWechatConfig } from "@/lib/wechat/config";
import { WechatDeliveryService } from "@/lib/wechat/service";

async function main(): Promise<void> {
  const service = new WechatDeliveryService();
  const issueKey = readArg("issue");
  const dryRun = hasFlag("dry-run");

  const prepared = await service.prepareDue({
    issueKey,
    dryRun,
    lookaheadMinutes: Number(readArg("lookahead-minutes")) || undefined,
  });
  const published = await service.publishDue({
    issueKey,
    dryRun,
  });

  printJson({
    ok: prepared.ok && published.ok,
    at: published.at,
    publishMode: getWechatConfig().publishMode,
    dryRunRequested: dryRun,
    prepared,
    published,
  });
}

main().catch((error: unknown) => {
  printError(error);
  process.exitCode = 1;
});
