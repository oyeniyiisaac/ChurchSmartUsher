import { createHash } from "node:crypto";
import { getEnv } from "@/config/env";

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
  resourceType?: "image" | "video";
}

function generateCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${sortedEntries}${apiSecret}`).digest("hex");
}

function toDataUri(base64OrDataUri: string, mimeType: string = "image/jpeg"): string {
  const trimmed = base64OrDataUri.trim();
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  return `data:${mimeType};base64,${trimmed}`;
}

export async function uploadMediaToCloudinary(options: {
  fileContentBase64: string;
  folder?: string;
  publicId?: string;
  mimeType?: string;
  resourceType?: "image" | "video" | "auto";
}): Promise<CloudinaryUploadResult> {
  const env = getEnv();
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || env.NODE_ENV === "test") {
    throw new Error("Cloudinary live upload skipped in test or unconfigured environment.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = options.folder ?? "rccg_jesus_house_ogbomosho";

  const isVideo =
    options.resourceType === "video" ||
    Boolean(options.mimeType?.startsWith("video/")) ||
    options.fileContentBase64.startsWith("data:video/");
  const resolvedResourceType = isVideo ? "video" : "image";
  const defaultMimeType = isVideo ? "video/mp4" : "image/jpeg";

  const signParams: Record<string, string | number> = {
    folder,
    timestamp,
  };
  if (options.publicId) {
    signParams.public_id = options.publicId;
  }

  const signature = generateCloudinarySignature(signParams, apiSecret);
  const filePayload = toDataUri(options.fileContentBase64, options.mimeType || defaultMimeType);

  const formData = new FormData();
  formData.append("file", filePayload);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  if (options.publicId) {
    formData.append("public_id", options.publicId);
  }
  formData.append("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resolvedResourceType}/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${errText}`);
  }

  const json = (await response.json()) as {
    secure_url: string;
    public_id: string;
    bytes: number;
    format: string;
    width: number;
    height: number;
    resource_type?: string;
  };

  return {
    secureUrl: json.secure_url,
    publicId: json.public_id,
    bytes: json.bytes ?? 0,
    format: json.format ?? (isVideo ? "mp4" : "jpg"),
    width: json.width ?? 0,
    height: json.height ?? 0,
    resourceType: resolvedResourceType,
  };
}

export const uploadImageToCloudinary = uploadMediaToCloudinary;

export async function deleteMediaFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" = "image",
): Promise<boolean> {
  const env = getEnv();
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!publicId || !cloudName || !apiKey || !apiSecret || env.NODE_ENV === "test") {
    return false;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signParams: Record<string, string | number> = {
    public_id: publicId,
    timestamp,
  };
  const signature = generateCloudinarySignature(signParams, apiSecret);

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/destroy`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export const deleteImageFromCloudinary = deleteMediaFromCloudinary;
