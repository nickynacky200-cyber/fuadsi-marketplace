"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "./primitives";

/**
 * UX guard only. Real authorisation is enforced by every API route on the server.
 * - not signed in -> /login
 * - signed in but profile incomplete -> /onboarding
 */
export function Protected({ children, admin = false, allowIncomplete = false }: { children: React.ReactNode; admin?: boolean; allowIncomplete?: boolean }) {
  const { me, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (loading) return;
    const next = encodeURIComponent(path || "/");
    if (!me || !me.emailVerified) router.replace(`/login?next=${next}`);
    else if (!me.onboarded && !allowIncomplete) router.replace(`/onboarding?next=${next}`);
    else if (admin && me.role !== "admin") router.replace("/");
  }, [me, loading, router, path, admin, allowIncomplete]);
  const ok = !loading && me && me.emailVerified && (me.onboarded || allowIncomplete) && (!admin || me.role === "admin");
  if (!ok) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner className="h-7 w-7" /></div>;
  return <>{children}</>;
}

/** Runs `go` if signed in, otherwise sends the visitor to log in and back. */
export function useRequireLogin() {
  const { me } = useAuth();
  const router = useRouter();
  const path = usePathname();
  return (go: () => void) => {
    if (!me) return router.push(`/login?next=${encodeURIComponent(path || "/")}`);
    if (!me.emailVerified) return router.push(`/login?next=${encodeURIComponent(path || "/")}`);
    if (!me.onboarded) return router.push(`/onboarding?next=${encodeURIComponent(path || "/")}`);
    go();
  };
}
