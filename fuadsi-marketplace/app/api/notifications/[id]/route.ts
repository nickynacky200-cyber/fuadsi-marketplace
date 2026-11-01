import { handle, json, oid } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser(req);
  const id = oid(params.id, "notification id");
  await connectDB();
  await Notification.updateOne({ _id: id, user: user._id }, { $set: { read: true } });
  return json({ ok: true });
});
