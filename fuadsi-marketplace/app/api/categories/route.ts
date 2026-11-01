export const dynamic = "force-dynamic";
import { cacheable, handle } from "@/lib/api";
import { ensureCategories } from "@/lib/products";
import { Category } from "@/models/Category";

export const GET = handle(async () => {
  await ensureCategories();
  const rows = await Category.find({ active: true }).sort({ order: 1, name: 1 }).lean();
  return cacheable({ items: rows.map((c: any) => ({ id: String(c._id), name: c.name, slug: c.slug, icon: c.icon })) }, 60, 300);
});
