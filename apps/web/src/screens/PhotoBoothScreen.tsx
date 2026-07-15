import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { createPhotoDownload, uploadPhoto } from "../lib/api";
import { capturePhoto, frameThemes, type FrameTheme } from "../lib/photoFrame";

interface PhotoBoothScreenProps {
  onBack: () => void;
}

type Stage = "intro" | "camera" | "preview" | "download";

export function PhotoBoothScreen({ onBack }: PhotoBoothScreenProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [theme, setTheme] = useState<FrameTheme>("merah-putih");
  const [publicConsent, setPublicConsent] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<Blob | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snapshotUrlRef = useRef("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActiveStream(null);
    setCameraReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
    };
  }, []);

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

  async function startCamera() {
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
      streamRef.current = stream;
      setActiveStream(stream);
      setStage("camera");
    } catch {
      setBusy(false);
      setError("Kamera tidak dapat dibuka. Periksa izin browser dan sambungan webcam.");
    }
  }

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
      const blob = await capturePhoto(videoRef.current, theme);
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

  if (stage === "intro") {
    return (
      <section className="grid flex-1 place-items-center py-6">
        <div className="w-full max-w-5xl rounded-[3rem] bg-white p-9 shadow-2xl lg:p-12">
          <p className="text-xl font-bold tracking-[0.18em] text-brand-red uppercase">Photobooth Merdeka</p>
          <h1 className="mt-2 text-5xl font-bold lg:text-7xl">Siap berfoto?</h1>
          <p className="mt-5 text-2xl leading-relaxed text-black/65">
            Kamera hanya aktif selama sesi. Foto disimpan privat maksimal 7 hari. QR unduh berlaku 24 jam.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {frameThemes.map((frame) => (
              <button
                className={`rounded-2xl border-2 p-5 text-left ${theme === frame.id ? "border-brand-red bg-red-50" : "border-black/10"}`}
                key={frame.id}
                onClick={() => setTheme(frame.id)}
                type="button"
              >
                <strong className="block text-2xl">{frame.name}</strong>
                <span className="text-lg text-black/55">{frame.description}</span>
              </button>
            ))}
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-2xl bg-warm-white p-5 text-xl">
            <input
              className="mt-1 size-7 accent-brand-red"
              type="checkbox"
              checked={publicConsent}
              onChange={(event) => setPublicConsent(event.target.checked)}
            />
            Saya bersedia foto ditampilkan publik setelah moderasi. Tidak wajib untuk membuat foto.
          </label>
          {error && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-xl font-bold text-brand-red" role="alert">{error}</p>}
          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <button className="touch-button-secondary" type="button" onClick={onBack}>Kembali</button>
            <button className="touch-button-primary" disabled={busy} type="button" onClick={() => void startCamera()}>
              {busy ? "Membuka Kamera…" : "Aktifkan Kamera"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (stage === "download") {
    return (
      <section className="grid flex-1 place-items-center py-6 text-center">
        <div className="max-w-4xl rounded-[3rem] bg-white p-10 shadow-2xl">
          <p className="text-xl font-bold tracking-[0.18em] text-brand-red uppercase">Foto tersimpan</p>
          <h1 className="mt-2 text-5xl font-bold lg:text-7xl">Pindai untuk mengunduh</h1>
          <img className="mx-auto mt-6 size-80 max-h-[38vh] max-w-full" src={qrUrl} alt="QR unduh foto" />
          <p className="mt-4 text-xl text-black/60">QR berlaku sampai {new Date(expiresAt).toLocaleString("id-ID")}.</p>
          <button className="touch-button-primary mt-7" type="button" onClick={onBack}>Selesai</button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col py-5">
      <div className="mb-4 flex items-center justify-between gap-5">
        <div>
          <p className="text-lg font-bold tracking-[0.18em] text-brand-red uppercase">Photobooth Merdeka</p>
          <h1 className="text-4xl font-bold">{stage === "camera" ? "Lihat kamera" : "Periksa hasil foto"}</h1>
        </div>
        <button className="touch-button-secondary" type="button" onClick={onBack}>Kembali</button>
      </div>
      <div className="relative mx-auto aspect-video w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-black shadow-2xl">
        {stage === "camera" ? (
          <video ref={videoRef} className="size-full object-cover -scale-x-100" autoPlay muted playsInline />
        ) : (
          <img className="size-full object-cover" src={snapshotUrl} alt="Pratinjau foto photobooth" />
        )}
        {stage === "camera" && !cameraReady && countdown === null && (
          <div className="absolute inset-0 grid place-items-center bg-black/45 text-center text-2xl font-bold text-white">
            Menghubungkan stream kamera…
          </div>
        )}
        {countdown !== null && <div className="absolute inset-0 grid place-items-center bg-black/35 text-[12rem] font-bold text-white">{countdown}</div>}
      </div>
      {stage === "camera" && (
        <p className={`mx-auto mt-4 text-xl font-bold ${cameraReady ? "text-green-700" : "text-black/55"}`} aria-live="polite">
          {cameraReady ? "Kamera siap" : "Menunggu frame kamera"}
        </p>
      )}
      {error && <p className="mx-auto mt-4 w-full max-w-5xl rounded-2xl bg-red-50 p-4 text-xl font-bold text-brand-red" role="alert">{error}</p>}
      <div className="mt-5 flex justify-center gap-4">
        {stage === "camera" ? (
          <>
            {error && (
              <button className="touch-button-secondary" type="button" onClick={() => { stopCamera(); void startCamera(); }}>
                Buka Ulang Kamera
              </button>
            )}
            <button className="touch-button-primary" disabled={busy || !cameraReady} type="button" onClick={() => void takePhoto()}>
              {cameraReady ? "Ambil Foto" : "Menunggu Kamera…"}
            </button>
          </>
        ) : (
          <>
            <button className="touch-button-secondary" disabled={busy} type="button" onClick={() => void retake()}>Ambil Ulang</button>
            <button className="touch-button-primary" disabled={busy} type="button" onClick={() => void savePhoto()}>{busy ? "Menyimpan…" : "Simpan & Buat QR"}</button>
          </>
        )}
      </div>
    </section>
  );
}
