/**
 * Puter.js TypeScript declarations
 * Puter is a client-side AI library loaded from CDN.
 * No API key needed — runs entirely in the browser.
 */

interface PuterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PuterChatOptions {
  stream?: boolean;
  model?: string;
  system?: string;
  messages?: PuterChatMessage[];
}

interface PuterChatStreamPart {
  text?: string;
  message?: {
    content: string;
    role: string;
  };
}

interface PuterChatResponse {
  message?: {
    content: string;
    role: string;
  };
  text?: string;
}

interface PuterAI {
  chat(
    input: string | PuterChatMessage[],
    options?: PuterChatOptions
  ): Promise<PuterChatResponse | AsyncIterable<PuterChatStreamPart>>;
}

interface PuterConsole {
  log(...args: unknown[]): void;
}

interface Puter {
  ai?: PuterAI;
  chat: (
    input: string | PuterChatMessage[],
    options?: PuterChatOptions
  ) => Promise<PuterChatResponse | AsyncIterable<PuterChatStreamPart>>;
  console?: PuterConsole;
}

interface Window {
  puter?: Puter;
}
