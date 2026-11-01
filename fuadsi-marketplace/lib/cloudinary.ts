import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

function configured() {
  const e = env();
  cloudinary.config({ cloud_name: e.CLOUDINARY_CLOUD_NAME, api_key: e.CLOUDINARY_API_KEY, api_secret: e.CLOUDINARY_API_SECRET, secure: true });
  return e;
}

export type UploadKind = "products" | "avatars" | "chat" | "stores";

export const uploadFolder = (kind: UploadKind, uid: string) => `fuadsi/${kind}/${uid}`;

/** Signed upload params. folder + allowed_formats are part of the signature so clients cannot change them. */
export function signUpload(kind: UploadKind, uid: string) {
  const e = configured();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder: uploadFolder(kind, uid), timestamp, allowed_formats: "jpg,jpeg,png,webp" };
  const signature = cloudinary.utils.api_sign_request(params, e.CLOUDINARY_API_SECRET);
  return { cloudName: e.CLOUDINARY_CLOUD_NAME, apiKey: e.CLOUDINARY_API_KEY, signature, ...params };
}

/** An image reference is trusted only if it points at our Cloudinary account AND our per-user folder. */
export function isOwnedImage(img: { url: string; publicId: string }, uid: string, kind: UploadKind): boolean {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud) return false;
  return (
    img.url.startsWith(`https://res.cloudinary.com/${cloud}/`) &&
    img.publicId.startsWith(`${uploadFolder(kind, uid)}/`) &&
    img.url.includes(img.publicId)
  );
}

export async function destroyImages(publicIds: string[]) {
  if (!publicIds.length) return;
  configured();
  await Promise.allSettled(publicIds.map((id) => cloudinary.uploader.destroy(id, { invalidate: true })));
}
