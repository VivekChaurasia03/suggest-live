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
}

const DEFAULT_SUGGESTION_PROMPT = `You are a live meeting copilot. Read the recent transcript below and surface 3 suggestions that are immediately useful to the person receiving them.

Rules:
- Use FACT-CHECK when a specific claim, number, or assertion was just made that could be verified
- Use TALKING POINT when a new topic or concept was introduced that deserves expansion
- Use QUESTION TO ASK when the conversation needs probing, clarification, or goes one-sided
- Use ACTION ITEM only when commitments or next steps are being discussed (closing phase)
- Never return generic suggestions. If the transcript doesn't clearly support a type, pick a different type
- The mix should reflect what's actually happening, not a quota of one each

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
