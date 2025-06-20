interface HuggingFaceResponse {
    generated_text: string;
}

interface TherapeuticPrompt {
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature: number;
}

export class HuggingFaceService {
    private static readonly API_BASE_URL = 'https://api-inference.huggingface.co/models';
    private static readonly DEFAULT_MODEL = 'microsoft/DialoGPT-large'; // Free conversational model
    private static readonly BACKUP_MODEL = 'facebook/blenderbot-400M-distill'; // Alternative free model

    // Therapeutic personality traits to maintain consistency
    private static readonly THERAPEUTIC_PERSONALITY = {
        tone: 'warm, empathetic, and professional',
        style: 'non-judgmental, supportive, and insightful',
        approach: 'person-centered therapy with mindfulness elements',
        characteristics: [
            'Uses reflective listening',
            'Offers gentle insights without being prescriptive',
            'Validates emotions',
            'Encourages self-discovery',
            'Maintains appropriate therapeutic boundaries'
        ]
    };

    static async generateTherapeuticResponse(
        mood: string,
        transcription: string,
        userTone: 'calm' | 'motivational' | 'reflective' = 'calm',
        userId?: string
    ): Promise<{
        response: string;
        tone: 'calm' | 'motivational' | 'reflective';
        suggestions: string[];
        confidence: number;
    }> {
        try {
            // Create therapeutic prompt based on mood and transcription
            const prompt = this.createTherapeuticPrompt(mood, transcription, userTone);

            // Generate response using Hugging Face
            const aiResponse = await this.callHuggingFaceAPI(prompt);

            // Process and validate the response
            const processedResponse = this.processTherapeuticResponse(aiResponse, mood, userTone);

            // Generate contextual suggestions
            const suggestions = this.generateContextualSuggestions(mood, transcription);

            return {
                response: processedResponse.text,
                tone: userTone,
                suggestions,
                confidence: processedResponse.confidence
            };
        } catch (error) {
            console.error('Hugging Face API error:', error);

            // Fallback to enhanced template system if AI fails
            return this.getFallbackResponse(mood, transcription, userTone);
        }
    }

    private static createTherapeuticPrompt(
        mood: string,
        transcription: string,
        tone: 'calm' | 'motivational' | 'reflective'
    ): TherapeuticPrompt {
        const toneInstructions = {
            calm: 'Respond with a gentle, soothing tone that promotes peace and understanding.',
            motivational: 'Respond with encouragement and inspiration while maintaining therapeutic professionalism.',
            reflective: 'Respond with thoughtful questions and insights that encourage deeper self-reflection.'
        };

        const systemPrompt = `You are Dr. Sarah, a warm and experienced therapist with expertise in person-centered therapy and mindfulness. Your responses should be:

${this.THERAPEUTIC_PERSONALITY.tone} - Use a ${this.THERAPEUTIC_PERSONALITY.style} approach.

Key principles:
- ${this.THERAPEUTIC_PERSONALITY.characteristics.join('\n- ')}

${toneInstructions[tone]}

Guidelines:
- Keep responses between 250-450 words for comprehensive support
- Use "I" statements and avoid "you should" 
- Acknowledge the person's feelings before offering insights
- Provide deeper reflection and multiple layers of understanding
- Include practical wisdom and gentle guidance
- Share relatable metaphors or examples that illuminate the experience
- End with thoughtful encouragement and forward-looking perspective
- Be conversational, not clinical, but thorough and meaningful
- Explore the emotional landscape with curiosity and compassion
- Never diagnose or provide medical advice`;

        const userPrompt = `A person is feeling ${mood} and shared this with you:

"${transcription}"

Please respond as Dr. Sarah would, offering therapeutic support that validates their experience while providing gentle insights and encouragement. Focus on their emotional state and what they've shared, making them feel heard and understood.`;

        return {
            systemPrompt,
            userPrompt,
            maxTokens: 450,
            temperature: 0.7
        };
    }

