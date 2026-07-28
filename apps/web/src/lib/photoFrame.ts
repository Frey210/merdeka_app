export type TwibbonId =
  | "dirgahayu-nusantara"
  | "pesona-makassar"
  | "harmoni-indonesia";

export interface Twibbon {
  id: TwibbonId;
  name: string;
  description: string;
  src: string;
}

export const twibbons: Twibbon[] = [
  {
    id: "dirgahayu-nusantara",
    name: "Dirgahayu Nusantara",
    description: "Semangat budaya dan sejarah Makassar",
    src: "/twibbons/dirgahayu-nusantara.png",
  },
  {
    id: "pesona-makassar",
    name: "Pesona Makassar",
    description: "Ikon Bandara Sultan Hasanuddin",
    src: "/twibbons/pesona-makassar.png",
  },
  {
    id: "harmoni-indonesia",
    name: "Harmoni Indonesia",
    description: "Kebersamaan dalam keberagaman",
    src: "/twibbons/harmoni-indonesia.png",
  },
];

export function getTwibbon(id: TwibbonId): Twibbon {
  return twibbons.find((twibbon) => twibbon.id === id) ?? twibbons[0];
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Twibbon gagal dimuat"));
    image.src = source;
  });
}

function drawVideoCover(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) {
  const videoRatio = video.videoWidth / video.videoHeight;
  const canvasRatio = width / height;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;
  let sourceX = 0;
  let sourceY = 0;
  if (videoRatio > canvasRatio) {
    sourceWidth = video.videoHeight * canvasRatio;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else {
    sourceHeight = video.videoWidth / canvasRatio;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }
  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
  context.restore();
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Foto gagal diproses"))),
      "image/jpeg",
      quality,
    );
  });
}

export async function capturePhoto(video: HTMLVideoElement, twibbonId: TwibbonId): Promise<Blob> {
  if (!video.videoWidth || !video.videoHeight) throw new Error("Kamera belum siap");
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia");

  drawVideoCover(context, video, canvas.width, canvas.height);
  const overlay = await loadImage(getTwibbon(twibbonId).src);
  context.drawImage(overlay, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.9, 0.82, 0.74, 0.66]) {
    const blob = await canvasToJpeg(canvas, quality);
    if (blob.size <= 2 * 1024 * 1024) return blob;
  }
  throw new Error("Ukuran foto melebihi 2 MB");
}
