import { printJson, requireIssueKey } from "./_args";
import { WechatDeliveryService } from "@/lib/wechat/service";

printJson(new WechatDeliveryService().getStatus(requireIssueKey()));
