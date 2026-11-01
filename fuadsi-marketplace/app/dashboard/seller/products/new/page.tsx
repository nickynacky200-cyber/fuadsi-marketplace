"use client";
import { Protected } from "@/components/ui/Protected";
import { ProductForm } from "@/components/ProductForm";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function NewProduct() {
  const { me } = useAuth();
  return (
    <Protected>
      <div className="container-x max-w-2xl py-6">
        <h1 className="mb-4 text-2xl font-extrabold">Add a product</h1>
        {me?.isSeller ? <div className="card p-5"><ProductForm /></div> : <div className="card p-6 text-center"><p className="mb-3 text-sm text-ink-soft">Open your free store before listing products.</p><Link href="/sell" className="btn btn-primary">Open my store</Link></div>}
      </div>
    </Protected>
  );
}
