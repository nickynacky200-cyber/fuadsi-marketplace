"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { firebaseConfigured } from "@/lib/firebase-client";
import { PAYMENT_NOTICE } from "@/lib/constants";

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
  );
}

const FRIENDLY: Record<string, string> = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "Wrong email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists. Try logging in, or use Google if you signed up with it.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled. In Firebase console, Authentication, Sign-in method: enable Google and Email/Password.",
  "auth/unauthorized-domain": "This website's domain isn't authorised. In Firebase console, Authentication, Settings, Authorized domains: add this site's domain (e.g. fuadsi-marketplace.vercel.app).",
  "auth/invalid-api-key": "The Firebase API key is missing or wrong in this deployment. Set NEXT_PUBLIC_FIREBASE_* in Vercel and Redeploy.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "The Firebase API key is wrong. Check NEXT_PUBLIC_FIREBASE_API_KEY in Vercel and Redeploy.",
  "auth/configuration-not-found": "Firebase Authentication isn't set up for this project yet. Open Authentication in the Firebase console and click Get started.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups for this site and try again.",
  "auth/web-storage-unsupported": "Your browser blocks storage needed to sign in. Disable private mode or content blockers, or open the site in Chrome/Safari.",
};
const explain = (e: any) => FRIENDLY[e?.code] || (e?.code ? `Sign-in failed (${e.code}).` : e?.message || "That didn't work. Please try again.");

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const { me, loading, signedIn, refresh, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, resendVerification, checkVerified, logout, authError } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const sp = useSearchParams();
  const rawNext = sp.get("next") || "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"; // avoid open redirects
  const signup = mode === "signup";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading || !me || !me.emailVerified) return;
    router.replace(me.onboarded ? next : `/onboarding?next=${encodeURIComponent(next)}`);
  }, [me, loading, next, router]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try { await fn(); } catch (e: any) { setError(explain(e)); } finally { setBusy(false); }
  };

  const google = () => run(signInWithGoogle);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signup && password.length < 8) return setError(FRIENDLY["auth/weak-password"]);
    run(() => (signup ? signUpWithEmail(name.trim(), email.trim(), password) : signInWithEmail(email.trim(), password)));
  };
  const forgot = () => {
    if (!email.trim()) return setError("Type your email above first, then tap Forgot password.");
    run(async () => { await resetPassword(email.trim()); toast("success", "Password reset email sent. Check your inbox (and spam)."); });
  };

  // Firebase accepted the sign-in but our server could not load the account: show the real reason
  if (!loading && signedIn && !me) {
    return (
      <div className="container-x flex min-h-[70vh] items-center justify-center py-8">
        <div className="card w-full max-w-md space-y-4 p-6">
          <h1 className="text-xl font-extrabold">Signed in, but we couldn&apos;t load your account</h1>
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{authError || "Unknown server error."}</p>
          <p className="text-xs text-ink-soft">This is a server configuration problem, not your password. Open <a className="font-bold text-brand-600 underline" href="/api/health" target="_blank" rel="noopener noreferrer">/api/health</a> to see which service (database, Firebase Admin, Redis, Cloudinary) is failing.</p>
          <button className="btn btn-primary w-full" disabled={busy} onClick={() => run(refresh)}>Try again</button>
          <button className="btn btn-ghost w-full" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }

  // Signed in with email/password but the address isn't confirmed yet
  if (!loading && me && !me.emailVerified) {
    return (
      <div className="container-x flex min-h-[70vh] items-center justify-center py-8">
        <div className="card w-full max-w-md space-y-4 p-6 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-brand-600" />
          <h1 className="text-xl font-extrabold">Verify your email</h1>
          <p className="text-sm text-ink-soft">We sent a confirmation link to <b>{me.email}</b>. Open it, then come back and tap the button below.</p>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy} onClick={() => run(async () => { if (!(await checkVerified())) setError("Not verified yet. Open the link in your email first."); })}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}I&apos;ve verified my email</button>
          <button className="btn btn-soft w-full" disabled={busy} onClick={() => run(async () => { await resendVerification(); toast("success", "Verification email sent again."); })}>Resend email</button>
          <button className="text-sm font-semibold text-ink-mute hover:text-red-600" onClick={logout}>Use a different account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-8">
      <div className="card w-full max-w-md overflow-hidden">
        {!firebaseConfigured() && <p className="bg-red-50 p-3 text-xs font-semibold text-red-700" role="alert">This deployment was built without the NEXT_PUBLIC_FIREBASE_* variables. Add them in Vercel, then <b>Redeploy</b> (these values are baked in at build time).</p>}
        <div className="relative bg-gradient-to-br from-brand-700 to-brand-500 px-6 pb-8 pt-7 text-white">
          <Image src="/images/illustrations/chat.webp" alt="" width={110} height={106} className="absolute right-4 top-3 h-24 w-auto opacity-95" />
          <h1 className="text-2xl font-extrabold">{signup ? "Join FUADSI Marketplace" : "Welcome back"}</h1>
          <p className="mt-1 max-w-[16rem] text-sm text-white/85">{signup ? "Create a free account to buy, sell and chat with students on campus." : "Sign in to message sellers, place orders and manage your store."}</p>
        </div>
        <div className="space-y-4 p-6">
          {(error || authError) && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error || authError}</p>}
          <button onClick={google} disabled={busy || loading} className="btn w-full gap-3 border border-brand-200 bg-white py-3 text-ink shadow-sm hover:bg-lav" type="button">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleG />}Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-ink-mute"><span className="h-px flex-1 bg-brand-100" />or use email<span className="h-px flex-1 bg-brand-100" /></div>
          <form onSubmit={submit} className="space-y-3">
            {signup && <div><label className="label" htmlFor="an">Full name</label><input id="an" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" /></div>}
            <div><label className="label" htmlFor="ae">Email</label><input id="ae" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" placeholder="you@gmail.com" /></div>
            <div>
              <label className="label" htmlFor="ap">Password</label>
              <div className="relative"><input id="ap" type={show ? "text" : "password"} className="input pr-11" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={signup ? 8 : 1} autoComplete={signup ? "new-password" : "current-password"} /><button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-mute hover:bg-brand-50" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              {signup ? <p className="mt-1 text-xs text-ink-mute">At least 8 characters.</p> : <button type="button" onClick={forgot} className="mt-1.5 text-xs font-bold text-brand-600">Forgot password?</button>}
            </div>
            <button className="btn btn-primary w-full py-3" disabled={busy || loading}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{signup ? "Create account" : "Login"}</button>
          </form>
          <p className="rounded-xl bg-lav p-3 text-xs text-ink-soft">{PAYMENT_NOTICE}</p>
          <p className="text-center text-sm text-ink-soft">{signup ? <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-brand-600">Login</Link></> : <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-bold text-brand-600">Sign up free</Link></>}</p>
        </div>
      </div>
    </div>
  );
}
