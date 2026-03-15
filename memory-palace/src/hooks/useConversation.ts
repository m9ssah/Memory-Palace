"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AIMessage } from "@/types";

const SYSTEM_PROMPT =
  "You are a kind, patient memory companion for a person with dementia. " +
  "You are helping them recall and talk about a memory they are viewing in their Memory Palace. " +
  "Be warm, encouraging, and ask gentle questions. Keep responses brief (2-3 sentences). " +
  "Never correct or contradict their memories — validate their experiences and help them explore their feelings.";

interface UseConversationOptions {
  sessionId: string | null;
  memoryTitle?: string;
}

export function useConversation({ sessionId, memoryTitle }: UseConversationOptions) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversationIdRef = useRef<string | null>(null);
  const initCalledRef = useRef(false);

  // Initialize conversation when sessionId becomes available
  useEffect(() => {
    if (!sessionId || initCalledRef.current) return;
    initCalledRef.current = true;

    let cancelled = false;

    async function init() {
      setIsInitializing(true);
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: memoryTitle ? `Memory: ${memoryTitle}` : "Memory Conversation",
            systemPrompt: SYSTEM_PROMPT,
            sessionId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to start conversation");
        }

        const data = await res.json();
        if (cancelled) return;

        setConversationId(data.conversationId);
        conversationIdRef.current = data.conversationId;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to start conversation");
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [sessionId, memoryTitle]);

  // Send initial greeting once conversation is ready
  const greetingSentRef = useRef(false);
  useEffect(() => {
    if (!conversationId || greetingSentRef.current) return;
    greetingSentRef.current = true;

    // Send a greeting to get the AI's opening message
    sendMessageInternal("Hello", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const sendMessageInternal = useCallback(
    async (text: string, hideUserMessage = false) => {
      const id = conversationIdRef.current;
      if (!id || !text.trim()) return;

      const tempId = crypto.randomUUID();
      const optimisticMsg: AIMessage = {
        id: tempId,
        conversationId: id,
        role: "user",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };

      if (!hideUserMessage) {
        setMessages((prev) => [...prev, optimisticMsg]);
      }
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/conversations/${id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage: text.trim() }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send message");
        }

        const data = await res.json();

        const assistantMsg: AIMessage = {
          id: crypto.randomUUID(),
          conversationId: id,
          role: "assistant",
          content: data.assistantMessage,
          tokensUsed: data.tokensUsed,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        // Remove optimistic message on error
        if (!hideUserMessage) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      await sendMessageInternal(text, false);
    },
    [sendMessageInternal]
  );

  const synthesizeSpeech = useCallback(
    async (text: string): Promise<Blob | null> => {
      const id = conversationIdRef.current;
      if (!id) return null;

      try {
        const res = await fetch(`/api/conversations/${id}/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: "nova" }),
        });

        if (!res.ok) return null;
        return await res.blob();
      } catch {
        return null;
      }
    },
    []
  );

  const endConversation = useCallback(async () => {
    const id = conversationIdRef.current;
    if (!id) return;

    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
    } catch {
      // Fire and forget
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // End conversation on unmount
  useEffect(() => {
    return () => {
      if (conversationIdRef.current) {
        fetch(`/api/conversations/${conversationIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ended" }),
        }).catch(() => {});
      }
    };
  }, []);

  return {
    conversationId,
    messages,
    isLoading,
    isInitializing,
    error,
    sendMessage,
    synthesizeSpeech,
    endConversation,
    clearError,
  };
}
