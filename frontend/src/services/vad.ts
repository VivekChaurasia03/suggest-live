// RMS threshold below which audio is treated as silence/ambient noise.
// Typical values: silence ~0.0001, ambient noise ~0.001–0.005, quiet speech ~0.01+
const RMS_THRESHOLD = 0.01;

export async function hasVoiceActivity(blob: Blob): Promise<boolean> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close();
  }

  let sumSquares = 0;
  let totalSamples = 0;
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    const samples = audioBuffer.getChannelData(c);
    for (let i = 0; i < samples.length; i++) {
      sumSquares += samples[i] * samples[i];
    }
    totalSamples += samples.length;
  }

  const rms = Math.sqrt(sumSquares / totalSamples);
  return rms >= RMS_THRESHOLD;
}
