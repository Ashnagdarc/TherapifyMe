interface TavusVideoRequest {
  script: string;
  background_url?: string;
  replica_id?: string;
  replica_settings?: {
    emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised';
    pace?: 'slow' | 'normal' | 'fast';
  };
}

interface TavusVideoResponse {
  video_id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  download_url?: string;
  stream_url?: string;
  thumbnail_url?: string;
}

export class TavusService {
  private static readonly API_BASE_URL = 'https://tavusapi.com/v2';

  static async createVideo(apiKey: string, script: string, replicaId?: string): Promise<TavusVideoResponse> {
    if (!apiKey) {
      throw new Error('Tavus API key not configured');
    }

    const requestBody: TavusVideoRequest = {
      script,
      replica_id: replicaId || 'r6ca16dbe104', // Linda persona from Tavus Library
      replica_settings: {
        emotion: 'neutral',
        pace: 'normal'
      }
    };

    try {
      const response = await fetch(`${this.API_BASE_URL}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
      }

      const videoResponse: TavusVideoResponse = await response.json();
      return videoResponse;
    } catch (error) {
      console.error('Tavus video creation error:', error);
      throw new Error('Failed to create therapy video');
    }
  }

  static async getVideoStatus(apiKey: string, videoId: string): Promise<TavusVideoResponse> {
    if (!apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/videos/${videoId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get video status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching video status:', error);
      throw error;
    }
  }

  static async listReplicas(apiKey: string): Promise<any[]> {
    if (!apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/replicas`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch replicas: ${response.statusText}`);
      }

      const data = await response.json();
      return data.replicas || [];
    } catch (error) {
      console.error('Error fetching replicas:', error);
      throw error;
    }
  }

  static async testConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey) {
      return { success: false, message: 'API key is missing.' };
    }
    try {
      await this.listReplicas(apiKey);
      return { success: true, message: 'Tavus API connection successful.' };
    } catch (error: any) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }
}