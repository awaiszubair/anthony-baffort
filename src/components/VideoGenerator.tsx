import { useState, useCallback, useRef } from "react";
import { Video, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { downloadBlob } from "@/lib/mediaUtils";

interface VideoGeneratorProps {
  /** Base64 data-url of the image to animate */
  getImageBase64: () => Promise<string>;
  originalName: string;
}

type Status = "idle" | "creating" | "processing" | "done" | "error";

const POLL_INTERVAL = 10_000; // 10s

const VideoGenerator = ({ getImageBase64, originalName }: VideoGeneratorProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useI18n();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollTask = useCallback(
    (taskId: string) => {
      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += POLL_INTERVAL;
        // Approximate progress (max 90% while polling)
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
            } else {
              throw new Error("No video URL in response");
            }
          } else if (taskStatus === "failed") {
            stopPolling();
            setStatus("error");
            toast.error(taskData?.task_status_msg || t.videoGenError);
          }
          // else still processing
        } catch (e) {
          console.error("Poll error:", e);
          stopPolling();
          setStatus("error");
          toast.error(t.videoGenError);
        }
      }, POLL_INTERVAL);
    },
    [stopPolling, t]
  );

  const handleGenerate = useCallback(async () => {
    setStatus("creating");
    setProgress(0);
    setVideoUrl(null);

    try {
      const base64 = await getImageBase64();
      // Strip data-url prefix if present
      const cleanBase64 = base64.replace(/^data:image\/[^;]+;base64,/, "");

      const { data, error } = await supabase.functions.invoke("kling-video", {
        body: {
          action: "create",
          imageBase64: cleanBase64,
          prompt: prompt || undefined,
          duration: "5",
        },
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
  }, [getImageBase64, prompt, pollTask, t]);

  const handleDownload = useCallback(async () => {
    if (!videoUrl) return;
    try {
      const resp = await fetch(videoUrl);
      const blob = await resp.blob();
      const baseName = originalName.replace(/\.[^.]+$/, "");
      downloadBlob(blob, `${baseName}_video.mp4`);
    } catch {
      toast.error("Download failed");
    }
  }, [videoUrl, originalName]);

  const isWorking = status === "creating" || status === "processing";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-card-foreground">{t.videoGenTitle}</span>
      </div>

      {status === "idle" || status === "error" ? (
        <>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.videoGenPrompt}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerate();
            }}
          />
          <Button size="sm" onClick={handleGenerate} className="gap-1.5">
            <Video className="h-3.5 w-3.5" />
            {t.videoGenStart}
          </Button>
        </>
      ) : isWorking ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {status === "creating" ? t.videoGenCreating : t.videoGenProcessing}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : status === "done" && videoUrl ? (
        <div className="space-y-2">
          <video
            src={videoUrl}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="w-full rounded-md"
          />
          <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5 w-full">
            <Download className="h-3.5 w-3.5" />
            {t.download}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default VideoGenerator;
