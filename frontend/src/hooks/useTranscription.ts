import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { transcribeAudio, parseGroqError } from '../services/groq';
import { useAudioCapture } from './useAudioCapture';
import { hasVoiceActivity } from '../services/vad';
import { log } from '../services/logger';

const INTENT_SIGNALS = [
  // hedging / uncertainty
  "i don't know", "i'm not sure", "i'm confused", "not sure about",
  // clarification requests — likely during a live demo
  "could you clarify", "can you explain", "what do you mean",
  "can you walk me through", "help me understand", "can you elaborate",
  "what exactly do you mean", "what's the reasoning", "how does that work",
  "what's the difference", "could you give an example", "i'm not following",
  // topic shifts that benefit from fresh suggestions
  "what was the", "so you're saying", "just to confirm",
];

// Whisper hallucinates these phrases on near-silent audio — discard them
const WHISPER_HALLUCINATIONS = new Set([
  'thank you.', 'thank you', 'thanks for watching.', 'thanks for watching',
  'you', 'you.', 'bye.', 'bye', 'goodbye.', 'goodbye',
  'thanks.', 'thanks', 'okay.', 'okay', 'ok.', 'ok',
  'um.', 'uh.', 'hmm.', 'mm-hmm.',
]);

export function useTranscription(
  onIntentDetected: () => void,
  onTranscriptAdded: (text: string) => void,
  onRecordingError?: () => void,
) {
  const { apiKey, addTranscriptChunk, setAppError } = useApp();

  const handleChunk = useCallback(async (blob: Blob) => {
    if (!apiKey) return;
    log.transcribe(`chunk received — ${(blob.size / 1024).toFixed(1)}KB`);

    const hasVoice = await hasVoiceActivity(blob);
    if (!hasVoice) {
      log.transcribe('VAD: no voice activity detected — skipping Whisper call');
      return;
    }
    log.transcribe('VAD: voice activity confirmed — sending to Whisper');

    try {
      const result = await transcribeAudio(apiKey, blob);
      log.transcribe(`Whisper response: "${result.text.trim()}" (${result.segments.length} segments)`);
      const text = result.text.trim();
      if (!text) {
        log.transcribe('empty transcription — skipping');
        return;
      }
      if (WHISPER_HALLUCINATIONS.has(text.toLowerCase())) {
        log.transcribe(`hallucination detected ("${text}") — skipping`);
        return;
      }
      if (text.split(/\s+/).length < 3) {
        log.transcribe(`transcription too short ("${text}") — likely noise, skipping`);
        return;
      }

      addTranscriptChunk({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        text,
      });

      // Pass text directly so useSuggestions doesn't depend on React re-render timing
      onTranscriptAdded(text);

      const lower = text.toLowerCase();
      const matched = INTENT_SIGNALS.find(signal => lower.includes(signal));
      if (matched) {
        log.transcribe(`intent signal detected: "${matched}" — triggering early refresh`);
        onIntentDetected();
      }
    } catch (err) {
      log.error('Transcription failed:', err);
      setAppError(parseGroqError(err));
    }
  }, [apiKey, addTranscriptChunk, onIntentDetected, onTranscriptAdded]);

  const handleRecordingError = useCallback((err: unknown) => {
    log.error('MediaRecorder crashed mid-session:', err);
    setAppError('Recording stopped unexpectedly. Please restart to continue.');
    onRecordingError?.();
  }, [setAppError, onRecordingError]);

  const { start, stop, flush } = useAudioCapture(handleChunk, handleRecordingError);
  return { start, stop, flush };
}
