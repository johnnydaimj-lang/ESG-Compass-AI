import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const LOCK_ROOT = resolve(process.cwd(), "data", "wechat", "locks");
const ISSUE_KEY_PATTERN = /^\d{4}-w\d{2}$/;
const DEFAULT_WAIT_MS = 15_000;
const DEFAULT_STALE_MS = 15 * 60_000;

interface LockOwner {
  token: string;
  pid: number;
  createdAt: string;
  issueKey: string;
}

export class WechatDeliveryLockError extends Error {
  readonly code = "DELIVERY_BUSY";

  constructor(issueKey: string) {
    super(`周报 ${issueKey} 正在被另一个发布任务处理，请稍后重试`);
    this.name = "WechatDeliveryLockError";
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function lockPaths(issueKey: string): { path: string; ownerPath: string } {
  if (!ISSUE_KEY_PATTERN.test(issueKey)) {
    throw new Error(`Invalid weekly issue key: ${issueKey}`);
  }
  const path = resolve(LOCK_ROOT, `${issueKey}.lock`);
  return { path, ownerPath: resolve(path, "owner.json") };
}

function isStale(path: string, staleMilliseconds: number): boolean {
  try {
    return Date.now() - statSync(path).mtimeMs >= staleMilliseconds;
  } catch {
    return true;
  }
}

function removeOwnedLock(path: string, token: string): void {
  const ownerPath = resolve(path, "owner.json");
  try {
    const owner = JSON.parse(readFileSync(ownerPath, "utf8")) as Partial<LockOwner>;
    if (owner.token !== token) return;
    unlinkSync(ownerPath);
    rmdirSync(path);
  } catch {
    // A failed cleanup must not hide the result of the actual operation.
  }
}

function reclaimStaleLock(path: string): boolean {
  const stalePath = `${path}.stale-${process.pid}-${Date.now()}`;
  try {
    // Rename is atomic: if another process already reclaimed the lock, this
    // process loses the race and simply retries acquisition.
    renameSync(path, stalePath);
  } catch {
    return false;
  }
  try {
    const ownerPath = resolve(stalePath, "owner.json");
    if (existsSync(ownerPath)) unlinkSync(ownerPath);
    rmdirSync(stalePath);
  } catch {
    // The renamed directory is harmless and will be ignored by future calls.
  }
  return true;
}

/**
 * File-based mutex for the local/persistent-server state backend.
 *
 * It prevents two requests in the same deployment from submitting the same
 * issue concurrently. Vercel serverless instances do not share this filesystem,
 * so production must replace this with a database/KV compare-and-set lock.
 */
export async function withDeliveryLock<T>(
  issueKey: string,
  operation: () => Promise<T> | T,
  options: { waitMs?: number; staleMs?: number } = {},
): Promise<T> {
  const { path, ownerPath } = lockPaths(issueKey);
  mkdirSync(LOCK_ROOT, { recursive: true });

  const waitMs = Math.max(0, options.waitMs ?? DEFAULT_WAIT_MS);
  const staleMs = Math.max(1_000, options.staleMs ?? DEFAULT_STALE_MS);
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + waitMs;

  for (;;) {
    try {
      // mkdir is atomic on both Windows and POSIX. Creating the directory is
      // the lock acquisition; owner.json is written afterwards for diagnostics.
      mkdirSync(path);
      const owner: LockOwner = {
        token,
        pid: process.pid,
        createdAt: new Date().toISOString(),
        issueKey,
      };
      writeFileSync(ownerPath, JSON.stringify(owner), { encoding: "utf8", mode: 0o600 });
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;
      if (isStale(path, staleMs)) reclaimStaleLock(path);
      if (Date.now() >= deadline) throw new WechatDeliveryLockError(issueKey);
      await sleep(Math.min(100, Math.max(10, deadline - Date.now())));
    }
  }

  try {
    return await operation();
  } finally {
    removeOwnedLock(path, token);
  }
}

