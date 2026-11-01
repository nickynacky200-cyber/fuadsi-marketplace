import { Suspense } from "react";
import { SellerDashboard } from "@/components/SellerDashboard";
export const metadata = { title: "Seller dashboard" };
export default function Page() { return <Suspense><SellerDashboard /></Suspense>; }
