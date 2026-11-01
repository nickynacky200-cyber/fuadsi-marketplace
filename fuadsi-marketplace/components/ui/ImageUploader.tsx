"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import clsx from "clsx";
import { UploadedImage, UploadKind, uploadImage, validateImage } from "@/lib/upload";
import { api } from "@/lib/api-client";
import { LIMITS } from "@/lib/constants";

type Pending = { key: string; name: string; progress: number; error?: string };

/** Multi-image picker: validation, previews, per-file progress, direct signed uploads to Cloudinary. */
export function ImageUploader({ kind, value, onChange, max = LIMITS.maxImagesPerProduct, shape = "square", label = "Add photos" }: {
  kind: UploadKind; value: UploadedImage[]; onChange: (v: UploadedImage[]) => void; max?: number; shape?: "square" | "round"; label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const fresh = useRef(new Set<string>()); // uploaded in this session and not yet saved anywhere

  const pick = async (files: FileList | null) => {
    if (!files) return;
    const room = max - value.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    let current = value;
    for (const file of list) {
      const key = `${file.name}-${Math.random()}`;
      const bad = validateImage(file);
      if (bad) { setPending((p) => [...p, { key, name: file.name, progress: 0, error: bad }]); continue; }
      setPending((p) => [...p, { key, name: file.name, progress: 0 }]);
      try {
        const img = await uploadImage(file, kind, (pct) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress: pct } : x))));
        fresh.current.add(img.publicId);
        current = [...current, img];
        onChange(current);
        setPending((p) => p.filter((x) => x.key !== key));
      } catch (e: any) {
        setPending((p) => p.map((x) => (x.key === key ? { ...x, error: e.message || "Upload failed" } : x)));
      }
    }
    if (input.current) input.current.value = "";
  };

  const remove = (img: UploadedImage) => {
    onChange(value.filter((v) => v.publicId !== img.publicId));
    if (fresh.current.has(img.publicId)) {
      fresh.current.delete(img.publicId);
      api("/upload/delete", { method: "POST", body: { publicId: img.publicId } }).catch(() => {}); // clean up unused upload
    }
  };

  const round = shape === "round";
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((img, i) => (
          <div key={img.publicId} className={clsx("relative h-24 w-24 overflow-hidden border border-brand-100 bg-lav", round ? "rounded-full" : "rounded-xl")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_240,c_fill,h_240/")} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && !round && max > 1 && <span className="absolute bottom-0 inset-x-0 bg-ink/70 py-0.5 text-center text-[10px] font-semibold text-white">Cover</span>}
            <button type="button" onClick={() => remove(img)} className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-white hover:bg-red-600" aria-label="Remove image"><X className="h-3 w-3" /></button>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.key} className={clsx("relative flex h-24 w-24 flex-col items-center justify-center border p-1 text-center text-[10px]", round ? "rounded-full" : "rounded-xl", p.error ? "border-red-300 bg-red-50 text-red-700" : "border-brand-200 bg-brand-50 text-brand-700")}>
            {p.error ? (<><span className="line-clamp-3 px-1">{p.error}</span><button type="button" className="mt-0.5 font-bold underline" onClick={() => setPending((s) => s.filter((x) => x.key !== p.key))}>Dismiss</button></>) : (<><Loader2 className="h-4 w-4 animate-spin" /><span className="mt-1 font-bold">{p.progress}%</span><span className="mt-1 h-1 w-14 overflow-hidden rounded-full bg-brand-200"><span className="block h-full bg-brand-600 transition-all" style={{ width: `${p.progress}%` }} /></span></>)}
          </div>
        ))}
        {value.length + pending.filter((p) => !p.error).length < max && (
          <button type="button" onClick={() => input.current?.click()} className={clsx("flex h-24 w-24 flex-col items-center justify-center gap-1 border-2 border-dashed border-brand-200 text-xs font-semibold text-brand-600 transition hover:border-brand-600 hover:bg-brand-50", round ? "rounded-full" : "rounded-xl")}>
            <ImagePlus className="h-5 w-5" />{label}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} className="hidden" onChange={(e) => pick(e.target.files)} />
      <p className="mt-2 text-xs text-ink-mute">JPG, PNG or WebP, up to {Math.round(LIMITS.maxImageBytes / 1024 / 1024)}MB each{max > 1 ? `, max ${max} photos` : ""}.</p>
    </div>
  );
}
