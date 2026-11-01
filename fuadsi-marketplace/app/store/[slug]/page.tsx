import { StoreView } from "@/components/StoreView";
export default function Page({ params }: { params: { slug: string } }) { return <StoreView slug={params.slug} />; }
