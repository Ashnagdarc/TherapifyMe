import { MoodTag } from '../types/database';

export interface AIResponse {
  response: string;
  tone: 'calm' | 'motivational' | 'reflective';
  suggestions: string[];
}

export class AIResponseService {
  static async generateResponse(
    mood: MoodTag,
    transcription: string,
    userTone: 'calm' | 'motivational' | 'reflective' = 'calm'
  ): Promise<AIResponse> {
    try {
      // For now, we'll generate contextual responses based on mood and transcription
      // In production, you'd use OpenAI GPT or similar AI service
      return this.generateContextualResponse(mood, transcription, userTone);
    } catch (error) {
      console.error('AI response generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private static generateContextualResponse(
    mood: MoodTag,
    transcription: string,
    tone: 'calm' | 'motivational' | 'reflective'
  ): AIResponse {
    const responses = this.getResponseTemplates();
    const moodResponses = responses[mood] || responses.default;
    const toneResponses = moodResponses[tone];
    
    // Select a random response from the appropriate tone
    const randomResponse = toneResponses[Math.floor(Math.random() * toneResponses.length)];
    
    // Generate suggestions based on mood
    const suggestions = this.getSuggestions(mood);
    
    return {
      response: randomResponse,
      tone,
      suggestions
    };
  }

  private static getResponseTemplates() {
    return {
      happy: {
        calm: [
          "I'm so glad to hear you're feeling happy today. This positive energy can be a wonderful foundation for the rest of your day. Take a moment to appreciate what's contributing to this feeling.",
          "Your happiness is shining through, and it's beautiful to witness. Sometimes it's helpful to reflect on what specifically is bringing you joy today.",
        ],
        motivational: [
          "That's fantastic! Your happiness is infectious and shows your resilience. Use this positive momentum to tackle any challenges ahead with confidence.",
          "Amazing! You're radiating positive energy. This is the perfect time to set intentions for maintaining this wonderful mood.",
        ],
        reflective: [
          "It's wonderful that you're experiencing happiness. Take a moment to really savor this feeling and consider what life circumstances or choices led to this positive state.",
        ]
      },
      anxious: {
        calm: [
          "I hear that you're feeling anxious, and I want you to know that's completely okay. Anxiety is a natural response, and acknowledging it is the first brave step toward managing it.",
          "Thank you for sharing your anxiety with me. Let's take this moment to breathe together and remember that you have the strength to work through these feelings.",
        ],
        motivational: [
          "You're facing your anxiety head-on by reaching out, and that takes real courage. You have the power to transform this challenging feeling into an opportunity for growth.",
          "I admire your bravery in acknowledging your anxiety. This awareness is your superpower - it means you can take positive action to support yourself.",
        ],
        reflective: [
          "Anxiety often carries important messages about what matters to us. What do you think your anxiety might be trying to tell you about your current situation?",
        ]
      },
      sad: {
        calm: [
          "I'm here with you in this moment of sadness. It's okay to feel this way - sadness is a natural part of the human experience, and you don't have to carry it alone.",
          "Your sadness is valid, and I'm honored that you've shared this feeling with me. Sometimes the most healing thing we can do is simply acknowledge our pain with gentleness.",
        ],
        motivational: [
          "Even in sadness, you're showing incredible strength by reaching out. This feeling won't last forever, and you have the resilience to move through it.",
          "Your willingness to sit with sadness shows emotional maturity. You're capable of healing, and brighter days are ahead.",
        ],
        reflective: [
          "Sadness often signals that something meaningful to us has been affected. What losses or changes might be contributing to this feeling?",
        ]
      },
      stressed: {
        calm: [
          "Stress can feel overwhelming, but you're taking the right step by pausing to check in with yourself. Let's focus on finding some calm in this moment together.",
          "I can sense the weight you're carrying right now. Stress is your mind and body's way of signaling that you need some extra care and support.",
        ],
        motivational: [
          "You're handling stress by being proactive about your mental health - that's a sign of real wisdom and self-care. You've got this!",
          "Stress means you care deeply about something important. Channel that caring energy into positive action, one small step at a time.",
        ],
        reflective: [
          "Stress often points to areas where we feel stretched beyond our current capacity. What specific pressures are you facing right now?",
        ]
      },
      calm: {
        calm: [
          "Your sense of calm is like a gentle refuge. This peaceful state is something to be treasured and can serve as an anchor during more turbulent times.",
          "There's something beautiful about the calm you're experiencing. This inner peace is a gift you can return to whenever you need it.",
        ],
        motivational: [
          "Your calm energy is powerful! Use this peaceful state as a launching pad for anything you want to accomplish today.",
          "This calmness shows your inner strength and balance. You're in a perfect position to make thoughtful decisions and positive changes.",
        ],
        reflective: [
          "Calm moments are precious opportunities for self-reflection. What insights about yourself or your life are emerging in this peaceful space?",
        ]
      },
      excited: {
        calm: [
          "Your excitement is wonderful to feel. This enthusiasm can be channeled into meaningful action while staying grounded in the present moment.",
          "I love feeling your excitement! This energy is precious - let's think about how to nurture it while maintaining your emotional balance.",
        ],
        motivational: [
          "Your excitement is contagious! This is the perfect energy to propel you toward your goals and dreams. Ride this wave of enthusiasm!",
          "What amazing energy you have! Use this excitement as fuel to take bold steps toward what matters most to you.",
        ],
        reflective: [
          "Excitement often signals alignment with our values and desires. What is it about this moment or opportunity that's generating such positive energy?",
        ]
      },
      frustrated: {
        calm: [
          "Frustration can be really challenging to sit with. I'm here to help you work through these feelings with patience and understanding.",
          "Your frustration is completely understandable. Sometimes things don't go as we hope, and it's natural to feel upset about that.",
        ],
        motivational: [
          "Frustration often means you care deeply about making things better. Channel this energy into finding creative solutions and positive change.",
          "Your frustration shows your passion and commitment. Use this fire to fuel positive action and breakthrough whatever barriers you're facing.",
        ],
        reflective: [
          "Frustration can be a signal that our expectations aren't matching reality. What gap between your hopes and current circumstances might be causing this feeling?",
        ]
      },
      grateful: {
        calm: [
          "Gratitude is such a beautiful emotion to experience. This appreciation for life's gifts can bring deep peace and contentment to your day.",
          "Your sense of gratitude is heartwarming. This positive perspective can be a source of strength and joy, both for you and others around you.",
        ],
        motivational: [
          "Gratitude is one of the most powerful emotions for creating positive change! Use this appreciation as energy to spread kindness and pursue your dreams.",
          "Your grateful heart is inspiring! This positive mindset is your secret weapon for overcoming challenges and creating an amazing life.",
        ],
        reflective: [
          "Gratitude opens our hearts to recognize the abundance already present in our lives. What specific people, experiences, or circumstances are you most thankful for right now?",
        ]
      },
      overwhelmed: {
        calm: [
          "Feeling overwhelmed is a sign that you're dealing with a lot right now. Let's take this one breath at a time and remember that you don't have to handle everything at once.",
          "I can feel the weight you're carrying. Being overwhelmed is exhausting, but you're strong enough to work through this step by step.",
        ],
        motivational: [
          "Even though you feel overwhelmed, you're taking positive action by checking in with yourself. You have the power to break things down into manageable pieces.",
          "Overwhelm means you're engaged with life, even if it feels like too much right now. You can and will find your way through this challenge.",
        ],
        reflective: [
          "Overwhelm often happens when we're trying to juggle too many things at once. What are the main sources of pressure in your life right now?",
        ]
      },
      content: {
        calm: [
          "Contentment is a wonderful state of being. This sense of satisfaction and peace with where you are right now is truly valuable.",
          "Your contentment radiates a quiet strength. This balanced emotional state is something to appreciate and can serve as a foundation for whatever comes next.",
        ],
        motivational: [
          "Contentment shows you've found balance in your life - that's an amazing achievement! Use this stable foundation to reach for whatever dreams call to you.",
          "Your sense of contentment is beautiful and shows real emotional wisdom. From this grounded place, you can make powerful choices about your future.",
        ],
        reflective: [
          "Contentment suggests a harmony between your inner world and external circumstances. What aspects of your life are contributing most to this sense of satisfaction?",
        ]
      },
      default: {
        calm: [
          "Thank you for sharing how you're feeling with me. Whatever emotions you're experiencing are valid, and I'm here to support you through them.",
          "I appreciate you taking the time to check in with yourself today. This self-awareness is an important part of taking care of your mental health.",
        ],
        motivational: [
          "You're taking positive action for your mental health by checking in today. That shows real commitment to your well-being and growth.",
          "Every emotion you experience has value and can teach you something important about yourself. You're on a journey of self-discovery and healing.",
        ],
        reflective: [
          "Taking time to acknowledge and reflect on our emotions is a powerful practice. What insights about yourself are emerging as you sit with these feelings?",
        ]
      }
    };
  }

  private static getSuggestions(mood: MoodTag): string[] {
    const suggestionMap = {
      happy: [
        "Practice gratitude by writing down three things you're thankful for",
        "Share your positive energy with someone you care about",
        "Take a moment to savor this feeling and what created it"
      ],
      anxious: [
        "Try the 4-7-8 breathing technique: breathe in for 4, hold for 7, exhale for 8",
        "Ground yourself by naming 5 things you can see, 4 you can touch, 3 you can hear",
        "Take a short walk outside if possible"
      ],
      sad: [
        "Allow yourself to feel this emotion without judgment",
        "Reach out to a trusted friend or family member",
        "Practice gentle self-care like taking a warm bath or listening to soothing music"
      ],
      stressed: [
        "Make a priority list and focus on one task at a time",
        "Take three deep breaths and release tension in your shoulders",
        "Consider what you can delegate or postpone"
      ],
      calm: [
        "Use this peaceful moment for meditation or reflection",
        "Set positive intentions for the rest of your day",
        "Appreciate this sense of balance and remember how it feels"
      ],
      excited: [
        "Channel this energy into a creative project or goal",
        "Share your enthusiasm with others who might benefit from it",
        "Write down what's exciting you to remember this feeling later"
      ],
      frustrated: [
        "Take a break from whatever is causing frustration",
        "Try some physical movement to release tension",
        "Consider a different approach or perspective on the situation"
      ],
      grateful: [
        "Write a thank-you note to someone who has impacted your life",
        "Spend time appreciating small everyday pleasures",
        "Consider how you might pay this gratitude forward"
      ],
      overwhelmed: [
        "Break large tasks into smaller, manageable steps",
        "Practice saying 'no' to non-essential commitments",
        "Focus on just the next one thing you need to do"
      ],
      content: [
        "Reflect on what has contributed to this sense of balance",
        "Consider how you might maintain this feeling going forward",
        "Appreciate this moment of equilibrium and peace"
      ]
    };

    return suggestionMap[mood] || suggestionMap.content;
  }
}