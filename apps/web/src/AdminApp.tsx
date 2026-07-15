import { useCallback, useEffect, useState } from "react";
import {
  deleteGuestEntry,
  getAdminSession,
  listAdminGuestEntries,
  moderateGuestEntry,
  type AdminGuestEntry,
  type AdminIdentity,
} from "./lib/api";

type QueueStatus = AdminGuestEntry["status"];

const tabs: { value: QueueStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export function AdminApp() {
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [entries, setEntries] = useState<AdminGuestEntry[]>([]);
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
        listAdminGuestEntries(queueStatus),
      ]);
      setIdentity(session);
      setEntries(queue);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dashboard gagal dimuat");
    } finally {
      setLoading(false);
    }
  }, [queueStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderate(id: string, status: "approved" | "rejected") {
    setWorkingId(id);
    setError("");
    try {
      await moderateGuestEntry(id, status);
      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Moderasi gagal");
    } finally {
      setWorkingId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus entri ini permanen?")) return;
    setWorkingId(id);
    setError("");
    try {
      await deleteGuestEntry(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
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
            <h1 className="text-2xl font-bold">Moderasi Buku Tamu</h1>
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
        ) : entries.length === 0 && !error ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-bold">Antrean kosong</p>
            <p className="mt-1 text-black/55">Tidak ada entri dengan status ini.</p>
          </div>
        ) : (
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
                    {entry.consent_public ? "Boleh dipublikasi" : "Privat"}
                  </span>
                </div>
                <p className="my-5 whitespace-pre-wrap text-lg">{entry.message}</p>
                <div className="flex flex-wrap gap-2">
                  {entry.status === "pending" && (
                    <>
                      <button
                        className="rounded-full bg-green-700 px-5 py-2 font-bold text-white disabled:opacity-50"
                        disabled={workingId === entry.id}
                        onClick={() => void moderate(entry.id, "approved")}
                        type="button"
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
        )}
      </section>
    </main>
  );
}
