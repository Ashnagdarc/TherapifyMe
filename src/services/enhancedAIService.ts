import { HuggingFaceService } from './huggingFaceService';
import { AIResponseService } from './aiResponseService';
import { TavusService } from './tavusService';
import { MoodTag } from '../types/database';

interface EnhancedAIResponse {
    response: string;
    tone: 'calm' | 'motivational' | 'reflective';
    suggestions: string[];
    source: 'ai' | 'template' | 'hybrid';
    confidence: number;
    videoScript?: string;
}

interface VideoGenerationRequest {
    aiResponse: string;
    mood: MoodTag;
    transcription: string;
    userTone: 'calm' | 'motivational' | 'reflective';
}

export class EnhancedAIService {
    private static readonly AI_CONFIDENCE_THRESHOLD = 0.6;
    private static readonly USE_AI_PERCENTAGE = 70; // 70% of time try AI first

    static async generateResponse(
        mood: MoodTag,
        transcription: string,
        userTone: 'calm' | 'motivational' | 'reflective' = 'calm',
        userId?: string,
        forceAI: boolean = false
    ): Promise<EnhancedAIResponse> {
        const shouldUseAI = forceAI || Math.random() * 100 < this.USE_AI_PERCENTAGE;

        if (shouldUseAI) {
            try {
                console.log('🤖 Attempting AI generation...');

                // Try Hugging Face AI first
                const aiResult = await HuggingFaceService.generateTherapeuticResponse(
                    mood,
                    transcription,
                    userTone,
                    userId
                );

                if (aiResult.confidence >= this.AI_CONFIDENCE_THRESHOLD) {
                    console.log('✅ AI generation successful with high confidence');

                    return {
                        response: aiResult.response,
                        tone: aiResult.tone,
                        suggestions: aiResult.suggestions,
                        source: 'ai',
                        confidence: aiResult.confidence,
                        videoScript: this.createVideoScript(aiResult.response, mood, transcription)
                    };
                } else {
                    console.log('⚠️ AI confidence too low, falling back to hybrid approach');
                    return await this.generateHybridResponse(mood, transcription, userTone, userId, aiResult);
                }
            } catch (error) {
                console.error('❌ AI generation failed:', error);
                console.log('🔄 Falling back to enhanced template system');
                return await this.generateTemplateResponse(mood, transcription, userTone, userId);
            }
        } else {
            console.log('📝 Using enhanced template system');
            return await this.generateTemplateResponse(mood, transcription, userTone, userId);
        }
    }

    private static async generateHybridResponse(
        mood: MoodTag,
        transcription: string,
        userTone: 'calm' | 'motivational' | 'reflective',
        userId: string | undefined,
        aiResult: any
    ): Promise<EnhancedAIResponse> {
        // Get template response for comparison and enhancement
        const templateResult = await AIResponseService.generateResponse(
            mood,
            transcription,
            userTone,
            userId
        );

        // Combine AI insights with template reliability
        const hybridResponse = this.blendResponses(aiResult.response, templateResult.response);

        // Use best suggestions from both sources
        const combinedSuggestions = [
            ...aiResult.suggestions.slice(0, 2),
            ...templateResult.suggestions.slice(0, 1)
        ];

        return {
            response: hybridResponse,
            tone: userTone,
            suggestions: combinedSuggestions,
            source: 'hybrid',
            confidence: (aiResult.confidence + 0.8) / 2, // Average AI confidence with template baseline
            videoScript: this.createVideoScript(hybridResponse, mood, transcription)
        };
    }

    private static async generateTemplateResponse(
        mood: MoodTag,
        transcription: string,
        userTone: 'calm' | 'motivational' | 'reflective',
        userId: string | undefined
    ): Promise<EnhancedAIResponse> {
        const templateResult = await AIResponseService.generateResponse(
            mood,
            transcription,
            userTone,
            userId
        );

        return {
            response: templateResult.response,
            tone: templateResult.tone,
            suggestions: templateResult.suggestions,
            source: 'template',
            confidence: 0.85, // Template system has high reliability
            videoScript: this.createVideoScript(templateResult.response, mood, transcription)
        };
    }

    private static blendResponses(aiResponse: string, templateResponse: string): string {
        // Extract the most therapeutic parts from both responses
        const aiWords = aiResponse.split(' ');
        const templateWords = templateResponse.split(' ');

        // Use AI opening if it's therapeutic, otherwise use template
        const aiOpening = aiWords.slice(0, 30).join(' ');
        const templateOpening = templateWords.slice(0, 30).join(' ');

        const opening = this.isTherapeuticOpening(aiOpening) ? aiOpening : templateOpening;

        // Use template middle section for reliability
        const middle = templateWords.slice(30, -30).join(' ');

        // Use AI closing if it's insightful, otherwise use template
        const aiClosing = aiWords.slice(-30).join(' ');
        const templateClosing = templateWords.slice(-30).join(' ');

        const closing = this.isInsightfulClosing(aiClosing) ? aiClosing : templateClosing;

        return `${opening} ${middle} ${closing}`.trim();
    }

    private static isTherapeuticOpening(text: string): boolean {
        const therapeuticPhrases = [
            'I hear you', 'Thank you for', 'I can sense', 'What you\'re sharing',
            'I understand', 'Your feelings', 'It sounds like'
        ];
        return therapeuticPhrases.some(phrase => text.toLowerCase().includes(phrase.toLowerCase()));
    }

