import { Category } from "@/models/Category";
import { DEFAULT_CATEGORIES } from "./constants";
import { connectDB } from "./db";

export const PRODUCT_POPULATE = [
  {
    path: "store",
    select: "name slug avatarUrl ratingAvg ratingCount whatsapp available owner",
    populate: { path: "owner", select: "verified" },
  },
  { path: "category", select: "name slug" },
];

export function toPublicProduct(p: any, opts: { detail?: boolean } = {}) {
  const store = p.store && typeof p.store === "object" ? p.store : null;
  const out: any = {
    id: String(p._id),
    title: p.title,
    price: p.price,
    originalPrice: p.originalPrice || null,
    discountPercent: p.discountPercent || 0,
    quantity: p.quantity,
    condition: p.condition,
    status: p.status,
    isAvailable: p.isAvailable,
    image: p.images?.[0]?.url || null,
    images: p.images?.map((i: any) => ({ url: i.url, publicId: i.publicId })) || [],
    category: p.category && typeof p.category === "object" ? { id: String(p.category._id), name: p.category.name, slug: p.category.slug } : null,
    location: p.location,
    createdAt: p.createdAt,
    seller: String(p.seller?._id || p.seller),
    store: store
      ? {
          id: String(store._id),
          name: store.name,
          slug: store.slug,
          avatarUrl: store.avatarUrl,
          ratingAvg: store.ratingAvg,
          ratingCount: store.ratingCount,
          available: store.available,
          verified: !!store.owner?.verified,
        }
      : null,
  };
  if (opts.detail) {
    out.description = p.description;
    out.viewCount = p.viewCount;
    out.favouriteCount = p.favouriteCount;
    out.rejectionReason = p.rejectionReason || "";
    if (store) out.store.whatsapp = store.whatsapp || "";
  }
  return out;
}

/** Categories are reference data (not products). The 11 standard ones are created on first use. */
export async function ensureCategories() {
  await connectDB();
  const count = await Category.estimatedDocumentCount();
  if (count === 0) {
    try {
      await Category.insertMany(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i })), { ordered: false });
    } catch {
      /* concurrent first requests: duplicates are fine */
    }
  }
}
