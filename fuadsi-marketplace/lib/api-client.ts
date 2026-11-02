import { getFirebaseAuth } from "./firebase-client";

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

type Opts = { method?: string; body?: unknown; signal?: AbortSignal; auth?: boolean };

export async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth !== false) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  const timeout = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; timeout.abort(); }, 25000); // never spin forever
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal ?? timeout.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
  } catch (e: any) {
    clearTimeout(timer);
    if (timedOut) throw new ApiClientError(0, "The server took too long to respond. Check /api/health for configuration problems.", "TIMEOUT");
    if (e?.name === "AbortError") throw e;
    throw new ApiClientError(0, "Can't reach the server. Check your connection and try again.", "NETWORK");
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new ApiClientError(res.status, data?.error || "Something went wrong. Please try again.", data?.code);
  return data as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
