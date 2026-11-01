export const dynamic = "force-dynamic";
import { z } from "zod";
import { handle, json, pageParams, pageResult, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";

export const GET = handle(async (req) => {
  const user = await requireUser(req);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip } = pageParams(url, 20);
  const filter: any = { user: user._id };
  if (url.searchParams.get("unread") === "1") filter.read = false;
  const [rows, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: user._id, read: false }),
  ]);
  const items = rows.map((n: any) => ({ id: String(n._id), type: n.type, title: n.title, body: n.body, link: n.link, read: n.read, createdAt: n.createdAt }));
  return json({ ...pageResult(items, total, page, limit), unread });
});

export const PATCH = handle(async (req) => {
  const user = await requireUser(req);
  await parseBody(req, z.object({ all: z.literal(true) }));
  await connectDB();
  await Notification.updateMany({ user: user._id, read: false }, { $set: { read: true } });
  return json({ ok: true });
});
