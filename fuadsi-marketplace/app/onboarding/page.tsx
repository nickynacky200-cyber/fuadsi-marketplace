"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Protected } from "@/components/ui/Protected";
import { ProfileForm } from "@/components/ProfileForm";

function Inner() {
  const sp = useSearchParams();
  const n = sp.get("next") || "/";
  const next = n.startsWith("/") && !n.startsWith("//") ? n : "/";
  return (
    <div className="container-x max-w-xl py-8">
      <h1 className="text-2xl font-extrabold">Finish setting up your profile</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">This takes a minute and lets sellers and buyers know who they&apos;re dealing with.</p>
      <div className="card p-5"><ProfileForm mode="onboarding" next={next} /></div>
    </div>
  );
}
export default function Page() {
  return <Protected allowIncomplete><Suspense><Inner /></Suspense></Protected>;
}
