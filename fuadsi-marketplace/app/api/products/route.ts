export const dynamic = "force-dynamic";
import { ApiError, cacheable, handle, json, pageParams, pageResult, parseBody } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { productSchema } from "@/lib/validators";
import { Product, publicProductFilter } from "@/models/Product";
import { Category } from "@/models/Category";
import { Store } from "@/models/Store";
import { User } from "@/models/User";
import { isOwnedImage } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { buildSearchTokens, queryTokens } from "@/lib/search";
import { discountPercent } from "@/lib/format";
import { PRODUCT_POPULATE, ensureCategories, toPublicProduct } from "@/lib/products";
import { notify } from "@/lib/notify";

const SORTS: Record<string, any> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
  popular: { favouriteCount: -1, viewCount: -1, createdAt: -1 },
  discount: { discountPercent: -1, createdAt: -1 },
};

export const GET = handle(async (req) => {
  await connectDB();
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, limit, skip } = pageParams(url);
  const filter: any = { ...publicProductFilter };

  const section = sp.get("section");
  let sortKey = sp.get("sort") || "newest";
  if (section === "hot") {
    filter.discountPercent = { $gt: 0 };
    sortKey = "discount";
  } else if (section === "recommended") sortKey = "popular";

  const cat = sp.get("category");
  if (cat) {
    await ensureCategories();
    const c = /^[a-f\d]{24}$/i.test(cat) ? await Category.findById(cat).select("_id").lean() : await Category.findOne({ slug: cat.toLowerCase() }).select("_id").lean();
    if (!c) return cacheable(pageResult([], 0, page, limit), 15, 60);
    filter.category = (c as any)._id;
  }

  const storeSlug = sp.get("store");
  if (storeSlug) {
    const s = await Store.findOne({ slug: storeSlug.toLowerCase() }).select("_id").lean();
    if (!s) return cacheable(pageResult([], 0, page, limit), 15, 60);
    filter.store = (s as any)._id;
  }

  const q = (sp.get("q") || "").slice(0, 80);
  const tokens = queryTokens(q);
  if (tokens.length) filter.searchTokens = { $all: tokens };

  const min = Number(sp.get("min"));
  const max = Number(sp.get("max"));
  if ((sp.get("min") && Number.isFinite(min)) || (sp.get("max") && Number.isFinite(max))) {
    filter.price = {};
    if (sp.get("min") && Number.isFinite(min)) filter.price.$gte = Math.max(0, min);
    if (sp.get("max") && Number.isFinite(max)) filter.price.$lte = max;
  }
  const cond = sp.get("condition");
  if (cond === "new" || cond === "used") filter.condition = cond;

  const [rows, total] = await Promise.all([
    Product.find(filter).sort(SORTS[sortKey] || SORTS.newest).skip(skip).limit(limit).populate(PRODUCT_POPULATE).lean(),
    Product.countDocuments(filter),
  ]);
  return cacheable(pageResult(rows.map((r: any) => toPublicProduct(r)), total, page, limit), 20, 90);
});

export const POST = handle(async (req) => {
  const user = await requireOnboarded(req);
  await rateLimit(`product-create:${user._id}`, 20, 3600);
  const body = await parseBody(req, productSchema);
  await connectDB();

  const store = await Store.findOne({ owner: user._id });
  if (!user.isSeller || !store) throw new ApiError(403, "Open your free store before listing products.", "NO_STORE");

  await ensureCategories();
  const category = await Category.findOne({ _id: body.category, active: true }).lean();
  if (!category) throw new ApiError(400, "Choose a valid category.");

  for (const img of body.images) {
    if (!isOwnedImage(img, String(user.uid), "products")) throw new ApiError(400, "One of the images was not uploaded through the marketplace.");
  }

  const original = body.originalPrice || null;
  const product = await Product.create({
    title: body.title,
    description: body.description,
    price: body.price,
    originalPrice: original,
    discountPercent: discountPercent(body.price, original),
    quantity: body.quantity,
    category: body.category,
    condition: body.condition,
    location: body.location || "FUADSI campus",
    images: body.images,
    seller: user._id,
    store: store._id,
    status: "PENDING_APPROVAL", // never self-approved
    searchTokens: buildSearchTokens(body.title, (category as any).name),
  });

  const admins = await User.find({ role: "admin", suspended: false }).select("_id").limit(20).lean();
  await Promise.all(admins.map((a: any) => notify({ user: String(a._id), type: "system", title: "New listing awaiting review", body: body.title, link: "/admin?tab=products" })));
  return json({ id: String(product._id), status: "PENDING_APPROVAL" }, { status: 201 });
});
