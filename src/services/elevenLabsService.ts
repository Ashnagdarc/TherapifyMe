export class ElevenLabsService {
  private static readonly API_BASE_URL = 'https://api.elevenlabs.io/v1';
  private static readonly DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam - warm, friendly voice
  
  static async textToSpeech(text: string, voiceId?: string): Promise<Blob> {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voice = voiceId || this.DEFAULT_VOICE_ID;
    
    try {
      const response = await fetch(`${this.API_BASE_URL}/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      return audioBlob;
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw new Error('Failed to generate audio response');
    }
  }

  static async getVoices(): Promise<any[]> {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/voices`, {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  // Pre-defined voice options for different therapeutic tones
  static getTherapeuticVoices() {
    return {
      calm: {
        id: 'pNInz6obpgDQGcFmaJgB', // Adam - warm and friendly
        name: 'Adam',
        description: 'Warm, calming voice for relaxation'
      },
      motivational: {
        id: 'EXAVITQu4vr4xnSDxMaL', // Bella - confident and encouraging  
        name: 'Bella',
        description: 'Confident, encouraging voice for motivation'
      },
      reflective: {
        id: 'AZnzlk1XvdvUeBnXmlld', // Domi - thoughtful and gentle
        name: 'Domi', 
        description: 'Gentle, thoughtful voice for reflection'
      }
    };
  }
}