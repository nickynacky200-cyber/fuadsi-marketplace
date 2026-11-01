"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRequireLogin } from "@/components/ui/Protected";
import { useToast } from "@/components/providers/ToastProvider";
import { api, errorMessage } from "@/lib/api-client";
import { buildWhatsAppLink, productEnquiryMessage } from "@/lib/whatsapp";

function WhatsAppIcon() {
  return <Phone className="h-4.5 w-4.5" aria-hidden />;
}

export function ChatSellerButton({ sellerId, productId, className, label = "Chat Seller" }: { sellerId: string; productId?: string; className?: string; label?: string }) {
  const router = useRouter();
  const { me } = useAuth();
  const requireLogin = useRequireLogin();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  if (me?.id === sellerId) return null;
  const go = () =>
    requireLogin(async () => {
      setBusy(true);
      try {
        const r = await api<{ id: string }>("/conversations", { method: "POST", body: { userId: sellerId, productId } });
        router.push(`/messages/${r.id}`);
      } catch (e) {
        toast("error", errorMessage(e));
        setBusy(false);
      }
    });
  return <button onClick={go} disabled={busy} className={className || "btn btn-outline"}><MessageCircle className="h-4.5 w-4.5" />{label}</button>;
}

export function WhatsAppButton({ number, productTitle, productId, className }: { number?: string; productTitle?: string; productId?: string; className?: string }) {
  if (!number) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "";
  const href = buildWhatsAppLink(number, productTitle && productId ? productEnquiryMessage(productTitle, `${origin}/product/${productId}`) : "Hello, I found your store on FUADSI Marketplace.");
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className || "btn bg-[#25D366] text-white hover:bg-[#1fb857]"}><WhatsAppIcon />WhatsApp</a>;
}
