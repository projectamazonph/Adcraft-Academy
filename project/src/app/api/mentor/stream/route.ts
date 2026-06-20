import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { logger } from '@/lib/logger';

// ============================================================================
// PPC Mentor System Prompt (shared with server action)
// ============================================================================

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
- [CPC_MAX] Max CPC = Product Price × Target ACoS × CVR. Never bid above this.
- [ROAS_BENCHMARK] RoAS > 4x = Strong, 2-4x = Average, < 2x = Underperforming
- [CTR_BENCHMARK] CTR > 0.5% for SP, > 0.3% for SB. Below threshold = relevancy issue.
- [NEG_KEYWORD_RULE] Negate search terms with > 10 clicks and 0 orders. Use exact match first.
- [BID_STRATEGY_START] New campaigns: Dynamic Bids Down Only. Switch to Up and Down after 2+ weeks of data.
- [CAMPAIGN_STRUCTURE] Separate campaigns by match type (Exact, Phrase, Broad) for budget control.
- [SPONSORED_PRODUCTS] Start with SP campaigns for direct ROI. Layer SB/SD for full-funnel.
- [BUDGET_PACING] Daily budget should allow at least 10 clicks (Budget ≥ 10 × avg CPC).
- [KEYWORD_HARVEST] Run Search Term Reports weekly. Promote high-converting terms to exact match.`;

// ============================================================================
// Request body schema
// ============================================================================

interface StreamRequest {
  message: string;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  context?: string;
}

// Request limits
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 1000;
const MAX_CONTEXT_LENGTH = 500;
const MAX_REQUEST_SIZE = 50_000; // 50KB

// ============================================================================
// POST /api/mentor/stream — SSE streaming endpoint
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Request size limit
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: StreamRequest = await request.json();
    const { message, chatHistory = [], context } = body;

    // Input validation
    const sanitizedMessage = message
      ?.replace(/<[^>]*>/g, '')
      ?.slice(0, MAX_MESSAGE_LENGTH)
      ?.trim();

    if (!sanitizedMessage) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty', code: 'EMPTY_MESSAGE' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate chatHistory is an array and limit its length
    const safeHistory = Array.isArray(chatHistory)
      ? chatHistory.slice(-MAX_HISTORY_LENGTH)
      : [];

    // Truncate context to prevent prompt injection via oversized context
    const safeContext = typeof context === 'string'
      ? context.slice(0, MAX_CONTEXT_LENGTH)
      : undefined;

    // Build messages array
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: safeContext
          ? `${PPC_MENTOR_SYSTEM_PROMPT}\n\nLEARNER CONTEXT:\n${safeContext}`
          : PPC_MENTOR_SYSTEM_PROMPT,
      },
    ];

    // Add recent chat history
    for (const msg of safeHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: String(msg.content).slice(0, MAX_HISTORY_MESSAGE_LENGTH),
        });
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: sanitizedMessage,
    });

    // Initialize SDK
    const zai = await ZAI.create();

    // Call with stream: true
    const stream = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
    });

    // Fallback for non-streaming SDK responses
    if (!(stream instanceof ReadableStream)) {
      const result = stream as any;
      const content = result?.choices?.[0]?.message?.content || 'No response generated.';
      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', model: result?.model || 'unknown' })}\n\n`));
          controller.close();
        },
      });
      return new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Transform the upstream SSE stream into our own SSE stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    const startTime = Date.now();

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = (stream as ReadableStream<Uint8Array>).getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              const latencyMs = Date.now() - startTime;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'done', model: 'streamed', latencyMs })}\n\n`)
              );
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);

                if (data === '[DONE]') {
                  const latencyMs = Date.now() - startTime;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'done', model: 'streamed', latencyMs })}\n\n`)
                  );
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;

                  if (delta) {
                    fullContent += delta;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'token', content: delta })}\n\n`)
                    );
                  }

                  const finishReason = parsed.choices?.[0]?.finish_reason;
                  if (finishReason === 'stop' || finishReason === 'length') {
                    const latencyMs = Date.now() - startTime;
                    logger.info('Mentor stream completed', {
                      latencyMs,
                      contentLength: fullContent.length,
                      finishReason,
                    });
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'done', model: parsed.model || 'streamed', latencyMs })}\n\n`)
                    );
                    controller.close();
                    return;
                  }
                } catch {
                  logger.warn('Failed to parse SSE data', { data: data.slice(0, 100) });
                }
              }
            }
          }
        } catch (error) {
          logger.error('Mentor stream interrupted', { error: String(error) });
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    logger.error('Mentor stream failed', { error: String(error) });
    return new Response(
      JSON.stringify({ error: 'Failed to stream AI mentor response', code: 'STREAM_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
