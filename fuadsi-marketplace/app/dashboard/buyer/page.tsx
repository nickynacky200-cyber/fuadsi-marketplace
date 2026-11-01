import { Suspense } from "react";
import { BuyerDashboard } from "@/components/BuyerDashboard";
export const metadata = { title: "My orders" };
export default function Page() { return <Suspense><BuyerDashboard /></Suspense>; }
