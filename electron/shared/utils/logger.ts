import fs from "fs";
import path from "path";

const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, "main.log");

export function logToFile(level: "info" | "error" | "warn", ...args: any[]) {
  const msg = `[${new Date().toISOString()}][${level.toUpperCase()}] ${args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}\n`;
  fs.appendFileSync(logFile, msg);
}