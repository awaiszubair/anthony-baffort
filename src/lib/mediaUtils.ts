export interface FormatConfig {
  id: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
}

export const FORMATS: FormatConfig[] = [
  { id: "square", label: "Feed", width: 1080, height: 1080, ratio: "1:1" },
  { id: "portrait", label: "Portrait", width: 1440, height: 1800, ratio: "4:5" },
  { id: "story", label: "Story / Reel", width: 1080, height: 1920, ratio: "9:16" },
];

export type MediaType = "image" | "video";

export function detectMediaType(file: File): MediaType {
  return file.type.startsWith("video/") ? "video" : "image";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function computeDrawParams(
  srcW: number, srcH: number,
  dstW: number, dstH: number,
  offsetX: number, offsetY: number,
  zoom: number
) {
  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;

  let baseW: number, baseH: number;
  if (srcRatio > dstRatio) {
    baseH = dstH;
    baseW = dstH * srcRatio;
  } else {
    baseW = dstW;
    baseH = dstW / srcRatio;
  }

  const drawW = baseW * zoom;
  const drawH = baseH * zoom;

  const overflowX = drawW - dstW;
  const overflowY = drawH - dstH;

  const x = overflowX > 0 ? -offsetX * overflowX : (dstW - drawW) / 2;
  const y = overflowY > 0 ? -offsetY * overflowY : (dstH - drawH) / 2;

  return { drawW, drawH, x, y };
}

export function renderImageToCanvas(
  img: HTMLImageElement,
  format: FormatConfig,
  offsetX: number,
  offsetY: number,
  zoom: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, format.width, format.height);

    const { drawW, drawH, x, y } = computeDrawParams(
      img.naturalWidth, img.naturalHeight,
      format.width, format.height,
      offsetX, offsetY, zoom
    );

    ctx.drawImage(img, x, y, drawW, drawH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to create blob"));
        resolve(blob);
      },
      "image/jpeg",
      0.85
    );
  });
}

export function renderVideoToBlob(
  video: HTMLVideoElement,
  format: FormatConfig,
  offsetX: number,
  offsetY: number,
  zoom: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d")!;

    const stream = canvas.captureStream(30);
    const mimeType = "video/mp4;codecs=h264" in navigator.mediaCapabilities
      ? "video/mp4;codecs=h264"
      : "video/webm;codecs=vp9";
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };

    const clone = video.cloneNode(true) as HTMLVideoElement;
    clone.currentTime = 0;
    clone.muted = false;

    clone.oncanplay = () => {
      // Capture audio from the video element and combine with canvas stream
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(clone);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination); // keep audible during recording? no — we just need the track
        source.disconnect(audioCtx.destination);

        // Merge canvas video track + audio track
        for (const track of dest.stream.getAudioTracks()) {
          stream.addTrack(track);
        }
      } catch {
        // No audio track or AudioContext not supported — continue without audio
      }

      mediaRecorder.start();
      clone.play();

      const draw = () => {
        if (clone.ended || clone.paused) {
          mediaRecorder.stop();
          return;
        }

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, format.width, format.height);

        const { drawW, drawH, x, y } = computeDrawParams(
          video.videoWidth, video.videoHeight,
          format.width, format.height,
          offsetX, offsetY, zoom
        );

        ctx.drawImage(clone, x, y, drawW, drawH);
        requestAnimationFrame(draw);
      };

      draw();
    };

    clone.onerror = () => reject(new Error("Video processing failed"));
    clone.load();
  });
}
