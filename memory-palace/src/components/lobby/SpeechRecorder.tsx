"use client";

import { useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface SpeechRecorderProps {
  onSessionEnd: (transcript: string) => void;
}

export default function SpeechRecorder({ onSessionEnd }: SpeechRecorderProps) {
  const { isRecording, isSupported, transcript, startRecording, stopRecording } =
    useSpeechRecognition();
  const transcriptRef = useRef(transcript);
  const onSessionEndRef = useRef(onSessionEnd);

  transcriptRef.current = transcript;
  onSessionEndRef.current = onSessionEnd;

  useEffect(() => {
    if (isSupported) {
      startRecording();
    }
    return () => {
      stopRecording();
      if (transcriptRef.current.trim()) {
        onSessionEndRef.current(transcriptRef.current.trim());
      }
    };
  }, [isSupported, startRecording, stopRecording]);

  if (!isSupported) {
    return (
      <div className="absolute bottom-4 left-4 z-[60] rounded-lg bg-black/60 px-3 py-2 text-xs text-white/60">
        Speech recording not supported in this browser
      </div>
    );
  }
  
  return (
    <div className="absolute bottom-4 left-4 z-[60] flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm">
      {isRecording && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      )}
      <span className="text-xs text-white/70">
        {isRecording ? "Recording..." : "Paused"}
      </span>
    </div>
  );
}
