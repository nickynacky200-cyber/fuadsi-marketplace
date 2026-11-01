import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env";

function app() {
  if (getApps().length) return getApps()[0];
  const e = env();
  return initializeApp({
    credential: cert({
      projectId: e.FIREBASE_PROJECT_ID,
      clientEmail: e.FIREBASE_CLIENT_EMAIL,
      // Vercel stores the key with literal "\n" sequences
      privateKey: e.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export function adminAuth() {
  return getAuth(app());
}
