import { ValidationUtils } from '../utils/validation';

// This definition was missing and causing errors. It's placed here for now.
const therapeuticThemes: Record<string, string[]> = {
    work: ['work', 'job', 'career', 'office', 'boss', 'colleague', 'deadline'],
    relationships: ['partner', 'friend', 'family', 'relationship', 'date', 'dating', 'mom', 'dad', 'sister', 'brother'],
    self_improvement: ['improve', 'grow', 'learn', 'skill', 'habit', 'goal'],
    anxiety: ['anxious', 'worried', 'nervous', 'stressed', 'panic'],
    depression: ['sad', 'depressed', 'empty', 'lonely', 'down', 'hopeless'],
};

class GeminiService {
    private static readonly API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
    private static readonly MODEL = 'gemini-1.5-flash-latest';

    private static async query(apiKey: string, prompt: string, generationConfig: any = {}): Promise<any> {
        if (!apiKey) {
            throw new Error("Gemini API key not provided.");
        }

        const url = `${GeminiService.API_BASE_URL}/${GeminiService.MODEL}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [{ "text": prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 800,
                ...generationConfig
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Gemini API error:", errorBody);
            throw new Error(`Gemini API error: ${response.status} - ${errorBody.error?.message || 'Unknown error'}`);
        }

        return response.json();
    }

    public static async generateText(apiKey: string, prompt: string): Promise<string> {
        try {
            const result = await this.query(apiKey, prompt);
            if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts[0]) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected response structure from Gemini:", result);
                return "I'm having a little trouble finding the right words right now.";
            }
        } catch (error) {
            console.error('Error generating text with Gemini:', error);
            throw error;
        }
    }

    public static async testConnection(apiKey: string): Promise<{ success: boolean, message: string }> {
        if (!apiKey) {
            return { success: false, message: "Gemini API key not provided." };
        }

        try {
            const result = await this.query(apiKey, "Hello", { maxOutputTokens: 10 });
            if (result.candidates && result.candidates.length > 0) {
                return { success: true, message: "Gemini API connected successfully" };
            } else {
                throw new Error("Invalid response structure from Gemini.");
            }
        } catch (error: any) {
            console.error("Gemini connection test error:", error);
            return { success: false, message: `Connection failed: ${error.message}` };
        }
    }

    public static containsCrisisKeywords(text: string): boolean {
        const { hasCrisisKeywords } = ValidationUtils.detectCrisisKeywords(text);
        return hasCrisisKeywords;
    }

    public static detectThemes(text: string): string[] {
        const detected: string[] = [];
        const lowercasedText = text.toLowerCase();

        for (const [theme, keywords] of Object.entries(therapeuticThemes)) {
            if (keywords.some((keyword: string) => lowercasedText.includes(keyword))) {
                detected.push(theme);
            }
        }
        return detected;
    }
}

export default GeminiService; 