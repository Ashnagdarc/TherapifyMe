import { supabase } from '../lib/supabase';
import { TavusService } from './tavusService';
import { Entry, MoodTag, User, TavusVideo } from '../types/database';

interface WeeklyMoodSummary {
  dominantMood: MoodTag;
  moodCounts: { [key in MoodTag]?: number };
  totalEntries: number;
  averageEntriesPerDay: number;
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  keyThemes: string[];
}

export class WeeklyVideoService {
  static async generateWeeklyVideo(userId: string): Promise<TavusVideo | null> {
    try {
      const currentWeek = this.getCurrentWeekNumber();
      
      // Check if video already exists for this week
      const existingVideo = await this.getExistingVideo(userId, currentWeek);
      if (existingVideo) {
        return existingVideo;
      }

      // Get user profile for personalization
      const user = await this.getUserProfile(userId);
      if (!user) {
        throw new Error('User profile not found');
      }

      // Analyze this week's entries
      const weeklyAnalysis = await this.analyzeWeeklyEntries(userId);
      if (weeklyAnalysis.totalEntries === 0) {
        console.log('No entries this week, skipping video generation');
        return null;
      }

      // Generate therapeutic script
      const script = this.generateTherapeuticScript(weeklyAnalysis, user);
      
      // Create video with Tavus
      const tavusResponse = await TavusService.createVideo(script);
      
      // Save to database
      const videoData = await this.saveVideoToDatabase(
        userId,
        currentWeek,
        tavusResponse,
        script,
        weeklyAnalysis
      );

      return videoData;
    } catch (error) {
      console.error('Error generating weekly video:', error);
      throw error;
    }
  }

  static async getWeeklyVideo(userId: string, weekNumber?: number): Promise<TavusVideo | null> {
    const week = weekNumber || this.getCurrentWeekNumber();
    
    try {
      const { data, error } = await supabase
        .from('tavus_videos')
        .select('*')
        .eq('user_id', userId)
        .eq('week', week)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching weekly video:', error);
      return null;
    }
  }

  private static async getExistingVideo(userId: string, week: number): Promise<TavusVideo | null> {
    try {
      const { data, error } = await supabase
        .from('tavus_videos')
        .select('*')
        .eq('user_id', userId)
        .eq('week', week)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing video:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getExistingVideo:', error);
      return null;
    }
  }

  private static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  private static async analyzeWeeklyEntries(userId: string): Promise<WeeklyMoodSummary> {
    const { weekStart, weekEnd } = this.getWeekDateRange();
    
    try {
      const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const moodCounts: { [key in MoodTag]?: number } = {};
      const themes: string[] = [];

      entries?.forEach(entry => {
        moodCounts[entry.mood_tag] = (moodCounts[entry.mood_tag] || 0) + 1;
        if (entry.transcription) {
          themes.push(entry.transcription);
        }
      });

      const dominantMood = Object.entries(moodCounts).reduce((a, b) => 
        moodCounts[a[0] as MoodTag]! > moodCounts[b[0] as MoodTag]! ? a : b
      )[0] as MoodTag;

      return {
        dominantMood,
        moodCounts,
        totalEntries: entries?.length || 0,
        averageEntriesPerDay: (entries?.length || 0) / 7,
        weekNumber: this.getCurrentWeekNumber(),
        weekStart,
        weekEnd,
        keyThemes: this.extractKeyThemes(themes)
      };
    } catch (error) {
      console.error('Error analyzing weekly entries:', error);
      return {
        dominantMood: 'content',
        moodCounts: {},
        totalEntries: 0,
        averageEntriesPerDay: 0,
        weekNumber: this.getCurrentWeekNumber(),
        weekStart,
        weekEnd,
        keyThemes: []
      };
    }
  }

  private static generateTherapeuticScript(analysis: WeeklyMoodSummary, user: User): string {
    const { dominantMood, totalEntries, averageEntriesPerDay, keyThemes } = analysis;
    const userName = user.name || 'there';
    
    // Personalized opening based on check-in frequency
    let opening = '';
    if (averageEntriesPerDay >= 1) {
      opening = `Hello ${userName}. I'm really proud of your commitment to checking in with yourself this week. `;
    } else if (averageEntriesPerDay >= 0.5) {
      opening = `Hi ${userName}. It's wonderful to see you taking time for self-reflection this week. `;
    } else {
      opening = `Hello ${userName}. I'm glad we have this moment together to reflect on your week. `;
    }

    // Mood-specific therapeutic content
    const moodInsights = this.getMoodInsight(dominantMood, analysis.moodCounts);
    
    // Weekly reflection and guidance
    const reflection = this.generateReflection(keyThemes, dominantMood);
    
    // Forward-looking encouragement
    const encouragement = this.generateEncouragement(dominantMood, user.preferred_tone);
    
    // Practical exercises
    const exercise = this.generateWeeklyExercise(dominantMood);

    return `${opening}

${moodInsights}

${reflection}

${encouragement}

${exercise}

Remember, every step you take toward understanding yourself better is valuable. I'm here to support you on this journey. Take care of yourself, ${userName}.`;
  }

