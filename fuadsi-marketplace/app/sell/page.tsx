"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, MessageCircle, PackagePlus, Wallet } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Protected } from "@/components/ui/Protected";
import { StoreForm } from "@/components/StoreForm";

export default function SellPage() {
  const { me, loading } = useAuth();
  const router = useRouter();
  return (
    <div className="container-x max-w-4xl py-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 p-6 text-white md:p-10">
        <Image src="/images/illustrations/cart.webp" alt="" width={300} height={390} className="absolute -bottom-6 right-2 hidden h-64 w-auto md:block" />
        <h1 className="max-w-md text-3xl font-extrabold leading-tight md:text-4xl">Sell on campus. It&apos;s free.</h1>
        <p className="mt-2 max-w-md text-white/85">Open your own storefront in a minute and reach students who are already looking for what you have.</p>
        <ul className="mt-5 grid max-w-md gap-2 text-sm">
          <li className="flex items-center gap-2"><Wallet className="h-4 w-4 text-leaf-400" />No fees. Buyers pay you directly.</li>
          <li className="flex items-center gap-2"><PackagePlus className="h-4 w-4 text-leaf-400" />Upload several photos per product.</li>
          <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-leaf-400" />Chat with buyers in the app or on WhatsApp.</li>
          <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-leaf-400" />Every listing is reviewed before it goes live.</li>
        </ul>
        {!loading && me?.isSeller && <Link href="/dashboard/seller" className="btn mt-6 bg-white text-brand-700 hover:bg-brand-50">Go to seller dashboard</Link>}
      </section>
      {!me?.isSeller && (
        <Protected>
          <section className="card mt-6 p-5 md:p-6">
            <h2 className="mb-1 text-xl font-extrabold">Open your free store</h2>
            <p className="mb-5 text-sm text-ink-soft">Your store link will be /store/{me?.username}</p>
            <StoreForm submitLabel="Open my store" onSaved={() => router.push("/dashboard/seller/products/new")} />
          </section>
        </Protected>
      )}
    </div>
  );
}
