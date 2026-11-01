export const dynamic = "force-dynamic";
import { escapeRegex, handle, json, pageParams, pageResult } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip } = pageParams(url, 20);
  const filter: any = {};
  const q = (url.searchParams.get("q") || "").trim().slice(0, 60);
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { username: rx }];
  }
  const f = url.searchParams.get("filter");
  if (f === "suspended") filter.suspended = true;
  if (f === "sellers") filter.isSeller = true;
  if (f === "admins") filter.role = "admin";
  if (f === "verified") filter.verified = true;
  const [rows, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(filter)]);
  const items = rows.map((u: any) => ({
    id: String(u._id), name: u.name, email: u.email, username: u.username, photoUrl: u.photoUrl, affiliation: u.affiliation,
    department: u.department, verified: u.verified, role: u.role, suspended: u.suspended, isSeller: u.isSeller, createdAt: u.createdAt,
  }));
  return json(pageResult(items, total, page, limit));
});
