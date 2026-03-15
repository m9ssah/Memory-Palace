"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";

type UseFadeTransitionOptions = {
  initialVisible?: boolean;
  initialMounted?: boolean;
  defaultDurationMs?: number;
};

type FadeOverlayProps = {
  className?: string;
  durationMs?: number;
};

type FadeCallback = () => void;

type UseFadeTransitionResult = {
  isFading: boolean;
  isMounted: boolean;
  triggerFade: (callback: FadeCallback, durationMs?: number) => void;
  showFade: () => void;
  hideFade: (durationMs?: number, onComplete?: FadeCallback) => void;
  FadeOverlay: ({ className, durationMs }: FadeOverlayProps) => ReactElement | null;
};

export function useFadeTransition(options: UseFadeTransitionOptions = {}): UseFadeTransitionResult {
  const {
    initialVisible = false,
    initialMounted = initialVisible,
    defaultDurationMs = 600,
  } = options;

  const [isMounted, setIsMounted] = useState(initialMounted);
  const [isFading, setIsFading] = useState(initialVisible);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const queueTimer = useCallback((callback: FadeCallback, delayMs: number) => {
    const timerId = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((id) => id !== timerId);
      callback();
    }, delayMs);

    timersRef.current.push(timerId);
  }, []);

  const showFade = useCallback(() => {
    clearTimers();
    setIsMounted(true);
    queueTimer(() => setIsFading(true), 16);
  }, [clearTimers, queueTimer]);

  const hideFade = useCallback(
    (durationMs = defaultDurationMs, onComplete?: FadeCallback) => {
      clearTimers();
      setIsMounted(true);
      setIsFading(false);
      queueTimer(() => {
        setIsMounted(false);
        onComplete?.();
      }, durationMs);
    },
    [clearTimers, defaultDurationMs, queueTimer],
  );

  const triggerFade = useCallback(
    (callback: FadeCallback, durationMs = defaultDurationMs) => {
      showFade();
      queueTimer(callback, durationMs);
    },
    [defaultDurationMs, queueTimer, showFade],
  );

  const FadeOverlay = useMemo(() => {
    return function FadeOverlayComponent({ className, durationMs = defaultDurationMs }: FadeOverlayProps) {
      if (!isMounted) return null;

      return (
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-0 z-50 bg-black transition-opacity",
            isFading ? "opacity-100" : "opacity-0",
            className,
          ].filter(Boolean).join(" ")}
          style={{ transitionDuration: `${durationMs}ms` }}
        />
      );
    };
  }, [defaultDurationMs, isFading, isMounted]);

  return {
    isFading,
    isMounted,
    triggerFade,
    showFade,
    hideFade,
    FadeOverlay,
  };
}