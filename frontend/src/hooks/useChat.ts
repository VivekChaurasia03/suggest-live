import { useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { streamChatResponse } from '../services/groq';
import { log } from '../services/logger';

export function useChat() {
  const { apiKey, transcript, chatMessages, addChatMessage, updateLastAssistantMessage } = useApp();

  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;

  const isStreamingRef = useRef(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!apiKey || !text.trim() || isStreamingRef.current) return;

    isStreamingRef.current = true;

    addChatMessage({ id: crypto.randomUUID(), role: 'user', content: text });
    addChatMessage({ id: crypto.randomUUID(), role: 'assistant', content: '', streaming: true });

    const history = chatMessagesRef.current
      .filter(m => m.content && !m.streaming)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    history.push({ role: 'user', content: text });

    const fullTranscript = transcriptRef.current
      .map(c => (c.speaker ? `${c.speaker}: ${c.text}` : c.text))
      .join('\n');

    log.chat(`streaming response for: "${text.slice(0, 60)}..."`);

    let accumulated = '';
    try {
      await streamChatResponse(
        apiKey,
        history,
        fullTranscript,
        (token) => {
          accumulated += token;
          updateLastAssistantMessage(accumulated, false);
        },
        () => {
          updateLastAssistantMessage(accumulated, true);
          log.chat(`stream done — ${accumulated.length} chars`);
        },
      );
    } catch (err) {
      log.error('streamChatResponse failed:', err);
      updateLastAssistantMessage('Sorry, something went wrong. Please try again.', true);
    } finally {
      isStreamingRef.current = false;
    }
  }, [apiKey, addChatMessage, updateLastAssistantMessage]);

  return { sendMessage };
}
