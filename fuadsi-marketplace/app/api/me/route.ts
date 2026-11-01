export const dynamic = "force-dynamic";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireUser, requireVerifiedEmail } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { profileSchema, RESERVED_USERNAMES } from "@/lib/validators";
import { User } from "@/models/User";
import { Store } from "@/models/Store";
import { isOwnedImage, destroyImages } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { meDto } from "@/lib/dto";

export const GET = handle(async (req) => {
  const user = await requireUser(req);
  const store = user.isSeller ? await Store.findOne({ owner: user._id }).select("name slug").lean() : null;
  return json({ user: meDto(user), store });
});

export const PATCH = handle(async (req) => {
  const user = await requireVerifiedEmail(req);
  await rateLimit(`profile:${user._id}`, 20, 3600);
  const body = await parseBody(req, profileSchema);
  await connectDB();

  if (body.username && body.username !== user.username) {
    if (user.username && user.isSeller) throw new ApiError(400, "Your username is your store link and can't be changed once you have a store.");
    if (RESERVED_USERNAMES.includes(body.username)) throw new ApiError(400, "That username is reserved.");
    const taken = await User.exists({ username: body.username, _id: { $ne: user._id } });
    if (taken) throw new ApiError(409, "That username is taken.");
    user.username = body.username;
  }
  user.name = body.name;
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.affiliation) user.affiliation = body.affiliation;
  if (body.department !== undefined) user.department = body.department;
  if (body.level !== undefined) user.level = body.level;

  if (body.photo) {
    if (!isOwnedImage(body.photo, String(user.uid), "avatars")) throw new ApiError(400, "Invalid profile photo.");
    const old = user.photoPublicId;
    user.photoUrl = body.photo.url;
    user.photoPublicId = body.photo.publicId;
    if (old && old !== body.photo.publicId) destroyImages([old]);
  }
  if (!user.username) throw new ApiError(400, "Choose a username to finish setting up your profile.");
  user.onboarded = true;
  await user.save();
  return json({ user: meDto(user) });
});
