import Groq from 'groq-sdk';

let client: Groq | null = null;

export function getGroqClient(apiKey: string): Groq {
  if (!client || (client as any)._options?.apiKey !== apiKey) {
    client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export async function transcribeAudio(
  apiKey: string,
  audioBlob: Blob,
): Promise<{ text: string; segments: Array<{ text: string; start: number; end: number }> }> {
  const groq = getGroqClient(apiKey);
  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type });

  const response = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  return {
    text: response.text,
    segments: (response.segments ?? []).map(s => ({
      text: s.text,
      start: s.start,
      end: s.end,
    })),
  };
}
