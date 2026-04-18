import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { transcribeAudio } from '../services/groq';
import { useAudioCapture } from './useAudioCapture';
import { log } from '../services/logger';

const INTENT_SIGNALS = [
  "i don't know", "i'm not sure", "what was the", "could you clarify",
  "can you explain", "what do you mean", "i'm confused", "not sure about",
];

export function useTranscription(onIntentDetected: () => void) {
  const { apiKey, addTranscriptChunk } = useApp();

  const handleChunk = useCallback(async (blob: Blob) => {
    if (!apiKey) return;
    log.transcribe(`sending chunk to Whisper — ${(blob.size / 1024).toFixed(1)}KB`);
    try {
      const result = await transcribeAudio(apiKey, blob);
      log.transcribe(`Whisper response: "${result.text.trim()}" (${result.segments.length} segments)`);
      if (!result.text.trim()) {
        log.transcribe('empty transcription — skipping');
        return;
      }

      addTranscriptChunk({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        text: result.text.trim(),
      });

      const lower = result.text.toLowerCase();
      const matched = INTENT_SIGNALS.find(signal => lower.includes(signal));
      if (matched) {
        log.transcribe(`intent signal detected: "${matched}" — triggering early refresh`);
        onIntentDetected();
      }
    } catch (err) {
      log.error('Transcription failed:', err);
    }
  }, [apiKey, addTranscriptChunk, onIntentDetected]);

  const { start, stop, flush } = useAudioCapture(handleChunk);
  return { start, stop, flush };
}
