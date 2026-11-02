import "./env-clean";
import { ApiError } from "./api";

/** Reads a required server variable, failing with a message that names the variable (never its value). */
export function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new ApiError(500, `Server configuration problem: ${name} is not set. Add it in Vercel (Settings, Environment Variables) and redeploy.`, "CONFIG");
  }
  return v;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
