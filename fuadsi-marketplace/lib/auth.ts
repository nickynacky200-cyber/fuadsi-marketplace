import { adminAuth } from "./firebase-admin";
import { connectDB } from "./db";
import { ApiError } from "./api";
import { adminEmails } from "./env";
import { User } from "@/models/User";
import { kv } from "./kv";

export function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : null;
}

/** Verifies the Firebase ID token and returns the matching DB user (creating it on first sign-in). */
export async function getAuthUser(req: Request) {
  const token = bearerToken(req);
  if (!token) return null;
  const auth = adminAuth(); // throws a clear CONFIG error when credentials are missing/invalid
  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch (e: any) {
    const msg = String(e?.message || "");
    console.error("[auth] verifyIdToken failed:", e?.code, msg.slice(0, 200));
    if (/incorrect "aud"|incorrect "iss"/i.test(msg)) {
      throw new ApiError(500, "FIREBASE_PROJECT_ID on the server doesn't match the Firebase project used by the website (NEXT_PUBLIC_FIREBASE_PROJECT_ID).", "CONFIG");
    }
    if (/credential|private key|PEM|Failed to parse|certificate/i.test(msg)) {
      throw new ApiError(500, "Firebase Admin credentials are invalid. Re-copy the service-account values.", "CONFIG");
    }
    throw new ApiError(401, "Your session has expired. Please sign in again.", "AUTH");
  }
  await connectDB();
  const email = (decoded.email || "").toLowerCase();
  let user = await User.findOne({ uid: decoded.uid });
  if (!user) {
    user = await User.create({
      uid: decoded.uid,
      email,
      name: decoded.name || "",
      photoUrl: decoded.picture || "",
      role: adminEmails().includes(email) && decoded.email_verified ? "admin" : "user",
    });
  } else if (user.role !== "admin" && email && adminEmails().includes(email) && decoded.email_verified) {
    user.role = "admin"; // bootstrap admins listed in ADMIN_EMAILS
    await user.save();
  }
  (user as any).emailVerified = !!decoded.email_verified; // transient, from the verified ID token
  if (user.suspended) {
    throw new ApiError(403, "This account has been suspended. Contact support if you think this is a mistake.", "SUSPENDED");
  }
  return user;
}

export async function requireUser(req: Request) {
  const user = await getAuthUser(req);
  if (!user) throw new ApiError(401, "Please sign in to continue.", "AUTH");
  return user;
}

/** Server-side admin check: role comes from the database, never from the client. */
export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if (user.role !== "admin") throw new ApiError(403, "Administrator access required.", "FORBIDDEN");
  return user;
}

/** Email/password accounts must confirm their address before using the marketplace (Google accounts arrive verified). */
export async function requireVerifiedEmail(req: Request) {
  const user = await requireUser(req);
  if (!(user as any).emailVerified) throw new ApiError(403, "Please verify your email address first. Check your inbox.", "EMAIL_UNVERIFIED");
  return user;
}

export async function requireOnboarded(req: Request) {
  const user = await requireVerifiedEmail(req);
  if (!user.onboarded || !user.username) throw new ApiError(403, "Complete your profile first.", "ONBOARDING");
  return user;
}

/** Throttled lastSeen update (at most once a minute per user). */
export async function touchLastSeen(userId: string) {
  const key = `seen:${userId}`;
  if (await kv().get(key)) return;
  await kv().set(key, 1, 60);
  await User.updateOne({ _id: userId }, { $set: { lastSeenAt: new Date() } });
}

/** For public endpoints that behave differently when signed in. A bad token is treated as signed-out. */
export async function optionalUser(req: Request) {
  if (!bearerToken(req)) return null;
  try {
    return await getAuthUser(req);
  } catch {
    return null;
  }
}
