import { useState, useCallback, useRef } from "react";
import { Video, Loader2, Download, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { downloadBlob } from "@/lib/mediaUtils";

type Status = "idle" | "creating" | "processing" | "done" | "error";
const POLL_INTERVAL = 10_000;

const VideoGeneratorPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setVideoUrl(null);
    setStatus("idle");
    setProgress(0);
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setFile(null);
    setPreview(null);
    setVideoUrl(null);
    setStatus("idle");
    setProgress(0);
    setPrompt("");
  }, [stopPolling]);

  const pollTask = useCallback(
    (taskId: string) => {
      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += POLL_INTERVAL;
        setProgress(Math.min(90, (elapsed / 120_000) * 90));
        try {
          const { data, error } = await supabase.functions.invoke("kling-video", {
            body: { action: "poll", taskId },
          });
          if (error) throw error;
          const taskData = data?.data;
          const taskStatus = taskData?.task_status;
          if (taskStatus === "succeed") {
            stopPolling();
            const url = taskData?.task_result?.videos?.[0]?.url;
            if (url) {
              setVideoUrl(url);
              setProgress(100);
              setStatus("done");
              toast.success(t.videoGenDone);
            } else throw new Error("No video URL");
          } else if (taskStatus === "failed") {
            stopPolling();
            setStatus("error");
            toast.error(taskData?.task_status_msg || t.videoGenError);
          }
        } catch {
          stopPolling();
          setStatus("error");
          toast.error(t.videoGenError);
        }
      }, POLL_INTERVAL);
    },
    [stopPolling, t]
  );

  const handleGenerate = useCallback(async () => {
    if (!file) return;
    setStatus("creating");
    setProgress(0);
    setVideoUrl(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const cleanBase64 = base64.replace(/^data:image\/[^;]+;base64,/, "");
      const { data, error } = await supabase.functions.invoke("kling-video", {
        body: { action: "create", imageBase64: cleanBase64, prompt: prompt || undefined, duration: "5" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const taskId = data?.data?.task_id;
      if (!taskId) throw new Error("No task_id received");
      setStatus("processing");
      setProgress(5);
      pollTask(taskId);
    } catch (e) {
      console.error("Video generation failed:", e);
      setStatus("error");
      toast.error(t.videoGenError);
    }
  }, [file, prompt, pollTask, t]);

  const handleDownload = useCallback(async () => {
    if (!videoUrl || !file) return;
    try {
      const resp = await fetch(videoUrl);
      const blob = await resp.blob();
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(blob, `${baseName}_video.mp4`);
    } catch {
      toast.error("Download failed");
    }
  }, [videoUrl, file]);

  const isWorking = status === "creating" || status === "processing";

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.videoGenTitle}</h1>
          <p className="text-muted-foreground">{t.videoGenPageDescription}</p>
        </div>

        {!file ? (
          <div
            className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t.videoGenUpload}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image preview */}
            <div className="flex justify-center">
              <div className="inline-block">
                <p className="mb-3 text-sm font-medium text-muted-foreground">{file.name}</p>
                <div className="overflow-hidden rounded-xl border border-border bg-card inline-block">
                  <img src={preview!} alt="Preview" className="max-h-80 block" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              {status === "idle" || status === "error" ? (
                <>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.videoGenPrompt}
                    onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleGenerate} className="gap-1.5 flex-1">
                      <Video className="h-4 w-4" />
                      {t.videoGenStart}
                    </Button>
                    <Button variant="outline" onClick={reset} className="gap-1.5">
                      <RotateCcw className="h-4 w-4" />
                      {t.reset}
                    </Button>
                  </div>
                </>
              ) : isWorking ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {status === "creating" ? t.videoGenCreating : t.videoGenProcessing}
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : status === "done" && videoUrl ? (
                <div className="space-y-4">
                  <video src={videoUrl} controls autoPlay muted loop playsInline className="w-full rounded-md" />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownload} className="gap-1.5 flex-1">
                      <Download className="h-4 w-4" />
                      {t.download}
                    </Button>
                    <Button variant="outline" onClick={reset} className="gap-1.5">
                      <RotateCcw className="h-4 w-4" />
                      {t.reset}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoGeneratorPage;
