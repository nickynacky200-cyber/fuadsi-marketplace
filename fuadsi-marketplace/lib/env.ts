import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

const schema = z.object({
  MONGODB_URI: z.string().min(10, "MONGODB_URI is required"),
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, "FIREBASE_CLIENT_EMAIL is required"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  UPSTASH_REDIS_REST_URL: isProd ? z.string().url("UPSTASH_REDIS_REST_URL is required in production") : z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: isProd ? z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required in production") : z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof schema>;
let cached: ServerEnv | null = null;

/** Validated lazily so `next build` works without secrets, but any request fails fast with a clear message. */
export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.message).join("; ");
    console.error("[env] Invalid server environment:", missing);
    throw new Error("Server is not configured correctly. Check environment variables.");
  }
  cached = parsed.data;
  return cached;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
