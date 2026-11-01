"use client";
import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { Protected } from "@/components/ui/Protected";
import { ProfileForm } from "@/components/ProfileForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, VerifiedBadge } from "@/components/ui/primitives";

export default function ProfilePage() {
  const { me, logout } = useAuth();
  return (
    <Protected>
      <div className="container-x max-w-xl py-6">
        <div className="mb-5 flex items-center gap-4">
          <Avatar src={me?.photoUrl} name={me?.name} size={64} />
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 truncate text-xl font-extrabold">{me?.name}{me?.verified && <VerifiedBadge className="h-5 w-5" />}</h1>
            <p className="truncate text-sm text-ink-soft">{me?.email}</p>
            {!me?.verified && <p className="mt-0.5 text-xs text-ink-mute">Not verified yet. Verification is granted manually by an administrator.</p>}
          </div>
        </div>
        <div className="card p-5"><ProfileForm mode="edit" /></div>
        <div className="mt-4 flex flex-wrap gap-3">
          {me?.role === "admin" && <Link href="/admin" className="btn btn-soft"><ShieldCheck className="h-4 w-4" />Admin dashboard</Link>}
          <button onClick={logout} className="btn btn-ghost text-red-600"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </div>
    </Protected>
  );
}
