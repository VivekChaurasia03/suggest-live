import { useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { fetchSuggestions, parseGroqError } from '../services/groq';
import { log } from '../services/logger';
import type { ConversationPhase } from '../types';

const COOLDOWN_MS = 25_000; // audio chunks are 30s apart — 5s buffer for Whisper latency jitter

function getPhase(sessionStartTime: Date | null): ConversationPhase {
  if (!sessionStartTime) return 'opening';
  const elapsedMin = (Date.now() - sessionStartTime.getTime()) / 60_000;
  if (elapsedMin < 5) return 'opening';
  if (elapsedMin < 20) return 'middle';
  return 'closing';
}

export function useSuggestions() {
  const {
    apiKey, transcript, contextWindowSeconds, suggestionPrompt,
    sessionStartTime, setConversationPhase,
    addSuggestionBatch, setIsFetchingSuggestions, setAppError,
    clickedSuggestionTypes,
  } = useApp();

  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  const clickedTypesRef = useRef(clickedSuggestionTypes);
  clickedTypesRef.current = clickedSuggestionTypes;

  const lastRunRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const pendingRunRef = useRef<string | null>(null);
  const forceNextRef = useRef(false);

  // newChunkText is passed directly to avoid depending on React re-render timing.
  // transcriptRef.current may still be stale when this fires (state not yet flushed).
  const run = useCallback(async (newChunkText?: string, force = false) => {
    if (!apiKey) return;
    if (isRunningRef.current) {
      pendingRunRef.current = newChunkText ?? pendingRunRef.current;
      return;
    }

    const shouldForce = force || forceNextRef.current;
    forceNextRef.current = false;

    const now = Date.now();
    const elapsed = now - lastRunRef.current;
    if (!shouldForce && elapsed < COOLDOWN_MS) {
      log.suggest(`cooldown active — ${Math.round((COOLDOWN_MS - elapsed) / 1000)}s remaining`);
      return;
    }

    const cutoff = new Date(now - contextWindowSeconds * 1000);
    const recent = transcriptRef.current.filter(c => c.timestamp >= cutoff);

    // Build rolling text: chunks already in state + the new chunk (not yet in ref)
    const lines = recent.map(c => (c.speaker ? `${c.speaker}: ${c.text}` : c.text));
    if (newChunkText && !recent.some(c => c.text === newChunkText)) {
      lines.push(newChunkText);
    }

    if (lines.length === 0) {
      log.suggest('no transcript in window — skipping');
      return;
    }

    const rollingText = lines.join('\n');
    const phase = getPhase(sessionStartTime);
    setConversationPhase(phase);
    log.suggest(`fetching suggestions — phase: ${phase}, window: ${lines.length} chunks`);

    isRunningRef.current = true;
    lastRunRef.current = now;
    setIsFetchingSuggestions(true);

    try {
      const suggestions = await fetchSuggestions(apiKey, rollingText, suggestionPrompt, phase, clickedTypesRef.current);
      log.suggest(`got ${suggestions.length} suggestions`, suggestions);
      addSuggestionBatch({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        suggestions,
      });
    } catch (err) {
      log.error('fetchSuggestions failed:', err);
      setAppError(parseGroqError(err));
      lastRunRef.current = 0;
    } finally {
      isRunningRef.current = false;
      setIsFetchingSuggestions(false);
      if (pendingRunRef.current !== null) {
        const queued = pendingRunRef.current;
        pendingRunRef.current = null;
        run(queued ?? undefined, true);
      }
    }
  }, [apiKey, contextWindowSeconds, suggestionPrompt, sessionStartTime, setConversationPhase, addSuggestionBatch, setIsFetchingSuggestions, setAppError, clickedSuggestionTypes]);

  const fetchNow = useCallback(() => run(undefined, true), [run]);
  // Call before stopTranscription() so the final chunk's Whisper response bypasses cooldown
  const forceNext = useCallback(() => { forceNextRef.current = true; }, []);

  return { run, fetchNow, forceNext };
}
