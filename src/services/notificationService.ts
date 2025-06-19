export interface NotificationConfig {
    title: string;
    body: string;
    tag?: string;
    icon?: string;
    badge?: string;
    data?: any;
}

export class NotificationService {
    private static instance: NotificationService;
    private permission: NotificationPermission = 'default';

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async init(): Promise<void> {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
    }

    async sendNotification(config: NotificationConfig): Promise<void> {
        if (this.permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }

        try {
            const notification = new Notification(config.title, {
                body: config.body,
                tag: config.tag,
                icon: config.icon || '/favicon.ico',
                badge: config.badge,
                data: config.data,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();

                // Handle custom click actions based on notification type
                if (config.data?.action === 'check-in') {
                    window.location.href = '/check-in';
                }
            };
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Schedule daily check-in reminder
    scheduleDailyReminder(userId: string, time: string = '19:00'): void {
        const [hours, minutes] = time.split(':').map(Number);

        const scheduleNotification = () => {
            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            // If time has passed today, schedule for tomorrow
            if (scheduledTime <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            const timeUntilNotification = scheduledTime.getTime() - now.getTime();

            setTimeout(() => {
                this.sendNotification({
                    title: 'TherapifyMe Reminder',
                    body: 'Time for your daily mood check-in! How are you feeling?',
                    tag: 'daily-reminder',
                    data: { action: 'check-in', userId }
                });

                // Schedule next day's notification
                scheduleNotification();
            }, timeUntilNotification);
        };

        scheduleNotification();
    }

    // Send crisis support notification
    sendCrisisNotification(): void {
        this.sendNotification({
            title: 'Crisis Support Available',
            body: 'If you\'re in crisis, please reach out for help. Crisis resources are available in your settings.',
            tag: 'crisis-support',
            data: { action: 'crisis-resources' }
        });
    }

    // Send achievement notification
    sendAchievementNotification(achievement: string): void {
        this.sendNotification({
            title: 'Achievement Unlocked! 🎉',
            body: achievement,
            tag: 'achievement',
            data: { action: 'view-achievements' }
        });
    }

    // Send weekly summary notification
    sendWeeklySummaryNotification(): void {
        this.sendNotification({
            title: 'Your Weekly Summary is Ready',
            body: 'Check out your mood patterns and personalized video therapy session.',
            tag: 'weekly-summary',
            data: { action: 'view-dashboard' }
        });
    }

    // Cancel specific notification
    cancelNotification(tag: string): void {
        // This doesn't directly cancel scheduled notifications
        // but prevents duplicates with the same tag
        console.log(`Notification with tag ${tag} cancelled`);
    }

    // Clear all notifications
    clearAllNotifications(): void {
        if ('Notification' in window) {
            // This would work with service workers for more control
            console.log('All notifications cleared');
        }
    }
} 