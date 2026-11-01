export const DEFAULT_CATEGORIES = [
  { slug: "phones-accessories", name: "Phones & Accessories", icon: "Smartphone" },
  { slug: "laptops-computers", name: "Laptops & Computers", icon: "Laptop" },
  { slug: "fashion-clothing", name: "Fashion & Clothing", icon: "Shirt" },
  { slug: "shoes-bags", name: "Shoes & Bags", icon: "ShoppingBag" },
  { slug: "food-drinks", name: "Food & Drinks", icon: "UtensilsCrossed" },
  { slug: "books-materials", name: "Books & Educational Materials", icon: "BookOpen" },
  { slug: "electronics", name: "Electronics", icon: "Cpu" },
  { slug: "beauty-skincare", name: "Beauty & Skincare", icon: "Sparkles" },
  { slug: "hostel-accommodation", name: "Hostel & Accommodation", icon: "Building2" },
  { slug: "services", name: "Services", icon: "Wrench" },
  { slug: "others", name: "Others", icon: "MoreHorizontal" },
] as const;

export const PRODUCT_STATUSES = ["PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED", "SOLD_OUT"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  SOLD_OUT: "Sold out",
};

export const CONDITIONS = ["new", "used"] as const;
export const CONDITION_LABEL = { new: "New", used: "Fairly used" } as const;

export const AFFILIATIONS = [
  { value: "student", label: "FUADSI student" },
  { value: "staff", label: "FUADSI staff" },
  { value: "alumni", label: "FUADSI alumnus / alumna" },
  { value: "other", label: "Not affiliated with FUADSI" },
] as const;

export const DELIVERY_LABEL = { meetup: "Campus meetup", campus_delivery: "Campus delivery" } as const;

export const LIMITS = {
  maxImagesPerProduct: 6,
  maxImageBytes: 5 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  maxMessageLength: 2000,
  pageSize: 12,
  maxPageSize: 48,
} as const;

export const PAYMENT_NOTICE =
  "FUADSI Marketplace does not process payments. You and the other party arrange payment and delivery directly, so only pay after you have seen the item.";
