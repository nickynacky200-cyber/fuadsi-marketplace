import { allowedNext, OrderStatus } from "./order-flow";

export const ORDER_POPULATE = [
  { path: "buyer", select: "name username photoUrl phone" },
  { path: "seller", select: "name username photoUrl" },
  { path: "store", select: "name slug whatsapp" },
];

export function orderDto(o: any, viewerId: string) {
  const role = String(o.buyer?._id || o.buyer) === viewerId ? "buyer" : "seller";
  const buyer = o.buyer && o.buyer.name !== undefined ? o.buyer : null;
  const seller = o.seller && o.seller.name !== undefined ? o.seller : null;
  const store = o.store && o.store.name !== undefined ? o.store : null;
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    status: o.status as OrderStatus,
    items: (o.items || []).map((i: any) => ({ productId: String(i.product), title: i.title, price: i.price, quantity: i.quantity, image: i.image })),
    total: o.total,
    deliveryMethod: o.deliveryMethod,
    meetingLocation: o.meetingLocation,
    buyerNote: o.buyerNote,
    reviewed: !!o.reviewed,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    history: (o.history || []).map((h: any) => ({ status: h.status, at: h.at, note: h.note })),
    role,
    buyer: buyer && { id: String(buyer._id), name: buyer.name, username: buyer.username, photoUrl: buyer.photoUrl },
    seller: seller && { id: String(seller._id), name: seller.name, username: seller.username, photoUrl: seller.photoUrl },
    store: store && { name: store.name, slug: store.slug, whatsapp: role === "buyer" ? store.whatsapp : "" },
    actions: allowedNext(role, o.status, o.deliveryMethod),
    canReview: role === "buyer" && o.status === "completed" && !o.reviewed,
  };
}
