import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { destroyImages } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

const schema = z.object({ publicId: z.string().min(5).max(200) });

/** Removes an image the caller uploaded but never attached to a listing (e.g. a cancelled form). */
export const POST = handle(async (req) => {
  const user = await requireUser(req);
  await rateLimit(`udel:${user._id}`, 60, 3600);
  const { publicId } = await parseBody(req, schema);
  if (!/^fuadsi\/(products|avatars|chat|stores)\//.test(publicId) || !publicId.includes(`/${user.uid}/`)) {
    throw new ApiError(403, "You can only delete your own uploads.");
  }
  await connectDB();
  if (await Product.exists({ "images.publicId": publicId })) throw new ApiError(409, "That image is attached to a listing.");
  await destroyImages([publicId]);
  return json({ ok: true });
});
