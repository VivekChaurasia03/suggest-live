import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { apiKey, setApiKey, contextWindowSeconds, setContextWindowSeconds, suggestionPrompt, setSuggestionPrompt } = useApp();
  const [draftKey, setDraftKey] = useState(apiKey);
  const [draftWindow, setDraftWindow] = useState(contextWindowSeconds);
  const [draftPrompt, setDraftPrompt] = useState(suggestionPrompt);

  const save = () => {
    setApiKey(draftKey.trim());
    setContextWindowSeconds(draftWindow);
    setSuggestionPrompt(draftPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-gray-200 tracking-wide">Settings</h2>

        <div className="space-y-1.5">
          <label className="block text-xs text-gray-400">Groq API Key</label>
          <input
            type="password"
            value={draftKey}
            onChange={e => setDraftKey(e.target.value)}
            placeholder="gsk_..."
            autoComplete="off"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-gray-400">
            Suggestion context window: <span className="text-gray-200">{draftWindow}s</span>
          </label>
          <input
            type="range" min={30} max={300} step={15}
            value={draftWindow}
            onChange={e => setDraftWindow(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <p className="text-[10px] text-gray-600">Last {draftWindow}s of transcript used for live suggestions. Full session used for detail answers.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-gray-400">Suggestion system prompt</label>
          <textarea
            value={draftPrompt}
            onChange={e => setDraftPrompt(e.target.value)}
            rows={8}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-xs text-gray-300 font-mono focus:outline-none focus:border-gray-500 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded transition-colors">
            Cancel
          </button>
          <button onClick={save} className="px-4 py-1.5 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
