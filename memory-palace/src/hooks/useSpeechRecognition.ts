"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldBeRecordingRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecording = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      (window as Window).webkitSpeechRecognition ||
      (globalThis as unknown as { SpeechRecognition: { new (): SpeechRecognition } }).SpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    recognition.onend = () => {
      // Auto-restart 
      if (shouldBeRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore if already started
        }
      } else {
        setIsRecording(false);
      }
    };

    recognition.onerror = (event: Event & { error: string }) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldBeRecordingRef.current = false;
        setIsRecording(false);
      }
      // For other errors 
    };

    recognitionRef.current = recognition;
    shouldBeRecordingRef.current = true;
    setIsRecording(true);

    try {
      recognition.start();
    } catch {
      // Ignore
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    shouldBeRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const resetTranscript = useCallback(() => setTranscript(""), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldBeRecordingRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isRecording, isSupported, transcript, startRecording, stopRecording, resetTranscript };
}
