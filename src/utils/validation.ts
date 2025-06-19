export const ValidationUtils = {
    // Email validation
    isValidEmail: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    },

    // Password strength validation
    isValidPassword: (password: string): { valid: boolean; message?: string } => {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return { valid: false, message: 'Password must contain uppercase, lowercase, and number' };
        }
        return { valid: true };
    },

    // Name validation
    isValidName: (name: string): boolean => {
        return name.trim().length >= 2 && name.trim().length <= 50;
    },

    // Sanitize user input to prevent XSS
    sanitizeText: (text: string): string => {
        return text
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .trim();
    },

    // Check for crisis keywords in user input
    detectCrisisKeywords: (text: string): { hasCrisisKeywords: boolean; keywords: string[] } => {
        const crisisKeywords = [
            'suicide', 'kill myself', 'end it all', 'want to die', 'self harm',
            'cutting', 'overdose', 'can\'t go on', 'hopeless', 'worthless'
        ];

        const lowerText = text.toLowerCase();
        const foundKeywords = crisisKeywords.filter(keyword =>
            lowerText.includes(keyword)
        );

        return {
            hasCrisisKeywords: foundKeywords.length > 0,
            keywords: foundKeywords
        };
    },

    // Rate limiting helper
    isRateLimited: (userId: string, action: string, limit: number = 5): boolean => {
        const key = `rate_limit_${userId}_${action}`;
        const stored = localStorage.getItem(key);

        if (!stored) {
            localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: Date.now() }));
            return false;
        }

        const data = JSON.parse(stored);
        const oneHour = 60 * 60 * 1000;

        if (Date.now() - data.timestamp > oneHour) {
            localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: Date.now() }));
            return false;
        }

        if (data.count >= limit) {
            return true;
        }

        data.count++;
        localStorage.setItem(key, JSON.stringify(data));
        return false;
    }
}; 