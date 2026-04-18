import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export function TranscriptPanel() {
  const { transcript, isRecording } = useApp();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="flex flex-col w-1/3 min-w-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <span className="text-xs font-semibold text-gray-400 tracking-wider">1. MIC &amp; TRANSCRIPT</span>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            RECORDING
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {transcript.length === 0 ? (
          <p className="text-xs text-gray-600 mt-4">Transcript will appear here once recording starts.</p>
        ) : (
          transcript.map(chunk => (
            <div key={chunk.id} className="text-xs leading-relaxed">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-gray-600 tabular-nums">{chunk.timestamp.toLocaleTimeString()}</span>
                {chunk.speaker && (
                  <span className="text-blue-400 font-semibold">{chunk.speaker}</span>
                )}
              </div>
              <p className="text-gray-300">{chunk.text}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
