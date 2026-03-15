"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const play = useCallback(
    (blob: Blob) => {
      cleanup();

      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);

      setIsPlaying(true);
      audio.play().catch(() => setIsPlaying(false));
    },
    [cleanup]
  );

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { isPlaying, play, stop };
}
