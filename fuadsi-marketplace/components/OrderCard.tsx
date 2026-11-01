"use client";
import Link from "next/link";
import { useState } from "react";
import { CalendarClock, MapPin, MessageCircle, Phone } from "lucide-react";
import { api, errorMessage } from "@/lib/api-client";
import { formatNaira, timeAgo } from "@/lib/format";
import { DELIVERY_LABEL } from "@/lib/constants";
import { ORDER_LABELS, OrderStatus } from "@/lib/order-flow";
import { Avatar, Modal, StatusChip } from "@/components/ui/primitives";
import { ChatSellerButton, WhatsAppButton } from "@/components/ContactButtons";
import { ReportButton } from "@/components/ReportButton";
import { useToast } from "@/components/providers/ToastProvider";
import clsx from "clsx";

const TONE: Record<OrderStatus, "green" | "amber" | "red" | "purple" | "gray"> = { pending: "amber", accepted: "purple", rejected: "red", ready_for_pickup: "green", out_for_delivery: "green", completed: "green", cancelled: "gray" };
const ACTION_LABEL: Record<string, string> = { accepted: "Accept", rejected: "Reject", ready_for_pickup: "Ready for pickup", out_for_delivery: "Out for delivery", completed: "Mark completed", cancelled: "Cancel order" };

export function OrderCard({ order, onChange }: { order: any; onChange: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [place, setPlace] = useState(order.meetingLocation || "");
  const [editPlace, setEditPlace] = useState(false);
  const isSeller = order.role === "seller";
  const other = isSeller ? order.buyer : order.seller;
  const active = !["rejected", "completed", "cancelled"].includes(order.status);

  const act = async (status: string) => {
    if (status === "cancelled" && !confirm("Cancel this order?")) return;
    if (status === "rejected" && !confirm("Reject this order?")) return;
    setBusy(true);
    try { await api(`/orders/${order.id}`, { method: "PATCH", body: { status } }); onChange(); }
    catch (e) { toast("error", errorMessage(e)); } finally { setBusy(false); }
  };
  const savePlace = async () => {
    setBusy(true);
    try { await api(`/orders/${order.id}`, { method: "PATCH", body: { meetingLocation: place } }); setEditPlace(false); toast("success", "Meeting place updated."); onChange(); }
    catch (e) { toast("error", errorMessage(e)); } finally { setBusy(false); }
  };
  const sendReview = async () => {
    setBusy(true);
    try { await api("/reviews", { method: "POST", body: { orderId: order.id, rating, comment } }); toast("success", "Thanks for your review!"); setReview(false); onChange(); }
    catch (e) { toast("error", errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <article className="card space-y-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-sm font-extrabold">{order.orderNumber}</p><p className="flex items-center gap-1 text-xs text-ink-mute"><CalendarClock className="h-3.5 w-3.5" />{timeAgo(order.createdAt)}</p></div>
        <StatusChip label={ORDER_LABELS[order.status as OrderStatus]} tone={TONE[order.status as OrderStatus]} />
      </header>
      <ul className="space-y-2">
        {order.items.map((i: any) => (
          <li key={i.productId} className="flex items-center gap-3">
            <Link href={`/product/${i.productId}`} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-lav">{i.image && <img src={i.image.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_120,c_fill,h_120/")} alt="" className="h-full w-full object-cover" />}</Link>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{i.title}</p><p className="text-xs text-ink-soft">{i.quantity} x {formatNaira(i.price)}</p></div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-brand-100 pt-2.5 text-sm"><span className="text-ink-soft">{DELIVERY_LABEL[order.deliveryMethod as keyof typeof DELIVERY_LABEL]}</span><span className="font-extrabold text-brand-700">{formatNaira(order.total)}</span></div>

      <div className="flex items-center gap-2.5 rounded-xl bg-lav p-2.5 text-sm">
        <Avatar src={other?.photoUrl} name={other?.name} size={32} />
        <div className="min-w-0 flex-1"><p className="truncate font-semibold">{other?.name}</p><p className="text-xs text-ink-mute">{isSeller ? "Buyer" : order.store?.name || "Seller"}</p></div>
        {other?.id && <ChatSellerButton sellerId={other.id} className="btn btn-soft btn-sm" label="Chat" />}
        {!isSeller && <WhatsAppButton number={order.store?.whatsapp} className="btn btn-sm bg-[#25D366] text-white" />}
      </div>

      {order.buyerNote && <p className="rounded-xl border border-brand-100 p-2.5 text-xs text-ink-soft"><b>Buyer note:</b> {order.buyerNote}</p>}

      <div className="text-sm">
        {editPlace ? (
          <div className="flex gap-2"><input className="input" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={200} placeholder="Where will you meet / deliver?" aria-label="Meeting place" /><button onClick={savePlace} disabled={busy} className="btn btn-primary btn-sm">Save</button></div>
        ) : (
          <p className="flex flex-wrap items-center gap-2 text-ink-soft"><MapPin className="h-4 w-4 shrink-0" /><span className={clsx(!order.meetingLocation && "text-ink-mute")}>{order.meetingLocation || "No meeting place agreed yet"}</span>{active && <button onClick={() => setEditPlace(true)} className="text-xs font-bold text-brand-600">{order.meetingLocation ? "Change" : "Set place"}</button>}</p>
        )}
      </div>

      {(order.actions.length > 0 || order.canReview) && (
        <div className="flex flex-wrap gap-2 border-t border-brand-100 pt-3">
          {order.actions.map((a: string) => (
            <button key={a} disabled={busy} onClick={() => act(a)} className={clsx("btn btn-sm", a === "rejected" || a === "cancelled" ? "btn-ghost border border-red-200 text-red-600" : "btn-primary")}>{ACTION_LABEL[a]}</button>
          ))}
          {order.canReview && <button onClick={() => setReview(true)} className="btn btn-leaf btn-sm">Leave a review</button>}
        </div>
      )}
      {order.role === "buyer" && order.status === "completed" && order.reviewed && <p className="text-xs font-semibold text-leaf-700">You reviewed this order.</p>}
      <div className="flex justify-end"><ReportButton targetType="order" target={order.id} /></div>

      <Modal open={review} onClose={() => setReview(false)} title="Rate this seller">
        <div className="space-y-3">
          <div className="flex justify-center gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)} className={clsx("text-3xl transition", n <= rating ? "text-amber-400" : "text-slate-200")} aria-label={`${n} stars`}>&#9733;</button>)}</div>
          <textarea className="input min-h-24" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600} placeholder="How was the transaction? (optional)" />
          <button className="btn btn-primary w-full" onClick={sendReview} disabled={busy}>Submit review</button>
        </div>
      </Modal>
    </article>
  );
}
