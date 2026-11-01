"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api-client";
import { useApi } from "@/lib/hooks";
import { useToast } from "@/components/providers/ToastProvider";
import { ImageUploader } from "@/components/ui/ImageUploader";
import type { UploadedImage } from "@/lib/upload";

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const cats = useApi<{ items: { id: string; name: string }[] }>("/categories", { auth: false });
  const existing = useApi<{ product: any }>(productId ? `/products/${productId}` : null);
  const [f, setF] = useState({ title: "", description: "", price: "", originalPrice: "", quantity: "1", category: "", condition: "new", location: "FUADSI campus" });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    const p = existing.data?.product;
    if (!p) return;
    setF({ title: p.title, description: p.description, price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : "", quantity: String(p.quantity), category: p.category?.id || "", condition: p.condition, location: p.location });
    setImages(p.images);
  }, [existing.data]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!images.length) return setError("Add at least one photo.");
    setBusy(true); setError("");
    const body = {
      title: f.title, description: f.description, price: parseInt(f.price, 10), quantity: parseInt(f.quantity, 10), category: f.category, condition: f.condition, location: f.location,
      originalPrice: f.originalPrice ? parseInt(f.originalPrice, 10) : null, images: images.map(({ url, publicId, width, height }) => ({ url, publicId, width, height })),
    };
    try {
      if (productId) {
        const r = await api<{ resubmitted: boolean }>(`/products/${productId}`, { method: "PATCH", body });
        toast("success", r.resubmitted ? "Saved. Your changes are waiting for admin approval." : "Listing updated.");
      } else {
        await api("/products", { method: "POST", body });
        toast("success", "Submitted! An administrator will review your listing before it goes live.");
      }
      router.push("/dashboard/seller?tab=products");
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  if (productId && existing.loading) return <div className="skeleton h-96" />;
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex gap-2 rounded-2xl bg-lav p-3 text-xs text-ink-soft"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />New listings and changes to title, photos, description, category or condition are reviewed by an administrator before they appear publicly. Price and stock changes apply immediately.</div>
      <div><span className="label">Photos (the first is the cover)</span><ImageUploader kind="products" value={images} onChange={setImages} /></div>
      <div><label className="label" htmlFor="t">Title</label><input id="t" className="input" value={f.title} onChange={set("title")} required minLength={3} maxLength={120} placeholder="e.g. iPhone 11, 64GB, clean" /></div>
      <div><label className="label" htmlFor="d">Description</label><textarea id="d" className="input min-h-32" value={f.description} onChange={set("description")} required minLength={10} maxLength={4000} placeholder="Condition, what's included, reason for selling..." /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c">Category</label><select id="c" className="input" value={f.category} onChange={set("category")} required><option value="">Choose a category</option>{cats.data?.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="cond">Condition</label><select id="cond" className="input" value={f.condition} onChange={set("condition")}><option value="new">New</option><option value="used">Fairly used</option></select></div>
        <div><label className="label" htmlFor="p">Price (NGN)</label><input id="p" className="input" inputMode="numeric" value={f.price} onChange={(e) => setF((s) => ({ ...s, price: e.target.value.replace(/\D/g, "") }))} required /></div>
        <div><label className="label" htmlFor="op">Old price (optional, shows a discount)</label><input id="op" className="input" inputMode="numeric" value={f.originalPrice} onChange={(e) => setF((s) => ({ ...s, originalPrice: e.target.value.replace(/\D/g, "") }))} /></div>
        <div><label className="label" htmlFor="q">Quantity in stock</label><input id="q" className="input" inputMode="numeric" value={f.quantity} onChange={(e) => setF((s) => ({ ...s, quantity: e.target.value.replace(/\D/g, "") }))} required /></div>
        <div><label className="label" htmlFor="l">Location</label><input id="l" className="input" value={f.location} onChange={set("location")} maxLength={100} /></div>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <button className="btn btn-primary w-full py-3 sm:w-auto sm:px-10" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{productId ? "Save changes" : "Submit for approval"}</button>
    </form>
  );
}
