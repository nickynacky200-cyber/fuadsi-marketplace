export const dynamic = "force-dynamic";
import { cacheable, handle } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Store } from "@/models/Store";

/** Top sellers = stores with the most approved, available listings. Real data only. */
export const GET = handle(async () => {
  await connectDB();
  const agg = await Product.aggregate([
    { $match: { status: "APPROVED", isAvailable: true } },
    { $group: { _id: "$store", products: { $sum: 1 } } },
    { $sort: { products: -1 } },
    { $limit: 5 },
  ]);
  if (!agg.length) return cacheable({ items: [] }, 30, 120);
  const stores: any[] = await Store.find({ _id: { $in: agg.map((a: any) => a._id) }, available: true }).populate("owner", "verified").lean();
  const byId = new Map(stores.map((s) => [String(s._id), s]));
  const items = agg
    .map((a: any) => {
      const s = byId.get(String(a._id));
      return s && { id: String(s._id), slug: s.slug, name: s.name, avatarUrl: s.avatarUrl, verified: !!s.owner?.verified, ratingAvg: s.ratingAvg, ratingCount: s.ratingCount, products: a.products };
    })
    .filter(Boolean);
  return cacheable({ items }, 30, 120);
});
