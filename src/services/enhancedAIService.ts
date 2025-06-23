import GeminiService from './geminiService';
import { TavusService } from './tavusService';
import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Helper to get user from Supabase to fetch API keys
async function getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        console.error('Error fetching user:', error);
        return null;
    }
    return data.user;
}

export class EnhancedAIService {
    private static readonly AI_USAGE_PERCENTAGE_KEY = 'aiUsagePercentage';
    private static readonly CONFIDENCE_THRESHOLD_KEY = 'aiConfidenceThreshold';
    private static readonly RESPONSE_HISTORY_KEY = 'aiResponseHistory';

    private static getAiUsagePercentage(): number {
        const storedValue = localStorage.getItem(EnhancedAIService.AI_USAGE_PERCENTAGE_KEY);
        return storedValue ? parseInt(storedValue, 10) : 70;
    }

    private static getConfidenceThreshold(): number {
        const storedValue = localStorage.getItem(EnhancedAIService.CONFIDENCE_THRESHOLD_KEY);
        return storedValue ? parseInt(storedValue, 10) : 60;
    }

    private static getResponseHistory(): string[] {
        const storedHistory = localStorage.getItem(EnhancedAIService.RESPONSE_HISTORY_KEY);
        return storedHistory ? JSON.parse(storedHistory) : [];
    }

    private static addToResponseHistory(response: string) {
        let history = this.getResponseHistory();
        history.unshift(response);
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        localStorage.setItem(EnhancedAIService.RESPONSE_HISTORY_KEY, JSON.stringify(history));
    }

    private static isRepetitive(response: string): boolean {
        const history = this.getResponseHistory();
        return history.slice(0, 3).some(pastResponse => pastResponse === response);
    }

    private static getSystemPrompt(entryText: string): string {
        const themes = GeminiService.detectThemes(entryText);

        let prompt = `
            You are a compassionate and empathetic AI therapy assistant named 'Aura'.
            Your goal is to make the user feel heard, validated, and deeply understood.
            You NEVER give direct advice. Instead, you ask gentle, open-ended questions to guide reflection.
            
            IMPORTANT: The user just shared their thoughts through a VOICE RECORDING that was transcribed to: "${entryText}"
            
            This means they spoke these words aloud to you, making this a more personal and vulnerable moment than written text.
        `;

        if (themes.length > 0) {
            prompt += `\nFrom their voice recording, I can sense themes of: ${themes.join(', ')}.`;
        }

        prompt += `
            Your task is to craft a response that:
            1. Acknowledges that they shared this through their voice (making it more personal)
            2. Validates their feelings directly and with warmth
            3. Shows you understand by thoughtfully reflecting back what you heard in their voice
            4. Offers ONE insightful, open-ended question to encourage deeper reflection
            5. Maintains a warm, supportive, and non-judgmental tone
            
            Keep the response between 150 and 300 words to provide a thorough therapeutic response.
            
            Your response:
        `;

        return prompt;
    }

    private static getApiKey(type: 'gemini_api_key' | 'tavus_api_key'): string | null {
        // Use global environment variables instead of user-specific keys
        if (type === 'gemini_api_key') {
            return import.meta.env.VITE_GEMINI_API_KEY || null;
        }
        if (type === 'tavus_api_key') {
            return import.meta.env.VITE_TAVUS_API_KEY || null;
        }
        return null;
    }

    public static async generateEnhancedResponse(entryText: string): Promise<{
        finalResponse: string;
        aiConfidence: number;
        source: 'AI' | 'Template' | 'Hybrid';
        videoScript: string;
    }> {
        const aiUsage = this.getAiUsagePercentage() / 100;
        const confidenceThreshold = this.getConfidenceThreshold() / 100;
        const geminiApiKey = this.getApiKey('gemini_api_key');

        if (geminiApiKey && Math.random() < aiUsage) {
            try {
                const prompt = this.getSystemPrompt(entryText);
                const aiResponse = await GeminiService.generateText(geminiApiKey, prompt);
                const confidence = this.calculateConfidence(aiResponse);

                if (this.isRepetitive(aiResponse)) {
                    console.log("AI response was repetitive, falling back to template.");
                    return this.getTemplateResponse(entryText, "Repetitive AI");
                }

                if (confidence >= confidenceThreshold) {
                    this.addToResponseHistory(aiResponse);
                    return {
                        finalResponse: aiResponse,
                        aiConfidence: confidence * 100,
                        source: 'AI',
                        videoScript: this.createVideoScript(aiResponse)
                    };
                } else {
                    const template = this.getTemplateResponse(entryText, "Low AI Confidence");
                    const hybridResponse = this.createHybridResponse(aiResponse, template.finalResponse);
                    this.addToResponseHistory(hybridResponse);
                    return {
                        finalResponse: hybridResponse,
                        aiConfidence: confidence * 100,
                        source: 'Hybrid',
                        videoScript: this.createVideoScript(hybridResponse)
                    };
                }
            } catch (error) {
                console.error("Error generating AI response, falling back to template:", error);
                return this.getTemplateResponse(entryText, "AI Service Error");
            }
        }

        return this.getTemplateResponse(entryText, "AI Not Triggered");
    }

