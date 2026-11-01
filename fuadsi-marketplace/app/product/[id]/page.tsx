import { ProductView } from "@/components/ProductView";
export const metadata = { title: "Product" };
export default function Page({ params }: { params: { id: string } }) { return <ProductView id={params.id} />; }
