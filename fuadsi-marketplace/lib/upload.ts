import { api } from "./api-client";
import { LIMITS } from "./constants";

export type UploadedImage = { url: string; publicId: string; width?: number; height?: number };
export type UploadKind = "products" | "avatars" | "chat" | "stores";

export function validateImage(file: File): string | null {
  if (!(LIMITS.allowedImageTypes as readonly string[]).includes(file.type)) return "Use a JPG, PNG or WebP image.";
  if (file.size > LIMITS.maxImageBytes) return `Image is too large (max ${Math.round(LIMITS.maxImageBytes / 1024 / 1024)}MB).`;
  return null;
}

/** Downscales large phone photos before upload to save data on slow connections. */
async function shrink(file: File, maxSide = 1600): Promise<File> {
  try {
    if (file.size < 600 * 1024) return file;
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

/** Signed direct-to-Cloudinary upload with progress. */
export async function uploadImage(original: File, kind: UploadKind, onProgress?: (pct: number) => void): Promise<UploadedImage> {
  const problem = validateImage(original);
  if (problem) throw new Error(problem);
  const file = await shrink(original);
  const sig = await api<any>("/upload/sign", { method: "POST", body: { kind } });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowed_formats);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: r.secure_url, publicId: r.public_id, width: r.width, height: r.height });
        else reject(new Error(r?.error?.message || "Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };
    xhr.send(form);
  });
}

/** Cloudinary delivery transform for small, fast images (auto format + quality). */
export function cdn(url: string | null | undefined, width = 600): string {
  if (!url) return "";
  return url.includes("/image/upload/") ? url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width},c_limit/`) : url;
}
