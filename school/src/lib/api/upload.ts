/**
 * Upload student photos and receipt photos to the teaching backend (max 2MB).
 * Uses multipart/form-data; requires teaching API to be configured.
 */
import { getTeachingApiUrl, isTeachingApiConfigured, teachingFetch } from "./client";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

function checkSize(file: File): void {
  if (file.size > MAX_BYTES) {
    throw new Error("File must be under 2MB. Please choose a smaller image.");
  }
}

/**
 * Upload a student profile photo. Returns the full URL to the image.
 */
export async function uploadStudentPhoto(file: File): Promise<string> {
  if (!isTeachingApiConfigured()) {
    throw new Error("Upload is not configured. Set VITE_TEACHING_API_URL.");
  }
  checkSize(file);
  const form = new FormData();
  form.append("file", file);
  const res = await teachingFetch("/upload/student-photo", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? "Upload failed");
  }
  const data = (await res.json()) as { url: string };
  if (data.url.startsWith("http://") || data.url.startsWith("https://")) {
    return data.url;
  }
  const path = data.url.startsWith("/") ? data.url : `/${data.url}`;
  return `${getTeachingApiUrl().replace(/\/$/, "")}${path}`;
}

/**
 * Upload a fee receipt photo. Returns the full URL to the image.
 */
export async function uploadReceipt(file: File): Promise<string> {
  if (!isTeachingApiConfigured()) {
    throw new Error("Upload is not configured. Set VITE_TEACHING_API_URL.");
  }
  checkSize(file);
  const form = new FormData();
  form.append("file", file);
  const res = await teachingFetch("/upload/receipt", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? "Upload failed");
  }
  const data = (await res.json()) as { url: string };
  if (data.url.startsWith("http://") || data.url.startsWith("https://")) {
    return data.url;
  }
  const path = data.url.startsWith("/") ? data.url : `/${data.url}`;
  return `${getTeachingApiUrl().replace(/\/$/, "")}${path}`;
}
