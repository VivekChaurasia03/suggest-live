import { useState, useEffect, useRef } from 'react';
import { log } from './services/logger';
import { AppProvider, useApp } from './context/AppContext';
import { TranscriptPanel } from './components/TranscriptPanel';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { useTranscription } from './hooks/useTranscription';
import { useSuggestions } from './hooks/useSuggestions';
import { useChat } from './hooks/useChat';
import type { Suggestion } from './types';
import { exportSession } from './services/export';

function AppShell() {
  const { apiKey, isRecording, setIsRecording, setSessionStartTime, conversationPhase, appError, setAppError, transcript, suggestionBatches, chatMessages } = useApp();
  const { sendMessage } = useChat();
  const [showSettings, setShowSettings] = useState(!apiKey);
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const [isStarting, setIsStarting] = useState(false);

  // Resizable panels
  const [widths, setWidths] = useState([33.33, 33.33, 33.34]);
  const mainRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ handle: 0 | 1; startX: number; startWidths: number[] } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !mainRef.current) return;
      const { handle, startX, startWidths } = dragRef.current;
      const containerW = mainRef.current.getBoundingClientRect().width;
      const pct = (e.clientX - startX) / containerW * 100;
      const MIN = 15;
      const next = [...startWidths];
      if (handle === 0) {
        next[0] = Math.min(70, Math.max(MIN, startWidths[0] + pct));
        next[1] = Math.min(70, Math.max(MIN, startWidths[1] - pct));
      } else {
        next[1] = Math.min(70, Math.max(MIN, startWidths[1] + pct));
        next[2] = Math.min(70, Math.max(MIN, startWidths[2] - pct));
      }
      setWidths(next);
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const startDrag = (handle: 0 | 1) => (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { handle, startX: e.clientX, startWidths: [...widths] };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const { run: runSuggestions, fetchNow: fetchSuggestions, forceNext: forceNextSuggestion } = useSuggestions();
  const { start: startTranscription, stop: stopTranscription, flush: flushChunk } = useTranscription(
    () => { log.suggest('intent signal → early suggestion refresh'); fetchSuggestions(); },
    (text) => runSuggestions(text),   // passes text directly — avoids stale ref on first chunk
  );

  const toggleRecording = async () => {
    if (!apiKey) { setShowSettings(true); return; }
    if (!isRecording) {
      log.audio(`[toggleRecording] → START (isRecording was false)`);
      setIsStarting(true);
      try {
        await startTranscription();
        setSessionStartTime(new Date());
        setIsRecording(true);
        log.audio('[toggleRecording] → recording active, state set');
      } catch (err) {
        log.error('[toggleRecording] start failed:', err);
        setAppError('Microphone access denied. Please allow mic access in your browser settings.');
      } finally {
        setIsStarting(false);
      }
    } else {
      log.audio('[toggleRecording] → STOP (isRecording was true)');
      forceNextSuggestion(); // final chunk's Whisper response should always produce suggestions
      stopTranscription();
      setIsRecording(false);
      setSessionStartTime(null);
    }
  };

  // countdown timer display
  useEffect(() => {
    if (!isRecording) { setNextRefreshIn(30); return; }
    setNextRefreshIn(30);
    const tick = setInterval(() => {
      setNextRefreshIn(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [isRecording]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    sendMessage(suggestion.text);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold tracking-wide text-gray-200">
            TwinMind — Live Suggestions
          </h1>
          {isRecording && (
            <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border ${
              conversationPhase === 'opening'
                ? 'bg-blue-900/40 text-blue-300 border-blue-700'
                : conversationPhase === 'middle'
                ? 'bg-violet-900/40 text-violet-300 border-violet-700'
                : 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
            }`}>
              {conversationPhase.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {isRecording && (
            <button
              onClick={flushChunk}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded transition-colors cursor-pointer"
            >
              ↻ Flush now
            </button>
          )}
          {(transcript.length > 0 || suggestionBatches.length > 0) && (
            <button
              onClick={() => exportSession(transcript, suggestionBatches, chatMessages)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded transition-colors cursor-pointer"
            >
              ↓ Export
            </button>
          )}
          <button
            onClick={toggleRecording}
            disabled={isStarting}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
          >
            {isStarting ? '⏳ Starting...' : isRecording ? '■ Stop Recording' : '● Start Recording'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded transition-colors cursor-pointer"
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {appError && (
        <div className="flex items-center justify-between px-6 py-2 bg-red-900/60 border-b border-red-700 shrink-0">
          <span className="text-xs text-red-200">{appError}</span>
          <button
            onClick={() => setAppError(null)}
            className="text-xs text-red-400 hover:text-red-200 ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <main ref={mainRef} className="flex flex-1 overflow-hidden">
        <div style={{ width: `${widths[0]}%` }} className="flex flex-col min-w-0 overflow-hidden border-r border-gray-800">
          <TranscriptPanel />
        </div>
        <div
          className="w-1 shrink-0 bg-gray-800 hover:bg-blue-500 active:bg-blue-400 cursor-col-resize transition-colors"
          onMouseDown={startDrag(0)}
        />
        <div style={{ width: `${widths[1]}%` }} className="flex flex-col min-w-0 overflow-hidden border-r border-gray-800">
          <SuggestionsPanel
            onSuggestionClick={handleSuggestionClick}
            onReload={fetchSuggestions}
            nextRefreshIn={nextRefreshIn}
          />
        </div>
        <div
          className="w-1 shrink-0 bg-gray-800 hover:bg-blue-500 active:bg-blue-400 cursor-col-resize transition-colors"
          onMouseDown={startDrag(1)}
        />
        <div style={{ width: `${widths[2]}%` }} className="flex flex-col min-w-0 overflow-hidden">
          <ChatPanel onSend={sendMessage} />
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
