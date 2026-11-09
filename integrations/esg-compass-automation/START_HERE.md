# ESG Compass 自动化接入包

这个目录可以直接交给另一个具备文件与终端权限的 AI 使用。

## 入口

先阅读：

1. `HANDOFF_PROMPT.md`
2. `AI_OPERATING_INSTRUCTIONS.md`
3. `automation_manifest.json`
4. `openapi.json`

执行一次：

```powershell
.\run.ps1
```

或者：

```bash
python3 run_workflow.py
```

Windows 也可直接运行 `py run_workflow.py`。

## 产物

- `state/state.json`：游标与已处理事件，保证重复运行不重复推送。
- `out/latest_run.json`：机器可读的事件、筛选结果和运行状态。
- `out/ai_payload.json`：供下游 AI 生成工作平台内容的结构化输入。
- `out/latest_digest.md`：可直接展示的中文摘要草稿。

首次运行默认回溯 7 天，之后自动使用上次游标并保留 1 天重叠窗口。公开 API 不需要密钥。
