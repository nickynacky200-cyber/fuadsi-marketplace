import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
export const metadata = { title: "Sign up" };
export default function Page() { return <Suspense><AuthCard mode="signup" /></Suspense>; }
