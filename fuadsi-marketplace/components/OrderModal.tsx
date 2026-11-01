"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info } from "lucide-react";
import { Modal } from "@/components/ui/primitives";
import { useToast } from "@/components/providers/ToastProvider";
import { api, errorMessage } from "@/lib/api-client";
import { formatNaira } from "@/lib/format";
import { PAYMENT_NOTICE } from "@/lib/constants";

export function OrderModal({ open, onClose, items, total, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void; items: { productId: string; quantity: number; title: string; price: number }[]; total: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [delivery, setDelivery] = useState<"meetup" | "campus_delivery">("meetup");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api("/orders", { method: "POST", body: { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), deliveryMethod: delivery, meetingLocation: place, note } });
      toast("success", "Order sent! The seller will accept or reject it soon.");
      onSuccess?.();
      onClose();
      router.push("/dashboard/buyer?tab=orders");
    } catch (e) {
      toast("error", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Send order request">
      <div className="space-y-4">
        <ul className="space-y-1 rounded-xl bg-lav p-3 text-sm">
          {items.map((i) => <li key={i.productId} className="flex justify-between gap-3"><span className="truncate">{i.quantity} x {i.title}</span><span className="font-semibold">{formatNaira(i.price * i.quantity)}</span></li>)}
          <li className="flex justify-between border-t border-brand-100 pt-1.5 font-extrabold"><span>Total</span><span>{formatNaira(total)}</span></li>
        </ul>
        <fieldset>
          <legend className="label">How do you want to receive it?</legend>
          <div className="grid grid-cols-2 gap-2">
            {([["meetup", "Campus meetup"], ["campus_delivery", "Campus delivery"]] as const).map(([v, l]) => (
              <label key={v} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold ${delivery === v ? "border-brand-600 bg-brand-50 text-brand-700" : "border-brand-100"}`}>
                <input type="radio" name="delivery" className="sr-only" checked={delivery === v} onChange={() => setDelivery(v)} />{l}
              </label>
            ))}
          </div>
        </fieldset>
        <div><label className="label" htmlFor="place">{delivery === "meetup" ? "Suggested meeting place" : "Delivery location (hostel, room, faculty)"}</label><input id="place" className="input" maxLength={200} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="You can agree on this in chat later" /></div>
        <div><label className="label" htmlFor="note">Note to seller (optional)</label><textarea id="note" className="input min-h-20" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><Info className="mt-0.5 h-4 w-4 shrink-0" />{PAYMENT_NOTICE}</p>
        <button onClick={submit} disabled={busy} className="btn btn-primary w-full py-3">Send order request</button>
      </div>
    </Modal>
  );
}
