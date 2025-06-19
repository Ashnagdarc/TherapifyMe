import { Entry, User } from '../types/database';

interface OfflineEntry {
    tempId: string;
    entry: Partial<Entry>;
    audioBlob?: Blob;
    timestamp: number;
}

export const OfflineUtils = {
    // Check if user is online
    isOnline: (): boolean => {
        return navigator.onLine;
    },

    // Store entry for offline sync
    storeOfflineEntry: (entry: Partial<Entry>, audioBlob?: Blob): void => {
        const offlineEntries = OfflineUtils.getOfflineEntries();
        const tempId = `temp_${Date.now()}`;

        const offlineEntry: OfflineEntry = {
            tempId,
            entry,
            audioBlob,
            timestamp: Date.now()
        };

        offlineEntries.push(offlineEntry);
        localStorage.setItem('offline_entries', JSON.stringify(offlineEntries));

        // Store audio blob separately if exists
        if (audioBlob) {
            const reader = new FileReader();
            reader.onload = () => {
                localStorage.setItem(`audio_${tempId}`, reader.result as string);
            };
            reader.readAsDataURL(audioBlob);
        }

        console.log('Entry stored for offline sync');
    },

    // Get pending offline entries
    getOfflineEntries: (): OfflineEntry[] => {
        const stored = localStorage.getItem('offline_entries');
        return stored ? JSON.parse(stored) : [];
    },

    // Sync offline entries when online
    syncOfflineEntries: async (userId: string): Promise<void> => {
        if (!OfflineUtils.isOnline()) return;

        const offlineEntries = OfflineUtils.getOfflineEntries();
        if (offlineEntries.length === 0) return;

        console.log(`Syncing ${offlineEntries.length} offline entries...`);

        for (const offlineEntry of offlineEntries) {
            try {
                // Here you would implement the actual sync logic
                // This is a placeholder for the sync process
                console.log('Syncing entry:', offlineEntry.tempId);

                // Clean up after successful sync
                localStorage.removeItem(`audio_${offlineEntry.tempId}`);
            } catch (error) {
                console.error('Failed to sync entry:', offlineEntry.tempId, error);
                // Keep entry for retry
                continue;
            }
        }

        // Clear synced entries
        localStorage.removeItem('offline_entries');
    },

    // Cache user data for offline access
    cacheUserData: (user: User, entries: Entry[]): void => {
        const cacheData = {
            user,
            entries: entries.slice(0, 50), // Cache last 50 entries
            timestamp: Date.now()
        };

        localStorage.setItem('cached_user_data', JSON.stringify(cacheData));
    },

    // Get cached user data
    getCachedUserData: (): { user: User; entries: Entry[] } | null => {
        const cached = localStorage.getItem('cached_user_data');
        if (!cached) return null;

        const data = JSON.parse(cached);
        const oneDay = 24 * 60 * 60 * 1000;

        // Return cached data if less than 24 hours old
        if (Date.now() - data.timestamp < oneDay) {
            return { user: data.user, entries: data.entries };
        }

        return null;
    },

    // Show offline notification
    showOfflineNotification: (): void => {
        // This would integrate with your notification system
        console.log('App is offline. Your data will be synced when connection is restored.');
    },

    // Clean up old offline data
    cleanupOfflineData: (): void => {
        const offlineEntries = OfflineUtils.getOfflineEntries();
        const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);

        const validEntries = offlineEntries.filter(entry => {
            if (entry.timestamp < threeDaysAgo) {
                // Clean up old audio data
                localStorage.removeItem(`audio_${entry.tempId}`);
                return false;
            }
            return true;
        });

        localStorage.setItem('offline_entries', JSON.stringify(validEntries));
    },

    // Initialize offline support
    initializeOfflineSupport: (): void => {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('Connection restored');
            // Trigger sync when coming back online
            const userId = localStorage.getItem('current_user_id');
            if (userId) {
                OfflineUtils.syncOfflineEntries(userId);
            }
        });

        window.addEventListener('offline', () => {
            console.log('Connection lost');
            OfflineUtils.showOfflineNotification();
        });

        // Clean up old data on startup
        OfflineUtils.cleanupOfflineData();
    }
}; 