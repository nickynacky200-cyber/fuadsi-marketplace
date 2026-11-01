// Usage: node scripts/check-env.mjs   (loads .env.local if present)
import { existsSync, readFileSync } from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "MONGODB_URI", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY",
  "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "ADMIN_EMAILS",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing environment variables:\n - " + missing.join("\n - "));
  process.exit(1);
}
if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== process.env.CLOUDINARY_CLOUD_NAME) console.warn("Warning: the two Cloudinary cloud names differ.");
if (!process.env.FIREBASE_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")) console.warn("Warning: FIREBASE_PRIVATE_KEY does not look like a private key.");
console.log("Environment looks complete.");
