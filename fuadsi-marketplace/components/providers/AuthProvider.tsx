"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, User as FbUser, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, updateProfile } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { api, ApiClientError } from "@/lib/api-client";

export type Me = {
  id: string; email: string; name: string; username: string | null; photoUrl: string; phone: string;
  affiliation: string; department: string; level: string; verified: boolean; role: "user" | "admin"; isSeller: boolean; onboarded: boolean; emailVerified: boolean;
};
type StoreLite = { name: string; slug: string } | null;

type AuthCtx = {
  me: Me | null;
  store: StoreLite;
  loading: boolean;
  authError: string | null;
  signedIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  checkVerified: () => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [store, setStore] = useState<StoreLite>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<{ user: Me; store: StoreLite }>("/me");
      setMe(r.user);
      setStore(r.store);
      setAuthError(null);
    } catch (e) {
      setMe(null);
      setStore(null);
      // Never fail silently: show why the account couldn't be loaded (server config, database, token problems...)
      setAuthError(e instanceof ApiClientError ? `${e.message}${e.status ? ` (HTTP ${e.status})` : ""}` : "Couldn't load your account.");
      if (e instanceof ApiClientError && e.code === "SUSPENDED") await signOut(getFirebaseAuth());
    }
  }, []);

  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(getFirebaseAuth(), async (u: FbUser | null) => {
        setSignedIn(!!u);
        if (!u) {
          setMe(null);
          setStore(null);
          setLoading(false);
          return;
        }
        await load();
        setLoading(false);
      });
    } catch (e) {
      console.error("Firebase is not configured", e);
      setLoading(false);
    }
    return () => unsub();
  }, [load]);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      if (e?.code === "auth/popup-blocked" || e?.code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider); // some in-app browsers block popups
        return;
      }
      if (e?.code === "auth/popup-closed-by-user" || e?.code === "auth/cancelled-popup-request") return;
      throw e;
    }
  }, []);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    await sendEmailVerification(cred.user);
    await cred.user.getIdToken(true);
    await load();
  }, [load]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  }, []);

  const resendVerification = useCallback(async () => {
    const u = getFirebaseAuth().currentUser;
    if (u) await sendEmailVerification(u);
  }, []);

  /** Re-reads the Firebase user and refreshes the ID token so the server sees email_verified = true. */
  const checkVerified = useCallback(async () => {
    const u = getFirebaseAuth().currentUser;
    if (!u) return false;
    await u.reload();
    await u.getIdToken(true);
    await load();
    return u.emailVerified;
  }, [load]);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
    setMe(null);
    setStore(null);
  }, []);

  const value = useMemo(() => ({ me, store, loading, authError, signedIn, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, resendVerification, checkVerified, logout, refresh: load }), [me, store, loading, authError, signedIn, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, resendVerification, checkVerified, logout, load]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
