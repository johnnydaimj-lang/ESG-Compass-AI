import { printJson, requireIssueKey, hasFlag, printError } from "./_args";
import { WechatDeliveryService } from "@/lib/wechat/service";

async function main(): Promise<void> {
  const issueKey = requireIssueKey();
  const service = new WechatDeliveryService();
  if (hasFlag("dry-run")) {
    printJson(service.getStatus(issueKey));
  } else {
    printJson(await service.refreshPublishStatus(issueKey));
  }
}

main().catch((error: unknown) => {
  printError(error);
  process.exitCode = 1;
});