    private static calculateConfidence(responseText: string): number {
        let score = 0;
        const wordCount = responseText.split(' ').length;
        if (wordCount > 100 && wordCount < 400) score += 0.3;
        else if (wordCount > 50) score += 0.15;

        if (responseText.includes('?')) score += 0.3;

        const validationPhrases = ["it sounds like", "it makes sense that", "i can understand why", "that seems", "it's understandable"];
        if (validationPhrases.some(phrase => responseText.toLowerCase().includes(phrase))) {
            score += 0.2;
        }

        const advicePhrases = ["you should", "you need to", "try to"];
        if (!advicePhrases.some(phrase => responseText.toLowerCase().includes(phrase))) {
            score += 0.2;
        }

        return Math.min(score, 1.0);
    }

    private static getTemplateResponse(entryText: string, reason: string): { finalResponse: string; aiConfidence: number; source: 'Template'; videoScript: string; } {
        console.log(`Using template response. Reason: ${reason}`);
        const themes = GeminiService.detectThemes(entryText);
        let response = "Thank you for sharing that with me. It takes courage to put your thoughts and feelings into words. ";

        if (themes.includes('work')) {
            response += "Navigating the pressures of work can be really challenging. ";
        }
        if (themes.includes('relationships')) {
            response += "Relationships are such a core part of our lives, and they can bring both joy and difficulty. ";
        }
        response += "What's one thing you could do for yourself today that would feel kind?";

        this.addToResponseHistory(response);

        return {
            finalResponse: response,
            aiConfidence: 0,
            source: 'Template',
            videoScript: this.createVideoScript(response)
        };
    }

    private static createHybridResponse(aiResponse: string, templateResponse: string): string {
        const aiSentences = aiResponse.split('. ');
        const templateSentences = templateResponse.split('?');

        const insightfulPart = aiSentences.slice(0, aiSentences.length - 1).join('. ') + '.';
        const safeQuestion = '?' + templateSentences[templateSentences.length - 1];

        return `${insightfulPart} ${safeQuestion}`;
    }

    private static createVideoScript(responseText: string): string {
        const keyPoints = responseText.split('. ').slice(0, 3).join('. ');
        return `Hey, I was just thinking about what you shared earlier. I wanted to say... ${keyPoints}. Remember to be kind to yourself.`;
    }

    public static async runDiagnostics(): Promise<{
        gemini: { status: 'Untested' | 'Operational' | 'Error' | 'Testing...'; message: string };
        tavus: { status: 'Untested' | 'Operational' | 'Error' | 'Testing...'; message: string };
        overall: { status: 'Untested' | 'Operational' | 'Error' | 'Testing...' | 'Good' | 'Issues Detected'; message: string };
    }> {
        console.log("🔍 Running AI service diagnostics...");

        const results: {
            gemini: { status: 'Untested' | 'Operational' | 'Error' | 'Testing...'; message: string };
            tavus: { status: 'Untested' | 'Operational' | 'Error' | 'Testing...'; message: string };
            overall: { status: 'Untested' | 'Operational' | 'Error' | 'Testing...' | 'Good' | 'Issues Detected'; message: string };
        } = {
            gemini: { status: 'Untested', message: '' },
            tavus: { status: 'Untested', message: '' },
            overall: { status: 'Good', message: 'All systems operational' }
        };

        // Get API keys from environment
        const geminiApiKey = this.getApiKey('gemini_api_key');
        const tavusApiKey = this.getApiKey('tavus_api_key');

        try {
            const geminiResult = await GeminiService.testConnection(geminiApiKey || '');
            results.gemini.status = geminiResult.success ? 'Operational' : 'Error';
            results.gemini.message = geminiResult.message;
        } catch (error: any) {
            results.gemini.status = 'Error';
            results.gemini.message = error.message;
        }

        try {
            const tavusResult = await TavusService.testConnection(tavusApiKey || '');
            results.tavus.status = tavusResult.success ? 'Operational' : 'Error';
            results.tavus.message = tavusResult.message;
        } catch (error: any) {
            results.tavus.status = 'Error';
            results.tavus.message = `Connection failed: ${error.message}`;
        }

        if (results.gemini.status !== 'Operational' || results.tavus.status !== 'Operational') {
            results.overall.status = 'Issues Detected';
            results.overall.message = 'One or more AI services are experiencing issues.';
        }

        return results;
    }
}
