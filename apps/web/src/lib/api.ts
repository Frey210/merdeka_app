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

interface ApiErrorPayload {
  detail?: string | { msg?: string }[];
}

export async function submitGuestEntry(input: GuestEntryInput): Promise<GuestEntryCreated> {
  const response = await fetch("/api/v1/guestbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "Harapan belum dapat disimpan. Coba lagi.";
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (typeof payload.detail === "string") message = payload.detail;
    } catch {
      // Keep safe generic message when response is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as GuestEntryCreated;
}

