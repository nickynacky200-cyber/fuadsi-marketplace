import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
export const metadata = { title: "Login" };
export default function Page() { return <Suspense><AuthCard mode="login" /></Suspense>; }
