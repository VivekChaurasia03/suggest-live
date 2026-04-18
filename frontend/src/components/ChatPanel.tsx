import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export function ChatPanel({ onSend }: { onSend: (message: string) => void }) {
  const { chatMessages } = useApp();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="flex flex-col w-1/3 min-w-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <span className="text-xs font-semibold text-gray-400 tracking-wider">3. CHAT (DETAILED ANSWERS)</span>
        <span className="text-xs text-gray-600">SESSION-ONLY</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {chatMessages.length === 0 ? (
          <p className="text-xs text-gray-600 mt-4">Click a suggestion for a detailed answer, or type anything below.</p>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} className={`space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <span className="text-[10px] font-bold tracking-widest text-gray-600">
                {msg.role === 'user' ? 'YOU' : 'ASSISTANT'}
              </span>
              <div className={`text-xs leading-relaxed px-3 py-2 rounded-lg max-w-[90%] ${
                msg.role === 'user'
                  ? 'bg-blue-900/50 text-blue-100 border border-blue-800'
                  : 'bg-gray-800 text-gray-200 border border-gray-700'
              } ${msg.streaming ? 'animate-pulse' : ''}`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 px-4 py-3 border-t border-gray-800 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={handleSend}
          className="px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
