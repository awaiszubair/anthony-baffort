export interface FormatConfig {
  id: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
}

export const FORMATS: FormatConfig[] = [
  { id: "square", label: "Feed Post", width: 1080, height: 1080, ratio: "1:1" },
  { id: "portrait", label: "Portrait Post", width: 1440, height: 1800, ratio: "4:5" },
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

/** Render an image onto a canvas with a given crop offset (0-1 range) */
export function renderImageToCanvas(
  img: HTMLImageElement,
  format: FormatConfig,
  offsetX: number,
  offsetY: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, format.width, format.height);

    const srcRatio = img.naturalWidth / img.naturalHeight;
    const dstRatio = format.width / format.height;

    let drawW: number, drawH: number;

    if (srcRatio > dstRatio) {
      // Source wider than target — height fits, width overflows
      drawH = format.height;
      drawW = format.height * srcRatio;
    } else {
      // Source taller — width fits, height overflows
      drawW = format.width;
      drawH = format.width / srcRatio;
    }

    const maxOffsetX = drawW - format.width;
    const maxOffsetY = drawH - format.height;

    const x = -offsetX * maxOffsetX;
    const y = -offsetY * maxOffsetY;

    ctx.drawImage(img, x, y, drawW, drawH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to create blob"));
        resolve(blob);
      },
      "image/png",
      1
    );
  });
}

/** Record a video with the crop offset applied, returns a webm blob */
export function renderVideoToBlob(
  video: HTMLVideoElement,
  format: FormatConfig,
  offsetX: number,
  offsetY: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d")!;

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8_000_000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };

    // Clone video to play from start
    const clone = video.cloneNode(true) as HTMLVideoElement;
    clone.currentTime = 0;
    clone.muted = true;

    const srcRatio = video.videoWidth / video.videoHeight;
    const dstRatio = format.width / format.height;

    clone.oncanplay = () => {
      mediaRecorder.start();
      clone.play();

      const draw = () => {
        if (clone.ended || clone.paused) {
          mediaRecorder.stop();
          return;
        }

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, format.width, format.height);

        let drawW: number, drawH: number;
        if (srcRatio > dstRatio) {
          drawH = format.height;
          drawW = format.height * srcRatio;
        } else {
          drawW = format.width;
          drawH = format.width / srcRatio;
        }

        const maxOffsetX = drawW - format.width;
        const maxOffsetY = drawH - format.height;
        const x = -offsetX * maxOffsetX;
        const y = -offsetY * maxOffsetY;

        ctx.drawImage(clone, x, y, drawW, drawH);
        requestAnimationFrame(draw);
      };

      draw();
    };

    clone.onerror = () => reject(new Error("Video processing failed"));
    clone.load();
  });
}
