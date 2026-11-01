import { z } from "zod";
import { handle, json, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { signUpload } from "@/lib/cloudinary";

const schema = z.object({ kind: z.enum(["products", "avatars", "chat", "stores"]) });

export const POST = handle(async (req) => {
  const user = await requireUser(req);
  await rateLimit(`sign:${user._id}`, 60, 3600);
  const { kind } = await parseBody(req, schema);
  return json(signUpload(kind, String(user.uid)));
});
