export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import "@/lib/env-clean";
import { connectDB } from "@/lib/db";
import { kv } from "@/lib/kv";
import { adminAuth } from "@/lib/firebase-admin";

const REQUIRED = [
  "MONGODB_URI", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY",
  "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "ADMIN_EMAILS",
  "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID", "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
];

// Never echo secrets or connection strings: strip anything URL-like and truncate.
const safe = (e: any) => String(e?.message || e).replace(/\S*:\/\/\S*/g, "[url]").slice(0, 200);

async function check(fn: () => Promise<void>) {
  try {
    await fn();
    return "ok";
  } catch (e) {
    return `FAILED: ${safe(e)}`;
  }
}

/** Diagnostics: names of missing variables (never values) and whether each backing service works. */
export async function GET() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  const hints: string[] = [];
  const key = process.env.FIREBASE_PRIVATE_KEY || "";
  if (key && !key.includes("BEGIN PRIVATE KEY")) hints.push("FIREBASE_PRIVATE_KEY does not look like a private key.");
  if (process.env.FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) hints.push("FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_PROJECT_ID differ: logins will fail.");
  if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== process.env.CLOUDINARY_CLOUD_NAME) hints.push("The two Cloudinary cloud names differ.");
  hints.push("NEXT_PUBLIC_* variables are baked in at build time: after changing them you must Redeploy.");

  const redisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const [mongo, redis, firebaseAdmin] = await Promise.all([
    check(async () => { await connectDB(); await mongoose.connection.db!.admin().ping(); }),
    redisConfigured
      ? check(async () => { await kv().set("health:ping", 1, 10); if ((await kv().get("health:ping")) == null) throw new Error("write ok, read empty"); })
      : Promise.resolve("NOT CONFIGURED: realtime chat and rate limiting are degraded (add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or connect Upstash in Vercel)"),
    check(async () => { await adminAuth().listUsers(1); }),
  ]);

  const core = missing.length === 0 && mongo === "ok" && firebaseAdmin === "ok";
  return NextResponse.json(
    { loginWillWork: mongo === "ok" && firebaseAdmin === "ok", ok: core && redis === "ok", missingEnv: missing, hints, mongodb: mongo, firebaseAdmin, redis, nodeEnv: process.env.NODE_ENV },
    { status: core ? 200 : 503 }
  );
}
