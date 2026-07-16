import { useCallback, useEffect, useRef, useState } from "react";
import type { DinoGameResult } from "../game/DinoGame";
import {
  createGameSession,
  finishGameSession,
  listLeaderboard,
  type GameSessionCreated,
  type LeaderboardItem,
} from "../lib/api";

interface GameScreenProps {
  onBack: () => void;
}

type Stage = "intro" | "loading" | "playing" | "result" | "leaderboard";

export function GameScreen({ onBack }: GameScreenProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [session, setSession] = useState<GameSessionCreated | null>(null);
  const [onlineSession, setOnlineSession] = useState(true);
  const [result, setResult] = useState<DinoGameResult | null>(null);
  const [verifiedScore, setVerifiedScore] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [period, setPeriod] = useState<"daily" | "all-time">("daily");
  const [error, setError] = useState("");
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const loadLeaderboard = useCallback(async (selectedPeriod: "daily" | "all-time") => {
    try {
      const response = await listLeaderboard(selectedPeriod);
      setLeaderboard(response.items);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard(period);
  }, [loadLeaderboard, period]);

  useEffect(() => {
    if (stage !== "playing" || !session || !gameContainerRef.current) return;
    let disposed = false;
    let destroy: (() => void) | undefined;
    void import("../game/DinoGame").then(async ({ mountDinoGame }) => {
      if (disposed || !gameContainerRef.current) return;
      destroy = await mountDinoGame({
        parent: gameContainerRef.current,
        seed: session.seed,
        onGameOver: (gameResult) => {
          if (disposed) return;
          setResult(gameResult);
          setStage("result");
        },
      });
    });
    return () => {
      disposed = true;
      destroy?.();
    };
  }, [session, stage]);

  async function startGame() {
    setStage("loading");
    setError("");
    setDisplayName("");
    setResult(null);
    setRank(null);
    setVerifiedScore(null);
    try {
      const created = await createGameSession();
      setSession(created);
      setOnlineSession(true);
    } catch {
      setSession({
        id: `offline-${Date.now()}`,
        seed: Math.floor(Math.random() * 2_147_483_647),
        expires_at: new Date(Date.now() + 300_000).toISOString(),
      });
      setOnlineSession(false);
    }
    setStage("playing");
  }

  async function submitScore() {
    if (!session || !result || displayName.trim().length < 2) return;
    if (!onlineSession) {
      setError("Game dimainkan offline. Skor lokal tidak dapat masuk leaderboard.");
      return;
    }
    setError("");
    try {
      const submitted = await finishGameSession(session.id, {
        display_name: displayName,
        duration_ms: result.durationMs,
        jump_times_ms: result.jumpTimesMs,
      });
      setVerifiedScore(submitted.score);
      setRank(submitted.rank);
      await loadLeaderboard(period);
      setStage("leaderboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Skor belum dapat dikirim.");
    }
  }

  if (stage === "playing" || stage === "loading") {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink p-4 text-white lg:p-8">
        <div className="absolute left-6 top-6 z-20 flex items-center gap-4">
          <button className="touch-button-secondary" type="button" onClick={onBack}>Keluar</button>
          {!onlineSession && <span className="rounded-full bg-amber-300 px-5 py-3 text-xl font-bold text-ink">Mode offline</span>}
        </div>
        {stage === "loading" ? (
          <p className="text-4xl font-bold">Menyiapkan lintasan…</p>
        ) : (
          <div
            className="aspect-video max-h-[calc(100vh-2rem)] w-full max-w-[1600px] overflow-hidden rounded-[2.5rem] border-8 border-white/15 bg-warm-white shadow-2xl"
            ref={gameContainerRef}
            aria-label="Area permainan Dino Merdeka. Sentuh layar untuk melompat."
          />
        )}
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-red px-8 py-8 text-white lg:px-16">
      <div className="pointer-events-none absolute -right-32 -top-52 size-[42rem] rounded-full border-[7rem] border-white/10" />
      <div className="pointer-events-none absolute -bottom-64 -left-36 size-[42rem] rounded-full border-[7rem] border-black/10" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1720px] flex-col">
        <header className="flex items-center justify-between gap-6">
          <div>
            <p className="text-2xl font-bold uppercase tracking-[0.18em]">Mini Game Kemerdekaan</p>
            <h1 className="text-6xl font-bold leading-none lg:text-8xl">Dino Merdeka</h1>
          </div>
          <button className="touch-button-secondary" type="button" onClick={onBack}>Kembali ke Menu</button>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            {stage === "intro" && (
              <>
                <p className="max-w-3xl text-3xl leading-snug lg:text-4xl">
                  Bantu Dino membawa Merah Putih melintasi rintangan. Sentuh layar untuk melompat dan raih skor tertinggi!
                </p>
                <div className="mt-9 flex flex-wrap gap-4">
                  <button className="min-h-24 rounded-full bg-white px-14 py-5 text-4xl font-bold text-brand-red shadow-2xl" type="button" onClick={() => void startGame()}>
                    Mulai Berlari
                  </button>
                </div>
                <p className="mt-6 text-2xl text-white/75">Kontrol: sentuh layar, klik, atau tekan Space.</p>
              </>
            )}

            {stage === "result" && result && (
              <div className="rounded-[3rem] bg-white p-9 text-ink shadow-2xl lg:p-12">
                <p className="text-xl font-bold uppercase tracking-[0.18em] text-brand-red">Perjalanan selesai</p>
                <p className="mt-2 text-7xl font-bold">{result.score.toString().padStart(4, "0")}</p>
                <p className="mt-2 text-2xl text-black/55">Masukkan nama panggilan untuk mengabadikan skor.</p>
                <label className="kiosk-field mt-7">
                  Nama panggilan
                  <input
                    autoFocus
                    maxLength={20}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Contoh: Garuda81"
                  />
                  <small>{displayName.length}/20 · Nama dan skor akan terlihat publik</small>
                </label>
                {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-xl font-bold text-brand-red" role="alert">{error}</p>}
                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="touch-button-primary" disabled={displayName.trim().length < 2} type="button" onClick={() => void submitScore()}>Simpan Skor</button>
                  <button className="touch-button-secondary" type="button" onClick={() => void startGame()}>Main Lagi</button>
                  <button className="touch-button-secondary" type="button" onClick={onBack}>Lewati</button>
                </div>
              </div>
            )}

            {stage === "leaderboard" && (
              <div>
                <p className="text-3xl font-bold uppercase tracking-[0.12em]">Skor tersimpan</p>
                <p className="mt-2 text-8xl font-bold">#{rank}</p>
                <p className="text-4xl">{displayName} · {verifiedScore?.toString().padStart(4, "0")}</p>
                <div className="mt-9 flex flex-wrap gap-4">
                  <button className="min-h-20 rounded-full bg-white px-10 py-4 text-3xl font-bold text-brand-red" type="button" onClick={() => void startGame()}>Main Lagi</button>
                  <button className="min-h-20 rounded-full border-2 border-white/50 px-10 py-4 text-3xl font-bold" type="button" onClick={onBack}>Selesai</button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[3rem] bg-white p-7 text-ink shadow-2xl lg:p-9">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold uppercase tracking-[0.18em] text-brand-red">Papan Peringkat</p>
                <h2 className="text-4xl font-bold">Pelari Terbaik</h2>
              </div>
              <button
                className="rounded-full bg-warm-white px-5 py-3 text-lg font-bold"
                type="button"
                onClick={() => setPeriod((current) => (current === "daily" ? "all-time" : "daily"))}
              >
                {period === "daily" ? "Hari Ini" : "Semua"}
              </button>
            </div>
            <ol className="mt-6 space-y-2">
              {leaderboard.length ? leaderboard.map((entry) => (
                <li className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl bg-warm-white px-5 py-3 text-2xl" key={`${entry.rank}-${entry.display_name}-${entry.score}`}>
                  <strong className="text-brand-red">{entry.rank}</strong>
                  <span className="truncate font-bold">{entry.display_name}</span>
                  <span className="font-bold tabular-nums">{entry.score.toString().padStart(4, "0")}</span>
                </li>
              )) : (
                <li className="rounded-2xl bg-warm-white p-6 text-center text-xl text-black/55">Jadilah pelari pertama hari ini!</li>
              )}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
