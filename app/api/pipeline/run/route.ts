import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { isAdmin } from "@/lib/admin-auth";

const PIPELINE_SCRIPT = resolve(process.cwd(), "scripts", "pipeline.mjs");

function sanitizeOutput(text: string): string {
  return text.replace(/(sk-[A-Za-z0-9_-]{6})[A-Za-z0-9_-]+/g, "$1****");
}

function runPipeline(timeoutMs = 240000): Promise<{ ok: boolean; output: string; code: number | null }> {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [PIPELINE_SCRIPT], {
      cwd: process.cwd(),
      env: process.env,
      windowsHide: true,
    });
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      resolvePromise({ ok: false, output: output + "\n[timeout] 管道运行超时（240s）", code: null });
    }, timeoutMs);

    child.stdout.on("data", (d) => { output += d.toString(); });
    child.stderr.on("data", (d) => { output += d.toString(); });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ ok: code === 0, output, code });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolvePromise({ ok: false, output: output + "\n[error] " + err.message, code: null });
    });
  });
}

export async function POST() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const result = await runPipeline();
    return NextResponse.json({
      ok: result.ok,
      output: sanitizeOutput(result.output).slice(-6000),
      exitCode: result.code,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "管道触发失败：" + (err.message || "未知错误") }, { status: 500 });
  }
}
