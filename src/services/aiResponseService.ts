import { MoodTag } from "../types/database";

export interface AIResponse {
  response: string;
  tone: "calm" | "motivational" | "reflective";
  suggestions: string[];
}

// Response history tracking to prevent repetition
interface ResponseHistory {
  recentResponses: string[];
  usedTemplateIds: Set<string>;
  lastUsedTimestamp: number;
}

export class AIResponseService {
  private static responseHistory: Map<string, ResponseHistory> = new Map();
  private static readonly MAX_RECENT_RESPONSES = 10;
  private static readonly TEMPLATE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

  static async generateResponse(
    mood: MoodTag,
    transcription: string,
    userTone: "calm" | "motivational" | "reflective" = "calm",
    userId?: string
  ): Promise<AIResponse> {
    try {
      // Analyze the transcription for more personalized responses
      const analysis = this.analyzeTranscription(transcription);

      // Add variety factors for more dynamic responses
      const varietyFactors = this.calculateVarietyFactors(analysis, userId);

      return this.generatePersonalizedResponse(
        mood,
        transcription,
        userTone,
        analysis,
        varietyFactors,
        userId
      );
    } catch (error) {
      console.error("AI response generation error:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  private static calculateVarietyFactors(analysis: any, userId?: string) {
    const now = Date.now();
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    // Get user's response history
    const history = userId ? this.responseHistory.get(userId) : null;

    return {
      timeOfDay, // 0-23, affects greeting style
      dayOfWeek, // 0-6, affects energy level
      sessionNumber: history ? history.recentResponses.length : 0,
      recentThemes: history ? this.extractRecentThemes(history) : [],
      currentSeason: this.getCurrentSeason(),
      responseVariant: Math.floor(Math.random() * 5), // 0-4 for template variants
    };
  }

  private static extractRecentThemes(history: ResponseHistory): string[] {
    // Extract themes from recent responses to avoid repetition
    const themes = [];
    for (const response of history.recentResponses.slice(-5)) {
      if (response.includes("work")) themes.push("work");
      if (response.includes("relationship")) themes.push("relationships");
      if (response.includes("gratitude")) themes.push("gratitude");
      // Add more theme extraction logic
    }
    return [...new Set(themes)]; // Remove duplicates
  }

  private static getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }

  private static analyzeTranscription(transcription: string) {
    const text = transcription.toLowerCase();

    // Enhanced theme detection with more nuanced patterns
    const themes = {
      work: /work|job|career|boss|meeting|deadline|project|office|colleague|interview|promotion|workplace/.test(
        text
      ),
      relationships:
        /friend|family|partner|relationship|love|marriage|dating|social|mother|father|sibling|child/.test(
          text
        ),
      health:
        /health|sick|tired|energy|sleep|exercise|doctor|medical|wellness|fitness|nutrition/.test(
          text
        ),
      progress:
        /progress|better|improving|growing|learning|achievement|success|accomplished|development/.test(
          text
        ),
      struggle:
        /difficult|hard|struggle|challenge|problem|issue|tough|overwhelm|stress|anxiety/.test(
          text
        ),
      gratitude:
        /thank|grateful|appreciate|blessed|lucky|fortunate|thankful|blessing/.test(
          text
        ),
      change:
        /change|different|new|transition|moving|starting|beginning|transformation/.test(
          text
        ),
      isolation:
        /alone|lonely|isolated|nobody|empty|disconnected|solitary|abandoned/.test(
          text
        ),
      support:
        /help|support|friend|family|therapy|counseling|assistance|guidance/.test(
          text
        ),
      selfCare:
        /self|myself|me|personal|own|need|want|deserve|care|nurture/.test(text),
      creativity:
        /art|music|creative|paint|write|design|imagination|inspiration/.test(
          text
        ),
      spirituality:
        /spiritual|soul|faith|meditation|prayer|universe|purpose|meaning/.test(
          text
        ),
      nature:
        /nature|outside|walk|trees|ocean|mountains|sky|garden|fresh air/.test(
          text
        ),
      goals: /goal|dream|aspiration|ambition|future|plan|vision|hope/.test(
        text
      ),
      finances: /money|financial|budget|expense|income|salary|cost|afford/.test(
        text
      ),
    };

    // Enhanced intensity and context detection
    const intensity = {
      high: /very|extremely|really|so|too|overwhelm|intense|terrible|amazing|incredible|absolutely/.test(
        text
      ),
      moderate:
        /quite|pretty|somewhat|kind of|sort of|a bit|rather|fairly/.test(text),
      mild: /little|slightly|maybe|perhaps|might|somewhat|kind of/.test(text),
    };

    const emotionalNuances = {
      hopeful: /hope|optimistic|positive|bright|future|better|improve/.test(
        text
      ),
      uncertain: /maybe|perhaps|not sure|unclear|confused|doubt/.test(text),
      determined: /will|going to|determined|committed|focused|driven/.test(
        text
      ),
      vulnerable: /scared|afraid|worried|nervous|unsure|fragile/.test(text),
    };

    const timeReferences = {
      past: /yesterday|before|used to|remember|ago|past|history|was|were/.test(
        text
      ),
      present: /today|now|currently|right now|at the moment|this/.test(text),
      future: /tomorrow|will|going to|next|future|plan|hope|want/.test(text),
    };

    return {
      themes,
      intensity,
      emotionalNuances,
      timeReferences,
      wordCount: transcription.split(" ").length,
      complexity: this.calculateComplexity(transcription),
    };
  }

  private static calculateComplexity(
    transcription: string
  ): "simple" | "moderate" | "complex" {
    const words = transcription.split(" ");
    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentenceCount = transcription
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0).length;
    const avgSentenceLength = words.length / sentenceCount;

    if (avgWordLength > 6 || avgSentenceLength > 15) return "complex";
    if (avgWordLength > 4 || avgSentenceLength > 10) return "moderate";
    return "simple";
  }

