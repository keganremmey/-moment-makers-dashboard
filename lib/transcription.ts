export type TranscriptionResult = {
  transcript: string;
  wordCount: number;
};

// Whisper via a plain fetch call rather than the openai npm package, this
// repo deliberately keeps dependencies minimal for one endpoint. A missing
// key or a failed request degrades gracefully, never throws, since a failed
// transcription must never fail the audio upload it's attached to.
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<TranscriptionResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(audioBuffer)]), filename);
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      console.error("transcribeAudio error", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as { text: string };
    const transcript = data.text.trim();
    const wordCount = transcript.split(/\s+/).filter(Boolean).length;

    return { transcript, wordCount };
  } catch (err) {
    console.error("transcribeAudio error", err);
    return null;
  }
}
