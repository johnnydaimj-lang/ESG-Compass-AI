import { printJson, requireIssueKey, hasFlag, printError } from "./_args";
import { WechatDeliveryService } from "@/lib/wechat/service";

async function main(): Promise<void> {
  const issueKey = requireIssueKey();
  printJson(await new WechatDeliveryService().syncDraft(issueKey, { dryRun: hasFlag("dry-run") }));
}

main().catch((error: unknown) => {
  printError(error);
  process.exitCode = 1;
});
