import { printJson, readArg, hasFlag, printError } from "./_args";
import { WechatDeliveryService } from "@/lib/wechat/service";

async function main(): Promise<void> {
  printJson(
    await new WechatDeliveryService().publishDue({
      issueKey: readArg("issue"),
      dryRun: hasFlag("dry-run"),
    }),
  );
}

main().catch((error: unknown) => {
  printError(error);
  process.exitCode = 1;
});