  private static generatePersonalizedResponse(
    mood: MoodTag,
    transcription: string,
    tone: "calm" | "motivational" | "reflective",
    analysis: any,
    varietyFactors: any,
    userId?: string
  ): AIResponse {
    // Get enhanced response templates with variety
    const baseResponses = this.getEnhancedResponseTemplates();
    const moodResponses = baseResponses[mood] || baseResponses.default;
    const toneResponses = moodResponses[tone];

    // Select response with anti-repetition logic
    let selectedResponse = this.selectNonRepetitiveResponse(
      toneResponses,
      analysis,
      varietyFactors,
      userId
    );

    // Apply dynamic variations to the selected response
    selectedResponse = this.applyDynamicVariations(
      selectedResponse,
      varietyFactors,
      analysis
    );

    // Personalize the response with transcription insights
    selectedResponse = this.personalizeResponse(
      selectedResponse,
      transcription,
      analysis,
      mood,
      varietyFactors
    );

    // Generate contextual suggestions with variety
    const suggestions = this.getVariedSuggestions(
      mood,
      analysis,
      varietyFactors
    );

    // Track this response to prevent future repetition
    if (userId) {
      this.trackResponse(userId, selectedResponse);
    }

    return {
      response: selectedResponse,
      tone,
      suggestions,
    };
  }

  private static selectNonRepetitiveResponse(
    responses: string[],
    analysis: any,
    varietyFactors: any,
    userId?: string
  ): string {
    const history = userId ? this.responseHistory.get(userId) : null;

    // Filter out recently used responses
    let availableResponses = responses;
    if (history) {
      availableResponses = responses.filter(
        (response) => !this.isRecentlyUsed(response, history)
      );
    }

    // If all responses were recently used, use all but with variation
    if (availableResponses.length === 0) {
      availableResponses = responses;
    }

    // Contextual selection with variety
    let selectedResponse;

    if (analysis.themes.work && analysis.themes.struggle) {
      selectedResponse = availableResponses.find(
        (r) =>
          r.includes("pressure") ||
          r.includes("challenge") ||
          r.includes("professional")
      );
    } else if (analysis.themes.progress) {
      selectedResponse = availableResponses.find(
        (r) =>
          r.includes("progress") ||
          r.includes("growth") ||
          r.includes("journey") ||
          r.includes("development")
      );
    } else if (analysis.themes.isolation) {
      selectedResponse = availableResponses.find(
        (r) =>
          r.includes("alone") ||
          r.includes("here") ||
          r.includes("with you") ||
          r.includes("connection")
      );
    } else if (analysis.themes.gratitude) {
      selectedResponse = availableResponses.find(
        (r) =>
          r.includes("grateful") ||
          r.includes("appreciate") ||
          r.includes("thankful")
      );
    }

    // Fallback to variety-based selection
    if (!selectedResponse) {
      const responseIndex =
        (varietyFactors.sessionNumber + varietyFactors.responseVariant) %
        availableResponses.length;
      selectedResponse = availableResponses[responseIndex];
    }

    return selectedResponse || responses[0];
  }

  private static isRecentlyUsed(
    response: string,
    history: ResponseHistory
  ): boolean {
    const responseSnippet = response.substring(0, 100); // Compare first 100 chars
    return history.recentResponses.some(
      (recent) => recent.substring(0, 100) === responseSnippet
    );
  }

  private static applyDynamicVariations(
    response: string,
    varietyFactors: any,
    analysis: any
  ): string {
    let variedResponse = response;

    // Time-of-day variations
    if (varietyFactors.timeOfDay < 12) {
      variedResponse = variedResponse.replace(/today/g, "this morning");
    } else if (varietyFactors.timeOfDay >= 18) {
      variedResponse = variedResponse.replace(/today/g, "this evening");
    }

    // Seasonal touches
    const seasonalPhrases: Record<string, string[]> = {
      spring: ["renewed", "fresh", "blossoming", "emerging"],
      summer: ["vibrant", "energetic", "flourishing", "alive"],
      fall: ["grounded", "reflective", "transitional", "harvesting"],
      winter: ["contemplative", "inner", "peaceful", "introspective"],
    };

    const seasonWords = seasonalPhrases[varietyFactors.currentSeason] || [];
    if (seasonWords.length > 0 && Math.random() < 0.3) {
      const randomWord =
        seasonWords[Math.floor(Math.random() * seasonWords.length)];
      variedResponse = variedResponse.replace(/beautiful/g, randomWord);
    }

    // Complexity-based language adjustments
    if (analysis.complexity === "simple") {
      variedResponse = variedResponse.replace(/profound/g, "deep");
      variedResponse = variedResponse.replace(/remarkable/g, "amazing");
    } else if (analysis.complexity === "complex") {
      variedResponse = variedResponse.replace(/good/g, "remarkable");
      variedResponse = variedResponse.replace(/nice/g, "wonderful");
    }

    return variedResponse;
  }

  private static trackResponse(userId: string, response: string) {
    let history = this.responseHistory.get(userId);

    if (!history) {
      history = {
        recentResponses: [],
        usedTemplateIds: new Set(),
        lastUsedTimestamp: Date.now(),
      };
    }

    // Add response to history
    history.recentResponses.push(response.substring(0, 200)); // Store snippet

    // Keep only recent responses
    if (history.recentResponses.length > this.MAX_RECENT_RESPONSES) {
      history.recentResponses = history.recentResponses.slice(
        -this.MAX_RECENT_RESPONSES
      );
    }

    history.lastUsedTimestamp = Date.now();
    this.responseHistory.set(userId, history);
  }