    private static isInsightfulClosing(text: string): boolean {
        const insightfulPhrases = [
            'strength within', 'you deserve', 'take this one step', 'be gentle',
            'you have the power', 'trust yourself', 'you matter'
        ];
        return insightfulPhrases.some(phrase => text.toLowerCase().includes(phrase.toLowerCase()));
    }

    private static createVideoScript(response: string, mood: MoodTag, transcription: string): string {
        // Create a video-optimized version of the response
        const videoResponse = response
            .replace(/\n\n/g, '\n') // Single line breaks for video
            .replace(/\. /g, '. [pause] ') // Add pauses for natural speech
            .trim();

        // Add video-specific opening
        const videoOpening = this.getVideoOpening(mood);

        // Add gentle closing for video
        const videoClosing = "\n\n[pause] Remember, I'm here to support you on this journey, and you're doing great by taking time to reflect and care for yourself.";

        return `${videoOpening}\n\n${videoResponse}${videoClosing}`;
    }

    private static getVideoOpening(mood: MoodTag): string {
        const openings: Record<MoodTag, string> = {
            happy: "It's wonderful to see you in such a positive space today.",
            sad: "I want you to know that it's perfectly okay to feel sad sometimes.",
            anxious: "I can sense you're feeling anxious, and that's completely understandable.",
            stressed: "I know you're feeling stressed right now, and I'm here with you.",
            excited: "Your excitement is beautiful, and I love seeing this energy in you.",
            overwhelmed: "When everything feels overwhelming, remember that you don't have to handle it all at once.",
            frustrated: "Frustration can be so difficult to sit with, and I hear how you're feeling.",
            calm: "I can feel the calm energy you're bringing today, and it's lovely.",
            grateful: "Your gratitude is such a gift, both to yourself and others.",
            content: "There's something beautiful about feeling content, and I'm glad you're experiencing this."
        };

        return openings[mood] || "Thank you for sharing with me today.";
    }

    // Generate Tavus video based on AI response
    static async generateTherapyVideo(
        request: VideoGenerationRequest,
        replicaId?: string
    ): Promise<{ videoId: string; status: string }> {
        try {
            console.log('🎥 Creating therapy video with Tavus...');

            const videoScript = this.createVideoScript(
                request.aiResponse,
                request.mood,
                request.transcription
            );

            const videoResponse = await TavusService.createVideo(videoScript, replicaId);

            console.log('✅ Video generation initiated:', videoResponse.video_id);

            return {
                videoId: videoResponse.video_id,
                status: videoResponse.status
            };
        } catch (error) {
            console.error('❌ Video generation failed:', error);
            throw new Error('Failed to generate therapy video');
        }
    }

    // Get video status and download URL
    static async getVideoStatus(videoId: string) {
        try {
            return await TavusService.getVideoStatus(videoId);
        } catch (error) {
            console.error('Error getting video status:', error);
            throw error;
        }
    }

    // Test all AI services
    static async runDiagnostics(): Promise<{
        huggingFace: { success: boolean; message: string };
        tavus: { success: boolean; message: string };
        overall: { success: boolean; message: string };
    }> {
        console.log('🔍 Running AI service diagnostics...');

        // Test Hugging Face
        const huggingFaceTest = await HuggingFaceService.testConnection();

        // Test Tavus
        let tavusTest;
        try {
            await TavusService.listReplicas();
            tavusTest = { success: true, message: "Tavus API connected successfully" };
        } catch (error) {
            tavusTest = {
                success: false,
                message: `Tavus connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }

        const overallSuccess = huggingFaceTest.success && tavusTest.success;

        return {
            huggingFace: huggingFaceTest,
            tavus: tavusTest,
            overall: {
                success: overallSuccess,
                message: overallSuccess
                    ? "All AI services are operational"
                    : "Some AI services are experiencing issues"
            }
        };
    }

    // Generate response with automatic video creation
    static async generateResponseWithVideo(
        mood: MoodTag,
        transcription: string,
        userTone: 'calm' | 'motivational' | 'reflective' = 'calm',
        userId?: string,
        generateVideo: boolean = false,
        replicaId?: string
    ): Promise<EnhancedAIResponse & { videoGeneration?: { videoId: string; status: string } }> {
        // Generate AI response
        const aiResponse = await this.generateResponse(mood, transcription, userTone, userId);

        // Optionally generate video
        if (generateVideo) {
            try {
                const videoGeneration = await this.generateTherapyVideo({
                    aiResponse: aiResponse.response,
                    mood,
                    transcription,
                    userTone
                }, replicaId);

                return {
                    ...aiResponse,
                    videoGeneration
                };
            } catch (videoError) {
                console.warn('Video generation failed, returning response without video:', videoError);
                return aiResponse;
            }
        }

        return aiResponse;
    }

    // Configure AI preferences
    static configureAI(options: {
        useAIPercentage?: number;
        confidenceThreshold?: number;
        forceTemplate?: boolean;
    }) {
        if (options.useAIPercentage !== undefined) {
            (this as any).USE_AI_PERCENTAGE = Math.max(0, Math.min(100, options.useAIPercentage));
        }

        if (options.confidenceThreshold !== undefined) {
            (this as any).AI_CONFIDENCE_THRESHOLD = Math.max(0, Math.min(1, options.confidenceThreshold));
        }

        console.log('🔧 AI configuration updated:', {
            useAIPercentage: (this as any).USE_AI_PERCENTAGE,
            confidenceThreshold: (this as any).AI_CONFIDENCE_THRESHOLD
        });
    }
} 