"use client";
import { Protected } from "@/components/ui/Protected";
import { ProductForm } from "@/components/ProductForm";

export default function EditProduct({ params }: { params: { id: string } }) {
  return (
    <Protected>
      <div className="container-x max-w-2xl py-6">
        <h1 className="mb-4 text-2xl font-extrabold">Edit product</h1>
        <div className="card p-5"><ProductForm productId={params.id} /></div>
      </div>
    </Protected>
  );
}
