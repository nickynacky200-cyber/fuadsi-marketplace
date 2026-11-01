"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api-client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ImageUploader } from "@/components/ui/ImageUploader";
import type { UploadedImage } from "@/lib/upload";

export function StoreForm({ onSaved, submitLabel = "Save store" }: { onSaved?: () => void; submitLabel?: string }) {
  const { me, refresh } = useAuth();
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [available, setAvailable] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatar, setAvatar] = useState<UploadedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ store: any }>("/seller/store").then(({ store }) => {
      if (store) { setName(store.name); setDescription(store.description); setWhatsapp(store.whatsapp); setAvailable(store.available); setAvatarUrl(store.avatarUrl); }
      else setName(me?.name ? `${me.name.split(" ")[0]}'s Store` : "");
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [me?.name]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("/seller/store", { method: "PUT", body: { name, description, whatsapp, available, avatar: avatar[0] || undefined } });
      await refresh();
      toast("success", "Store saved.");
      onSaved?.();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  if (!loaded) return <div className="skeleton h-64" />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-4">
        {avatar.length === 0 && avatarUrl && <img src={avatarUrl} alt="Current store" className="h-24 w-24 rounded-full object-cover" />}
        <ImageUploader kind="stores" value={avatar} onChange={setAvatar} max={1} shape="round" label="Store photo" />
      </div>
      <div><label className="label" htmlFor="sname">Store name</label><input id="sname" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} /></div>
      <div><label className="label" htmlFor="sdesc">About your store</label><textarea id="sdesc" className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} placeholder="What do you sell? Where can buyers meet you?" /></div>
      <div><label className="label" htmlFor="swa">WhatsApp number (optional)</label><input id="swa" className="input" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0801 234 5678" /><p className="mt-1 text-xs text-ink-mute">Shown publicly as a contact button. Leave empty to only use in-app chat.</p></div>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-lav p-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={available} onChange={(e) => setAvailable(e.target.checked)} /><span><b>Store is open for orders.</b> <span className="text-ink-soft">Untick when you are away.</span></span></label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <button className="btn btn-primary w-full py-3" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{submitLabel}</button>
    </form>
  );
}
