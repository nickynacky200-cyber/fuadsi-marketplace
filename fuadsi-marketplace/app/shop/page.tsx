import { Suspense } from "react";
import { ShopView } from "@/components/ShopView";
export const metadata = { title: "Shop" };
export default function Page() { return <Suspense><ShopView /></Suspense>; }
