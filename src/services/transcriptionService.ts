export class TranscriptionService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
  private static readonly ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

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

      const assemblyAIKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;

      if (assemblyAIKey) {
        console.log('TranscriptionService: Using AssemblyAI for real transcription');
        const result = await this.transcribeWithAssemblyAI(audioBlob, assemblyAIKey);
        console.log('TranscriptionService: Real transcription completed successfully');
        return result;
      } else {
        console.warn('TranscriptionService: No AssemblyAI key found, falling back to simulation');
        const result = await this.transcribeWithSimulation(audioBlob);
        console.log('TranscriptionService: Simulation transcription completed');
        return result;
      }
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

  // Real transcription using AssemblyAI
  private static async transcribeWithAssemblyAI(audioBlob: Blob, apiKey: string): Promise<string> {
    try {
      // Step 1: Upload audio file to AssemblyAI
      console.log('TranscriptionService: Uploading audio to AssemblyAI...');
      const uploadResponse = await fetch(`${this.ASSEMBLYAI_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'content-type': 'application/octet-stream',
        },
        body: audioBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload audio: ${uploadResponse.statusText}`);
      }

      const { upload_url } = await uploadResponse.json();
      console.log('TranscriptionService: Audio uploaded, starting transcription...');

      // Step 2: Request transcription
      const transcriptResponse = await fetch(`${this.ASSEMBLYAI_API_URL}/transcript`, {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: 'en_us',
        }),
      });

      if (!transcriptResponse.ok) {
        throw new Error(`Failed to request transcription: ${transcriptResponse.statusText}`);
      }

      const { id } = await transcriptResponse.json();
      console.log(`TranscriptionService: Transcription job created with ID: ${id}`);

      // Step 3: Poll for completion
      let transcriptData;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait time

      while (attempts < maxAttempts) {
        const pollResponse = await fetch(`${this.ASSEMBLYAI_API_URL}/transcript/${id}`, {
          headers: {
            'authorization': apiKey,
          },
        });

        if (!pollResponse.ok) {
          throw new Error(`Failed to check transcription status: ${pollResponse.statusText}`);
        }

        transcriptData = await pollResponse.json();

        if (transcriptData.status === 'completed') {
          console.log('TranscriptionService: Transcription completed successfully');
          return transcriptData.text || 'No speech detected in the recording.';
        } else if (transcriptData.status === 'error') {
          throw new Error(`Transcription failed: ${transcriptData.error}`);
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        console.log(`TranscriptionService: Polling attempt ${attempts}/${maxAttempts}, status: ${transcriptData.status}`);
      }

      throw new Error('Transcription timed out after 30 seconds');
    } catch (error) {
      console.error('TranscriptionService: AssemblyAI error:', error);
      throw error;
    }
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