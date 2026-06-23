'use client';

/**
 * Puter Chat Hook — client-side AI chat via Puter.js
 *
 * Wraps the global `puter.chat()` API with streaming support.
 * No API keys needed — Puter.js handles auth via the browser.
 *
 * Usage:
 *   const { sendMessage, isReady, isLoading } = usePuterChat({
 *     systemPrompt: 'You are...',
 *     onToken: (text) => setContent((prev) => prev + text),
 *     onDone: () => console.log('done'),
 *   });
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UsePuterChatOptions {
  systemPrompt?: string;
  model?: string;
  onToken?: (token: string) => void;
  onDone?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export function usePuterChat(options: UsePuterChatOptions = {}) {
  const { systemPrompt, model, onToken, onDone, onError } = options;
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Check when Puter becomes available
  useEffect(() => {
    const checkPuter = () => {
      if (typeof window !== 'undefined' && (window.puter?.chat || window.puter?.ai?.chat)) {
        setIsReady(true);
        return true;
      }
      return false;
    };

    // Already available?
    if (checkPuter()) return;

    // Poll until available (Puter loads async even with beforeInteractive)
    const interval = setInterval(() => {
      if (checkPuter()) clearInterval(interval);
    }, 200);

    // Fallback timeout
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!checkPuter()) {
        console.warn('[usePuterChat] Puter.js not loaded after 15s. Is the CDN script blocked?');
      }
    }, 15_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (message: string, history: { role: 'user' | 'assistant'; content: string }[] = []) => {
      if (!window.puter?.chat && !window.puter?.ai?.chat) {
        const err = new Error('Puter.js not available');
        onError?.(err);
        throw err;
      }

      setIsLoading(true);
      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        // Build messages array
        const messages: PuterChatMessage[] = [];

        // Add system prompt if provided
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }

        // Add chat history
        for (const msg of history) {
          messages.push({ role: msg.role, content: msg.content });
        }

        // Add current user message
        messages.push({ role: 'user', content: message });

        // Determine which API to use
        const chatFn = window.puter.chat || window.puter.ai.chat;

        // Call with streaming
        const response = await chatFn(messages, {
          stream: true,
          model: model || 'openai/gpt-4o-mini',
        });

        // Process streaming response
        let fullContent = '';

        if (response && Symbol.asyncIterator in Object(response)) {
          // Async iterable stream
          for await (const part of response as AsyncIterable<PuterChatStreamPart>) {
            if (abortController.signal.aborted) break;

            const text = part.text || part.message?.content || '';
            if (text) {
              fullContent += text;
              onToken?.(text);
            }
          }
        } else {
          // Non-streaming fallback
          const result = response as PuterChatResponse;
          fullContent = result.message?.content || result.text || '';
          onToken?.(fullContent);
        }

        if (!abortController.signal.aborted) {
          onDone?.(fullContent);
        }

        setIsLoading(false);
        abortRef.current = null;
        return fullContent;
      } catch (error: unknown) {
        if (abortController.signal.aborted) {
          setIsLoading(false);
          return '';
        }
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        setIsLoading(false);
        abortRef.current = null;
        throw err;
      }
    },
    [systemPrompt, model, onToken, onDone, onError]
  );

  return { sendMessage, cancel, isReady, isLoading };
}
