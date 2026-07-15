export type FrameTheme = "merah-putih" | "pita-nusantara" | "bandara-upg";

export const frameThemes: { id: FrameTheme; name: string; description: string }[] = [
  { id: "merah-putih", name: "Merah Putih", description: "Klasik dan tegas" },
  { id: "pita-nusantara", name: "Pita Nusantara", description: "Dinamis dan meriah" },
  { id: "bandara-upg", name: "Bandara UPG", description: "Kenangan dari Makassar" },
];

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Logo bingkai gagal dimuat"));
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

function drawFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: FrameTheme,
  logo: HTMLImageElement,
) {
  context.save();
  if (theme === "merah-putih") {
    context.fillStyle = "#ed1c24";
    context.fillRect(0, height - 112, width, 112);
    context.fillRect(0, 0, 26, height);
  } else if (theme === "pita-nusantara") {
    context.fillStyle = "rgba(237, 28, 36, 0.94)";
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(330, 0);
    context.lineTo(0, 240);
    context.fill();
    context.beginPath();
    context.moveTo(width, height);
    context.lineTo(width - 380, height);
    context.lineTo(width, height - 260);
    context.fill();
  } else {
    context.fillStyle = "rgba(16, 16, 16, 0.78)";
    context.fillRect(0, height - 104, width, 104);
    context.fillStyle = "#ed1c24";
    context.fillRect(0, height - 116, width, 12);
  }

  context.fillStyle = "#fff";
  context.font = "700 36px 'Saira Semi Condensed', sans-serif";
  context.textBaseline = "middle";
  const caption = theme === "bandara-upg" ? "BANDARA SULTAN HASANUDDIN • UPG" : "INDONESIA MERDEKA • 2026";
  context.fillText(caption, 42, height - 54);
  context.drawImage(logo, width - 300, 22, 260, 184);
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

export async function capturePhoto(video: HTMLVideoElement, theme: FrameTheme): Promise<Blob> {
  if (!video.videoWidth || !video.videoHeight) throw new Error("Kamera belum siap");
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia");
  drawVideoCover(context, video, canvas.width, canvas.height);
  const logo = await loadImage("/branding/hut-ri-81.png");
  drawFrame(context, canvas.width, canvas.height, theme, logo);

  for (const quality of [0.9, 0.82, 0.74, 0.66]) {
    const blob = await canvasToJpeg(canvas, quality);
    if (blob.size <= 2 * 1024 * 1024) return blob;
  }
  throw new Error("Ukuran foto melebihi 2 MB");
}
