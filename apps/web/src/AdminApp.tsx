import { useCallback, useEffect, useState } from "react";
import {
  deletePhoto,
  deleteGuestEntry,
  getAdminSession,
  listAdminGuestEntries,
  listAdminPhotos,
  moderateGuestEntry,
  moderatePhoto,
  type AdminGuestEntry,
  type AdminIdentity,
  type AdminPhoto,
} from "./lib/api";

type QueueStatus = AdminGuestEntry["status"];

const tabs: { value: QueueStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export function AdminApp() {
  const [section, setSection] = useState<"guestbook" | "photos">("guestbook");
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [entries, setEntries] = useState<AdminGuestEntry[]>([]);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [session, queue] = await Promise.all([
        getAdminSession(),
        section === "guestbook"
          ? listAdminGuestEntries(queueStatus)
          : listAdminPhotos(queueStatus),
      ]);
      setIdentity(session);
      if (section === "guestbook") setEntries(queue as AdminGuestEntry[]);
      else setPhotos(queue as AdminPhoto[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dashboard gagal dimuat");
    } finally {
      setLoading(false);
    }
  }, [queueStatus, section]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderate(id: string, status: "approved" | "rejected") {
    setWorkingId(id);
    setError("");
    try {
      if (section === "guestbook") {
        await moderateGuestEntry(id, status);
        setEntries((current) => current.filter((entry) => entry.id !== id));
      } else {
        await moderatePhoto(id, status);
        setPhotos((current) => current.filter((photo) => photo.id !== id));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Moderasi gagal");
    } finally {
      setWorkingId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(`Hapus ${section === "guestbook" ? "entri" : "foto"} ini permanen?`)) return;
    setWorkingId(id);
    setError("");
    try {
      if (section === "guestbook") {
        await deleteGuestEntry(id);
        setEntries((current) => current.filter((entry) => entry.id !== id));
      } else {
        await deletePhoto(id);
        setPhotos((current) => current.filter((photo) => photo.id !== id));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Penghapusan gagal");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-warm-white text-ink">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-brand-red uppercase">UPG</p>
            <h1 className="text-2xl font-bold">Moderasi Konten</h1>
          </div>
          <div className="text-right text-sm text-black/60">
            <p>{identity?.email ?? "Cloudflare Access"}</p>
            <button className="font-bold text-brand-red" onClick={() => void load()} type="button">
              Muat ulang
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <div className="mb-4 flex gap-2 border-b border-black/10 pb-4" aria-label="Jenis konten">
          <button
            className={`rounded-xl px-5 py-3 font-bold ${section === "guestbook" ? "bg-ink text-white" : "bg-white"}`}
            onClick={() => setSection("guestbook")}
            type="button"
          >
            Buku Tamu
          </button>
          <button
            className={`rounded-xl px-5 py-3 font-bold ${section === "photos" ? "bg-ink text-white" : "bg-white"}`}
            onClick={() => setSection("photos")}
            type="button"
          >
            Foto
          </button>
        </div>
        <div className="mb-6 flex flex-wrap gap-2" aria-label="Filter status">
          {tabs.map((tab) => (
            <button
              className={`rounded-full px-5 py-2 font-bold ${
                queueStatus === tab.value ? "bg-brand-red text-white" : "bg-white text-black/65"
              }`}
              key={tab.value}
              onClick={() => setQueueStatus(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900" role="alert">
            <p className="font-bold">Dashboard belum dapat diakses</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-lg text-black/55">Memuat antrean…</p>
        ) : (section === "guestbook" ? entries.length : photos.length) === 0 && !error ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-bold">Antrean kosong</p>
            <p className="mt-1 text-black/55">Tidak ada entri dengan status ini.</p>
          </div>
        ) : section === "guestbook" ? (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-6" key={entry.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{entry.display_name}</h2>
                    <p className="text-black/55">
                      {entry.origin} · {new Date(entry.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-bold">
                    {entry.consent_public ? "Boleh dipublikasi" : "Privat · tidak tampil di idle"}
                  </span>
                </div>
                <p className="my-5 whitespace-pre-wrap text-lg">{entry.message}</p>
                <div className="flex flex-wrap gap-2">
                  {entry.status === "pending" && (
                    <>
                      <button
                        className="rounded-full bg-green-700 px-5 py-2 font-bold text-white disabled:opacity-50"
                        disabled={workingId === entry.id || !entry.consent_public}
                        onClick={() => void moderate(entry.id, "approved")}
                        type="button"
                        title={!entry.consent_public ? "Harapan privat tidak boleh dipublikasikan" : undefined}
                      >
                        Setujui
                      </button>
                      <button
                        className="rounded-full bg-black/70 px-5 py-2 font-bold text-white disabled:opacity-50"
                        disabled={workingId === entry.id}
                        onClick={() => void moderate(entry.id, "rejected")}
                        type="button"
                      >
                        Tolak
                      </button>
                    </>
                  )}
                  <button
                    className="rounded-full border border-red-200 px-5 py-2 font-bold text-brand-red disabled:opacity-50"
                    disabled={workingId === entry.id}
                    onClick={() => void remove(entry.id)}
                    type="button"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {photos.map((photo) => (
              <article className="overflow-hidden rounded-3xl bg-white shadow-sm" key={photo.id}>
                <img
                  className="aspect-video w-full bg-black object-contain"
                  src={`/api/v1/admin/photos/${photo.id}/content`}
                  alt="Foto photobooth untuk moderasi"
                />
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/55">
                    <span>{new Date(photo.created_at).toLocaleString("id-ID")}</span>
                    <span className="rounded-full bg-black/5 px-3 py-1 font-bold">
                      {photo.public_consent ? "Boleh dipublikasi" : "Privat"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-black/50">
                    Retensi sampai {new Date(photo.expires_at).toLocaleString("id-ID")}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {photo.status === "pending" && (
                      <>
                        <button
                          className="rounded-full bg-green-700 px-5 py-2 font-bold text-white disabled:opacity-50"
                          disabled={workingId === photo.id || !photo.public_consent}
                          onClick={() => void moderate(photo.id, "approved")}
                          type="button"
                          title={!photo.public_consent ? "Foto privat tidak boleh dipublikasi" : undefined}
                        >
                          Setujui
                        </button>
                        <button
                          className="rounded-full bg-black/70 px-5 py-2 font-bold text-white disabled:opacity-50"
                          disabled={workingId === photo.id}
                          onClick={() => void moderate(photo.id, "rejected")}
                          type="button"
                        >
                          Tolak
                        </button>
                      </>
                    )}
                    <button
                      className="rounded-full border border-red-200 px-5 py-2 font-bold text-brand-red disabled:opacity-50"
                      disabled={workingId === photo.id}
                      onClick={() => void remove(photo.id)}
                      type="button"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
