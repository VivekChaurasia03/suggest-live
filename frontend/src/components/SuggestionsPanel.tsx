import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Suggestion, SuggestionBatch } from '../types';

const TYPE_STYLES: Record<string, string> = {
  'FACT-CHECK':      'bg-amber-900/50 text-amber-300 border border-amber-700',
  'TALKING POINT':   'bg-blue-900/50 text-blue-300 border border-blue-700',
  'QUESTION TO ASK': 'bg-violet-900/50 text-violet-300 border border-violet-700',
  'ACTION ITEM':     'bg-emerald-900/50 text-emerald-300 border border-emerald-700',
};

function SuggestionCard({ suggestion, onClick, isClicked }: { suggestion: Suggestion; onClick: () => void; isClicked: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-500 space-y-1.5 cursor-pointer relative ${isClicked ? 'border-l-2 border-l-teal-500' : ''}`}
    >
      {isClicked && (
        <span className="absolute top-2 right-2 text-teal-400 text-[10px] leading-none">✓</span>
      )}
      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded tracking-wider ${TYPE_STYLES[suggestion.type] ?? 'bg-gray-700 text-gray-300'}`}>
        {suggestion.type}
      </span>
      <p className="text-xs text-gray-200 leading-relaxed">{suggestion.text}</p>
    </button>
  );
}

function BatchGroup({ batch, age, onSuggestionClick, clickedSet }: {
  batch: SuggestionBatch;
  age: number;
  onSuggestionClick: (s: Suggestion) => void;
  clickedSet: Set<string>;
}) {
  const opacity = age === 0 ? 'opacity-100' : age === 1 ? 'opacity-50' : 'opacity-20';
  return (
    <div className={`space-y-2 transition-opacity ${opacity}`}>
      {batch.suggestions.map((s, i) => (
        <SuggestionCard
          key={i}
          suggestion={s}
          onClick={() => onSuggestionClick(s)}
          isClicked={clickedSet.has(s.text)}
        />
      ))}
      <p className="text-center text-[10px] text-gray-600 py-1">
        — batch · {batch.timestamp.toLocaleTimeString()} —
      </p>
    </div>
  );
}

export function SuggestionsPanel({ onSuggestionClick, onReload, nextRefreshIn }: {
  onSuggestionClick: (s: Suggestion) => void;
  onReload: () => void;
  nextRefreshIn: number;
}) {
  const { suggestionBatches, isFetchingSuggestions, addClickedType } = useApp();
  const [clickedSet, setClickedSet] = useState<Set<string>>(new Set());
  const recent = [...suggestionBatches].reverse().slice(0, 3);

  const handleSuggestionClick = (s: Suggestion) => {
    setClickedSet(prev => new Set(prev).add(s.text));
    addClickedType(s.type);
    onSuggestionClick(s);
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <span className="text-xs font-semibold text-gray-400 tracking-wider">2. LIVE SUGGESTIONS</span>
        <span className="text-xs text-gray-600">{suggestionBatches.length} BATCHES</span>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <button
          onClick={onReload}
          disabled={isFetchingSuggestions}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isFetchingSuggestions ? '⏳ Generating...' : '↻ Reload suggestions'}
        </button>
        <span className="text-xs text-gray-600">
          {isFetchingSuggestions ? 'thinking...' : `auto-refresh in ${nextRefreshIn}s`}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
        {recent.length === 0 ? (
          <p className="text-xs text-gray-600 mt-4">Suggestions appear every 30s once recording starts.</p>
        ) : (
          recent.map((batch, age) => (
            <BatchGroup key={batch.id} batch={batch} age={age} onSuggestionClick={handleSuggestionClick} clickedSet={clickedSet} />
          ))
        )}
      </div>
    </div>
  );
}