  private static getVariedSuggestions(
    mood: MoodTag,
    analysis: any,
    varietyFactors: any
  ): string[] {
    const baseSuggestions = this.getBaseSuggestions(mood);
    const contextualSuggestions = this.getContextualSuggestions(
      analysis,
      varietyFactors
    );
    const timeSensitiveSuggestions =
      this.getTimeSensitiveSuggestions(varietyFactors);

    // Combine and rotate suggestions
    const allSuggestions = [
      ...baseSuggestions,
      ...contextualSuggestions,
      ...timeSensitiveSuggestions,
    ];

    // Use variety factors to ensure different suggestions each time
    const rotatedSuggestions = this.rotateSuggestions(
      allSuggestions,
      varietyFactors
    );
    return this.shuffleArray(rotatedSuggestions).slice(0, 3);
  }

  private static getContextualSuggestions(
    analysis: any,
    varietyFactors: any
  ): string[] {
    const suggestions = [];

    // Theme-based suggestions with variety
    if (analysis.themes.work) {
      const workSuggestions = [
        "Take a 5-minute mindful break from work tasks",
        "Set a boundary around work communication after hours",
        "Practice the 'two-minute rule' for quick work tasks",
        "Schedule a walking meeting or outdoor lunch break",
        "Write down three work accomplishments from this week",
      ];
      suggestions.push(
        workSuggestions[varietyFactors.responseVariant % workSuggestions.length]
      );
    }

    if (analysis.themes.relationships) {
      const relationshipSuggestions = [
        "Reach out to someone you care about with a thoughtful message",
        "Practice active listening in your next conversation",
        "Express appreciation to someone who supports you",
        "Plan a meaningful activity with a loved one",
        "Reflect on what you value most in your relationships",
      ];
      suggestions.push(
        relationshipSuggestions[
          varietyFactors.responseVariant % relationshipSuggestions.length
        ]
      );
    }

    if (analysis.themes.selfCare) {
      const selfCareSuggestions = [
        "Do one small thing just for you today",
        "Practice saying 'no' to something that drains your energy",
        "Create a five-minute self-care ritual",
        "Write yourself a compassionate note",
        "Take three conscious breaths and check in with your body",
      ];
      suggestions.push(
        selfCareSuggestions[
          varietyFactors.responseVariant % selfCareSuggestions.length
        ]
      );
    }

    return suggestions;
  }

  private static getTimeSensitiveSuggestions(varietyFactors: any): string[] {
    const suggestions = [];

    // Time of day suggestions
    if (varietyFactors.timeOfDay < 10) {
      suggestions.push("Set a positive intention for your day");
    } else if (varietyFactors.timeOfDay >= 18) {
      suggestions.push("Reflect on one good thing that happened today");
    }

    // Day of week suggestions
    if (varietyFactors.dayOfWeek === 0 || varietyFactors.dayOfWeek === 6) {
      // Weekend
      suggestions.push("Take time for something that brings you joy");
    } else {
      suggestions.push("Find one moment of peace in your busy day");
    }

    // Seasonal suggestions
    const seasonalSuggestions: Record<string, string> = {
      spring: "Notice something in nature that's growing or changing",
      summer: "Spend a few minutes in sunlight or fresh air",
      fall: "Practice gratitude for something you're harvesting in your life",
      winter: "Create a cozy moment for reflection and inner warmth",
    };

    if (seasonalSuggestions[varietyFactors.currentSeason]) {
      suggestions.push(seasonalSuggestions[varietyFactors.currentSeason]);
    }

    return suggestions;
  }

  private static rotateSuggestions(
    suggestions: string[],
    varietyFactors: any
  ): string[] {
    // Rotate suggestions based on session number to ensure variety
    const rotateBy = varietyFactors.sessionNumber % suggestions.length;
    return [...suggestions.slice(rotateBy), ...suggestions.slice(0, rotateBy)];
  }