  private static getMoodInsight(dominantMood: MoodTag, moodCounts: { [key in MoodTag]?: number }): string {
    const totalCount = Object.values(moodCounts).reduce((sum, count) => sum + (count || 0), 0);
    const percentage = Math.round(((moodCounts[dominantMood] || 0) / totalCount) * 100);

    const insights = {
      happy: `This week, happiness was your most frequent emotion, appearing in ${percentage}% of your check-ins. This suggests you've found sources of joy and positivity in your daily life.`,
      calm: `Calmness dominated your emotional landscape this week at ${percentage}% of your entries. This indicates a wonderful sense of inner peace and emotional regulation.`,
      anxious: `I noticed anxiety was present in ${percentage}% of your check-ins this week. While challenging, this awareness allows us to develop strategies for managing these feelings.`,
      sad: `Sadness appeared in ${percentage}% of your entries this week. It's important to honor these feelings as a natural part of processing life's experiences.`,
      stressed: `Stress was your primary emotion in ${percentage}% of your check-ins. Let's explore ways to build resilience and find moments of relief in your daily routine.`,
      excited: `Excitement filled ${percentage}% of your week! This enthusiasm is a powerful energy that can fuel positive changes in your life.`,
      frustrated: `Frustration appeared in ${percentage}% of your entries, suggesting areas where expectations and reality might not be aligning. This is valuable information for growth.`,
      grateful: `Gratitude was prominent in ${percentage}% of your check-ins. This positive perspective is a strong foundation for mental wellbeing.`,
      overwhelmed: `Feeling overwhelmed occurred in ${percentage}% of your entries. This signals it might be time to reassess priorities and find ways to create more space in your life.`,
      content: `Contentment characterized ${percentage}% of your week. This balanced emotional state shows you're finding harmony between your inner world and external circumstances.`
    };

    return insights[dominantMood] || insights.content;
  }

  private static generateReflection(themes: string[], dominantMood: MoodTag): string {
    if (themes.length === 0) {
      return "While you didn't share many details in your voice notes this week, the simple act of checking in shows your commitment to self-awareness.";
    }

    // Simple keyword analysis
    const commonWords = ['work', 'stress', 'family', 'friends', 'sleep', 'exercise', 'health', 'goals'];
    const themeText = themes.join(' ').toLowerCase();
    const mentionedThemes = commonWords.filter(word => themeText.includes(word));

    if (mentionedThemes.length > 0) {
      return `Looking at your reflections this week, I notice themes around ${mentionedThemes.slice(0, 3).join(', ')}. These areas of your life are clearly on your mind and deserve attention.`;
    }

    return "Your reflections this week show a thoughtful approach to understanding your emotions and experiences.";
  }

