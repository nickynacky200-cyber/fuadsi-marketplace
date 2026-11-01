import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireOnboarded } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { reportSchema } from "@/lib/validators";
import { Report } from "@/models/Report";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";

export const POST = handle(async (req) => {
  const user = await requireOnboarded(req);
  await rateLimit(`report:${user._id}`, 10, 3600);
  const body = await parseBody(req, reportSchema);
  await connectDB();

  if (body.targetType === "product") {
    const p: any = await Product.findById(body.target).select("seller").lean();
    if (!p) throw new ApiError(404, "Product not found.");
    if (String(p.seller) === String(user._id)) throw new ApiError(400, "You can't report your own listing.");
  } else if (body.targetType === "user") {
    if (body.target === String(user._id)) throw new ApiError(400, "You can't report yourself.");
    if (!(await User.exists({ _id: body.target }))) throw new ApiError(404, "User not found.");
  } else {
    const o: any = await Order.findById(body.target).select("buyer seller").lean();
    if (!o || ![String(o.buyer), String(o.seller)].includes(String(user._id))) throw new ApiError(404, "Order not found.");
  }
  const dup = await Report.exists({ reporter: user._id, targetType: body.targetType, target: body.target, status: { $in: ["open", "reviewing"] } });
  if (dup) throw new ApiError(409, "You've already reported this. Our team will review it.");

  const r = await Report.create({ reporter: user._id, ...body });
  const admins = await User.find({ role: "admin", suspended: false }).select("_id").limit(20).lean();
  await Promise.all(admins.map((a: any) => notify({ user: String(a._id), type: "system", title: "New report to review", body: `${body.targetType} report: ${body.reason}`, link: "/admin?tab=reports" })));
  return json({ id: String(r._id) }, { status: 201 });
});
