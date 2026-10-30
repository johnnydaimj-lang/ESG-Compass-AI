import {
  contentOpsPaths,
  listContentSignals,
  validateContentSignal,
} from "@/lib/content-ops/signal-store";

const signals = listContentSignals();
const errors = signals.flatMap((signal) =>
  validateContentSignal(signal).map((error) => `${signal.signalId}: ${error}`),
);
const paths = contentOpsPaths();

console.log(JSON.stringify({
  valid: errors.length === 0,
  signals: signals.length,
  errors,
  paths,
}, null, 2));

if (errors.length > 0) process.exitCode = 1;
