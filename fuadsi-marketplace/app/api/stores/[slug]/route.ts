export const dynamic = "force-dynamic";
import { ApiError, handle, json } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Store } from "@/models/Store";
import { Product } from "@/models/Product";

export const GET = handle(async (_req, { params }: { params: { slug: string } }) => {
  await connectDB();
  const s: any = await Store.findOne({ slug: String(params.slug).toLowerCase().slice(0, 40) }).populate("owner", "verified name affiliation department").lean();
  if (!s) throw new ApiError(404, "Store not found.");
  const productCount = await Product.countDocuments({ store: s._id, status: "APPROVED", isAvailable: true });
  return json({
    store: {
      id: String(s._id), ownerId: String(s.owner._id), slug: s.slug, name: s.name, description: s.description, avatarUrl: s.avatarUrl,
      whatsapp: s.whatsapp, available: s.available, ratingAvg: s.ratingAvg, ratingCount: s.ratingCount,
      verified: !!s.owner.verified, affiliation: s.owner.affiliation, department: s.owner.department, productCount, joinedAt: s.createdAt,
    },
  });
});
