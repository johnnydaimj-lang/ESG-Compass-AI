# 旧版消费者游标归档

本目录属于旧版“周报信号 -> 员工 2 号”交接链路，不再是员工 2 号当前工作的默认输入。

当前流程：

- 员工 2 号通过 `contentops:product-read` 只读扫描 ESG Compass 产品内容。
- 不再运行 `contentops:read --consumer=employee-2 --update-cursor`。
- 不再维护员工 2 号的信号游标。
- W43 已由 Johnny 人工发布，不进入新选题队列。

保留本目录只是为了审计历史信号消费位置，不要在新流程中修改。

当前命令：

```powershell
npm.cmd run contentops:product-read -- --days=30 --limit=40 --format=json
```
