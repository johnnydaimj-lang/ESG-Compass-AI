import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { promises as fs } from "fs";
import path from "path";
import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    var privateDir = process.env.PRIVATE_KB_DIR
      ? path.resolve(/* turbopackIgnore: true */ process.env.PRIVATE_KB_DIR)
      : path.join(/* turbopackIgnore: true */ process.cwd(), "data", "private-kb");
    var privateEntries: any[] = [];

    try {
      var stat = await fs.stat(/* turbopackIgnore: true */ privateDir);
      if (stat.isDirectory()) {
        var files = await fs.readdir(/* turbopackIgnore: true */ privateDir, { withFileTypes: true });
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (!file.isFile() || !file.name.toLowerCase().endsWith(".md")) continue;
          var raw = await fs.readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ privateDir, file.name), "utf8");
          var lines = raw.split(/\r?\n/);
          var title = (lines[0] || "").replace(/^#+\s*/, "").trim() || file.name.replace(/\.md$/i, "");
          var summary = lines.slice(1).join(" ").replace(/\s+/g, " ").trim().slice(0, 160);
          privateEntries.push({
            id: "private-" + file.name.replace(/\.md$/i, ""),
            title: title,
            summary: summary,
            content: raw,
            sourceName: "本地私密知识库",
            sourceUrl: "",
            tags: [],
            category: "私密",
          });
        }
      }
    } catch {}

    return NextResponse.json({
      publicEntries: KNOWLEDGE_BASE,
      privateEntries: privateEntries,
      privateDir: privateDir,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "读取知识库失败：" + (err.message || "未知错误") }, { status: 500 });
  }
}