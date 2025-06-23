import { supabase } from '../lib/supabase';
import { Entry, User } from '../types/database';

export interface MoodTrendData {
    date: string;
    mood: string;
    intensity: number;
    count: number;
}

export interface UserAnalytics {
    totalEntries: number;
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
    dominantMood: string;
    moodTrend: 'improving' | 'stable' | 'declining';
    averageMoodScore: number;
    lastUpdated: string;
}

export interface DashboardData {
    moodTrends: MoodTrendData[];
    userAnalytics: UserAnalytics;
    recentEntries: MinimalEntry[];
    streakInfo: {
        current: number;
        longest: number;
        lastCheckIn: string | null;
    };
}

export interface MinimalEntry {
    id: string;
    mood_tag: string;
    created_at: string;
    text_summary: string;
    transcription: string;
}

export class AnalyticsService {
    private static instance: AnalyticsService;
    private cache = new Map<string, { data: any; timestamp: number; expiry: number }>();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    /**
     * Get cached data or fetch if expired
     */
    private async getCachedData<T>(
        key: string,
        fetcher: () => Promise<T>,
        customTTL?: number
    ): Promise<T> {
        const cached = this.cache.get(key);
        const now = Date.now();

        if (cached && now < cached.expiry) {
            return cached.data;
        }

        const data = await fetcher();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiry: now + (customTTL || this.CACHE_DURATION)
        });

        return data;
    }

    /**
     * Get comprehensive dashboard data with caching
     */
    async getDashboardData(userId: string): Promise<DashboardData> {
        const cacheKey = `dashboard_${userId}`;

        return this.getCachedData(cacheKey, async () => {
            try {
                console.log('AnalyticsService: Fetching dashboard data for user:', userId);

                const [moodTrends, userAnalytics, recentEntries, streakInfo] = await Promise.allSettled([
                    this.getMoodTrends(userId),
                    this.getUserAnalytics(userId),
                    this.getRecentEntries(userId),
                    this.getStreakInfo(userId)
                ]);

                return {
                    moodTrends: moodTrends.status === 'fulfilled' ? moodTrends.value : this.getDefaultMoodTrends(),
                    userAnalytics: userAnalytics.status === 'fulfilled' ? userAnalytics.value : this.getDefaultUserAnalytics(),
                    recentEntries: recentEntries.status === 'fulfilled' ? recentEntries.value : [],
                    streakInfo: streakInfo.status === 'fulfilled' ? streakInfo.value : { current: 0, longest: 0, lastCheckIn: null }
                };
            } catch (error) {
                console.error('AnalyticsService: Error in getDashboardData:', error);
                // Return default data if everything fails
                return {
                    moodTrends: this.getDefaultMoodTrends(),
                    userAnalytics: this.getDefaultUserAnalytics(),
                    recentEntries: [],
                    streakInfo: { current: 0, longest: 0, lastCheckIn: null }
                };
            }
        });
    }

    /**
     * Get optimized mood trends for last 7 days
     */
    private async getMoodTrends(userId: string): Promise<MoodTrendData[]> {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Use the user_sessions table for pre-calculated daily data
            const { data: sessionData, error: sessionError } = await supabase
                .from('user_sessions')
                .select('session_date, dominant_mood, check_ins_count, mood_score')
                .eq('user_id', userId)
                .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])
                .order('session_date', { ascending: true });

            if (!sessionError && sessionData && sessionData.length > 0) {
                // Use pre-calculated session data
                return sessionData.map(session => ({
                    date: session.session_date,
                    mood: session.dominant_mood || 'content',
                    intensity: session.mood_score || 5,
                    count: session.check_ins_count || 0
                }));
            }

            // Fallback to real-time calculation if session data not available
            const { data: entries, error } = await supabase
                .from('entries')
                .select('created_at, mood_tag')
                .eq('user_id', userId)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (error || !entries) {
                console.warn('AnalyticsService: Entries query failed, using defaults:', error);
                return this.getDefaultMoodTrends();
            }

            // Group by date and calculate trends
            const trendMap = new Map<string, { moods: string[]; count: number }>();

            entries.forEach(entry => {
                const date = entry.created_at.split('T')[0];
                if (!trendMap.has(date)) {
                    trendMap.set(date, { moods: [], count: 0 });
                }
                const dayData = trendMap.get(date)!;
                dayData.moods.push(entry.mood_tag);
                dayData.count++;
            });

            // Convert to trend data
            const trends: MoodTrendData[] = [];
            for (const [date, data] of trendMap) {
                const dominantMood = this.getDominantMood(data.moods);
                const intensity = this.calculateMoodIntensity(dominantMood, data.count);

                trends.push({
                    date,
                    mood: dominantMood,
                    intensity,
                    count: data.count
                });
            }

            return trends.length > 0 ? trends : this.getDefaultMoodTrends();
        } catch (error) {
            console.error('AnalyticsService: Error in getMoodTrends:', error);
            return this.getDefaultMoodTrends();
        }
    }

    /**
     * Get comprehensive user analytics
     */
    private async getUserAnalytics(userId: string): Promise<UserAnalytics> {
        try {
            const [entriesCount, streakData, moodDistribution] = await Promise.allSettled([
                this.getTotalEntries(userId),
                this.getStreakInfo(userId),
                this.getMoodDistribution(userId)
            ]);

            const activeDays = await this.getActiveDaysCount(userId).catch(() => 0);
            const averageMoodScore = await this.getAverageMoodScore(userId).catch(() => 5);
            const moodTrend = await this.calculateMoodTrend(userId).catch(() => 'stable' as const);

            return {
                totalEntries: entriesCount.status === 'fulfilled' ? entriesCount.value : 0,
                activeDays,
                currentStreak: streakData.status === 'fulfilled' ? streakData.value.current : 0,
                longestStreak: streakData.status === 'fulfilled' ? streakData.value.longest : 0,
                dominantMood: moodDistribution.status === 'fulfilled' ? moodDistribution.value.dominant : 'content',
                moodTrend,
                averageMoodScore,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('AnalyticsService: Error in getUserAnalytics:', error);
            return this.getDefaultUserAnalytics();
        }
    }

    /**
     * Get recent entries with minimal data
     */
    private async getRecentEntries(userId: string): Promise<MinimalEntry[]> {
        try {
            const { data, error } = await supabase
                .from('entries')
                .select('id, mood_tag, created_at, text_summary, transcription')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.warn('AnalyticsService: Recent entries query failed:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('AnalyticsService: Error in getRecentEntries:', error);
            return [];
        }
    }

    /**
     * Get optimized streak information
     */
    private async getStreakInfo(userId: string): Promise<{
        current: number;
        longest: number;
        lastCheckIn: string | null;
    }> {
        try {
            // Try to get from user_sessions first (pre-calculated)
            const { data: sessionData } = await supabase
                .from('user_sessions')
                .select('streak_days, session_date')
                .eq('user_id', userId)
                .order('session_date', { ascending: false })
                .limit(1);

            if (sessionData && sessionData.length > 0) {
                const latestSession = sessionData[0];
                return {
                    current: latestSession.streak_days || 0,
                    longest: latestSession.streak_days || 0, // We'd need to calculate this separately
                    lastCheckIn: latestSession.session_date
                };
            }

            // Fallback to real-time calculation
            const { data: entries } = await supabase
                .from('entries')
                .select('created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!entries || entries.length === 0) {
                return { current: 0, longest: 0, lastCheckIn: null };
            }

            const dates = entries.map(entry =>
                new Date(entry.created_at).toDateString()
            );

            const uniqueDates = [...new Set(dates)].sort();

            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;

            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

            // Calculate current streak
            if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
                let checkDate = new Date();
                if (!uniqueDates.includes(today)) {
                    checkDate.setDate(checkDate.getDate() - 1);
                }

                while (uniqueDates.includes(checkDate.toDateString())) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            }

            // Calculate longest streak
            for (let i = 0; i < uniqueDates.length; i++) {
                if (i === 0) {
                    tempStreak = 1;
                } else {
                    const current = new Date(uniqueDates[i]);
                    const previous = new Date(uniqueDates[i - 1]);
                    const diffTime = current.getTime() - previous.getTime();
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);

                    if (diffDays === 1) {
                        tempStreak++;
                    } else {
                        longestStreak = Math.max(longestStreak, tempStreak);
                        tempStreak = 1;
                    }
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);

            return {
                current: currentStreak,
                longest: longestStreak,
                lastCheckIn: entries[0]?.created_at || null
            };
        } catch (error) {
            console.error('AnalyticsService: Error in getStreakInfo:', error);
            return { current: 0, longest: 0, lastCheckIn: null };
        }
    }

    /**
     * Update user session analytics (called after new entry)
     */
    async updateUserSessionAnalytics(userId: string, entryData: {
        mood: string;
        date: string;
    }): Promise<void> {
        try {
            const moodScore = this.getMoodScore(entryData.mood);

            // Update or insert session data
            const { error } = await supabase
                .from('user_sessions')
                .upsert({
                    user_id: userId,
                    session_date: entryData.date,
                    check_ins_count: 1,
                    dominant_mood: entryData.mood,
                    mood_score: moodScore,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,session_date',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error('Error updating session analytics:', error);
            }

            // Invalidate cache
            this.invalidateUserCache(userId);
        } catch (error) {
            console.error('Error in updateUserSessionAnalytics:', error);
        }
    }

    /**
     * Clear cache for a specific user
     */
    invalidateUserCache(userId: string): void {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(userId)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Helper methods
     */
    private async getTotalEntries(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        return error ? 0 : count || 0;
    }

    private async getActiveDaysCount(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('entries')
            .select('created_at')
            .eq('user_id', userId);

        if (error || !data) return 0;

        const uniqueDates = new Set(
            data.map(entry => entry.created_at.split('T')[0])
        );

        return uniqueDates.size;
    }

    private async getMoodDistribution(userId: string): Promise<{ dominant: string }> {
        const { data, error } = await supabase
            .from('entries')
            .select('mood_tag')
            .eq('user_id', userId);

        if (error || !data || data.length === 0) {
            return { dominant: 'content' };
        }

        const moodCounts = data.reduce((acc, entry) => {
            acc[entry.mood_tag] = (acc[entry.mood_tag] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const dominant = Object.entries(moodCounts)
            .sort(([, a], [, b]) => b - a)[0][0];

        return { dominant };
    }

    private async getAverageMoodScore(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('entries')
            .select('mood_tag')
            .eq('user_id', userId);

        if (error || !data || data.length === 0) return 5;

        const totalScore = data.reduce((sum, entry) => {
            return sum + this.getMoodScore(entry.mood_tag);
        }, 0);

        return Math.round((totalScore / data.length) * 10) / 10;
    }

    private async calculateMoodTrend(userId: string): Promise<'improving' | 'stable' | 'declining'> {
        const { data, error } = await supabase
            .from('entries')
            .select('mood_tag, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(14); // Last 2 weeks

        if (error || !data || data.length < 7) return 'stable';

        const recent = data.slice(0, 7);
        const previous = data.slice(7, 14);

        const recentAvg = recent.reduce((sum, entry) =>
            sum + this.getMoodScore(entry.mood_tag), 0) / recent.length;

        const previousAvg = previous.length > 0
            ? previous.reduce((sum, entry) => sum + this.getMoodScore(entry.mood_tag), 0) / previous.length
            : recentAvg;

        const difference = recentAvg - previousAvg;

        if (difference > 0.5) return 'improving';
        if (difference < -0.5) return 'declining';
        return 'stable';
    }

    private getMoodScore(mood: string): number {
        const moodScores: Record<string, number> = {
            'sad': 2,
            'anxious': 3,
            'frustrated': 3,
            'overwhelmed': 2,
            'stressed': 3,
            'content': 5,
            'calm': 6,
            'happy': 8,
            'excited': 9,
            'grateful': 9
        };

        return moodScores[mood] || 5;
    }

    private getDominantMood(moods: string[]): string {
        const moodCounts = moods.reduce((acc, mood) => {
            acc[mood] = (acc[mood] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(moodCounts)
            .sort(([, a], [, b]) => b - a)[0][0] || 'content';
    }

    private calculateMoodIntensity(mood: string, count: number): number {
        const baseIntensity = this.getMoodScore(mood);
        const countMultiplier = Math.min(count / 3, 2); // Max 2x for high activity
        return Math.min(Math.round(baseIntensity * countMultiplier), 10);
    }

    private getDefaultMoodTrends(): MoodTrendData[] {
        const trends: MoodTrendData[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            trends.push({
                date: date.toISOString().split('T')[0],
                mood: 'content',
                intensity: 0,
                count: 0
            });
        }
        return trends;
    }

    /**
     * Get default user analytics
     */
    private getDefaultUserAnalytics(): UserAnalytics {
        return {
            totalEntries: 0,
            activeDays: 0,
            currentStreak: 0,
            longestStreak: 0,
            dominantMood: 'content',
            moodTrend: 'stable',
            averageMoodScore: 5,
            lastUpdated: new Date().toISOString()
        };
    }
} 