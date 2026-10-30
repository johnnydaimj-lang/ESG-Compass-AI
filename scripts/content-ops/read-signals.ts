import {
  readNewContentSignals,
} from "@/lib/content-ops/signal-store";
import { hasFlag, readArg } from "./_args";

const consumer = readArg("consumer") || "employee-2";
const limit = Number(readArg("limit")) || undefined;
const updateCursor = hasFlag("update-cursor");
const result = readNewContentSignals({
  consumer,
  limit,
  updateCursor,
});

console.log(JSON.stringify({
  consumer,
  updateCursor,
  count: result.signals.length,
  cursorFound: result.cursorFound,
  cursor: result.cursor,
  signals: result.signals,
}, null, 2));
