export class TranscriptionService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    console.log('TranscriptionService: Starting transcription process');
    console.log('Audio blob details:', {
      size: audioBlob.size,
      type: audioBlob.type
    });

    try {
      // Check if the audio blob is valid
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Invalid audio blob provided');
      }

      // For now, we'll use a simple simulation
      // In production, you'd want to use OpenAI Whisper, ElevenLabs, or similar
      const result = await this.transcribeWithSimulation(audioBlob);
      console.log('TranscriptionService: Transcription completed successfully');
      return result;
    } catch (error) {
      console.error('TranscriptionService: Transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async transcribeWithSimulation(audioBlob: Blob): Promise<string> {
    console.log('TranscriptionService: Using simulation transcription');

    return new Promise((resolve, reject) => {
      // Simulate realistic processing time based on audio duration
      // For a typical 30-second recording, 1-2 seconds is realistic
      const processingTime = Math.min(Math.max(audioBlob.size / 50000, 1000), 3000);

      console.log(`TranscriptionService: Simulating ${processingTime}ms processing time`);

      // Common therapeutic check-in phrases that users might say
      const commonPhrases = [
        "I'm feeling anxious today and could really use some support and guidance",
        "I had a pretty good day overall but I'm feeling a bit overwhelmed by everything",
        "I've been feeling quite stressed about work lately and I need to find ways to relax",
        "I'm feeling grateful for all the good things in my life today",
        "I've been feeling sad and down lately and could use some encouragement",
        "I had some really frustrating moments today but I'm trying to stay positive",
        "I'm feeling excited and hopeful about some upcoming opportunities in my life",
        "I've been struggling to manage my emotions today and need some help",
        "I'm feeling proud of the progress I've made recently in taking care of myself",
        "I've been having trouble sleeping and it's affecting my mood during the day",
        "I feel like I'm making good progress with my mental health journey",
        "Today was challenging but I'm learning to be more patient with myself"
      ];

      // Simulate processing time
      setTimeout(() => {
        try {
          const randomIndex = Math.floor(Math.random() * commonPhrases.length);
          const selectedPhrase = commonPhrases[randomIndex];
          console.log('TranscriptionService: Generated simulated transcription');
          resolve(selectedPhrase);
        } catch (error) {
          console.error('TranscriptionService: Error in simulation:', error);
          reject(new Error('Simulation transcription failed'));
        }
      }, processingTime);
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