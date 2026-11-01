import { Suspense } from "react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
export const metadata = { title: "Admin", robots: { index: false } };
export default function Page() { return <Suspense><AdminDashboard /></Suspense>; }
