import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

// Firebase web config is public by design; access is enforced by Firebase Auth + our server-side token checks.
const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, "");

export function firebaseConfigured() {
  return !!clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) && !!clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

function firebaseApp(): FirebaseApp {
  if (getApps().length) return getApp();
  return initializeApp({
    apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  });
}

/** Lazy so that server-side rendering and `next build` never need Firebase credentials. */
export function getFirebaseAuth(): Auth {
  return getAuth(firebaseApp());
}
