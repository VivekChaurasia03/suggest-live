import Groq from 'groq-sdk';
import type { Suggestion, ConversationPhase } from '../types';

export function parseGroqError(err: unknown): string {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 401) return 'Invalid API key. Open Settings and check your Groq API key.';
    if (status === 429) return 'Rate limit hit. Groq is throttling requests — wait a moment and try again.';
    if (status === 503 || status === 502) return 'Groq is temporarily unavailable. Try again in a few seconds.';
  }
  if (err instanceof Error && err.message.toLowerCase().includes('network')) {
    return 'Network error. Check your internet connection.';
  }
  return 'Something went wrong. Check the console for details.';
}

const SUGGESTION_MODEL = 'openai/gpt-oss-120b'; // GPT-OSS 120B as specified in assignment
const VALID_TYPES = ['FACT-CHECK', 'TALKING POINT', 'QUESTION TO ASK', 'ACTION ITEM'] as const;

let client: Groq | null = null;

export function getGroqClient(apiKey: string): Groq {
  if (!client || (client as any)._options?.apiKey !== apiKey) {
    client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export async function transcribeAudio(
  apiKey: string,
  audioBlob: Blob,
): Promise<{ text: string; segments: Array<{ text: string; start: number; end: number }> }> {
  const groq = getGroqClient(apiKey);
  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type });

  const response = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  }) as unknown as {
    text: string;
    segments?: Array<{ text: string; start: number; end: number }>;
  };

  return {
    text: response.text,
    segments: (response.segments ?? []).map(s => ({
      text: s.text,
      start: s.start,
      end: s.end,
    })),
  };
}

const PHASE_HINTS: Record<ConversationPhase, string> = {
  opening: 'OPENING PHASE (first 5 min) — Context Builder mode. Clarify who is in the room and their roles, surface the unstated goal of the meeting, and flag any assumptions being made before the real discussion starts. Prefer TALKING POINT and FACT-CHECK. Avoid ACTION ITEM.',
  middle:  'MIDDLE PHASE (5–20 min) — Devil\'s Advocate mode. Look for contradictions between what different speakers said, numbers or claims that went unchallenged, and moments where the conversation turned vague. A QUESTION TO ASK that targets a specific risk or gap is the highest-value card right now.',
  closing: 'CLOSING PHASE (20+ min) — The Closer mode. Aggressively extract commitments. Every task needs an owner and a deadline. If someone said they\'ll "look into it" without a date or name attached, that is your ACTION ITEM. If no deadline was mentioned, the suggestion should ask for one explicitly.',
};

const CHAT_SYSTEM_PROMPT = `You are a real-time meeting copilot. You have access to the full conversation transcript below. The user is still in an active meeting — they need answers they can act on in the next 30 seconds.

RULES:
- Be direct and specific. Reference names, numbers, and claims from the transcript.
- Structure every response for scannability: lead with a one-line direct answer, then use bold headers or bullet points for detail. Never write a wall of prose.
- Do not hedge. No "it might be worth considering" — just the answer.
- Never use LaTeX math notation — express formulas in plain text (e.g. "ROI = (Savings - Cost) / Cost × 100%").
- If the transcript doesn't contain enough information to answer confidently, say so in one sentence and ask what context is missing.`;

export async function streamChatResponse(
  apiKey: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  fullTranscript: string,
  onToken: (token: string) => void,
  onDone: () => void,
): Promise<void> {
  const groq = getGroqClient(apiKey);

  const systemContent = fullTranscript
    ? `${CHAT_SYSTEM_PROMPT}\n\nFull transcript:\n${fullTranscript}`
    : CHAT_SYSTEM_PROMPT;

  const stream = await groq.chat.completions.create({
    model: SUGGESTION_MODEL,
    messages: [
      { role: 'system', content: systemContent },
      ...history,
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
    reasoning_effort: 'low',
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? '';
    if (token) onToken(token);
  }
  onDone();
}

export async function fetchSuggestions(
  apiKey: string,
  rollingTranscript: string,
  systemPrompt: string,
  phase: ConversationPhase,
  clickedTypes: string[] = [],
): Promise<Suggestion[]> {
  const groq = getGroqClient(apiKey);

  const feedbackHint = clickedTypes.length > 0
    ? `\n\nThe user found these suggestion types useful earlier in this session: [${clickedTypes.join(', ')}]. If the transcript supports it, slightly favor these types — but never force a type that doesn't fit the content.`
    : '';

  const response = await groq.chat.completions.create({
    model: SUGGESTION_MODEL,
    messages: [
      { role: 'system', content: `${systemPrompt}\n\n${PHASE_HINTS[phase]}${feedbackHint}` },
      { role: 'user', content: `Recent transcript:\n${rollingTranscript}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4096,
    reasoning_effort: 'low',
  });

  const content = response.choices[0]?.message?.content ?? '';
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed.suggestions)) throw new Error('Invalid JSON shape from model');

  return parsed.suggestions.slice(0, 3).map((s: { text?: unknown; type?: unknown }) => ({
    text: String(s.text ?? ''),
    type: VALID_TYPES.includes(s.type as typeof VALID_TYPES[number])
      ? (s.type as Suggestion['type'])
      : 'TALKING POINT',
  }));
}