    private static async callHuggingFaceAPI(prompt: TherapeuticPrompt): Promise<string> {
        const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

        if (!apiKey) {
            throw new Error('Hugging Face API key not configured');
        }

        // Try primary model first
        try {
            return await this.makeAPICall(this.DEFAULT_MODEL, prompt, apiKey);
        } catch (error) {
            console.warn('Primary model failed, trying backup model:', error);

            // Try backup model
            try {
                return await this.makeAPICall(this.BACKUP_MODEL, prompt, apiKey);
            } catch (backupError) {
                console.error('Both models failed:', backupError);
                throw new Error('AI service temporarily unavailable');
            }
        }
    }

    private static async makeAPICall(
        model: string,
        prompt: TherapeuticPrompt,
        apiKey: string
    ): Promise<string> {
        const fullPrompt = `${prompt.systemPrompt}\n\nHuman: ${prompt.userPrompt}\n\nDr. Sarah:`;

        const response = await fetch(`${this.API_BASE_URL}/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: fullPrompt,
                parameters: {
                    max_new_tokens: prompt.maxTokens,
                    temperature: prompt.temperature,
                    do_sample: true,
                    top_p: 0.9,
                    return_full_text: false
                },
                options: {
                    wait_for_model: true,
                    use_cache: false
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
        }

        const data: HuggingFaceResponse[] = await response.json();

        if (!data || !data[0] || !data[0].generated_text) {
            throw new Error('Invalid response from Hugging Face API');
        }

        return data[0].generated_text;
    }

    private static processTherapeuticResponse(
        rawResponse: string,
        mood: string,
        tone: string
    ): { text: string; confidence: number } {
        let processed = rawResponse.trim();

        // Clean up the response
        processed = this.cleanResponse(processed);

        // Validate therapeutic appropriateness
        const validation = this.validateTherapeuticContent(processed);

        if (!validation.isAppropriate) {
            throw new Error('Generated response failed therapeutic validation');
        }

        // Enhance response with therapeutic elements
        processed = this.enhanceTherapeuticResponse(processed, mood, tone);

        return {
            text: processed,
            confidence: validation.confidence
        };
    }

    private static cleanResponse(response: string): string {
        // Remove common AI artifacts
        let cleaned = response
            .replace(/^(Dr\. Sarah:|Human:|Assistant:)/i, '')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove markdown bold
            .replace(/\*([^*]+)\*/g, '$1');    // Remove markdown italic

        // Ensure proper sentence structure
        if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
            cleaned += '.';
        }

        return cleaned;
    }

    private static validateTherapeuticContent(response: string): { isAppropriate: boolean; confidence: number } {
        const inappropriate = [
            'diagnose', 'diagnosis', 'disorder', 'medication', 'prescribe',
            'cure', 'treatment plan', 'therapy session', 'professional help immediately',
            'emergency', 'crisis', 'suicide', 'self-harm'
        ];

        const therapeutic = [
            'feel', 'understand', 'hear', 'valid', 'normal', 'experience',
            'gentle', 'kind', 'compassion', 'support', 'strength', 'resilience'
        ];

        const lowerResponse = response.toLowerCase();

        // Check for inappropriate content
        const hasInappropriate = inappropriate.some(word => lowerResponse.includes(word));
        if (hasInappropriate) {
            return { isAppropriate: false, confidence: 0 };
        }

        // Calculate therapeutic quality score
        const therapeuticWords = therapeutic.filter(word => lowerResponse.includes(word));
        const confidence = Math.min(1, therapeuticWords.length / 3); // 3+ therapeutic words = high confidence

        return {
            isAppropriate: confidence > 0.2, // Minimum threshold
            confidence
        };
    }

    private static enhanceTherapeuticResponse(response: string, mood: string, tone: string): string {
        // Add warm opening if missing
        if (!response.match(/^(I|It's|What|Thank you|I can|I hear)/i)) {
            const openings = [
                "I hear you, and what you're sharing is really important. ",
                "Thank you for trusting me with these feelings. ",
                "I can sense the depth of what you're experiencing. "
            ];
            response = openings[Math.floor(Math.random() * openings.length)] + response;
        }

        // Add gentle closing encouragement if missing
        if (!response.match(/(strength|resilience|capable|deserve|worthy|matter).*[.!]$/i)) {
            const closings = [
                " Remember, you have more strength within you than you realize.",
                " Your feelings are valid, and you deserve compassion - especially from yourself.",
                " Take this one step at a time, and be gentle with yourself along the way."
            ];
            response += closings[Math.floor(Math.random() * closings.length)];
        }

        return response;
    }

    private static generateContextualSuggestions(mood: string, transcription: string): string[] {
        const text = transcription.toLowerCase();
        const suggestions = [];

        // Theme-based suggestions
        if (text.includes('work') || text.includes('job')) {
            suggestions.push("Take a mindful 5-minute break from work tasks");
            suggestions.push("Set a boundary around work communication after hours");
        }

        if (text.includes('stress') || text.includes('overwhelm')) {
            suggestions.push("Try the 4-7-8 breathing technique: inhale 4, hold 7, exhale 8");
            suggestions.push("Write down three things you can control right now");
        }

        if (text.includes('sad') || text.includes('down')) {
            suggestions.push("Allow yourself to feel this emotion without judgment");
            suggestions.push("Create a comfort space with soft lighting and calming music");
        }

        if (text.includes('anxious') || text.includes('worry')) {
            suggestions.push("Practice the 5-4-3-2-1 grounding technique");
            suggestions.push("Remind yourself: 'This feeling is temporary and will pass'");
        }

        // Mood-based fallbacks
        const moodSuggestions: Record<string, string[]> = {
            happy: ["Share this positive energy with someone you care about", "Write down what's contributing to your happiness"],
            sad: ["Be extra gentle with yourself today", "Consider what this sadness might be teaching you"],
            anxious: ["Focus on slow, deep breathing", "Name three things you can see, hear, and feel right now"],
            stressed: ["Prioritize one important task and let the rest wait", "Take a short walk outside if possible"],
            excited: ["Channel this energy into something creative or meaningful", "Share your excitement with a supportive friend"],
            calm: ["Savor this peaceful moment", "Notice what conditions helped create this calm feeling"]
        };

        const baseSuggestions = moodSuggestions[mood] || moodSuggestions.calm;
        suggestions.push(...baseSuggestions);

        // Return up to 3 unique suggestions
        return [...new Set(suggestions)].slice(0, 3);
    }

    private static getFallbackResponse(
        mood: string,
        transcription: string,
        tone: 'calm' | 'motivational' | 'reflective'
    ) {
        // Enhanced fallback using template system with AI-style personalization
        const fallbackResponses = {
            calm: "I hear you, and I want you to know that your feelings are completely valid. What you're experiencing right now is part of being human, and there's no need to judge yourself for feeling this way. Sometimes the most healing thing we can do is simply acknowledge where we are with compassion and patience.",
            motivational: "I see such strength in you for reaching out and sharing what's on your heart. That takes real courage, and it shows me that you have the resilience to move through whatever you're facing. You've overcome challenges before, and you have everything within you to handle this too.",
            reflective: "What strikes me about what you've shared is the awareness you have about your own experience. That kind of self-reflection is actually a powerful tool for growth and healing. I'm curious about what insights might emerge as you sit with these feelings a little longer."
        };

        return {
            response: fallbackResponses[tone],
            tone,
            suggestions: this.generateContextualSuggestions(mood, transcription),
            confidence: 0.8
        };
    }

    // Test connection to Hugging Face API
    static async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const testPrompt = {
                systemPrompt: "You are a helpful assistant.",
                userPrompt: "Hello, how are you?",
                maxTokens: 50,
                temperature: 0.7
            };

            await this.callHuggingFaceAPI(testPrompt);
            return { success: true, message: "Connected to Hugging Face API successfully" };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
} 