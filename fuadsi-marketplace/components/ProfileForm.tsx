"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { api, errorMessage } from "@/lib/api-client";
import { AFFILIATIONS } from "@/lib/constants";
import type { UploadedImage } from "@/lib/upload";

export function ProfileForm({ mode, next = "/" }: { mode: "onboarding" | "edit"; next?: string }) {
  const { me, refresh } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(me?.name || "");
  const [username, setUsername] = useState(me?.username || "");
  const [phone, setPhone] = useState(me?.phone || "");
  const [affiliation, setAffiliation] = useState(me?.affiliation || "student");
  const [department, setDepartment] = useState(me?.department || "");
  const [level, setLevel] = useState(me?.level || "");
  const [photo, setPhoto] = useState<UploadedImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const lockedUsername = !!me?.username && !!me?.isSeller;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/me", { method: "PATCH", body: { name, username: username || undefined, phone, affiliation, department, level, photo: photo[0] || undefined } });
      await refresh();
      toast("success", mode === "onboarding" ? "Welcome to FUADSI Marketplace!" : "Profile saved.");
      if (mode === "onboarding") router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <span className="label">Profile photo (optional)</span>
        <div className="flex items-center gap-4">
          {photo.length === 0 && me?.photoUrl && <img src={me.photoUrl} alt="Current profile" className="h-24 w-24 rounded-full object-cover" />}
          <ImageUploader kind="avatars" value={photo} onChange={setPhoto} max={1} shape="round" label="Upload" />
        </div>
      </div>
      <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" /></div>
      <div>
        <label className="label" htmlFor="username">Username {lockedUsername ? "(your store link)" : ""}</label>
        <div className="flex items-center rounded-xl border border-brand-100 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15"><span className="pl-3.5 text-sm text-ink-mute">@</span><input id="username" className="w-full rounded-xl bg-transparent px-2 py-2.5 text-sm outline-none disabled:text-ink-mute" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9_.\-]*" disabled={lockedUsername} autoCapitalize="none" autoComplete="username" /></div>
        <p className="mt-1 text-xs text-ink-mute">Letters, numbers, dots, dashes and underscores. Your store will live at /store/{username || "username"}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="aff">I am a</label>
          <select id="aff" className="input" value={affiliation} onChange={(e) => setAffiliation(e.target.value)}>{AFFILIATIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select>
        </div>
        <div><label className="label" htmlFor="phone">Phone (optional)</label><input id="phone" className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="0801 234 5678" autoComplete="tel" /></div>
        <div><label className="label" htmlFor="dept">Department (optional)</label><input id="dept" className="input" value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={80} /></div>
        <div><label className="label" htmlFor="level">Level (optional)</label><input id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value)} maxLength={20} placeholder="e.g. 200L" /></div>
      </div>
      <p className="rounded-xl bg-lav p-3 text-xs text-ink-soft">Your FUADSI affiliation is self-declared. Signing in with Google doesn&apos;t prove enrolment. A verified badge is only given after an administrator checks you manually.</p>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <button className="btn btn-primary w-full py-3" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "onboarding" ? "Finish setup" : "Save changes"}</button>
    </form>
  );
}
