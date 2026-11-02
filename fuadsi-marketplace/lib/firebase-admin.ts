import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { need } from "./env";
import { ApiError } from "./api";

function app() {
  if (getApps().length) return getApps()[0];
  const projectId = need("FIREBASE_PROJECT_ID");
  const clientEmail = need("FIREBASE_CLIENT_EMAIL");
  // Vercel keeps "\n" as two characters; real PEM needs actual newlines
  const privateKey = need("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
  try {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } catch (e) {
    console.error("[firebase-admin] init failed:", (e as Error).message);
    throw new ApiError(500, "Firebase Admin credentials are invalid. Re-copy FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY from the service-account JSON file.", "CONFIG");
  }
}

export function adminAuth() {
  return getAuth(app());
}
