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

export interface ApprovedGuestEntry {
  id: string;
  display_name: string;
  origin: string;
  message: string;
  created_at: string;
}

export interface ApprovedPhoto {
  id: string;
  created_at: string;
}

export interface GameSessionCreated {
  id: string;
  seed: number;
  expires_at: string;
}

export interface GameFinishInput {
  display_name: string;
  duration_ms: number;
  jump_times_ms: number[];
}

export interface GameFinishResult {
  score: number;
  rank: number;
}

export interface LeaderboardItem {
  rank: number;
  display_name: string;
  score: number;
  created_at: string;
}

export interface LeaderboardResponse {
  period: "daily" | "all-time";
  items: LeaderboardItem[];
}

export interface AdminLeaderboardEntry {
  id: string;
  display_name: string;
  score: number;
  created_at: string;
  hidden_at: string | null;
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

export async function listApprovedGuestEntries(limit = 20): Promise<ApprovedGuestEntry[]> {
  const response = await fetch(`/api/v1/guestbook/approved?limit=${limit}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const payload: unknown = await response.json();
  return Array.isArray(payload) ? (payload as ApprovedGuestEntry[]) : [];
}

export async function listApprovedPhotos(limit = 20): Promise<ApprovedPhoto[]> {
  const response = await fetch(`/api/v1/photos/approved?limit=${limit}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const payload: unknown = await response.json();
  return Array.isArray(payload) ? (payload as ApprovedPhoto[]) : [];
}

export function approvedPhotoContentUrl(id: string): string {
  return `/api/v1/photos/approved/${encodeURIComponent(id)}/content`;
}

export async function createGameSession(): Promise<GameSessionCreated> {
  const response = await fetch("/api/v1/game/sessions", { method: "POST" });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as GameSessionCreated;
}

export async function finishGameSession(
  id: string,
  input: GameFinishInput,
): Promise<GameFinishResult> {
  const response = await fetch(`/api/v1/game/sessions/${encodeURIComponent(id)}/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as GameFinishResult;
}

export async function listLeaderboard(
  period: "daily" | "all-time" = "all-time",
  limit = 200,
): Promise<LeaderboardResponse> {
  const response = await fetch(`/api/v1/game/leaderboard?period=${period}&limit=${limit}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as LeaderboardResponse;
}

export async function listAdminLeaderboard(): Promise<AdminLeaderboardEntry[]> {
  const response = await fetch("/api/v1/admin/leaderboard?limit=100");
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminLeaderboardEntry[];
}

export async function updateLeaderboardVisibility(
  id: string,
  hidden: boolean,
): Promise<AdminLeaderboardEntry> {
  const response = await fetch(`/api/v1/admin/leaderboard/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hidden }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminLeaderboardEntry;
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
