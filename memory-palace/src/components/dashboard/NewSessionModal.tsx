"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewSessionModal({ open, onClose }: NewSessionModalProps) {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setFileName(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    fileRef.current = file;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleStartSession = useCallback(async () => {
    if (!preview || !fileRef.current || !fileName) return;
    
    setLoading(true);
    try {
      // Step 1: Create memory with image preview
      const memoryResponse = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fileName.replace(/\.[^.]+$/, ""), // Remove extension
          description: `Memory created from ${fileName}`,
          imageUrl: preview, // Store preview as base64
          tags: "imported",
        }),
      });

      if (!memoryResponse.ok) {
        throw new Error("Failed to create memory");
      }

      const memoryData = await memoryResponse.json();
      const memoryId = memoryData.id;

      // Step 2: Generate world from memory
      const worldResponse = await fetch("/api/world/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoryId,
        }),
      });

      if (!worldResponse.ok) {
        throw new Error("Failed to generate world");
      }

      const worldData = await worldResponse.json();
      const operationId = worldData.operationId;

      // Step 3: Create session (worldId may be null if world is still generating)
      const sessionResponse = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoryId,
          // Don't send worldId since it's still pending - will be linked when generation completes
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to create session");
      }

      const sessionData = await sessionResponse.json();
      const sessionId = sessionData.sessionId;

      // Step 4: Poll for world generation completion and link to memory
      let maxAttempts = 120; // 10 minutes with 5 second intervals
      let worldGenComplete = false;
      
      while (maxAttempts > 0 && !worldGenComplete) {
        try {
          const statusResponse = await fetch(
            `/api/world/status/${operationId}?memoryId=${memoryId}`
          );
          const statusData = await statusResponse.json();
          
          if (statusData.status === "ready") {
            worldGenComplete = true;
            break;
          }
        } catch (err) {
          console.error("Error checking world generation status:", err);
        }
        
        maxAttempts--;
        if (!worldGenComplete && maxAttempts > 0) {
          // Wait 5 seconds before polling again
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // Step 5: Navigate to viewer
      handleClose();
      router.push(`/viewer/${memoryId}`);
    } catch (error) {
      console.error("Error starting session:", error);
      alert("Failed to start session. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [preview, fileName, handleClose, router]);

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Start New Session</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Upload a photo to generate an immersive 3D memory world.
          </p>
        </div>

        {/* Drop zone / preview */}
        {preview ? (
          <div className="relative overflow-hidden rounded-xl border border-palace-mid/40">
            <img
              src={preview}
              alt="Upload preview"
              className="h-56 w-full object-cover"
            />
            <div className="flex items-center justify-between bg-palace-light/60 px-4 py-2.5">
              <span className="truncate text-sm font-medium text-foreground/70">
                {fileName}
              </span>
              <button
                onClick={reset}
                className="text-xs font-medium text-palace-primary hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
              dragOver
                ? "border-palace-primary bg-palace-light/50"
                : "border-palace-mid/60 bg-palace-light/20 hover:border-palace-primary/50 hover:bg-palace-light/40"
            }`}
          >
            {/* Upload icon */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-palace-primary/70"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <div className="text-center">
              <p className="text-sm font-medium text-foreground/70">
                Drag & drop an image here, or{" "}
                <span className="text-palace-primary font-semibold">browse</span>
              </p>
              <p className="mt-1 text-xs text-foreground/40">
                JPG, PNG, or WebP
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            disabled={!preview || loading}
            onClick={handleStartSession}
          >
            {loading ? "Generating..." : "Generate World"}
          </Button>
          <Button variant="secondary" size="md" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}