  private static generateEncouragement(dominantMood: MoodTag, preferredTone: 'calm' | 'motivational' | 'reflective'): string {
    const encouragements = {
      calm: {
        happy: "Continue nurturing the practices and relationships that bring you this joy.",
        calm: "Your inner peace is a gift. Trust in your ability to maintain this balance.",
        anxious: "You have the strength to work through these feelings, one breath at a time.",
        sad: "Be gentle with yourself. Healing happens in its own time, and you're on the right path.",
        stressed: "Remember that you've overcome challenges before. You have more resilience than you realize.",
        excited: "Channel this wonderful energy mindfully toward what matters most to you.",
        frustrated: "These feelings are temporary. Trust in your ability to find solutions and peace.",
        grateful: "Your grateful heart is a source of strength. Let this gratitude guide your decisions.",
        overwhelmed: "You don't have to carry everything at once. Take it one step at a time.",
        content: "This sense of balance is something to treasure and protect."
      },
      motivational: {
        happy: "Use this happiness as fuel to chase your biggest dreams and goals!",
        calm: "Your inner peace is your superpower. You can accomplish anything from this centered place!",
        anxious: "You're stronger than your anxiety. Every challenge is an opportunity to prove your resilience!",
        sad: "Your sensitivity is a strength. You're going to emerge from this even stronger than before!",
        stressed: "You're a warrior! Every stressful moment is building your capacity to handle anything life throws at you!",
        excited: "This energy is unstoppable! Channel it into creating the life you've always dreamed of!",
        frustrated: "Your frustration means you care deeply. That passion will drive you to amazing breakthroughs!",
        grateful: "Your gratitude is magnetic! This positive energy will attract even more good things into your life!",
        overwhelmed: "You're capable of more than you know! Break it down and tackle each piece with confidence!",
        content: "From this stable foundation, you can build anything you desire!"
      },
      reflective: {
        happy: "What patterns and choices led to this happiness? These insights can guide future decisions.",
        calm: "This calmness offers clarity. What wisdom is emerging from this peaceful state?",
        anxious: "What is your anxiety trying to teach you about your needs and boundaries?",
        sad: "Sadness often carries important messages about what we value. What is yours telling you?",
        stressed: "Consider what this stress reveals about your priorities and capacity for growth.",
        excited: "This excitement points to your authentic desires. What is it calling you toward?",
        frustrated: "Frustration often signals misalignment. What adjustments might bring more harmony?",
        grateful: "Your gratitude illuminates what truly matters. How can this guide your path forward?",
        overwhelmed: "What would it look like to honor your limits while still pursuing your goals?",
        content: "From this place of contentment, what gentle steps toward growth feel authentic?"
      }
    };

    return encouragements[preferredTone][dominantMood] || encouragements[preferredTone].content;
  }

  private static generateWeeklyExercise(dominantMood: MoodTag): string {
    const exercises = {
      happy: "This week, try the 'happiness ripple' exercise: each day, consciously share your positive energy with one person, whether through a kind word, smile, or small act of generosity.",
      calm: "Practice the 'calm anchor' technique: when you notice stress arising, take three deep breaths and remember this peaceful feeling. Let it be your refuge.",
      anxious: "Try the '5-4-3-2-1' grounding exercise when anxiety arises: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
      sad: "This week, practice self-compassion: when sadness arises, place your hand on your heart and speak to yourself as you would to a dear friend in need.",
      stressed: "Implement the 'stress inventory' practice: each day, write down your stressors and categorize them as 'can control' or 'cannot control.' Focus your energy only on what you can influence.",
      excited: "Channel your excitement with the 'intentional enthusiasm' exercise: choose one meaningful goal each day and pour your positive energy into making progress on it.",
      frustrated: "Try the 'frustration flip' technique: when frustration arises, ask yourself 'What is this situation trying to teach me?' and 'How can I use this energy constructively?'",
      grateful: "Deepen your gratitude practice by writing one detailed appreciation each day, focusing not just on what you're grateful for, but why it matters to you.",
      overwhelmed: "Practice the 'one thing' rule: when feeling overwhelmed, identify just one small action you can take right now, and focus only on that until it's complete.",
      content: "Use your contentment as a foundation for gentle growth: each day, notice one small area where you could expand your comfort zone without losing your sense of peace."
    };

    return exercises[dominantMood] || exercises.content;
  }

  private static extractKeyThemes(transcriptions: string[]): string[] {
    // Simple keyword extraction - in production, you might use NLP
    const commonThemes = ['work', 'family', 'relationships', 'health', 'stress', 'goals', 'sleep', 'exercise'];
    const text = transcriptions.join(' ').toLowerCase();
    
    return commonThemes.filter(theme => text.includes(theme));
  }

  private static getCurrentWeekNumber(): number {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil(dayOfYear / 7);
  }

  private static getWeekDateRange(): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Make Monday the start of week
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  }

  private static async saveVideoToDatabase(
    userId: string,
    week: number,
    tavusResponse: any,
    script: string,
    analysis: WeeklyMoodSummary
  ): Promise<TavusVideo> {
    const title = `Week ${week} Therapy Session - ${analysis.dominantMood.charAt(0).toUpperCase() + analysis.dominantMood.slice(1)} Focus`;
    
    try {
      const { data, error } = await supabase
        .from('tavus_videos')
        .insert({
          user_id: userId,
          week: week,
          tavus_video_url: tavusResponse.download_url || tavusResponse.stream_url || '',
          title: title
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving video to database:', error);
      throw error;
    }
  }
}