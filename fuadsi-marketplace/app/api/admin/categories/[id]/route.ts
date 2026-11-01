import { ApiError, handle, json, oid, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { categorySchema } from "@/lib/validators";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { audit } from "@/lib/audit";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req, { params }: Ctx) => {
  const admin = await requireAdmin(req);
  const id = oid(params.id, "category id");
  const body = await parseBody(req, categorySchema.partial());
  await connectDB();
  const c = await Category.findById(id);
  if (!c) throw new ApiError(404, "Category not found.");
  if (body.name !== undefined) c.name = body.name; // slug stays stable so links don't break
  if (body.icon !== undefined) c.icon = body.icon;
  if (body.order !== undefined) c.order = body.order;
  if (body.active !== undefined) c.active = body.active;
  await c.save();
  await audit(String(admin._id), "category.update", "category", id, body);
  return json({ ok: true });
});

export const DELETE = handle(async (req, { params }: Ctx) => {
  const admin = await requireAdmin(req);
  const id = oid(params.id, "category id");
  await connectDB();
  if (await Product.exists({ category: id })) throw new ApiError(409, "Products use this category. Hide it instead of deleting it.");
  await Category.deleteOne({ _id: id });
  await audit(String(admin._id), "category.delete", "category", id);
  return json({ ok: true });
});
