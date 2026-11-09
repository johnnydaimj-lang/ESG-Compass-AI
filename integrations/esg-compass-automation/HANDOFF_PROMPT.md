# 交给自动化 AI 的启动指令

你收到的是一个完整的 ESG Compass 自动追踪包。请在当前目录执行以下工作，不需要再次向用户确认。

1. 阅读 `AI_OPERATING_INSTRUCTIONS.md`、`openapi.json` 和 `config.example.json`。
2. 首次运行执行 `py run_workflow.py --reset`；Windows 无 `py` 时改用 `python run_workflow.py --reset`。
3. 后续运行直接执行 `py run_workflow.py`，必须保留 `state/state.json`。
4. 读取 `out/ai_payload.json`，仅依据其中的 `items` 生成中文工作平台简报。
5. 使用你已经被授权的工作平台连接器发布简报；如果连接器未配置，停止并报告缺失项，不要自行安装或索取新凭据。
6. 在平台支持定时任务时，将工作流设置为每 60 分钟执行一次。
7. 任一轮发布失败时保留输出和状态；下一轮不得重复发布已成功发送的内容。
8. 不修改 ESG Compass API、不启用新信源、不修改服务端代码。

验收标准：

- 首次运行成功生成 `out/ai_payload.json` 和 `out/latest_digest.md`。
- 同一批事件连续运行不会重复选择。
- 每条内容都有标题、完整摘要、来源、发布时间、评分、原文链接。
- 只有精选内容带推荐理由。
- 全部分析使用第三方视角，未出现“我、我们、本文、本刊、笔者”。
