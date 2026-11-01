export const dynamic = "force-dynamic";
import { handle, json, pageParams, pageResult } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AdminLog } from "@/models/AdminLog";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  await connectDB();
  const { page, limit, skip } = pageParams(new URL(req.url), 30);
  const [rows, total] = await Promise.all([AdminLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("admin", "name email").lean(), AdminLog.estimatedDocumentCount()]);
  return json(pageResult(rows.map((l: any) => ({ id: String(l._id), admin: l.admin?.name || l.admin?.email || "Admin", action: l.action, targetType: l.targetType, targetId: l.targetId, meta: l.meta, at: l.createdAt })), total, page, limit));
});
