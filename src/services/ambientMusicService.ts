export class AmbientMusicService {
    private static audioElement: HTMLAudioElement | null = null;
    private static isInitialized = false;
    private static isEnabled = true;

    // Initialize the ambient music system
    static initialize() {
        if (this.isInitialized) return;

        // Create audio element
        this.audioElement = new Audio();
        this.audioElement.preload = 'auto';
        this.audioElement.loop = true;
        this.audioElement.volume = 0.08; // Very low volume for subtle background ambience

        // Try to use a real lo-fi track first, fallback to generated
        this.audioElement.src = '/audio/lofi-ambient.mp3';

        // If real file fails to load, use generated ambient sound
        this.audioElement.addEventListener('error', () => {
            console.log('🎵 Real audio file not found, using generated ambient sound');
            if (this.audioElement) {
                this.audioElement.src = this.generateAmbientAudioDataURL();
            }
        }, { once: true });

        // Handle audio events
        this.audioElement.addEventListener('canplaythrough', () => {
            console.log('🎵 Ambient music ready to play');
        });

        this.audioElement.addEventListener('error', (e) => {
            console.warn('🎵 Ambient music failed to load:', e);
        });

        this.isInitialized = true;
        console.log('🎵 AmbientMusicService initialized');
    }

    // Start playing ambient music
    static async startMusic() {
        if (!this.isInitialized) this.initialize();
        if (!this.audioElement || !this.isEnabled) return;

        try {
            await this.audioElement.play();
            console.log('🎵 Ambient music started');
        } catch (error) {
            console.warn('🎵 Could not start ambient music (user interaction required):', error);
        }
    }

    // Stop ambient music (for recording)
    static stopMusic() {
        if (this.audioElement && !this.audioElement.paused) {
            this.audioElement.pause();
            console.log('🎵 Ambient music stopped for recording');
        }
    }

    // Resume ambient music (after recording)
    static async resumeMusic() {
        if (!this.isEnabled) return;
        await this.startMusic();
    }

    // Toggle music on/off
    static toggleMusic() {
        this.isEnabled = !this.isEnabled;
        if (this.isEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        console.log(`🎵 Ambient music ${this.isEnabled ? 'enabled' : 'disabled'}`);
        return this.isEnabled;
    }

    // Set volume (0.0 to 1.0)
    static setVolume(volume: number) {
        if (this.audioElement) {
            this.audioElement.volume = Math.max(0, Math.min(1, volume));
        }
    }

    // Get current state
    static getState() {
        return {
            isInitialized: this.isInitialized,
            isEnabled: this.isEnabled,
            isPlaying: this.audioElement ? !this.audioElement.paused : false,
            volume: this.audioElement ? this.audioElement.volume : 0.15
        };
    }

    // Generate a proper lo-fi ambient audio data URL
    private static generateAmbientAudioDataURL(): string {
        const sampleRate = 22050;
        const duration = 30; // 30 seconds loop for better performance
        const samples = sampleRate * duration;
        const buffer = new ArrayBuffer(44 + samples * 2);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples * 2, true);

        // Generate proper lo-fi ambient music
        let offset = 44;
        let phase1 = 0, phase2 = 0, phase3 = 0;

        for (let i = 0; i < samples; i++) {
            const time = i / sampleRate;

            // Create gentle ambient pad with very low frequencies for calming effect
            const bassFreq = 55;    // Very low bass for grounding
            const midFreq = 110;    // Low mid for warmth  
            const highFreq = 165;   // Gentle high for presence

            // Extremely gentle sine waves with slow modulation
            const bass = Math.sin(phase1) * 0.03 * (0.5 + 0.1 * Math.sin(time * 0.1));
            const mid = Math.sin(phase2) * 0.02 * (0.4 + 0.2 * Math.sin(time * 0.15 + 1));
            const high = Math.sin(phase3) * 0.015 * (0.3 + 0.3 * Math.sin(time * 0.08 + 2));

            // Very subtle texture (barely audible)
            const texture = (Math.random() - 0.5) * 0.001;

            // Combine with very low overall volume
            const sample = (bass + mid + high + texture) * 32767 * 0.15;
            view.setInt16(offset, Math.max(-32767, Math.min(32767, sample)), true);
            offset += 2;

            // Update phases
            phase1 += (2 * Math.PI * bassFreq) / sampleRate;
            phase2 += (2 * Math.PI * midFreq) / sampleRate;
            phase3 += (2 * Math.PI * highFreq) / sampleRate;

            // Keep phases in range
            if (phase1 > 2 * Math.PI) phase1 -= 2 * Math.PI;
            if (phase2 > 2 * Math.PI) phase2 -= 2 * Math.PI;
            if (phase3 > 2 * Math.PI) phase3 -= 2 * Math.PI;
        }

        const blob = new Blob([buffer], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
    }
} 