export type SuggestionType = 'FACT-CHECK' | 'TALKING POINT' | 'QUESTION TO ASK' | 'ACTION ITEM';

export interface Suggestion {
  text: string;
  type: SuggestionType;
}

export interface SuggestionBatch {
  id: string;
  timestamp: Date;
  suggestions: Suggestion[];
}

export interface TranscriptChunk {
  id: string;
  timestamp: Date;
  text: string;
  speaker?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export type ConversationPhase = 'opening' | 'middle' | 'closing';
