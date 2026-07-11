"use client";

import { useRef, useState } from "react";
import { requestUploadAction, createMediaAssetAction } from "@/lib/actions/media";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

type UploadedAsset = Awaited<ReturnType<typeof createMediaAssetAction>>;

export function MediaUploader({
  category,
  accept,
  storageConfigured,
  onUploaded,
  label = "Upload file",
}: {
  category: string;
  accept?: string;
  storageConfigured: boolean;
  onUploaded: (asset: UploadedAsset) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const mimeType = file.type || "application/octet-stream";
      const result = await requestUploadAction(category, file.name, mimeType);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", result.uploadUrl);
        xhr.setRequestHeader("Content-Type", mimeType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error("Upload to storage failed."));
        xhr.onerror = () => reject(new Error("Upload to storage failed."));
        xhr.send(file);
      });

      const asset = await createMediaAssetAction({
        key: result.key,
        url: result.publicUrl,
        filename: file.name,
        mimeType,
        sizeBytes: file.size,
      });

      onUploaded(asset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (!storageConfigured) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
        Storage isn&apos;t connected yet — add Cloudflare R2 credentials to enable uploads.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className="size-4" />
        {uploading ? `Uploading… ${progress}%` : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
