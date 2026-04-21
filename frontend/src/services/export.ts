import type { TranscriptChunk, SuggestionBatch, ChatMessage } from '../types';

export function exportSession(
  transcript: TranscriptChunk[],
  suggestionBatches: SuggestionBatch[],
  chatMessages: ChatMessage[],
): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const lines: string[] = [];

  lines.push(`# TwinMind Session Export`);
  lines.push(`**Exported:** ${dateStr} at ${timeStr}`);
  lines.push('');

  // Transcript
  lines.push('## Transcript');
  if (transcript.length === 0) {
    lines.push('_No transcript recorded._');
  } else {
    for (const chunk of transcript) {
      const ts = chunk.timestamp.toLocaleTimeString();
      const speaker = chunk.speaker ? `**${chunk.speaker}** ` : '';
      lines.push(`- \`${ts}\` ${speaker}${chunk.text}`);
    }
  }
  lines.push('');

  // Suggestions
  lines.push('## Suggestion Batches');
  if (suggestionBatches.length === 0) {
    lines.push('_No suggestions generated._');
  } else {
    for (const batch of suggestionBatches) {
      lines.push(`### Batch — ${batch.timestamp.toLocaleTimeString()}`);
      for (const s of batch.suggestions) {
        lines.push(`- **[${s.type}]** ${s.text}`);
      }
      lines.push('');
    }
  }

  // Chat
  lines.push('## Chat');
  const completedMessages = chatMessages.filter(m => !m.streaming && m.content);
  if (completedMessages.length === 0) {
    lines.push('_No chat messages._');
  } else {
    for (const msg of completedMessages) {
      const label = msg.role === 'user' ? '**You**' : '**Assistant**';
      lines.push(`${label}: ${msg.content}`);
      lines.push('');
    }
  }

  const markdown = lines.join('\n');
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `twinmind-session-${now.toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
