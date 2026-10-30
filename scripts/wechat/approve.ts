import { readArg, printJson, requireIssueKey, hasFlag, printError } from "./_args";
import { WechatDeliveryService } from "@/lib/wechat/service";

async function main(): Promise<void> {
  if (hasFlag("help")) {
    console.log("用法：npm.cmd run wechat:approve -- --issue=2026-w43 --reviewer=姓名 --hash=<readiness 中的 contentHash>");
    return;
  }

  const issueKey = requireIssueKey();
  const reviewer = readArg("reviewer");
  const contentHash = readArg("hash");
  if (!reviewer || !contentHash) {
    throw new Error("审批必须提供 --reviewer 和 --hash；请先从 readiness 获取 contentHash");
  }

  printJson({
    ok: true,
    readiness: await new WechatDeliveryService().approve(issueKey, { reviewer, contentHash }),
  });
}

main().catch((error: unknown) => {
  printError(error);
  process.exitCode = 1;
});
