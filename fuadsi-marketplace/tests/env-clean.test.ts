import { test } from "node:test";
import assert from "node:assert/strict";

test("env-clean strips quotes, maps Vercel KV names and unpacks service-account JSON", async () => {
  process.env.MONGODB_URI = '"mongodb+srv://u:p@c.mongodb.net/db"';
  process.env.KV_REST_API_URL = "https://example.upstash.io";
  process.env.KV_REST_API_TOKEN = "tok";
  process.env.FIREBASE_PRIVATE_KEY = JSON.stringify({ project_id: "proj", client_email: "a@proj.iam.gserviceaccount.com", private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n" });
  await import("../lib/env-clean.ts");
  assert.equal(process.env.MONGODB_URI, "mongodb+srv://u:p@c.mongodb.net/db");
  assert.equal(process.env.UPSTASH_REDIS_REST_URL, "https://example.upstash.io");
  assert.equal(process.env.UPSTASH_REDIS_REST_TOKEN, "tok");
  assert.equal(process.env.FIREBASE_PROJECT_ID, "proj");
  assert.ok(process.env.FIREBASE_PRIVATE_KEY!.includes("BEGIN PRIVATE KEY"));
});
