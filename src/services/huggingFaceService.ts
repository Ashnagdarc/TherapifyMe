import { ValidationUtils } from '../utils/validation';

// This definition was missing and causing errors. It's placed here for now.
const therapeuticThemes: Record<string, string[]> = {
    work: ['work', 'job', 'career', 'office', 'boss', 'colleague', 'deadline'],
    relationships: ['partner', 'friend', 'family', 'relationship', 'date', 'dating', 'mom', 'dad', 'sister', 'brother'],
    self_improvement: ['improve', 'grow', 'learn', 'skill', 'habit', 'goal'],
    anxiety: ['anxious', 'worried', 'nervous', 'stressed', 'panic'],
    depression: ['sad', 'depressed', 'empty', 'lonely', 'down', 'hopeless'],
};

class HuggingFaceService {
    private static readonly API_BASE_URL = "https://api-inference.huggingface.co/models";
    private static readonly DEFAULT_MODEL = 'gpt2';
    private static readonly BACKUP_MODEL = 'facebook/blenderbot-400M-distill';
    private static readonly CLASSIFICATION_MODEL = 'SamLowe/roberta-base-go_emotions';

    private apiKey: string;

    constructor() {
        const key = import.meta.env.VITE_HUGGING_FACE_API_KEY || '';
        if (!key) {
            console.warn("Hugging Face API key not found. AI features will be limited.");
        }
        this.apiKey = key;
    }

    public isEnabled(): boolean {
        return !!this.apiKey;
    }

    private async query(model: string, data: any, retries = 1): Promise<any> {
        if (!this.isEnabled()) {
            throw new Error("Hugging Face service is not enabled. API key is missing.");
        }

        const response = await fetch(`${HuggingFaceService.API_BASE_URL}/${model}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'X-Use-Cache': 'false'
            },
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            if (response.status === 503 && retries > 0) {
                const errorBody = await response.json();
                const waitTime = errorBody.estimated_time || 20;
                console.warn(`Model ${model} is loading, retrying in ${waitTime}s...`);
                await new Promise(res => setTimeout(res, waitTime * 1000));
                return this.query(model, data, retries - 1);
            }
            const errorText = await response.text();
            throw new Error(`Hugging Face API error for model ${model}: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response.json();
    }

    public async generateText(prompt: string, useBackup = false): Promise<string> {
        const model = useBackup ? HuggingFaceService.BACKUP_MODEL : HuggingFaceService.DEFAULT_MODEL;
        const payload = {
            inputs: prompt,
            parameters: {
                max_new_tokens: 250,
                min_length: 50,
                num_return_sequences: 1,
                repetition_penalty: 1.2,
                temperature: 0.85,
                top_p: 0.92,
                top_k: 50,
                do_sample: true,
            },
            options: {
                wait_for_model: true,
                use_cache: false,
            }
        };

        try {
            const result = await this.query(model, payload);
            if (result && Array.isArray(result) && result[0] && result[0].generated_text) {
                let text = result[0].generated_text;
                if (text.startsWith(prompt)) {
                    text = text.substring(prompt.length).trim();
                }
                return text;
            } else {
                console.error("Unexpected response structure from Hugging Face:", result);
                return "I'm having a little trouble finding the right words right now.";
            }
        } catch (error) {
            console.error(`Error generating text with ${model}:`, error);
            if (!useBackup) {
                console.log("Primary model failed, trying backup model...");
                return this.generateText(prompt, true);
            }
            throw error;
        }
    }

    public async analyzeSentiment(text: string): Promise<any[]> {
        const payload = { inputs: text };
        try {
            const result = await this.query(HuggingFaceService.CLASSIFICATION_MODEL, payload);
            return result && result[0] ? result[0] : [];
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            return [];
        }
    }

    public containsCrisisKeywords(text: string): boolean {
        const { hasCrisisKeywords } = ValidationUtils.detectCrisisKeywords(text);
        return hasCrisisKeywords;
    }

    public detectThemes(text: string): string[] {
        const detected: string[] = [];
        const lowercasedText = text.toLowerCase();

        for (const [theme, keywords] of Object.entries(therapeuticThemes)) {
            if (keywords.some((keyword: string) => lowercasedText.includes(keyword))) {
                detected.push(theme);
            }
        }
        return detected;
    }

    public async testConnection(): Promise<{ success: boolean, message: string }> {
        if (!this.isEnabled()) {
            return { success: false, message: "Hugging Face API key not provided." };
        }

        try {
            await this.query(HuggingFaceService.DEFAULT_MODEL, { inputs: "Hello" });
            return { success: true, message: "Hugging Face API connected successfully" };
        } catch (error: any) {
            console.error("Hugging Face connection test error:", error);
            if (error.message && error.message.includes('is loading')) {
                return { success: true, message: `Connected (Model is warming up)` };
            }
            return { success: false, message: `Connection failed: ${error.message}` };
        }
    }
}

export const huggingFaceService = new HuggingFaceService();