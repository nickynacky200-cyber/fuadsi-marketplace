import { z } from "zod";
import { LIMITS } from "./constants";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const imageRef = z.object({
  url: z.string().url().max(500),
  publicId: z.string().min(5).max(200),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
});

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30)
  .regex(/^[a-z0-9][a-z0-9_.-]*$/, "Use letters, numbers, dots, dashes or underscores");

export const RESERVED_USERNAMES = ["admin", "api", "store", "shop", "sell", "login", "signup", "support", "fuadsi", "messages", "cart", "dashboard", "me", "help"];

export const profileSchema = z.object({
  name: trimmed(2, 80),
  username: usernameSchema.optional(),
  phone: z.string().trim().max(20).optional(),
  affiliation: z.enum(["student", "staff", "alumni", "other"]).optional(),
  department: optionalText(80),
  level: optionalText(20),
  photo: imageRef.nullable().optional(),
});

export const storeSchema = z.object({
  name: trimmed(2, 60),
  description: optionalText(600),
  whatsapp: z.string().trim().max(20).optional().default(""),
  available: z.boolean().optional(),
  avatar: imageRef.nullable().optional(),
});

export const productSchema = z
  .object({
    title: trimmed(3, 120),
    description: trimmed(10, 4000),
    price: z.number().int().min(0).max(1_000_000_000),
    originalPrice: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    quantity: z.number().int().min(0).max(100000),
    category: objectId,
    condition: z.enum(["new", "used"]),
    location: optionalText(100),
    images: z.array(imageRef).min(1, "Add at least one image").max(LIMITS.maxImagesPerProduct),
  })
  .refine((p) => p.originalPrice == null || p.originalPrice === 0 || p.originalPrice > p.price, {
    message: "Original price must be higher than the selling price",
    path: ["originalPrice"],
  });

export const productPatchSchema = z.object({
  title: trimmed(3, 120).optional(),
  description: trimmed(10, 4000).optional(),
  price: z.number().int().min(0).max(1_000_000_000).optional(),
  originalPrice: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  quantity: z.number().int().min(0).max(100000).optional(),
  category: objectId.optional(),
  condition: z.enum(["new", "used"]).optional(),
  location: z.string().trim().max(100).optional(),
  images: z.array(imageRef).min(1).max(LIMITS.maxImagesPerProduct).optional(),
  isAvailable: z.boolean().optional(),
});

export const orderCreateSchema = z.object({
  items: z.array(z.object({ productId: objectId, quantity: z.number().int().min(1).max(100) })).min(1).max(20),
  deliveryMethod: z.enum(["meetup", "campus_delivery"]),
  meetingLocation: optionalText(200),
  note: optionalText(500),
});

export const orderPatchSchema = z.object({
  status: z.enum(["accepted", "rejected", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"]).optional(),
  meetingLocation: z.string().trim().max(200).optional(),
  note: z.string().trim().max(300).optional(),
});

export const reviewSchema = z.object({
  orderId: objectId,
  rating: z.number().int().min(1).max(5),
  comment: optionalText(600),
});

export const startConversationSchema = z.object({ userId: objectId, productId: objectId.optional() });

export const messageSchema = z
  .object({
    text: z.string().trim().max(LIMITS.maxMessageLength).optional().default(""),
    image: z.object({ url: z.string().url().max(500), publicId: z.string().min(5).max(200) }).nullable().optional(),
    productId: objectId.optional(),
    clientId: z.string().min(8).max(64).optional(),
  })
  .refine((m) => m.text.length > 0 || m.image || m.productId, { message: "Message cannot be empty" });

export const reportSchema = z.object({
  targetType: z.enum(["product", "user", "order"]),
  target: objectId,
  reason: z.enum(["scam", "prohibited", "inappropriate", "fake", "harassment", "other"]),
  details: optionalText(800),
});

export const adminProductActionSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  reason: z.string().trim().max(300).optional(),
});

export const adminUserActionSchema = z.object({
  action: z.enum(["suspend", "restore", "verify", "unverify", "make_admin", "remove_admin"]),
  reason: z.string().trim().max(300).optional(),
});

export const adminReportSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
  resolution: z.string().trim().max(500).optional().default(""),
  action: z.enum(["none", "suspend_product", "suspend_user"]).optional().default("none"),
});

export const categorySchema = z.object({
  name: trimmed(2, 60),
  icon: z.string().trim().max(40).optional(),
  order: z.number().int().min(0).max(1000).optional(),
  active: z.boolean().optional(),
});
