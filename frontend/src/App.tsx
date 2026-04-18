import { useState, useEffect } from 'react';
import { log } from './services/logger';
import { AppProvider, useApp } from './context/AppContext';
import { TranscriptPanel } from './components/TranscriptPanel';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { useTranscription } from './hooks/useTranscription';
import type { Suggestion } from './types';

function AppShell() {
  const { apiKey, isRecording, setIsRecording, setSessionStartTime, addChatMessage } = useApp();
  const [showSettings, setShowSettings] = useState(!apiKey);
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const [isStarting, setIsStarting] = useState(false);

  const { start: startTranscription, stop: stopTranscription, flush: flushChunk } = useTranscription(() => {
    // intent detected — will trigger early suggestion refresh in Phase 3
    console.log('Intent signal detected — early suggestion refresh');
  });

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
        alert('Microphone access denied. Please allow mic access and try again.');
      } finally {
        setIsStarting(false);
      }
    } else {
      log.audio('[toggleRecording] → STOP (isRecording was true)');
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
    addChatMessage({ id: crypto.randomUUID(), role: 'user', content: suggestion.text });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 shrink-0">
        <h1 className="text-sm font-semibold tracking-wide text-gray-200">
          TwinMind — Live Suggestions
        </h1>
        <div className="flex gap-3">
          {isRecording && (
            <button
              onClick={flushChunk}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded transition-colors"
            >
              ↻ Flush now
            </button>
          )}
          <button
            onClick={toggleRecording}
            disabled={isStarting}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
          >
            {isStarting ? '⏳ Starting...' : isRecording ? '■ Stop Recording' : '● Start Recording'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded transition-colors"
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden divide-x divide-gray-800">
        <TranscriptPanel />
        <SuggestionsPanel
          onSuggestionClick={handleSuggestionClick}
          onReload={() => {}}
          nextRefreshIn={nextRefreshIn}
        />
        <ChatPanel onSend={(text) => addChatMessage({ id: crypto.randomUUID(), role: 'user', content: text })} />
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
