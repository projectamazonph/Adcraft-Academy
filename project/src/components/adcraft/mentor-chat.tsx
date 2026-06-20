'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  Send,
  Sparkles,
  User,
  AlertCircle,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  Cpu,
  StopCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { saveChatExchange, getChatHistory } from '@/app/actions/mentor';
import { cn } from '@/lib/utils';

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error' | 'system';
  content: string;
  timestamp: Date;
  latencyMs?: number;
  model?: string;
  isStreaming?: boolean;
}

// --- Module-aware suggestions ---
const moduleSuggestions: Record<number, string[]> = {
  0: [
    'What will I learn in this training?',
    'How do Amazon PPC campaigns work?',
    'What should I focus on first as a beginner?',
  ],
  1: [
    'What is ACoS and how do I calculate it?',
    'Explain the difference between CPC and CVR',
    'How does TACoS differ from ACoS?',
  ],
  4: [
    'What is the difference between Sponsored Products and Sponsored Brands?',
    'When should I use Sponsored Display?',
    'How should I structure my campaigns by match type?',
  ],
  6: [
    'How do I decide between dynamic bids up/down vs fixed bids?',
    'What is placement adjustment and when should I use it?',
    'How do I calculate my max CPC bid?',
  ],
  7: [
    'What makes a good negative keyword strategy?',
    'When should I negate a search term vs pause it?',
    'How often should I review my search term reports?',
  ],
};

const defaultSuggestions = [
  'What is ACoS and how do I calculate it?',
  'Explain the difference between Sponsored Products and Sponsored Brands',
  'How do I decide between dynamic bids up/down vs fixed bids?',
  'What makes a good negative keyword strategy?',
];

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Welcome to the AI Mentor! I'm your PPC coaching assistant powered by real AI. Ask me anything about Amazon advertising — from basic metrics to advanced optimization strategies.\n\nI can:\n- **Explain concepts** with examples and analogies\n- **Walk through calculations** step by step\n- **Cite PPC rules** from our Decision Matrix\n- **Help you prepare** for your simulations\n\nTry asking a question below, or click a suggestion to get started!",
  timestamp: new Date(),
};

// --- Props ---
interface MentorChatProps {
  /** Current module context for personalized responses */
  moduleNumber?: number;
  /** Lesson context */
  lessonSlug?: string;
}

// --- Streaming cursor component ---
function StreamingCursor() {
  return (
    <span className="inline-flex items-center ml-0.5 text-primary">
      <span className="inline-block w-0.5 h-4 bg-primary animate-pulse" />
    </span>
  );
}

