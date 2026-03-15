"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface UseRealtimeConversationOptions {
  sessionId: string | null;
  memoryTitle?: string;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export function useRealtimeConversation({
  sessionId,
  memoryTitle,
}: UseRealtimeConversationOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const initCalledRef = useRef(false);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  // Keep ref in sync for cleanup access
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const cleanup = useCallback(() => {
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!sessionId) return;

    setStatus("connecting");
    setError(null);

    try {
      // 1. Get ephemeral token from our server
      const tokenRes = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, memoryTitle }),
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get session token");
      }

      const { clientSecret } = await tokenRes.json();
      if (!clientSecret) throw new Error("No client secret returned");

      // 2. Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Set up remote audio playback
      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      // 4. Add local mic track
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

      // 5. Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setStatus("connected");

        // Send initial greeting that directly references the specific memory
        const title = memoryTitle || "this memory";
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
              instructions:
                `Greet the patient warmly. You can see they are viewing "${title}" right now. ` +
                `Reference "${title}" by name and ask them a specific, gentle question about it — ` +
                `for example what they remember about that moment, how it makes them feel, or who was there with them. ` +
                `Keep it to 1-2 sentences. Do NOT ask which memory they want to talk about — you already know.`,
            },
          }),
        );
      };

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleServerEvent(msg);
        } catch {
          // Ignore parse errors
        }
      };

      // 6. Create SDP offer and connect to OpenAI
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        },
      );

      if (!sdpRes.ok) {
        throw new Error("Failed to establish WebRTC connection with OpenAI");
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("error");
          setError("Connection lost. Please try reconnecting.");
        }
      };
    } catch (err) {
      console.error("Realtime connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setStatus("error");
      cleanup();
    }
  }, [sessionId, memoryTitle, cleanup]);

  // Current response accumulator refs
  const currentResponseTextRef = useRef("");
  const currentResponseIdRef = useRef<string | null>(null);

  const handleServerEvent = useCallback((event: Record<string, unknown>) => {
    switch (event.type) {
      case "response.audio.delta":
        setIsSpeaking(true);
        break;

      case "response.audio.done":
        setIsSpeaking(false);
        break;

      case "response.text.delta": {
        const delta = (event as { delta?: string }).delta ?? "";
        currentResponseTextRef.current += delta;
        break;
      }

      case "response.done": {
        // Extract the full text from the completed response
        const response = event.response as {
          id?: string;
          output?: Array<{
            content?: Array<{ transcript?: string; text?: string }>;
          }>;
        } | undefined;

        let fullText = "";
        if (response?.output) {
          for (const item of response.output) {
            if (item.content) {
              for (const part of item.content) {
                fullText += part.transcript || part.text || "";
              }
            }
          }
        }

        if (!fullText) fullText = currentResponseTextRef.current;

        if (fullText.trim()) {
          const entry: TranscriptEntry = {
            id: (response?.id ?? crypto.randomUUID()) as string,
            role: "assistant",
            text: fullText.trim(),
            timestamp: new Date().toISOString(),
          };
          setTranscript((prev) => [...prev, entry]);
        }

        currentResponseTextRef.current = "";
        currentResponseIdRef.current = null;
        setIsSpeaking(false);
        break;
      }

      case "input_audio_buffer.speech_started":
        setIsUserSpeaking(true);
        break;

      case "input_audio_buffer.speech_stopped":
        setIsUserSpeaking(false);
        break;

      case "conversation.item.input_audio_transcription.completed": {
        const transcriptText = (event as { transcript?: string }).transcript ?? "";
        if (transcriptText.trim()) {
          const entry: TranscriptEntry = {
            id: crypto.randomUUID(),
            role: "user",
            text: transcriptText.trim(),
            timestamp: new Date().toISOString(),
          };
          setTranscript((prev) => [...prev, entry]);
        }
        break;
      }

      case "error": {
        const errMsg =
          ((event as { error?: { message?: string } }).error?.message) ??
          "An error occurred";
        console.error("Realtime API error:", event);
        setError(errMsg);
        break;
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("disconnected");
    setIsSpeaking(false);
    setIsUserSpeaking(false);
  }, [cleanup]);

  /** Returns the full conversation transcript as a single string (for analysis). */
  const getFullTranscript = useCallback((): string => {
    return transcriptRef.current
      .map((e) => `${e.role === "user" ? "Patient" : "Companion"}: ${e.text}`)
      .join("\n");
  }, []);

  // Auto-connect when sessionId is available
  useEffect(() => {
    if (!sessionId || initCalledRef.current) return;
    initCalledRef.current = true;
    connect();
  }, [sessionId, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    transcript,
    isSpeaking,
    isUserSpeaking,
    error,
    connect,
    disconnect,
    getFullTranscript,
    clearError: useCallback(() => setError(null), []),
  };
}
