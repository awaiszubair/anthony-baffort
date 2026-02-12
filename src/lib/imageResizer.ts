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

export interface ResizedImage {
  format: FormatConfig;
  dataUrl: string;
  blob: Blob;
}

export function resizeImage(
  file: File,
  format: FormatConfig
): Promise<ResizedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = format.width;
      canvas.height = format.height;
      const ctx = canvas.getContext("2d")!;

      // Fill with black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, format.width, format.height);

      // Calculate cover crop
      const srcRatio = img.width / img.height;
      const dstRatio = format.width / format.height;

      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (srcRatio > dstRatio) {
        // Source is wider - crop sides
        sw = img.height * dstRatio;
        sx = (img.width - sw) / 2;
      } else {
        // Source is taller - crop top/bottom
        sh = img.width / dstRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, format.width, format.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Failed to create blob"));
          resolve({
            format,
            dataUrl: canvas.toDataURL("image/png"),
            blob,
          });
        },
        "image/png",
        1
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
