export const dynamic = "force-dynamic";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { storeSchema } from "@/lib/validators";
import { Store } from "@/models/Store";
import { isOwnedImage, destroyImages } from "@/lib/cloudinary";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/rate-limit";

const dto = (s: any) => ({
  id: String(s._id), slug: s.slug, name: s.name, description: s.description, avatarUrl: s.avatarUrl,
  whatsapp: s.whatsapp, available: s.available, ratingAvg: s.ratingAvg, ratingCount: s.ratingCount,
});

export const GET = handle(async (req) => {
  const user = await requireOnboarded(req);
  await connectDB();
  const store = await Store.findOne({ owner: user._id }).lean();
  return json({ store: store ? dto(store) : null });
});

/** Creates (free) or updates the caller's storefront. Slug always equals the owner's username. */
export const PUT = handle(async (req) => {
  const user = await requireOnboarded(req);
  await rateLimit(`store:${user._id}`, 30, 3600);
  const body = await parseBody(req, storeSchema);
  await connectDB();

  let whatsapp = "";
  if (body.whatsapp) {
    const n = normalizeWhatsAppNumber(body.whatsapp);
    if (!n) throw new ApiError(400, "Enter a valid WhatsApp number, e.g. 08012345678.");
    whatsapp = n;
  }
  let store = await Store.findOne({ owner: user._id });
  if (!store) {
    store = new Store({ owner: user._id, slug: user.username });
  }
  store.name = body.name;
  store.description = body.description;
  store.whatsapp = whatsapp;
  if (body.available !== undefined) store.available = body.available;
  if (body.avatar) {
    if (!isOwnedImage(body.avatar, String(user.uid), "stores")) throw new ApiError(400, "Invalid store image.");
    const old = store.avatarPublicId;
    store.avatarUrl = body.avatar.url;
    store.avatarPublicId = body.avatar.publicId;
    if (old && old !== body.avatar.publicId) destroyImages([old]);
  }
  await store.save();
  if (!user.isSeller) {
    user.isSeller = true;
    await user.save();
  }
  return json({ store: dto(store) });
});
