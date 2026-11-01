"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export function JoinBanner() {
  const { me, loading } = useAuth();
  return (
    <section className="relative min-h-[205px] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-500 text-white md:rounded-3xl" aria-label="Join the marketplace">
      <div className="relative z-10 max-w-[62%] p-5 sm:max-w-[60%]">
        <h2 className="text-xl font-extrabold leading-tight">{me ? "Start selling today" : "Join Our Marketplace"}</h2>
        <p className="mt-1.5 text-sm text-white/90">{me ? "Open your free store and reach students across campus." : "Create an account to buy, sell and enjoy more features!"}</p>
        {!loading && (
          <Link href={me ? (me.isSeller ? "/dashboard/seller" : "/sell") : "/signup"} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 shadow-md hover:bg-brand-50">
            {me ? (me.isSeller ? "Seller dashboard" : "Open my store") : "Sign Up Free"}<ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <Image src="/images/mascot/student-banner.webp" alt="FUADSI student mascot" width={272} height={384} className="absolute bottom-0 right-0 h-full w-auto max-w-[45%] object-cover object-top [mask-image:linear-gradient(to_right,transparent,black_28%)]" />
    </section>
  );
}