// --- Component ---
export function MentorChat({ moduleNumber, lessonSlug }: MentorChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Build context string for the AI
  const buildContext = useCallback((): string => {
    const parts: string[] = [];
    if (moduleNumber !== undefined) {
      const moduleNames: Record<number, string> = {
        0: 'Onboarding',
        1: 'Foundations (CPC, ACoS, TACoS, RoAS)',
        4: 'Campaign Architecture (SP, SB, SD)',
        6: 'Bidding Lab (Bid strategies, position economics)',
        7: 'Search Term Triage (Negative keywords, STR analysis)',
      };
      parts.push(`Currently studying Module ${moduleNumber}: ${moduleNames[moduleNumber] || 'Unknown'}`);
    }
    if (lessonSlug) {
      parts.push(`Current lesson: ${lessonSlug}`);
    }
    return parts.join('. ');
  }, [moduleNumber, lessonSlug]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isStreaming]);

  // ponytail: load persisted chat history on mount
  useEffect(() => {
    if (sessionLoaded) return;
    getChatHistory().then((result) => {
      if (result.success && result.data.length > 0) {
        const historyMessages: Message[] = result.data.map((m) => ({
          id: `hist-${m.createdAt}`,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.createdAt),
        }));
        setMessages(historyMessages);
      }
      setSessionLoaded(true);
    }).catch(() => setSessionLoaded(true));
  }, [sessionLoaded]);

  // Get context-aware suggestions
  const suggestions = moduleNumber !== undefined
    ? moduleSuggestions[moduleNumber] || defaultSuggestions
    : defaultSuggestions;

  // --- Stream handler ---
  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Create a placeholder for the streaming AI response
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput('');
    setIsStreaming(true);

    // Create AbortController for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Build chat history for context (last 10 messages, excluding current)
      const chatHistory = messages
        .filter((m) => m.role !== 'error' && m.role !== 'system')
        .slice(-10)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const context = buildContext();
      const startTime = Date.now();

      // Fetch from streaming API route
      const response = await fetch('/api/mentor/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          chatHistory,
          context,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let sseBuffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'token' && parsed.content) {
                accumulatedContent += parsed.content;

                // Update the AI message with accumulated content
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                );
              } else if (parsed.type === 'done') {
                const latencyMs = Date.now() - startTime;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? {
                          ...m,
                          content: accumulatedContent,
                          isStreaming: false,
                          latencyMs,
                          model: parsed.model || 'streamed',
                        }
                      : m
                  )
                );
                // ponytail: persist to DB
                saveChatExchange(content, accumulatedContent).catch(() => {});
              } else if (parsed.type === 'error') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? {
                          ...m,
                          content: accumulatedContent || 'Stream was interrupted. Please try again.',
                          role: 'error' as const,
                          isStreaming: false,
                        }
                      : m
                  )
                );
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }

      // If stream ended without 'done' event, finalize anyway
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId && m.isStreaming
            ? {
                ...m,
                isStreaming: false,
                latencyMs: Date.now() - startTime,
                content: accumulatedContent || 'No response received.',
              }
            : m
        )
      );
                saveChatExchange(content, accumulatedContent).catch(() => {});
    } catch (error: any) {
      // Handle abort gracefully
      if (error?.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId && m.isStreaming
              ? { ...m, isStreaming: false, content: m.content || 'Response cancelled.' }
              : m
          )
        );
      } else {
        console.error('[MentorChat] Stream error:', error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content: 'Something went wrong. Please try again.',
                  role: 'error' as const,
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // --- Cancel streaming ---
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    // Cancel any in-flight stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const systemMsg: Message = {
      id: `system-${Date.now()}`,
      role: 'system',
      content: 'Conversation cleared. Start fresh!',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage, systemMsg]);
    setIsStreaming(false);
  };

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const messageCount = messages.filter((m) => m.role === 'user' || m.role === 'assistant').length;
  const lastModel = [...messages].reverse().find((m) => m.model)?.model;

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">AI Mentor</h2>
            {lastModel && (
              <Badge variant="outline" className="text-[9px] gap-1 bg-violet-500/10 text-violet-400 border-violet-500/20">
                <Cpu className="h-2.5 w-2.5" />
                AI-Powered
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Your PPC coaching assistant — powered by AI
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'h-2 w-2 rounded-full',
              isStreaming ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            )} />
            <span className={cn(
              'text-xs font-medium',
              isStreaming ? 'text-amber-400' : 'text-emerald-400'
            )}>
              {isStreaming ? 'Streaming...' : 'Online'}
            </span>
          </div>

          <Separator orientation="vertical" className="h-5" />

          {/* Message count */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {messageCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{messageCount} messages in conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Cancel / Clear button */}
          {isStreaming ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={handleCancel}
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stop generating</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleClear}
                    disabled={messages.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear conversation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Context banner */}
      {moduleNumber !== undefined && (
        <div className="flex items-center gap-2 py-2 px-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Context: Module {moduleNumber} — {lessonSlug || 'General'}</span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-4 pr-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          ))}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggested questions */}
      {messages.length <= 1 && !isStreaming && (
        <div className="py-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            {moduleNumber !== undefined ? 'Suggested for your current module:' : 'Try asking:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1.5 border-primary/20 hover:bg-primary/5 hover:border-primary/30"
                onClick={() => handleSend(q)}
                disabled={isStreaming}
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {q}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Ask your PPC mentor anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className="w-full h-10 rounded-lg border border-border bg-background px-4 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all disabled:opacity-50"
            />
          </div>
          {isStreaming ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={handleCancel}
              className="shrink-0"
              title="Stop generating"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Message Bubble Component ---
function MessageBubble({
  message,
  copiedId,
  onCopy,
}: {
  message: Message;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
}) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isError = message.role === 'error';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-muted-foreground/60 bg-muted/30 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'shrink-0 p-1.5 rounded-lg border',
          isAssistant
            ? 'bg-primary/10 border-primary/20'
            : isError
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-muted/50 border-border'
        )}
      >
        {isAssistant ? (
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        ) : isError ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Message content */}
      <div className={cn('max-w-[80%] group', isUser && 'flex flex-col items-end')}>
        <Card
          className={cn(
            'px-4 py-3',
            isUser
              ? 'bg-primary/10 border-primary/20'
              : isError
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-card border-border'
          )}
        >
          {isAssistant || (isError && message.content) ? (
            <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>ol]:my-1 [&>li]:mb-0.5 [&>code]:bg-primary/10 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>pre]:bg-muted/30 [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:text-xs [&>pre]:overflow-x-auto [&>blockquote]:border-primary/30 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>strong]:text-foreground">
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              ) : null}
              {message.isStreaming && <StreamingCursor />}
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
          )}

          {/* Metadata footer — only show when streaming is complete */}
          {!message.isStreaming && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-[10px] text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {message.latencyMs && (
                  <span className="ml-2 font-mono">{message.latencyMs}ms</span>
                )}
              </p>

              {/* Copy button (only for assistant messages) */}
              {isAssistant && (
                <button
                  onClick={() => onCopy(message.id, message.content)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted/30 rounded"
                  title="Copy response"
                >
                  {copiedId === message.id ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
