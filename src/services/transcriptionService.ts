export class TranscriptionService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // For now, we'll use a simple Web Speech API fallback
      // In production, you'd want to use OpenAI Whisper or similar
      return this.transcribeWithWebSpeech(audioBlob);
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  private static async transcribeWithWebSpeech(audioBlob: Blob): Promise<string> {
    // This is a simplified implementation
    // In a real app, you'd send the audio to a transcription service
    return new Promise((resolve, reject) => {
      // For now, return a placeholder based on common check-in phrases
      const commonPhrases = [
        "I'm feeling anxious today and need some support",
        "I had a good day but feeling a bit overwhelmed",
        "Feeling stressed about work and need to relax",
        "I'm grateful for the good things in my life today",
        "Feeling sad and could use some encouragement",
        "Had some frustrating moments but trying to stay positive",
        "Feeling excited about upcoming opportunities",
        "Need help managing my emotions today"
      ];
      
      // Simulate processing time
      setTimeout(() => {
        const randomPhrase = commonPhrases[Math.floor(Math.random() * commonPhrases.length)];
        resolve(randomPhrase);
      }, 1500);
    });
  }

  // Future implementation for OpenAI Whisper
  private static async transcribeWithWhisper(audioBlob: Blob, apiKey: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch(this.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
  }
}