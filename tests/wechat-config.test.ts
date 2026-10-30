import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { getWechatConfig } from "../lib/wechat/config";

const managedKeys = [
  "WECHAT_APP_ID",
  "WECHAT_APP_SECRET",
  "WECHAT_ARTICLE_SOURCE_URL",
  "WECHAT_PUBLISH_MODE",
  "WECHAT_CRON_SECRET",
  "CRON_SECRET",
] as const;

function withEnvFile(contents: string, run: (dir: string) => void): void {
  const directory = mkdtempSync(join(tmpdir(), "esg-wechat-config-"));
  const previousCwd = process.cwd();
  const previousEnv = new Map(managedKeys.map((key) => [key, process.env[key]]));

  try {
    writeFileSync(join(directory, ".env.local"), contents, "utf8");
    for (const key of managedKeys) delete process.env[key];
    process.chdir(directory);
    run(directory);
  } finally {
    process.chdir(previousCwd);
    for (const [key, value] of previousEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(directory, { recursive: true, force: true });
  }
}

test("Wechat CLI config reads .env.local without overriding process environment", () => {
  withEnvFile(
    [
      "WECHAT_APP_ID=from-file",
      "WECHAT_APP_SECRET=",
      "WECHAT_ARTICLE_SOURCE_URL=https://example.com/weekly/{issueKey}",
      "WECHAT_PUBLISH_MODE=draft_only",
      "WECHAT_CRON_SECRET=file-cron-secret",
    ].join("\n"),
    () => {
      process.env.WECHAT_APP_SECRET = "from-process";
      const config = getWechatConfig();

      assert.equal(config.appId, "from-file");
      assert.equal(config.appSecret, "from-process");
      assert.equal(config.contentSourceUrl, "https://example.com/weekly/{issueKey}");
      assert.equal(config.publishMode, "draft_only");
      assert.equal(config.cronSecret, "file-cron-secret");
      assert.equal(config.missing.length, 0);
    },
  );
});

test("existing process values take precedence over .env.local", () => {
  withEnvFile("WECHAT_APP_ID=from-file\nWECHAT_PUBLISH_MODE=auto_publish", () => {
    process.env.WECHAT_APP_ID = "from-process";
    process.env.WECHAT_PUBLISH_MODE = "dry_run";

    const config = getWechatConfig();
    assert.equal(config.appId, "from-process");
    assert.equal(config.publishMode, "dry_run");
  });
});

test("a public source URL and external cron secret are optional", () => {
  withEnvFile(
    ["WECHAT_APP_ID=wx-test-app", "WECHAT_APP_SECRET=test-secret"].join("\n"),
    () => {
      const config = getWechatConfig();
      assert.equal(config.contentSourceUrl, "");
      assert.equal(config.cronSecret, "");
      assert.deepEqual(config.missing, []);
    },
  );
});
