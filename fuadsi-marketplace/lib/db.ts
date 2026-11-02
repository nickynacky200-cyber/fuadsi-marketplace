import mongoose from "mongoose";
import { need } from "./env";
import { ApiError } from "./api";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = g._mongoose || (g._mongoose = { conn: null, promise: null });

/** Reuses a single connection across warm serverless invocations. */
export async function connectDB() {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;
  const uri = need("MONGODB_URI");
  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
  }
  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (e) {
    cache.promise = null;
    cache.conn = null;
    console.error("[db] connection failed:", (e as Error).message);
    throw new ApiError(
      503,
      "Can't reach the database. Check MONGODB_URI (special characters in the password must be URL-encoded) and in MongoDB Atlas, Network Access, allow 0.0.0.0/0.",
      "DB_UNAVAILABLE"
    );
  }
}
