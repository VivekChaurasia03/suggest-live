import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TranscriptChunk, SuggestionBatch, ChatMessage, ConversationPhase } from '../types';

interface AppState {
  apiKey: string;
  setApiKey: (key: string) => void;
  appError: string | null;
  setAppError: (msg: string | null) => void;
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  transcript: TranscriptChunk[];
  addTranscriptChunk: (chunk: TranscriptChunk) => void;
  suggestionBatches: SuggestionBatch[];
  addSuggestionBatch: (batch: SuggestionBatch) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (content: string, done: boolean) => void;
  conversationPhase: ConversationPhase;
  setConversationPhase: (phase: ConversationPhase) => void;
  contextWindowSeconds: number;
  setContextWindowSeconds: (s: number) => void;
  suggestionPrompt: string;
  setSuggestionPrompt: (p: string) => void;
  sessionStartTime: Date | null;
  setSessionStartTime: (d: Date | null) => void;
  isFetchingSuggestions: boolean;
  setIsFetchingSuggestions: (v: boolean) => void;
  clickedSuggestionTypes: string[];
  addClickedType: (type: string) => void;
}

const DEFAULT_SUGGESTION_PROMPT = `You are a real-time meeting copilot. Surface 3 high-signal suggestions based on the transcript below.

NON-NEGOTIABLE RULES:
1. ENTITY ANCHOR — every suggestion must reference a specific name, number, date, or claim from the transcript. Never be generic. "Ask about the timeline" is wrong. "Ask Sarah: does the October 15 cutoff hold if the API migration slips?" is right.
2. STRONG VERB OPENER — start each suggestion with: "Verify:", "Ask:", "Expand:", "Mention:", or "Assign:". No hedging. No "consider asking" or "it might be worth".
3. CONTRADICTION SCAN — if two things in the transcript conflict (a number changes, someone backtracks, two people disagree), surface the tension as a FACT-CHECK or QUESTION TO ASK. That conflict is the most valuable thing you can offer.
4. HONEST GAPS — if the transcript is too vague to anchor a suggestion, use QUESTION TO ASK to probe the vagueness directly. Never invent a fact.

TYPES:
- FACT-CHECK: a number, claim, or assertion worth verifying. (e.g. "Verify: is the 20% growth figure pre- or post-churn?")
- TALKING POINT: an idea worth expanding, connected to something specific just said. (e.g. "Expand: the pricing change likely triggers a review of Tier 3 contracts — worth flagging.")
- QUESTION TO ASK: a gap, ambiguity, or silence worth probing. Name the person if identifiable. (e.g. "Ask James: who is the single owner of the final sign-off?")
- ACTION ITEM: a commitment being made — include who and what. (e.g. "Assign to Priya: send the updated spec by EOD Friday.") — closing phase only.

Return JSON only: { "suggestions": [{ "text": "...", "type": "FACT-CHECK|TALKING POINT|QUESTION TO ASK|ACTION ITEM" }] }`;

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState('');
  const [appError, setAppError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptChunk[]>([]);
  const [suggestionBatches, setSuggestionBatches] = useState<SuggestionBatch[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>('opening');
  const [contextWindowSeconds, setContextWindowSeconds] = useState(90);
  const [suggestionPrompt, setSuggestionPrompt] = useState(DEFAULT_SUGGESTION_PROMPT);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [clickedSuggestionTypes, setClickedSuggestionTypes] = useState<string[]>([]);

  const addClickedType = useCallback((type: string) => {
    setClickedSuggestionTypes(prev => [...prev, type]);
  }, []);

  const addTranscriptChunk = useCallback((chunk: TranscriptChunk) => {
    setTranscript(prev => [...prev, chunk]);
  }, []);

  const addSuggestionBatch = useCallback((batch: SuggestionBatch) => {
    setSuggestionBatches(prev => [...prev, batch]);
  }, []);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
  }, []);

  const updateLastAssistantMessage = useCallback((content: string, done: boolean) => {
    setChatMessages(prev => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === 'assistant') {
        next[next.length - 1] = { ...last, content, streaming: !done };
      }
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      apiKey, setApiKey,
      appError, setAppError,
      isRecording, setIsRecording,
      transcript, addTranscriptChunk,
      suggestionBatches, addSuggestionBatch,
      chatMessages, addChatMessage, updateLastAssistantMessage,
      conversationPhase, setConversationPhase,
      contextWindowSeconds, setContextWindowSeconds,
      suggestionPrompt, setSuggestionPrompt,
      sessionStartTime, setSessionStartTime,
      isFetchingSuggestions, setIsFetchingSuggestions,
      clickedSuggestionTypes, addClickedType,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
