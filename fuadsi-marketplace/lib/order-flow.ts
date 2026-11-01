export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type DeliveryMethod = "meetup" | "campus_delivery";
export type OrderRole = "buyer" | "seller";

export const ORDER_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function allowedNext(role: OrderRole, from: OrderStatus, delivery: DeliveryMethod): OrderStatus[] {
  if (role === "buyer") {
    // Buyers may cancel until the seller starts preparing hand-over.
    return from === "pending" || from === "accepted" ? ["cancelled"] : [];
  }
  switch (from) {
    case "pending":
      return ["accepted", "rejected"];
    case "accepted":
      return delivery === "meetup" ? ["ready_for_pickup", "completed"] : ["out_for_delivery", "completed"];
    case "ready_for_pickup":
    case "out_for_delivery":
      return ["completed"];
    default:
      return [];
  }
}

export function canTransition(role: OrderRole, from: OrderStatus, to: OrderStatus, delivery: DeliveryMethod): boolean {
  return allowedNext(role, from, delivery).includes(to);
}

/** Statuses during which stock is held against the order. */
export function reservesStock(status: OrderStatus): boolean {
  return ["accepted", "ready_for_pickup", "out_for_delivery", "completed"].includes(status);
}

export function isActive(status: OrderStatus): boolean {
  return !["rejected", "completed", "cancelled"].includes(status);
}