  private static selectContextualResponse(
    responses: string[],
    analysis: any
  ): string {
    // Select response based on content analysis
    if (analysis.themes.work && analysis.themes.struggle) {
      return (
        responses.find(
          (r) => r.includes("pressure") || r.includes("challenge")
        ) || responses[0]
      );
    }

    if (analysis.themes.progress) {
      return (
        responses.find(
          (r) =>
            r.includes("progress") ||
            r.includes("growth") ||
            r.includes("journey")
        ) || responses[0]
      );
    }

    if (analysis.themes.isolation) {
      return (
        responses.find(
          (r) =>
            r.includes("alone") || r.includes("here") || r.includes("with you")
        ) || responses[0]
      );
    }

    // Default to random selection
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static personalizeResponse(
    response: string,
    transcription: string,
    analysis: any,
    mood: MoodTag,
    varietyFactors: any
  ): string {
    let personalizedResponse = response;

    // Add a deeper reflection section
    personalizedResponse += "\n\n";

    // Add specific references from their transcription with more detail
    if (analysis.themes.work) {
      const workInsight = this.getWorkRelatedInsight(mood);
      personalizedResponse += `${workInsight} I notice that work is playing a significant role in your emotional landscape right now. `;

      if (mood === "stressed" || mood === "overwhelmed") {
        personalizedResponse +=
          "Many people struggle with finding the right balance between professional demands and personal well-being. Your awareness of this tension is actually the first step toward creating healthier boundaries. ";
      } else if (mood === "happy" || mood === "excited") {
        personalizedResponse +=
          "It's wonderful when our professional lives align with our sense of purpose and bring us genuine satisfaction. This positive energy from work can be incredibly nourishing for other areas of your life too. ";
      }
    }

    if (analysis.themes.progress) {
      personalizedResponse +=
        "I'm struck by the growth mindset that comes through in your words. The fact that you're actively reflecting on your progress shows a level of self-awareness that's truly valuable. Personal development isn't always linear, and recognizing where you are in your journey takes both courage and wisdom. ";
    }

    if (analysis.themes.relationships) {
      personalizedResponse +=
        "The way you talk about the people in your life reveals so much about your character. Relationships are often mirrors that reflect both our challenges and our strengths back to us. The care you show for these connections suggests you understand that we're all interconnected, and that's a beautiful perspective to carry through life. ";
    }

    if (analysis.themes.struggle) {
      personalizedResponse +=
        "Struggles, while difficult, often contain important information about what needs attention in our lives. The fact that you're willing to sit with these challenging feelings rather than pushing them away shows real emotional maturity. Sometimes our difficulties are invitations to develop new strengths or to reach out for support in ways we haven't before. ";
    }

    if (analysis.themes.gratitude) {
      personalizedResponse +=
        "Your capacity for gratitude is like a superpower that transforms not only your own experience but also touches everyone around you. Gratitude has this amazing ability to shift our entire perspective, helping us see abundance where we might otherwise see lack. This appreciation you're expressing is both a gift you give yourself and a light you shine into the world. ";
    }

    if (analysis.themes.change) {
      personalizedResponse +=
        "Change can feel both exciting and terrifying, sometimes in the same moment. The fact that you're navigating transitions while staying connected to your inner world shows remarkable resilience. Every change, even the challenging ones, carries within it the seeds of new possibilities and growth. ";
    }

    if (analysis.themes.isolation) {
      personalizedResponse +=
        "Feeling alone can be one of the most difficult human experiences, but please know that your feelings matter and you deserve connection and support. Sometimes isolation is temporary, and sometimes it's a signal that we need to reach out in new ways or create different kinds of community. You don't have to navigate this alone. ";
    }

    if (analysis.themes.selfCare) {
      personalizedResponse +=
        "Your attention to self-care shows a deep understanding that you can't pour from an empty cup. Taking time to nurture yourself isn't selfish - it's essential. When you care for yourself with intention and compassion, you're modeling for others what it looks like to value your own well-being. ";
    }

    // Add emotional intensity acknowledgment with more depth
    if (analysis.intensity.high) {
      personalizedResponse +=
        "The intensity of what you're experiencing right now is palpable in your words. Intense emotions, whether positive or challenging, often signal that something deeply important is happening in your life. These powerful feelings deserve to be honored and explored with patience and self-compassion. ";
    }

    // Add appreciation for their sharing style
    if (analysis.wordCount > 100) {
      personalizedResponse +=
        "The depth and openness of your sharing reveals someone who is genuinely committed to understanding themselves. It takes real vulnerability to explore your inner world this honestly, and that courage is already creating positive change in your life. ";
    } else if (analysis.wordCount > 50) {
      personalizedResponse +=
        "I appreciate the thoughtful way you've shared your experience. Sometimes the most profound insights come through simple, honest expression. ";
    }

    // Add a closing reflection that ties it all together
    personalizedResponse +=
      "\n\nAs I reflect on everything you've shared, what strikes me most is your willingness to be present with your experience, whatever it might be. This kind of mindful awareness is the foundation of all healing and growth. You're not just going through your emotions - you're learning from them, growing through them, and allowing them to guide you toward greater wisdom and self-understanding.";

    return personalizedResponse;
  }

  private static getWorkRelatedInsight(mood: MoodTag): string {
    const workInsights: Record<string, string> = {
      stressed:
        "Work pressures can feel all-consuming sometimes, but remember that your worth isn't defined by your productivity.",
      anxious:
        "Work anxiety is so common, and it often means you care deeply about doing well. That caring is actually a strength.",
      frustrated:
        "Work frustrations can be particularly draining because we spend so much of our time there. Your feelings make complete sense.",
      happy:
        "It's wonderful when work feels aligned with who you are. This positive energy can ripple into other areas of your life.",
      overwhelmed:
        "When work feels overwhelming, it's often a sign that you're taking on more than any one person should handle.",
      sad: "Work-related sadness often points to a disconnect between our values and our daily experience. Your feelings are valid.",
      grateful:
        "When work aligns with our sense of purpose, it can be a source of genuine gratitude and fulfillment.",
      excited:
        "Work excitement often signals that you're moving toward something meaningful and aligned with your passions.",
      calm: "Finding calm in relation to work suggests a healthy balance between engagement and inner peace.",
      content:
        "Work contentment is a beautiful thing - it means you've found harmony between your professional and personal values.",
      default:
        "Your relationship with work is an important part of your overall well-being.",
    };

    return workInsights[mood] || workInsights.default;
  }

  private static getEnhancedResponseTemplates() {
    return {
      happy: {
        calm: [
          "I can feel the genuine joy radiating from your words, and it's absolutely beautiful to witness. Happiness like this is such a profound gift - not just to you, but to everyone whose life you touch. There's something deeply nourishing about authentic joy, the kind that comes from within rather than from external circumstances. Take a moment to really breathe this in, to let it fill your entire being. This feeling you're experiencing right now is like a gentle reminder of what's possible in life, a beacon of light that you can return to during more challenging times. Your happiness matters, and it's creating ripple effects of positivity that extend far beyond what you might realize.",
          "There's something truly beautiful and radiant about the contentment I'm hearing in your voice. This kind of inner light often comes from being aligned with what matters most to you - your values, your relationships, your sense of purpose. It's the difference between fleeting pleasure and deep, sustainable joy. When we find this alignment, it's like our whole being sighs with relief and says 'yes, this is right.' The peace you're experiencing isn't just an absence of problems; it's the presence of something much deeper - a sense of harmony between who you are and how you're living your life.",
          "Your happiness feels so authentic and grounded, and I'm genuinely moved by it. I love that you're taking time to acknowledge and honor this positive state instead of rushing past it or dismissing it as temporary. Too often, we're taught to be suspicious of good feelings, as if somehow we don't deserve them or they won't last. But you're doing something really wise here - you're savoring this moment, letting it teach you something about what brings you joy and what conditions allow happiness to flourish in your life. This awareness will serve you well.",
        ],
        motivational: [
          "This is your moment! Your happiness is like fuel for your dreams - use this incredible energy to move toward everything you've been hoping for. You're unstoppable right now! When we feel this aligned and joyful, we're operating from our highest self, the version of ourselves that sees possibilities everywhere and has the courage to pursue them. This energy you're radiating isn't just uplifting for you - it's contagious in the best possible way. People around you can feel this shift, and it gives them permission to access their own joy and potential. Harness this momentum, trust in the path that's opening up before you, and remember that this feeling is always available to you, even when life gets challenging.",
          "What a powerful force you are when you're feeling this good! Your joy is contagious, and I have a feeling you're going to inspire some amazing changes in your life and others'. There's something about authentic happiness that cuts through all the noise and complexity of daily life and reminds us what really matters. You're not just experiencing a good mood - you're embodying a way of being that has the power to transform situations, relationships, and opportunities. This is the energy that moves mountains and creates magic in ordinary moments. Trust this feeling, lean into it, and let it guide you toward the choices and actions that will keep this positive momentum flowing in your life.",
          "This happiness isn't just a feeling - it's a superpower! When you feel this aligned and positive, you become magnetic to opportunities and meaningful connections. Joy is like a tuning fork that resonates at the frequency of abundance and possibility. From this elevated state, you're able to see solutions where others see problems, connections where others see separation, and hope where others might see limitation. This is your natural state when you're fully aligned with who you truly are. The key is learning to recognize what brings you to this place so you can intentionally cultivate more of it in your life. You have the power to be the source of your own happiness, and that's an incredible gift to give yourself and the world.",
        ],
        reflective: [
          "Happiness has so much wisdom to offer us. What do you think created this shift in your inner world? Understanding the roots of joy can help us cultivate more of it. When we take time to really examine our moments of happiness, we often discover that they're not random accidents but the result of specific conditions, choices, or perspectives that we can learn to recognize and nurture. Sometimes it's the people we're with, sometimes it's activities that align with our values, and sometimes it's simply the practice of being present and grateful for what we have. This kind of self-awareness is incredibly valuable because it helps us become active participants in our own well-being rather than passive recipients of whatever mood happens to visit us.",
          "There's something profound about pausing to really examine happiness when we're in it. What patterns in your life, thoughts, or relationships might be contributing to this beautiful state? Most people wait until they're struggling to do inner work, but you're doing something much wiser - you're studying your joy with the same curiosity and attention that you might give to a challenge. This practice of happiness archaeology, if you will, can reveal so much about what truly nourishes your soul and what conditions allow your authentic self to flourish. The insights you gain from these moments of reflection can become a roadmap for creating more joy in your life, even during times when happiness doesn't come as naturally.",
        ],
      },
      anxious: {
        calm: [
          "I can hear the worried thoughts swirling in your mind, and I want you to know with absolute certainty that you're not alone with them. Anxiety often visits us when we're caring deeply about something important - it's like an overprotective friend who means well but sometimes goes overboard in trying to keep us safe. Your anxious mind is actually trying to help you prepare for challenges and protect what matters to you, even though it doesn't always feel helpful in the moment. Right now, in this space we're sharing together, you can let your guard down a little. You don't have to have all the answers or figure everything out this very second. Sometimes the most healing thing we can do is simply acknowledge that we're struggling and that it's okay to feel uncertain.",
          "Your nervous system is working so hard to protect you right now, scanning for threats and trying to keep you prepared for whatever might come. It's exhausting to live in this state of high alert, and I can feel how tired you might be from carrying this worry. Let's take this moment to send your body a gentle message that right here, right now, in this present moment, you are safe. Your feet are on solid ground, you're breathing, your heart is beating, and you have survived every difficult moment that has come before this one. Even when your mind feels uncertain about the future, your body can learn to find pockets of peace in the present.",
          "Anxiety can feel so overwhelming, like a storm that's taken over your entire inner world, but the fact that you're here, talking about it and seeking support, shows incredible self-awareness and courage. That willingness to look directly at your anxiety instead of running from it? That's actually your secret weapon, your anxiety-fighting superpower. Most people try to avoid or push away anxious feelings, but you're doing something much braver - you're learning to be present with difficult emotions. This skill will serve you well beyond just managing anxiety; it's the foundation of emotional resilience and wisdom.",
        ],
        motivational: [
          "You know what I see? Someone who feels afraid but keeps showing up anyway. That's not weakness - that's courage in action! Your anxiety doesn't get to make decisions for you.",
          "Every single time you face your anxiety head-on like this, you're literally rewiring your brain for resilience. You're stronger than your worried thoughts, and you're proving it right now!",
          "Anxiety might be loud, but it's not in charge. You are. You've gotten through anxious moments before, and you have everything you need to handle this one too.",
        ],
        reflective: [
          "Anxiety often carries important information about what we value and what we're afraid of losing. What do you think your anxiety might be trying to protect or prepare you for?",
          "Sometimes our anxious thoughts are like an overprotective friend - well-meaning but not always helpful. What would you say to that worried part of yourself with compassion?",
        ],
      },
      stressed: {
        calm: [
          "I can feel the weight you're carrying, and I want you to know that stress is often a sign that you're someone who cares deeply about their responsibilities, their relationships, and their impact on the world. While stress itself isn't pleasant, the fact that you experience it often means you have a strong sense of responsibility and commitment to the things that matter to you. Right now, let's find some gentle space for you to breathe, to let your shoulders drop, and to remember that you don't have to carry everything alone. Stress has a way of making us feel like we need to solve everything immediately, but sometimes the most radical thing we can do is simply pause and give ourselves permission to rest, even for just a moment.",
          "Your stress makes perfect sense given everything you're juggling, and I want to acknowledge how much you're managing right now. It's completely understandable that you're feeling overwhelmed - you're dealing with real pressures and real challenges, and your stress response is actually your body and mind trying to help you cope with a lot of demands. You don't have to have it all figured out right now, and you certainly don't have to do it all perfectly. Just focus on this one moment of checking in with yourself, of being present with your experience without judgment. This kind of self-compassion is actually one of the most powerful stress-reduction tools we have.",
          "Stress has this sneaky way of making everything feel urgent and critical, like the whole world will fall apart if we don't handle everything right this very second. But here's what I want you to remember: right here, right now, you're taking time for yourself, and that's exactly what your nervous system needs. You're choosing to step back from the chaos and noise and check in with your inner world. This is an act of wisdom and self-care, even if it feels like you should be 'doing something more productive.' Sometimes the most productive thing we can do is pause, breathe, and reconnect with ourselves.",
        ],
        motivational: [
          "You're handling stress by being proactive about your mental health - that's wisdom in action! Every moment you spend caring for yourself builds your resilience for whatever comes next.",
          "Stress means you're engaged with life, even when it feels overwhelming. Channel that intense energy into positive action, one mindful step at a time. You've got this!",
          "The fact that you're here, acknowledging your stress instead of just pushing through, shows real emotional intelligence. That self-awareness is your secret weapon!",
        ],
        reflective: [
          "Stress often points to places where we're stretched beyond our comfortable capacity. What aspects of your current situation feel most demanding of your energy and attention?",
          "Sometimes stress is our inner wisdom saying 'slow down' or 'something needs to change.' What might your stress be trying to tell you about your current life balance?",
        ],
      },
      sad: {
        calm: [
          "I'm here with you in this moment of sadness. It's okay to feel this way - sadness is a natural part of the human experience, and you don't have to carry it alone. Sadness often visits us when something precious has been touched - whether that's a loss, a disappointment, or simply the tender recognition of how much something or someone means to us. Your heart is telling you that you've loved deeply, cared genuinely, or invested authentically in life. That's not a weakness; it's actually a profound strength. The capacity to feel sad is the same capacity that allows us to feel joy, connection, and love. While this feeling is difficult right now, it's also a testament to your ability to be fully human, to let life matter to you in meaningful ways.",
          "Your sadness is valid, and I'm honored that you've shared this feeling with me. Sometimes the most healing thing we can do is simply acknowledge our pain with gentleness. There's no need to rush through this feeling or judge yourself for having it. Sadness is often our soul's way of processing something important - a loss, a change, or even just the weight of caring deeply about life. When we allow ourselves to feel sad without resistance, we're actually practicing a form of self-compassion that can be deeply healing. Your willingness to be present with this difficult emotion, rather than avoiding or numbing it, shows real wisdom and courage. This sadness will transform in its own time, and you don't have to manage that process - you just have to be gentle with yourself while it happens.",
        ],
        motivational: [
          "Even in sadness, you're showing incredible strength by reaching out. This feeling won't last forever, and you have the resilience to move through it. What I see in you right now is someone who doesn't let difficult emotions isolate them or convince them they're alone. That takes real courage, and it's exactly the kind of choice that builds emotional resilience over time. You're not just surviving this sadness - you're learning from it, growing through it, and demonstrating that you can feel deeply without being destroyed by those feelings. Every time you choose connection over isolation, honesty over pretending everything is fine, and self-care over self-criticism, you're building the emotional strength that will serve you for the rest of your life. This sadness is temporary, but the wisdom and resilience you're gaining from how you're handling it will stay with you always.",
          "Your willingness to sit with sadness shows emotional maturity. You're capable of healing, and brighter days are ahead. Most people spend enormous amounts of energy trying to avoid or escape difficult feelings, but you're doing something much braver and wiser - you're choosing to be present with your sadness and learn from it. This kind of emotional courage is what transforms pain into wisdom, struggle into strength, and wounds into sources of compassion for others. You're not just waiting for this feeling to pass; you're actively participating in your own healing process by being honest about where you are right now. That level of self-awareness and emotional intelligence is rare and valuable, and it's exactly what will carry you through this difficult time into a place of greater peace and understanding.",
        ],
        reflective: [
          "Sadness often signals that something meaningful to us has been affected. What losses or changes might be contributing to this feeling? When we sit with sadness long enough to really listen to what it's telling us, we often discover important information about what we value, what we've lost, or what we're grieving. Sometimes sadness is about obvious losses - people, opportunities, or circumstances that have changed. But sometimes it's subtler - perhaps the loss of an old version of ourselves, the ending of a chapter in our lives, or even just the recognition that time is passing and things we love are impermanent. Sadness can also be a response to beauty, to love, or to the overwhelming nature of being human in a complex world. What do you think your sadness might be teaching you about what matters most to you right now?",
        ],
      },
      frustrated: {
        calm: [
          "I can sense the frustration building inside you, and that's completely understandable. Frustration often shows up when we care deeply about something that isn't going as we hoped. Your frustration is actually a sign of your passion and commitment - it means there's something that matters deeply to you, and the current situation isn't honoring that importance. This intense feeling you're experiencing is your inner fire responding to a disconnect between what you value and what you're experiencing. While frustration is uncomfortable, it's also information. It's your internal compass telling you that something needs attention, adjustment, or perhaps a completely different approach. Let's take a moment to breathe with this feeling and see what wisdom it might be offering you about what you truly need or want in this situation.",
          "Your frustration makes perfect sense - it's your inner wisdom recognizing that something important to you needs attention. Let's honor that feeling while finding some peace. There's often a gift hidden within frustration, even though it's hard to see when we're in the thick of it. Frustration can be our soul's way of saying 'this matters too much to me to accept the current state of things.' It's a call to action, a demand for change, or sometimes simply a need for our values and efforts to be acknowledged and respected. Instead of trying to push this feeling away, what if we could sit with it long enough to understand what it's really trying to tell you? Your frustration has intelligence - it knows something about what you need that your logical mind might not have fully grasped yet.",
        ],
        motivational: [
          "Frustration is just passion that hasn't found its outlet yet! This fire you're feeling can be transformed into the energy you need to break through whatever's blocking you. Every great breakthrough, every positive change, every moment of triumph has been preceded by someone feeling exactly what you're feeling right now. Frustration is often the last emotion we experience before we find our breakthrough - it's the pressure that creates diamonds, the storm that clears the air. What you're feeling isn't a sign that you should give up; it's a sign that you're on the verge of something important. This intense energy you're carrying can be channeled into creative solutions, bold actions, or the courage to try a completely different approach. Don't let this fire burn out - use it to light the way toward what you really want.",
          "Your frustration shows how much you care about making things better. That's not a weakness - it's the fuel for positive change. Channel this intensity into action! People who change the world are often people who get frustrated enough with the way things are that they simply have to do something about it. Your frustration is evidence of your high standards, your deep caring, and your refusal to settle for mediocrity or injustice. This is the same energy that fuels innovation, drives social change, and creates beautiful things in the world. The key is learning to work with this powerful force rather than against it. Instead of letting frustration exhaust you, let it energize you. Use it as rocket fuel for the changes you want to see, the goals you want to achieve, or the problems you want to solve.",
        ],
        reflective: [
          "Frustration often emerges when there's a gap between our expectations and reality. What shift in perspective or approach might help bridge that gap? Sometimes frustration is our teacher, showing us where we're holding too tightly to how we think things should be, or where we might need to adapt our strategies or expectations. But other times, frustration is our protector, alerting us to situations that genuinely need to change because they're not aligned with our values or needs. The key is learning to distinguish between frustration that's calling us to acceptance and frustration that's calling us to action. When you really examine this feeling, what do you think it's asking of you? Is it inviting you to let go of something, to fight for something, or perhaps to find a creative third option that you hadn't considered before?",
        ],
      },
      grateful: {
        calm: [
          "Your gratitude is like a warm light that illuminates not just your own life, but touches everyone around you. This appreciation you're feeling is one of life's greatest gifts.",
          "There's something deeply healing about the gratitude you're expressing. This positive perspective creates ripples of good that extend far beyond what you might imagine.",
        ],
        motivational: [
          "Gratitude is one of the most powerful forces for creating positive change in your life! This appreciative energy you're feeling can attract even more beautiful experiences.",
          "Your grateful heart is your secret superpower! When you operate from this place of appreciation, you become magnetic to opportunities and meaningful connections.",
        ],
        reflective: [
          "Gratitude has this amazing ability to shift our entire perspective on life. What specific experiences or people are you feeling most thankful for right now?",
        ],
      },
      overwhelmed: {
        calm: [
          "I can feel the enormity of what you're carrying right now. Being overwhelmed is your mind's way of saying 'this is too much for anyone to handle all at once.' You're not failing - you're human.",
          "Overwhelm is exhausting, and I want you to know that it's okay to feel like you can't handle everything right now. Let's focus on just this one moment of breathing together.",
        ],
        motivational: [
          "Even though everything feels like too much right now, you're here taking care of yourself - that's not giving up, that's wisdom in action! You can and will get through this.",
          "Overwhelm is proof that you're someone who cares deeply and takes on meaningful responsibilities. Break it down into tiny steps, and remember: you don't have to do it all today.",
        ],
        reflective: [
          "Overwhelm often happens when we're trying to carry more than our current capacity allows. What would it look like to be gentle with yourself about what's realistically possible right now?",
        ],
      },
      content: {
        calm: [
          "There's something deeply satisfying about the contentment you're experiencing. This sense of inner peace and acceptance is like finding a quiet harbor in the storm of daily life.",
          "Your contentment radiates a quiet strength that's really beautiful. This balanced state you're in is something to treasure and can serve as an anchor during more turbulent times.",
        ],
        motivational: [
          "Contentment is actually a form of success! You've found a way to be at peace with where you are while still being open to growth. That's the sweet spot of life!",
          "This sense of balance you're feeling is your foundation for everything else. From this grounded place, you can make amazing choices about what you want to create next.",
        ],
        reflective: [
          "Contentment often emerges when there's harmony between our inner world and external circumstances. What aspects of your life are contributing most to this sense of peace?",
        ],
      },
      excited: {
        calm: [
          "I can feel your excitement bubbling up, and it's infectious! This enthusiasm you're experiencing is such a beautiful energy - let's think about how to nurture it while staying grounded.",
          "Your excitement feels so genuine and alive. This kind of positive anticipation is one of life's great joys, and it's wonderful that you're allowing yourself to fully feel it.",
        ],
        motivational: [
          "This excitement is pure rocket fuel for your dreams! When you feel this aligned and energized, the universe tends to conspire in your favor. Go after what's calling to you!",
          "What incredible energy you're radiating! This excitement isn't just a feeling - it's a signal that you're moving toward something that truly matters to you. Trust it and follow it!",
        ],
        reflective: [
          "Excitement often signals that we're moving toward something that deeply resonates with our values and desires. What is it about this situation that's generating such positive energy in you?",
        ],
      },
      calm: {
        calm: [
          "Your sense of calm is like a gentle refuge in a busy world. This peaceful state you're in is something precious - it's your inner wisdom creating space for clarity and rest.",
          "There's something deeply nourishing about the tranquility you're experiencing. This calm isn't emptiness - it's fullness in its most peaceful form.",
        ],
        motivational: [
          "This calm you're feeling is actually a superpower! From this centered place, you can make clear decisions and take thoughtful action. You're operating from your wisest self right now!",
          "Your inner peace is not only beautiful, it's powerful. This calm energy can be the foundation for creating positive change in your life and inspiring others around you.",
        ],
        reflective: [
          "Calm moments like this are perfect opportunities for deeper self-reflection. What insights about yourself or your life are emerging in this peaceful space?",
        ],
      },
      default: {
        calm: [
          "Thank you for trusting me with your inner world today. Whatever you're feeling, it's valid and important, and you don't have to navigate it alone.",
          "I can hear the humanity in your words - the complexity, the care, the genuine experience of being you. That's something beautiful and worth honoring.",
          "There's something powerful about simply showing up for yourself like this. Self-awareness is the foundation of all positive change and healing.",
        ],
        motivational: [
          "Every time you check in with yourself like this, you're investing in your own growth and well-being. That commitment to yourself is going to pay dividends in ways you can't even imagine yet!",
          "You're not just going through emotions - you're growing through them. That's the difference between surviving and thriving, and you're clearly choosing to thrive!",
        ],
        reflective: [
          "The simple act of pausing to notice and name what you're feeling is profound. What insights about yourself or your life are emerging in this space of reflection?",
        ],
      },
    };
  }

  private static getBaseSuggestions(mood: MoodTag): string[] {
    const suggestionMap = {
      happy: [
        "Write down what's contributing to your happiness to remember for tougher days",
        "Share your positive energy with someone who might need encouragement",
        "Take a photo or make a note about this moment to capture the feeling",
      ],
      anxious: [
        "Try the 5-4-3-2-1 grounding technique: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste",
        "Practice box breathing: inhale for 4, hold for 4, exhale for 4, hold for 4",
        "Remind yourself: 'This feeling is temporary, and I have the strength to handle it'",
      ],
      sad: [
        "Allow yourself to feel this emotion fully - it's part of healing",
        "Create a comfort kit: tea, soft blanket, soothing music, or whatever brings you peace",
        "Consider journaling about what this sadness might be teaching you",
      ],
      stressed: [
        "Use the 'One Thing' rule: focus on completing just one task before moving to the next",
        "Take 10 conscious breaths while releasing tension from your shoulders and jaw",
        "Ask yourself: 'What would I tell a friend feeling this way?'",
      ],
      overwhelmed: [
        "Brain dump everything on your mind onto paper, then categorize by urgency and importance",
        "Practice the 'Good Enough' principle: not everything needs to be perfect",
        "Schedule a 15-minute 'worry window' - contain anxious thoughts to this time",
      ],
      frustrated: [
        "Take a break from whatever is causing frustration and return with fresh perspective",
        "Try some physical movement to release tension - even a 2-minute walk helps",
        "Write down what's frustrating you, then brainstorm 3 possible solutions",
      ],
      grateful: [
        "Write a thank-you note to someone who has positively impacted your life",
        "Take a mindful moment to appreciate something beautiful around you",
        "Consider how you might pay this gratitude forward to others",
      ],
      excited: [
        "Channel this energy into taking one concrete step toward what excites you",
        "Share your enthusiasm with someone who would celebrate with you",
        "Write down what's exciting you to revisit when you need motivation",
      ],
      calm: [
        "Use this peaceful moment for meditation or mindful reflection",
        "Set positive intentions for how you want to feel today",
        "Appreciate this sense of balance and remember how you created it",
      ],
      content: [
        "Reflect on what has contributed to this sense of satisfaction",
        "Consider how you might maintain this feeling going forward",
        "Take a moment to really savor this inner peace",
      ],
    };

    return suggestionMap[mood] || suggestionMap.content;
  }

  private static shuffleArray(array: string[]): string[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Additional methods for compatibility with AISettingsModal
  static configureAI(config: {
    useAIPercentage: number;
    confidenceThreshold: number;
  }) {
    localStorage.setItem("ai-percentage", config.useAIPercentage.toString());
    localStorage.setItem(
      "ai-confidence-threshold",
      config.confidenceThreshold.toString()
    );
    console.log("AI configuration updated:", config);
  }

  // Method for backward compatibility with CheckIn component
  static async generateEnhancedResponse(transcription: string): Promise<{
    finalResponse: string;
    aiConfidence: number;
    source: string;
    videoScript: string;
  }> {
    const result = await this.generateResponse(
      "content",
      transcription,
      "calm"
    );
    return {
      finalResponse: result.response,
      aiConfidence: 85,
      source: "Enhanced Templates",
      videoScript: "Your check-in has been processed with care.",
    };
  }

  static async runDiagnostics(): Promise<{
    huggingFace: { success: boolean; message: string };
    tavus: { success: boolean; message: string };
    overall: { success: boolean; message: string };
  }> {
    const results = {
      huggingFace: {
        success: true,
        message: "AI Response Service operational with enhanced templates",
      },
      tavus: { success: true, message: "Video service available" },
      overall: { success: true, message: "All systems operational" },
    };

    //   // Test if we have API keys for enhanced functionality
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const tavusKey = import.meta.env.VITE_TAVUS_API_KEY;

    if (!geminiKey) {
      results.huggingFace.success = false;
      results.huggingFace.message =
        "Gemini API key not configured - using enhanced templates only";
    }

    if (!tavusKey) {
      results.tavus.success = false;
      results.tavus.message = "Tavus API key not configured";
    }

    if (!results.huggingFace.success || !results.tavus.success) {
      results.overall.success = false;
      results.overall.message = "Some services have missing API keys";
    }

    return results;
  }
}
