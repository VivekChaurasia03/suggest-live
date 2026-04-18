import { useRef, useCallback } from 'react';
import { log } from '../services/logger';

const CHUNK_INTERVAL_MS = 30_000;

function getMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

// Records exactly one chunk, resolves with the blob when recorder.stop() is called.
function recordOneChunk(stream: MediaStream, mimeType: string, recorderRef: React.MutableRefObject<MediaRecorder | null>): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: BlobPart[] = [];
    const opts = mimeType ? { mimeType } : undefined;
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, opts);
    } catch (err) {
      reject(err);
      return;
    }
    recorderRef.current = recorder;
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      recorderRef.current = null;
      resolve(new Blob(chunks, { type: mimeType || 'audio/webm' }));
    };
    recorder.onerror = e => reject(e);
    recorder.start();
    log.audio('recorder started for new chunk');
  });
}

export function useAudioCapture(onChunk: (blob: Blob) => void) {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  // Keep callback in a ref so the loop closure never goes stale
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  const flush = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      log.audio('flush — stopping current chunk early');
      recorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    log.audio('requesting microphone access...');
    // Prefer built-in mic: filter for non-monitor, non-external devices when possible
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    const builtIn = audioInputs.find(d =>
      /macbook|built.?in|internal|laptop/i.test(d.label)
    );
    log.audio(`available mics: ${audioInputs.map(d => d.label).join(' | ')}`);
    log.audio(`selected: ${builtIn?.label ?? 'system default'}`);

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      ...(builtIn ? { deviceId: { exact: builtIn.deviceId } } : {}),
    };
    const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
    log.audio(`mic granted — tracks: ${stream.getAudioTracks().map(t => t.label).join(', ')}`);
    streamRef.current = stream;
    const mimeType = getMimeType();
    log.audio(`mimeType: ${mimeType || 'browser default'}`);

    // Async loop — runs one chunk at a time, auto-advances when done
    const loop = async () => {
      while (streamRef.current?.active) {
        // Schedule auto-flush after CHUNK_INTERVAL_MS
        const timer = setTimeout(() => {
          if (recorderRef.current?.state === 'recording') {
            log.audio(`auto-flush after ${CHUNK_INTERVAL_MS / 1000}s`);
            recorderRef.current.stop();
          }
        }, CHUNK_INTERVAL_MS);

        try {
          const blob = await recordOneChunk(stream, mimeType, recorderRef);
          clearTimeout(timer);
          log.audio(`chunk done — size: ${(blob.size / 1024).toFixed(1)}KB`);
          if (blob.size > 1000) {
            onChunkRef.current(blob);
          } else {
            log.audio('chunk too small — skipped (silence?)');
          }
        } catch (err) {
          clearTimeout(timer);
          log.error('chunk recording error:', err);
          break;
        }
      }
      log.audio('recording loop ended');
    };

    loop();
  }, []);

  const stop = useCallback(() => {
    log.audio('stop called — flushing final chunk and closing stream');
    flush();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, [flush]);

  return { start, stop, flush };
}
