import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../context/AppContext';

export function ChatPanel({ onSend }: { onSend: (message: string) => void }) {
  const { chatMessages } = useApp();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = chatMessages.some(m => m.streaming);

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
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <span className="text-xs font-semibold text-gray-400 tracking-wider">3. CHAT (DETAILED ANSWERS)</span>
        <span className="text-xs text-gray-600">SESSION-ONLY</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
        {chatMessages.length === 0 ? (
          <p className="text-xs text-gray-600 mt-4">Click a suggestion for a detailed answer, or type anything below.</p>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} className={`space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <span className="text-[10px] font-bold tracking-widest text-gray-600">
                {msg.role === 'user' ? 'YOU' : 'ASSISTANT'}
              </span>
              <div className={`text-xs leading-relaxed px-3 py-2 rounded-lg max-w-[95%] ${
                msg.role === 'user'
                  ? 'bg-blue-900/50 text-blue-100 border border-blue-800'
                  : 'bg-gray-800 text-gray-200 border border-gray-700'
              }`}>
                {msg.content ? (
                  <div className="prose-chat">
                    <ReactMarkdown
                      children={msg.content.replace(/<br\s*\/?>/gi, '\n\n')}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        h1: ({ children }) => <h1 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xs font-bold mb-1.5 mt-2.5 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                        code: ({ children, className }) => {
                          const isBlock = className?.includes('language-');
                          return isBlock
                            ? <code className="block bg-gray-900 border border-gray-700 rounded px-3 py-2 my-2 font-mono text-[11px] text-green-300 overflow-x-auto whitespace-pre">{children}</code>
                            : <code className="bg-gray-900 border border-gray-700 rounded px-1 py-0.5 font-mono text-[11px] text-green-300">{children}</code>;
                        },
                        pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-600 pl-3 my-2 text-gray-400 italic">{children}</blockquote>,
                        hr: () => <hr className="border-gray-700 my-3" />,
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-2">
                            <table className="text-[11px] border-collapse w-full">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-gray-700/50">{children}</thead>,
                        th: ({ children }) => <th className="border border-gray-600 px-2 py-1 text-left font-semibold text-gray-200">{children}</th>,
                        td: ({ children }) => <td className="border border-gray-600 px-2 py-1 text-gray-300">{children}</td>,
                        a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{children}</a>,
                      }}
                    />
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-3 ml-0.5 bg-gray-400 animate-pulse align-middle" />
                    )}
                  </div>
                ) : msg.streaming ? (
                  <span className="text-gray-500 italic">thinking...</span>
                ) : null}
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
          onKeyDown={e => e.key === 'Enter' && !isStreaming && handleSend()}
          placeholder={isStreaming ? 'Waiting for response...' : 'Ask anything...'}
          disabled={isStreaming}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming}
          className="px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
