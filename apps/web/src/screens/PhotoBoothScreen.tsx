import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPhotoDownload, uploadPhoto } from "../lib/api";
import {
  capturePhoto,
  getTwibbon,
  twibbons,
  type TwibbonId,
} from "../lib/photoFrame";

interface PhotoBoothScreenProps {
  onBack: () => void;
}

type Stage = "camera" | "preview" | "download";

export function PhotoBoothScreen({ onBack }: PhotoBoothScreenProps) {
  const [stage, setStage] = useState<Stage>("camera");
  const [twibbonId, setTwibbonId] = useState<TwibbonId>("dirgahayu-nusantara");
  const [publicConsent, setPublicConsent] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<Blob | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snapshotUrlRef = useRef("");
  const cameraRequestRef = useRef(0);
  const selectedTwibbon = getTwibbon(twibbonId);

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActiveStream(null);
    setCameraReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;
    setError("");
    setBusy(true);
    setCameraReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setBusy(false);
      setError("Browser atau perangkat ini tidak mendukung kamera.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      if (cameraRequestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setActiveStream(stream);
      setStage("camera");
    } catch {
      if (cameraRequestRef.current !== requestId) return;
      setBusy(false);
      setError("Kamera tidak dapat dibuka. Periksa izin browser dan sambungan webcam.");
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      cameraRequestRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
    };
  }, [startCamera]);

  useEffect(() => {
    if (stage !== "camera" || !videoRef.current || !activeStream) return;

    const video = videoRef.current;
    const stream = activeStream;
    let ready = false;
    const markReady = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      ready = true;
      setCameraReady(true);
      setBusy(false);
      setError("");
    };
    const watchdog = window.setTimeout(() => {
      if (!ready) {
        setBusy(false);
        setError("Stream kamera aktif, tetapi frame video belum diterima. Coba buka ulang kamera.");
      }
    }, 8_000);

    video.srcObject = stream;
    video.addEventListener("loadedmetadata", markReady);
    video.addEventListener("canplay", markReady);
    video.addEventListener("playing", markReady);
    void video.play().then(markReady).catch(() => {
      setBusy(false);
      setError("Video kamera gagal diputar oleh browser. Tekan Buka Ulang Kamera.");
    });

    return () => {
      window.clearTimeout(watchdog);
      video.removeEventListener("loadedmetadata", markReady);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("playing", markReady);
    };
  }, [activeStream, stage]);

  async function takePhoto() {
    if (!videoRef.current || busy) return;
    if (!cameraReady || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      setError("Kamera belum siap. Tunggu sampai indikator Kamera siap muncul.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      for (let value = 3; value > 0; value -= 1) {
        setCountdown(value);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      setCountdown(null);
      const blob = await capturePhoto(videoRef.current, twibbonId);
      const url = URL.createObjectURL(blob);
      if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
      snapshotUrlRef.current = url;
      setSnapshot(blob);
      setSnapshotUrl(url);
      stopCamera();
      setStage("preview");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Foto gagal diambil");
    } finally {
      setCountdown(null);
      setBusy(false);
    }
  }

  async function retake() {
    if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
    snapshotUrlRef.current = "";
    setSnapshot(null);
    setSnapshotUrl("");
    await startCamera();
  }

  async function savePhoto() {
    if (!snapshot || busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await uploadPhoto(snapshot, publicConsent);
      const download = await createPhotoDownload(created.id);
      const code = await QRCode.toDataURL(download.download_url, {
        width: 420,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#101010", light: "#ffffff" },
      });
      setQrUrl(code);
      setExpiresAt(download.expires_at);
      setStage("download");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Foto belum dapat disimpan");
    } finally {
      setBusy(false);
    }
  }

  function handleBack() {
    stopCamera();
    onBack();
  }

  if (stage === "download") {
    return (
      <section className="grid flex-1 place-items-center py-6 text-center">
        <div className="max-w-4xl rounded-[3rem] bg-white p-10 shadow-2xl">
          <p className="text-xl font-bold tracking-[0.18em] text-brand-red uppercase">Foto tersimpan</p>
          <h1 className="mt-2 text-5xl font-bold lg:text-7xl">Pindai untuk mengunduh</h1>
          <img className="mx-auto mt-6 size-80 max-h-[38vh] max-w-full" src={qrUrl} alt="QR unduh foto" />
          <p className="mt-4 text-xl text-black/60">QR berlaku sampai {new Date(expiresAt).toLocaleString("id-ID")}.</p>
          <p className="mt-2 text-lg text-black/50">
            {publicConsent
              ? "Foto sudah dapat tampil di layar publik dan dapat disembunyikan petugas bila diperlukan."
              : "Foto tetap privat dan tidak akan tampil di layar publik; QR unduh tetap aktif."}
          </p>
          <button className="touch-button-primary mt-7" type="button" onClick={handleBack}>Selesai</button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col py-4">
      <div className="mb-4 flex items-center justify-between gap-5">
        <div>
          <p className="text-lg font-bold tracking-[0.18em] text-brand-red uppercase">Photobooth Merdeka</p>
          <h1 className="text-4xl font-bold">{stage === "camera" ? "Pilih twibbon & berpose" : "Periksa hasil foto"}</h1>
        </div>
        <button className="touch-button-secondary" type="button" onClick={handleBack}>Kembali</button>
      </div>

      <div className={`grid flex-1 items-start gap-5 ${stage === "camera" ? "lg:grid-cols-[minmax(0,1fr)_21rem]" : ""}`}>
        <div>
          <div className="relative mx-auto aspect-video w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-black shadow-2xl">
            {stage === "camera" ? (
              <>
                <video ref={videoRef} className="size-full object-cover -scale-x-100" autoPlay muted playsInline />
                <img
                  className="pointer-events-none absolute inset-0 size-full object-fill"
                  src={selectedTwibbon.src}
                  alt=""
                  aria-hidden="true"
                />
              </>
            ) : (
              <img className="size-full object-cover" src={snapshotUrl} alt="Pratinjau foto photobooth" />
            )}
            {stage === "camera" && !cameraReady && countdown === null && (
              <div className="absolute inset-0 grid place-items-center bg-black/55 text-center text-2xl font-bold text-white">
                {busy ? "Membuka kamera…" : "Kamera belum siap"}
              </div>
            )}
            {countdown !== null && (
              <div className="absolute inset-0 grid place-items-center bg-black/35 text-[12rem] font-bold text-white">
                {countdown}
              </div>
            )}
          </div>
          {error && (
            <p className="mx-auto mt-4 w-full max-w-6xl rounded-2xl bg-red-50 p-4 text-xl font-bold text-brand-red" role="alert">
              {error}
            </p>
          )}
        </div>

        {stage === "camera" && (
          <aside className="rounded-[2rem] bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold tracking-[0.16em] text-brand-red uppercase">Ganti gaya</p>
                <h2 className="text-2xl font-bold">Pilih twibbon</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${cameraReady ? "bg-green-100 text-green-800" : "bg-black/5 text-black/55"}`} aria-live="polite">
                {cameraReady ? "Kamera siap" : "Menunggu"}
              </span>
            </div>

            <div className="mt-4 grid gap-3" aria-label="Pilihan twibbon">
              {twibbons.map((twibbon) => {
                const selected = twibbon.id === twibbonId;
                return (
                  <button
                    className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 p-2 text-left transition ${
                      selected ? "border-brand-red bg-red-50 shadow-md" : "border-black/10 bg-white"
                    }`}
                    disabled={countdown !== null}
                    key={twibbon.id}
                    onClick={() => setTwibbonId(twibbon.id)}
                    type="button"
                    aria-pressed={selected}
                  >
                    <img className="aspect-video w-24 shrink-0 rounded-xl bg-black object-cover" src={twibbon.src} alt="" />
                    <span>
                      <strong className="block text-lg leading-tight">{twibbon.name}</strong>
                      <small className="mt-1 block text-sm leading-tight text-black/55">{twibbon.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-warm-white p-4 text-base">
              <input
                className="mt-0.5 size-6 shrink-0 accent-brand-red"
                type="checkbox"
                checked={publicConsent}
                onChange={(event) => setPublicConsent(event.target.checked)}
              />
              <span>
                Tampilkan foto di layar publik.
                <small className="mt-1 block text-sm text-black/55">
                  Hapus centang agar privat. QR unduh tetap tersedia.
                </small>
              </span>
            </label>

            <div className="mt-4 grid gap-3">
              {error && (
                <button className="touch-button-secondary w-full" type="button" onClick={() => { stopCamera(); void startCamera(); }}>
                  Buka Ulang Kamera
                </button>
              )}
              <button className="touch-button-primary w-full" disabled={busy || !cameraReady} type="button" onClick={() => void takePhoto()}>
                {cameraReady ? "Ambil Foto" : "Menunggu Kamera…"}
              </button>
            </div>
          </aside>
        )}
      </div>

      {stage === "preview" && (
        <div className="mt-5 flex justify-center gap-4">
          <button className="touch-button-secondary" disabled={busy} type="button" onClick={() => void retake()}>Ambil Ulang</button>
          <button className="touch-button-primary" disabled={busy} type="button" onClick={() => void savePhoto()}>
            {busy ? "Menyimpan…" : "Simpan & Buat QR"}
          </button>
        </div>
      )}
    </section>
  );
}
