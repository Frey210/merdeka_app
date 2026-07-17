import { useCallback, useEffect, useRef, useState } from "react";
import { KioskKeyboard } from "../components/KioskKeyboard";
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

interface CompletedRun {
  result: DinoGameResult;
  sessionId: string;
  online: boolean;
}

export function GameScreen({ onBack }: GameScreenProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [session, setSession] = useState<GameSessionCreated | null>(null);
  const [onlineSession, setOnlineSession] = useState(true);
  const [completedRun, setCompletedRun] = useState<CompletedRun | null>(null);
  const [verifiedScore, setVerifiedScore] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [error, setError] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [gameLoadError, setGameLoadError] = useState("");
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const activeRunRef = useRef(0);
  const startingRef = useRef(false);
  const gameDestroyRef = useRef<(() => void) | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await listLeaderboard("all-time", 200);
      setLeaderboard(response.items);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (stage !== "playing" || !session || !gameContainerRef.current) return;
    const runId = activeRunRef.current;
    let disposed = false;
    let destroy: (() => void) | undefined;
    void (async () => {
      try {
        const { mountDinoGame } = await import("../game/DinoGame");
        if (disposed || !gameContainerRef.current) return;
        const teardown = await mountDinoGame({
          parent: gameContainerRef.current,
          seed: session.seed,
          onReady: () => {
            if (disposed || activeRunRef.current !== runId) return;
            setGameReady(true);
          },
          onGameOver: (gameResult) => {
            if (disposed || activeRunRef.current !== runId) return;
            setCompletedRun({ result: gameResult, sessionId: session.id, online: onlineSession });
            setStage("result");
          },
        });
        if (disposed || activeRunRef.current !== runId) {
          teardown();
          return;
        }
        destroy = teardown;
        gameDestroyRef.current = teardown;
      } catch {
        if (!disposed && activeRunRef.current === runId) {
          setGameLoadError("Arena permainan gagal dimuat. Silakan coba lagi.");
        }
      }
    })();
    return () => {
      disposed = true;
      destroy?.();
      if (gameDestroyRef.current === destroy) gameDestroyRef.current = null;
    };
  }, [onlineSession, session, stage]);

  async function startGame() {
    if (startingRef.current) return;
    startingRef.current = true;
    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;
    gameDestroyRef.current?.();
    gameDestroyRef.current = null;
    setStage("loading");
    setSession(null);
    setError("");
    setDisplayName("");
    setCompletedRun(null);
    setRank(null);
    setVerifiedScore(null);
    setKeyboardOpen(false);
    setSubmitting(false);
    setGameReady(false);
    setGameLoadError("");
    let nextSession: GameSessionCreated;
    let nextOnlineSession: boolean;
    try {
      nextSession = await createGameSession();
      nextOnlineSession = true;
    } catch {
      nextSession = {
        id: `offline-${Date.now()}`,
        seed: Math.floor(Math.random() * 2_147_483_647),
        expires_at: new Date(Date.now() + 300_000).toISOString(),
      };
      nextOnlineSession = false;
    }
    if (activeRunRef.current === runId) {
      setSession(nextSession);
      setOnlineSession(nextOnlineSession);
      setStage("playing");
      startingRef.current = false;
    }
  }

  async function submitScore() {
    if (!completedRun || displayName.trim().length < 2 || submitting) return;
    if (!completedRun.online) {
      setError("Game dimainkan offline. Skor lokal tidak dapat masuk leaderboard.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const submitted = await finishGameSession(completedRun.sessionId, {
        display_name: displayName,
        duration_ms: completedRun.result.durationMs,
        jump_times_ms: completedRun.result.jumpTimesMs,
      });
      setVerifiedScore(submitted.score);
      setRank(submitted.rank);
      await loadLeaderboard();
      setStage("leaderboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Skor belum dapat dikirim.");
    } finally {
      setSubmitting(false);
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
          <div className="text-center" role="status">
            <span className="mx-auto block size-20 animate-spin rounded-full border-8 border-white/20 border-t-brand-red" aria-hidden="true" />
            <p className="mt-7 text-4xl font-bold">Menyiapkan sesi permainan…</p>
          </div>
        ) : (
          <div className="relative aspect-video max-h-[calc(100vh-2rem)] w-full max-w-[1600px] overflow-hidden rounded-[2.5rem] border-8 border-white/15 bg-warm-white shadow-2xl">
            <div className="absolute inset-0" ref={gameContainerRef} aria-label="Area permainan Dino Merdeka" />
            {!gameReady && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-warm-white text-ink">
                {gameLoadError ? (
                  <div className="max-w-2xl px-8 text-center" role="alert">
                    <p className="text-4xl font-bold text-brand-red">Game belum dapat dibuka</p>
                    <p className="mt-4 text-2xl text-black/60">{gameLoadError}</p>
                    <div className="mt-8 flex justify-center gap-4">
                      <button className="touch-button-primary" type="button" onClick={() => void startGame()}>Coba Lagi</button>
                      <button className="touch-button-secondary" type="button" onClick={onBack}>Kembali</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center" role="status">
                    <span className="mx-auto block size-20 animate-spin rounded-full border-8 border-black/10 border-t-brand-red" aria-hidden="true" />
                    <p className="mt-7 text-4xl font-bold">Memuat arena dan aset permainan…</p>
                    <p className="mt-3 text-2xl text-black/50">Permainan belum dimulai</p>
                  </div>
                )}
              </div>
            )}
          </div>
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
                  Bantu Dino membawa Merah Putih melintasi bandara. Lompati rintangan darat, tetapi tetap berlari di bawah saat pesawat melintas!
                </p>
                <div className="mt-9 flex flex-wrap gap-4">
                  <button className="min-h-24 rounded-full bg-white px-14 py-5 text-4xl font-bold text-brand-red shadow-2xl" type="button" onClick={() => void startGame()}>
                    Mulai Berlari
                  </button>
                </div>
                <p className="mt-6 text-2xl text-white/75">Kontrol: sentuh layar, klik, atau tekan Space untuk melompat.</p>
              </>
            )}

            {stage === "result" && completedRun && (
              <div className="rounded-[3rem] bg-white p-9 text-ink shadow-2xl lg:p-12">
                <p className="text-xl font-bold uppercase tracking-[0.18em] text-brand-red">Perjalanan selesai</p>
                <p className="mt-2 text-7xl font-bold">{completedRun.result.score.toString().padStart(4, "0")}</p>
                <p className="mt-2 text-2xl text-black/55">Masukkan nama panggilan untuk mengabadikan skor.</p>
                <label className="kiosk-field mt-7">
                  Nama panggilan
                  <input
                    autoFocus
                    maxLength={20}
                    inputMode="none"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    onFocus={() => setKeyboardOpen(true)}
                    placeholder="Contoh: Garuda81"
                  />
                  <small>{displayName.length}/20 · Nama dan skor akan terlihat publik</small>
                </label>
                {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-xl font-bold text-brand-red" role="alert">{error}</p>}
                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="touch-button-primary" disabled={displayName.trim().length < 2 || submitting} type="button" onClick={() => void submitScore()}>{submitting ? "Menyimpan…" : "Simpan Skor"}</button>
                  <button className="touch-button-secondary" disabled={submitting} type="button" onClick={() => void startGame()}>Main Lagi</button>
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
              <span className="rounded-full bg-warm-white px-5 py-3 text-lg font-bold text-black/60">Sepanjang Waktu</span>
            </div>
            <ol className="kiosk-scrollbar mt-6 max-h-[min(52vh,38rem)] space-y-2 overflow-y-auto pr-3" aria-label="Leaderboard seluruh pemain">
              {leaderboard.length ? leaderboard.map((entry) => (
                <li className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl bg-warm-white px-5 py-3 text-2xl" key={`${entry.rank}-${entry.display_name}-${entry.score}`}>
                  <strong className="text-brand-red">{entry.rank}</strong>
                  <span className="truncate font-bold">{entry.display_name}</span>
                  <span className="font-bold tabular-nums">{entry.score.toString().padStart(4, "0")}</span>
                </li>
              )) : (
                <li className="rounded-2xl bg-warm-white p-6 text-center text-xl text-black/55">Jadilah pelari pertama!</li>
              )}
            </ol>
          </div>
        </section>
      </div>
      {stage === "result" && keyboardOpen && (
        <KioskKeyboard
          value={displayName}
          onChange={setDisplayName}
          onClose={() => setKeyboardOpen(false)}
          maxLength={20}
          label="Nama panggilan"
        />
      )}
    </main>
  );
}
