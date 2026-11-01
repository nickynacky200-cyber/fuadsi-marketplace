export const dynamic = "force-dynamic";
import { handle, json, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { categorySchema } from "@/lib/validators";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { ensureCategories } from "@/lib/products";
import { slugify } from "@/lib/format";
import { audit } from "@/lib/audit";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  await ensureCategories();
  const rows: any[] = await Category.find().sort({ order: 1, name: 1 }).lean();
  const counts = await Product.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]);
  const map = new Map(counts.map((c: any) => [String(c._id), c.n]));
  return json({ items: rows.map((c) => ({ id: String(c._id), name: c.name, slug: c.slug, icon: c.icon, order: c.order, active: c.active, products: map.get(String(c._id)) || 0 })) });
});

export const POST = handle(async (req) => {
  const admin = await requireAdmin(req);
  const body = await parseBody(req, categorySchema);
  await connectDB();
  const last: any = await Category.findOne().sort({ order: -1 }).select("order").lean();
  const c = await Category.create({ name: body.name, slug: slugify(body.name), icon: body.icon || "MoreHorizontal", order: body.order ?? (last?.order ?? 0) + 1, active: body.active ?? true });
  await audit(String(admin._id), "category.create", "category", String(c._id), { name: c.name });
  return json({ id: String(c._id) }, { status: 201 });
});
