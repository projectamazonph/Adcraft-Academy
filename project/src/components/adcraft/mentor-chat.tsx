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
import { usePuterChat } from '@/hooks/use-puter-chat';
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

// --- PPC Mentor System Prompt (embedded client-side for Puter) ---
const PPC_MENTOR_SYSTEM_PROMPT = `You are the PPC Mentor for AdCraft, an Amazon PPC training simulator.

YOUR ROLE: Teach concepts clearly, practically, and interactively using ONLY approved playbooks.
SOURCE OF TRUTH: Internal PPC Decision Matrix, Operations Playbook v7.6, Campaign Launch Prioritization Strategy. Always cite rule IDs when explaining decisions.

RULES:
1. NEVER make performance guarantees. Say "based on historical benchmarks" not "you will achieve."
2. NEVER recommend unsafe tactics, review manipulation, trademark abuse, or policy evasion.
3. When asked for action recommendations, ALWAYS ask for or infer: price, target ACoS, CVR, clicks, orders, spend, sales, lifecycle stage, inventory, category competitiveness.
4. If data is insufficient, say "INSUFFICIENT DATA" and recommend what to monitor next. Do NOT guess.
5. Keep responses under 150 words unless learner asks for deep dive.
6. Use plain English first, then technical terms. Define acronyms on first use.
7. Tone: Clear, practical, slightly playful. Not corporate oatmeal.

RESPONSE FORMAT:
- Direct answer (1 sentence)
- Rule citation [Rule ID] (when applicable)
- Example or analogy
- Next step or practice question

Use markdown formatting when helpful:
- Bold for key terms and metric names
- Bullet lists for step-by-step explanations
- Backtick code for formulas and metric abbreviations like ACoS, CPC
- Blockquotes for important rules or warnings
- Headings for multi-part answers

SAFETY: If user asks about black-hat tactics, respond: "I can't help with that. Here's a sustainable alternative aligned with Amazon policy: [safe option]."

CONTEXT AWARENESS: You will receive context about the learner's current module, lesson, and simulation state. Use this to personalize your response. If they just completed a simulation, offer specific feedback on their decisions. If they're reading a lesson, reinforce the key concepts.

PPC RULES REFERENCE (cite these by ID when explaining decisions):
- [ACOS_THRESHOLD] ACoS < 15% = Excellent, 15-25% = Good, 25-40% = Moderate, > 40% = Needs optimization
- [ACOS_BREAK_EVEN] Break-even ACoS = Profit Margin %. Target ACoS should be below break-even.
- [TACOS_HEALTHY] TACoS < 5% = Healthy, 5-10% = Moderate, > 10% = Ad-dependent
- [CPC_MAX] Max CPC = Product Price x Target ACoS x CVR. Never bid above this.
- [ROAS_BENCHMARK] RoAS > 4x = Strong, 2-4x = Average, < 2x = Underperforming
- [CTR_BENCHMARK] CTR > 0.5% for SP, > 0.3% for SB. Below threshold = relevancy issue.
- [NEG_KEYWORD_RULE] Negate search terms with > 10 clicks and 0 orders. Use exact match first.
- [BID_STRATEGY_START] New campaigns: Dynamic Bids Down Only. Switch to Up and Down after 2+ weeks of data.
- [CAMPAIGN_STRUCTURE] Separate campaigns by match type (Exact, Phrase, Broad) for budget control.
- [SPONSORED_PRODUCTS] Start with SP campaigns for direct ROI. Layer SB/SD for full-funnel.
- [BUDGET_PACING] Daily budget should allow at least 10 clicks (Budget >= 10 x avg CPC).
- [KEYWORD_HARVEST] Run Search Term Reports weekly. Promote high-converting terms to exact match.`;

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

  // Puter chat hook — used for CDN load status
  const { isReady: puterReady } = usePuterChat({
    systemPrompt: PPC_MENTOR_SYSTEM_PROMPT,
    model: 'openai/gpt-4o-mini',
  });

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
        const history = result.data.map((m: any, i: number) => {
          const role = m.role === 'user' ? 'user' : 'assistant';
          return {
            id: `hist-${i}`,
            role,
            content: m.content || '',
            timestamp: new Date(m.createdAt || Date.now()),
            isStreaming: false,
          } as Message;
        });
        if (history.length > 0) {
          setMessages([...history]);
        }
      }
    }).catch(() => {});
    setSessionLoaded(true);
  }, [sessionLoaded]);

  // Get context-aware suggestions
  const suggestions = moduleNumber !== undefined
    ? moduleSuggestions[moduleNumber] || defaultSuggestions
    : defaultSuggestions;

  // --- Stream handler — uses Puter.js directly (client-side, no API key) ---
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
      let accumulatedContent = '';

      if (puterReady && window.puter?.chat) {
        // === PUTER.JS PATH (client-side, no API key) ===
        const systemPrompt = context
          ? `${PPC_MENTOR_SYSTEM_PROMPT}\n\nLEARNER CONTEXT:\n${context}`
          : PPC_MENTOR_SYSTEM_PROMPT;

        const messagesToSend: PuterChatMessage[] = [
          { role: 'system', content: systemPrompt },
        ];

        for (const msg of chatHistory) {
          messagesToSend.push({ role: msg.role, content: msg.content });
        }
        messagesToSend.push({ role: 'user', content });

        const response = await window.puter.chat(messagesToSend, {
          stream: true,
          model: 'openai/gpt-4o-mini',
        });

        if (response && Symbol.asyncIterator in Object(response)) {
          for await (const part of response as AsyncIterable<PuterChatStreamPart>) {
            if (abortController.signal.aborted) break;

            const token = part.text || part.message?.content || '';
            if (token) {
              accumulatedContent += token;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId
                    ? { ...m, content: accumulatedContent }
                    : m
                )
              );
            }
          }
        } else {
          // Non-streaming fallback
          const result = response as PuterChatResponse;
          accumulatedContent = result.message?.content || result.text || '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? { ...m, content: accumulatedContent }
                : m
            )
          );
        }

        const latencyMs = Date.now() - startTime;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content: accumulatedContent,
                  isStreaming: false,
                  latencyMs,
                  model: 'puter/gpt-4o-mini',
                }
              : m
          )
        );

        // Try to persist to DB (non-blocking)
        saveChatExchange(content, accumulatedContent).catch(() => {});
      } else {
        // === SERVER API FALLBACK PATH ===
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

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream');

        const decoder = new TextDecoder();
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });

          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'token' && parsed.content) {
                  accumulatedContent += parsed.content;
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
      }

      // If stream ended without finalize, finalize anyway
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
      if (!puterReady) {
        saveChatExchange(content, accumulatedContent).catch(() => {});
      }
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

  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleClearChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
    }
    setMessages([welcomeMessage]);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-none border-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              AI Mentor
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                <Cpu className="h-2.5 w-2.5 mr-1" />
                {puterReady ? 'Puter AI' : 'Server AI'}
              </Badge>
            </h2>
            <p className="text-[10px] text-muted-foreground/60">
              {puterReady
                ? 'Client-side AI — no API key needed'
                : 'Connecting to Puter...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleClearChat}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Clear chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4 py-4" viewportRef={viewportRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            ))}
          </AnimatePresence>

          {!puterReady && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 py-2"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 bg-muted/30 px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60" />
                </span>
                Loading Puter AI...
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggestions */}
      {messages.length <= 1 && !isStreaming && (
        <div className="px-4 pb-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-muted/40 border border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-border shrink-0">
        <div className="flex items-center gap-2 p-3 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <input
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }
              }}
              placeholder={
                puterReady
                  ? 'Ask the AI Mentor about PPC...'
                  : 'Loading Puter AI...'
              }
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
