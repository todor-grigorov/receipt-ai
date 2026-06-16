const isDev = process.env.NODE_ENV === "development";

export function info(...args: unknown[]): void {
  if (isDev) console.info("[ReceiptAI]", ...args);
}

export function error(...args: unknown[]): void {
  console.error("[ReceiptAI]", ...args);
}

export function warn(...args: unknown[]): void {
  if (isDev) console.warn("[ReceiptAI]", ...args);
}

export function debug(...args: unknown[]): void {
  if (isDev) console.debug("[ReceiptAI]", ...args);
}
