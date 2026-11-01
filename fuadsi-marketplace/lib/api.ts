import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import mongoose from "mongoose";
import { LIMITS } from "./constants";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

export const cacheable = (data: unknown, sMaxAge = 30, swr = 120) =>
  NextResponse.json(data, { headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}` } });

/** Wraps a route handler: consistent JSON errors, no stack traces or internals leaked to clients. */
export function handle<C = any>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (err: any) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const path = first?.path?.join(".") || "request";
        return NextResponse.json({ error: `${path}: ${first?.message || "Invalid value"}`, code: "VALIDATION" }, { status: 400 });
      }
      if (err?.code === 11000) {
        return NextResponse.json({ error: "That value is already taken.", code: "DUPLICATE" }, { status: 409 });
      }
      console.error("[api]", req.method, new URL(req.url).pathname, err?.message || err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  return schema.parse(raw);
}

export function isObjectId(v: unknown): v is string {
  return typeof v === "string" && /^[a-f\d]{24}$/i.test(v);
}

export function oid(v: unknown, label = "id"): string {
  if (!isObjectId(v)) throw new ApiError(400, `Invalid ${label}.`);
  return v;
}

export const toObjectId = (v: string) => new mongoose.Types.ObjectId(v);

export function pageParams(url: URL, defaultSize: number = LIMITS.pageSize) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(LIMITS.maxPageSize, Math.max(1, parseInt(url.searchParams.get("limit") || String(defaultSize), 10) || defaultSize));
  return { page, limit, skip: (page - 1) * limit };
}

export const pageResult = <T>(items: T[], total: number, page: number, limit: number) => ({
  items,
  total,
  page,
  pages: Math.max(1, Math.ceil(total / limit)),
});

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
