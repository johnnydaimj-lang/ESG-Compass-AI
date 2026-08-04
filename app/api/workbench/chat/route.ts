import { NextResponse } from "next/server";
import { getContentById } from "@/lib/esg-data";
import { searchKnowledgeBase, getRelatedKnowledge } from "@/lib/knowledge-base";
import { isAdmin } from "@/lib/admin-auth";

async function callLLM(systemPrompt: string, userMsg: string): Promise<string | null> {
  var apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
  var baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  var model = process.env.LLM_MODEL || "gpt-4o-mini";
  if (!apiKey) return null;
  try {
    var res = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
      }),
    });
    if (!res.ok) return null;
    var data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    var body = await request.json();
    var message = body.message || "";
    var eventId = body.eventId || "";
    if (!message.trim()) {
      return NextResponse.json({ error: "请输入问题" }, { status: 400 });
    }

    var eventCtx = eventId ? getContentById(eventId) : null;
    var kbResults = searchKnowledgeBase(message);
    var relatedKb = eventId ? getRelatedKnowledge(eventId) : [];
    var allSources = [...relatedKb];
    kbResults.forEach(function (k) {
      if (!allSources.find(function (s) { return s.id === k.id; })) allSources.push(k);
    });

    var contextParts: string[] = [];
    if (eventCtx) {
      contextParts.push("用户正在查看的事件：");
      contextParts.push("标题：" + eventCtx.title);
      contextParts.push("摘要：" + eventCtx.summary);
      contextParts.push("ESG 议题：" + eventCtx.esgTopic);
      contextParts.push("");
    }
    if (allSources.length > 0) {
      contextParts.push("可参考的知识库条目：");
      allSources.forEach(function (kb) {
        contextParts.push("---");
        contextParts.push("标题：" + kb.title);
        contextParts.push("摘要：" + kb.summary);
        contextParts.push("相关内容：" + kb.content.substring(0, 800));
      });
    }
    var contextStr = contextParts.join("\n");

    var systemPrompt = "你是一位专业的 ESG 知识顾问，名为「观澜 ESG Compass」。回答基于用户提供的知识库和当下全球 ESG 政策/标准，给出简洁、准确、实用的中文回答。回答不超过 300 字。如果知识库中没有相关信息，诚实告诉用户你不知道并给出力所能及的一般性建议。回答末尾标注引用的知识条目名称。";
    var userPrompt = "参考信息：\n" + contextStr + "\n---\n用户问题：" + message;
    var reply = await callLLM(systemPrompt, userPrompt);

    if (!reply) {
      var matchCount = allSources.length;
      if (eventCtx && matchCount > 0) {
        reply = "关于「" + eventCtx.title + "」的相关问题，我在知识库中找到了 " + matchCount + " 份参考资料。\n\n";
        allSources.slice(0, 2).forEach(function (kb) {
          reply += "**" + kb.title + "**：" + kb.summary + "\n\n";
        });
        reply += "建议你阅读原文获取完整内容。";
      } else if (matchCount > 0) {
        reply = "我找到了 " + matchCount + " 份相关的参考资料。\n\n";
        allSources.slice(0, 3).forEach(function (kb) {
          reply += "**" + kb.title + "**：" + kb.summary.substring(0, 200) + "\n\n";
        });
        reply += "请告诉我你具体想了解哪个方面。";
      } else {
        reply = "我目前的知识库暂未收录该主题的详细信息。建议你通过首页的 ESG 快讯或知识专区浏览当前热点，或换个关键词再试试。";
      }
    }

    return NextResponse.json({
      reply: reply,
      sources: allSources.slice(0, 5).map(function (kb) {
        return { id: kb.id, title: kb.title, sourceName: kb.sourceName, sourceUrl: kb.sourceUrl, category: kb.category };
      }),
      eventTitle: eventCtx?.title || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "处理请求时出错：" + (err.message || "未知错误") }, { status: 500 });
  }
}
