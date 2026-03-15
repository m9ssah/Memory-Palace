"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useRealtimeConversation,
  type TranscriptEntry,
} from "@/hooks/useRealtimeConversation";

interface ConversationPanelProps {
  sessionId: string | null;
  memoryTitle?: string;
  onConversationEnd?: (transcript: string) => void;
}

// ---------- Icons ----------

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}

// ---------- Voice visualizer ----------

function VoiceVisualizer({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center justify-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`inline-block w-[3px] rounded-full transition-all ${color}`}
          style={{
            height: active ? `${12 + Math.random() * 12}px` : "4px",
            animation: active ? `voice-bar 0.4s ease-in-out ${i * 0.08}s infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ---------- Transcript bubble ----------

function TranscriptBubble({ entry }: { entry: TranscriptEntry }) {
  const isUser = entry.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-purple-600/40 text-white/90"
            : "rounded-bl-sm bg-white/10 text-purple-100"
        }`}
      >
        <p className="whitespace-pre-wrap">{entry.text}</p>
      </div>
    </div>
  );
}

// ---------- Main panel ----------

export default function ConversationPanel({
  sessionId,
  memoryTitle,
  onConversationEnd,
}: ConversationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onConversationEndRef = useRef(onConversationEnd);
  onConversationEndRef.current = onConversationEnd;

  const {
    status,
    transcript,
    isSpeaking,
    isUserSpeaking,
    error,
    disconnect,
    connect,
    getFullTranscript,
    clearError,
  } = useRealtimeConversation({ sessionId, memoryTitle });

  const getFullTranscriptRef = useRef(getFullTranscript);
  getFullTranscriptRef.current = getFullTranscript;

  // Send transcript for analysis on unmount (e.g. user navigates away)
  useEffect(() => {
    return () => {
      const text = getFullTranscriptRef.current();
      if (text.trim() && onConversationEndRef.current) {
        onConversationEndRef.current(text);
      }
    };
  }, []);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  // Auto-scroll on new transcript entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isSpeaking]);

  const handleEndConversation = useCallback(() => {
    const fullTranscript = getFullTranscript();
    disconnect();
    if (onConversationEnd && fullTranscript.trim()) {
      onConversationEnd(fullTranscript);
    }
    setIsOpen(false);
  }, [disconnect, getFullTranscript, onConversationEnd]);

  const handleReconnect = useCallback(() => {
    clearError();
    connect();
  }, [clearError, connect]);

  return (
    <>
      <style>{`
        @keyframes voice-bar {
          0% { height: 4px; }
          100% { height: 20px; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes gentle-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Toggle button */}
      <div className="pointer-events-none absolute inset-0 z-30">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto absolute bottom-7 right-7 flex h-14 w-14 items-center justify-center rounded-full border border-purple-300/25 bg-black/60 text-purple-200/80 shadow-lg backdrop-blur-md transition-all hover:border-purple-300/50 hover:text-purple-100 hover:shadow-purple-500/20"
          >
            <ChatIcon />
            {isConnected && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-400" />
            )}
          </button>
        )}
      </div>

      {/* Panel */}
      {isOpen && (
        <div className="pointer-events-none absolute inset-0 z-30">
          <div className="pointer-events-auto absolute bottom-5 right-5 flex h-[60vh] w-[380px] max-sm:bottom-0 max-sm:right-0 max-sm:h-[50vh] max-sm:w-full flex-col overflow-hidden rounded-2xl max-sm:rounded-b-none border border-purple-300/15 bg-black/70 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-300/10 px-5 py-3">
              <div>
                <h3 className="text-sm font-medium text-purple-100/90">Memory Companion</h3>
                <p className="text-[11px] text-purple-300/50">
                  {isConnecting && "Connecting..."}
                  {isConnected && "Voice conversation active"}
                  {status === "error" && "Connection error"}
                  {status === "disconnected" && "Disconnected"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {isConnected && (
                  <button
                    type="button"
                    onClick={handleEndConversation}
                    title="End conversation"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <PhoneOffIcon />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-purple-300/50 transition-colors hover:bg-white/5 hover:text-purple-200"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-3 mt-2 flex items-center justify-between rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-200">
                <span className="flex-1">{error}</span>
                <div className="ml-2 flex items-center gap-1">
                  {status === "error" && (
                    <button
                      type="button"
                      onClick={handleReconnect}
                      className="rounded px-2 py-0.5 text-[11px] text-purple-300 hover:bg-white/5"
                    >
                      Retry
                    </button>
                  )}
                  <button type="button" onClick={clearError} className="text-red-300/60 hover:text-red-200">
                    <CloseIcon />
                  </button>
                </div>
              </div>
            )}

            {/* Voice status area */}
            <div className="flex flex-col items-center justify-center gap-4 border-b border-purple-300/10 py-6">
              {/* Companion speaking indicator */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                    isSpeaking
                      ? "bg-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                      : isUserSpeaking
                        ? "bg-white/5"
                        : "bg-white/[0.03]"
                  }`}
                >
                  {isSpeaking && (
                    <span
                      className="absolute inset-0 rounded-full border border-purple-400/30"
                      style={{ animation: "pulse-ring 2s ease-out infinite" }}
                    />
                  )}
                  <VoiceVisualizer
                    active={isSpeaking}
                    color="bg-purple-400"
                  />
                </div>
                <span className="text-[11px] tracking-wider text-purple-300/50">
                  {isSpeaking ? "Companion speaking" : isConnected ? "Listening" : ""}
                </span>
              </div>

              {/* User speaking indicator */}
              {isConnected && (
                <div className="flex items-center gap-2">
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                      isUserSpeaking
                        ? "bg-green-500/20 text-green-300"
                        : "bg-white/5 text-purple-300/30"
                    }`}
                  >
                    <MicIcon size={14} />
                    {isUserSpeaking && (
                      <span
                        className="absolute inset-0 rounded-full border border-green-400/30"
                        style={{ animation: "pulse-ring 1.5s ease-out infinite" }}
                      />
                    )}
                  </div>
                  <span className="text-[11px] text-purple-300/40">
                    {isUserSpeaking ? "You are speaking..." : "Speak anytime"}
                  </span>
                </div>
              )}

              {/* Connecting state */}
              {isConnecting && (
                <div
                  className="text-[11px] text-purple-300/40"
                  style={{ animation: "gentle-pulse 1.5s ease-in-out infinite" }}
                >
                  Setting up voice connection...
                </div>
              )}

              {/* Disconnected state */}
              {status === "disconnected" && !error && (
                <button
                  type="button"
                  onClick={handleReconnect}
                  className="rounded-full border border-purple-300/20 px-4 py-1.5 text-xs text-purple-300/60 transition-colors hover:border-purple-300/40 hover:text-purple-200"
                >
                  Start conversation
                </button>
              )}
            </div>

            {/* Transcript area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {transcript.length === 0 && isConnected && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-xs text-purple-300/25">
                    Your conversation will appear here
                  </p>
                </div>
              )}

              {transcript.map((entry) => (
                <TranscriptBubble key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
