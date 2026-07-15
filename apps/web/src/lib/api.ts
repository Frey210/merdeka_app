export interface GuestEntryInput {
  display_name: string;
  origin: string;
  message: string;
  consent_public: boolean;
}

export interface GuestEntryCreated {
  id: string;
  status: "pending";
}

export interface PhotoCreated {
  id: string;
  status: "pending";
}

export interface PhotoDownloadCreated {
  download_url: string;
  expires_at: string;
}

interface ApiErrorPayload {
  detail?: string | { msg?: string }[];
}

export interface AdminIdentity {
  email: string;
  subject: string;
}

export interface AdminGuestEntry {
  id: string;
  display_name: string;
  origin: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  consent_public: boolean;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface AdminPhoto {
  id: string;
  public_consent: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  expires_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (typeof payload.detail === "string") return payload.detail;
  } catch {
    // Response may not be JSON.
  }
  return `Server merespons ${response.status}`;
}

export async function getAdminSession(): Promise<AdminIdentity> {
  const response = await fetch("/api/v1/admin/session");
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminIdentity;
}

export async function listAdminGuestEntries(
  status: AdminGuestEntry["status"],
): Promise<AdminGuestEntry[]> {
  const response = await fetch(`/api/v1/admin/guestbook?status=${status}`);
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminGuestEntry[];
}

export async function moderateGuestEntry(
  id: string,
  status: "approved" | "rejected",
): Promise<AdminGuestEntry> {
  const response = await fetch(`/api/v1/admin/guestbook/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminGuestEntry;
}

export async function deleteGuestEntry(id: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/guestbook/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await readApiError(response));
}

export async function listAdminPhotos(status: AdminPhoto["status"]): Promise<AdminPhoto[]> {
  const response = await fetch(`/api/v1/admin/photos?status=${status}`);
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminPhoto[];
}

export async function moderatePhoto(
  id: string,
  status: "approved" | "rejected",
): Promise<AdminPhoto> {
  const response = await fetch(`/api/v1/admin/photos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminPhoto;
}

export async function deletePhoto(id: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/photos/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await readApiError(response));
}

export async function submitGuestEntry(input: GuestEntryInput): Promise<GuestEntryCreated> {
  const response = await fetch("/api/v1/guestbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "Harapan belum dapat disimpan. Coba lagi.";
    const detail = await readApiError(response);
    if (!detail.startsWith("Server merespons")) message = detail;
    throw new Error(message);
  }

  return (await response.json()) as GuestEntryCreated;
}

export async function uploadPhoto(photo: Blob, publicConsent: boolean): Promise<PhotoCreated> {
  const form = new FormData();
  form.append("photo", photo, "photobooth-merdeka-upg.jpg");
  form.append("public_consent", String(publicConsent));
  const response = await fetch("/api/v1/photos", { method: "POST", body: form });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as PhotoCreated;
}

export async function createPhotoDownload(photoId: string): Promise<PhotoDownloadCreated> {
  const response = await fetch(`/api/v1/photos/${photoId}/download`, { method: "POST" });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as PhotoDownloadCreated;
}
