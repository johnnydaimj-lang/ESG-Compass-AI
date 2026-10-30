import { printJson, readArg, hasFlag, printError } from "./_args";
import { WechatDeliveryService } from "@/lib/wechat/service";

async function main(): Promise<void> {
  printJson(
    await new WechatDeliveryService().prepareDue({
      issueKey: readArg("issue"),
      dryRun: hasFlag("dry-run"),
      lookaheadMinutes: Number(readArg("lookahead-minutes")) || undefined,
    }),
  );
}

main().catch((error: unknown) => {
  printError(error);
  process.exitCode = 1;
});
