import { supabase } from '../lib/supabase';
import { ValidationUtils } from '../utils/validation';

export interface CrisisResource {
    id: string;
    resource_type: 'hotline' | 'local_therapist' | 'emergency_contact' | 'crisis_center' | 'online_chat';
    resource_name: string;
    resource_data: {
        phone?: string;
        website?: string;
        description: string;
        availability: string;
        location?: string;
    };
    priority_level: number;
    is_active: boolean;
}

export interface CrisisFlag {
    id: string;
    severity_score: number;
    keywords_detected: string[];
    context_snippet: string;
    ai_assessment: string;
    flagged_at: string;
}

export class CrisisDetectionService {
    private static instance: CrisisDetectionService;

    static getInstance(): CrisisDetectionService {
        if (!CrisisDetectionService.instance) {
            CrisisDetectionService.instance = new CrisisDetectionService();
        }
        return CrisisDetectionService.instance;
    }

    /**
     * Check if text contains crisis indicators
     */
    async analyzeText(text: string, userId: string): Promise<{
        hasCrisisIndicators: boolean;
        severity: number;
        keywords: string[];
        shouldShowResources: boolean;
    }> {
        try {
            const result = ValidationUtils.detectCrisisKeywords(text);

            // If crisis indicators found, log for monitoring
            if (result.hasCrisisContent && result.severity >= 3) {
                await this.logCrisisFlag(userId, text, result.keywords, result.severity);
            }

            return {
                hasCrisisIndicators: result.hasCrisisContent,
                severity: result.severity,
                keywords: result.keywords,
                shouldShowResources: result.severity >= 2 // Show resources for moderate+ severity
            };
        } catch (error) {
            console.error('Error analyzing text for crisis content:', error);
            return {
                hasCrisisIndicators: false,
                severity: 0,
                keywords: [],
                shouldShowResources: false
            };
        }
    }

    /**
     * Get crisis resources for a user
     */
    async getCrisisResources(userId: string): Promise<CrisisResource[]> {
        try {
            const { data, error } = await supabase
                .from('crisis_resources')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('priority_level', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching crisis resources:', error);
            // Return default resources if database fails
            return this.getDefaultCrisisResources();
        }
    }

    /**
     * Add a crisis resource for a user
     */
    async addCrisisResource(
        userId: string,
        resource: Omit<CrisisResource, 'id'>
    ): Promise<CrisisResource | null> {
        try {
            const { data, error } = await supabase
                .from('crisis_resources')
                .insert({
                    user_id: userId,
                    ...resource
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding crisis resource:', error);
            return null;
        }
    }

    /**
     * Get user's crisis flags for monitoring
     */
    async getUserCrisisFlags(userId: string, limit = 10): Promise<CrisisFlag[]> {
        try {
            const { data, error } = await supabase
                .from('crisis_flags')
                .select('*')
                .eq('user_id', userId)
                .order('flagged_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching crisis flags:', error);
            return [];
        }
    }

    /**
     * Show crisis intervention modal with resources
     */
    showCrisisInterventionModal(severity: number, resources: CrisisResource[]): void {
        // Create modal dynamically
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-gray-900">Support Resources Available</h2>
        </div>
        
        <p class="text-gray-600 mb-6">
          ${severity >= 7
                ? "We're concerned about you and want to help. Please consider reaching out to these resources."
                : "If you're going through a difficult time, these resources are here to help."
            }
        </p>
        
        <div class="space-y-3 mb-6">
          ${resources.slice(0, 3).map(resource => `
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="font-medium text-gray-900 mb-2">${resource.resource_name}</h3>
              <p class="text-sm text-gray-600 mb-2">${resource.resource_data.description}</p>
              ${resource.resource_data.phone ? `
                <div class="flex items-center text-sm">
                  <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <a href="tel:${resource.resource_data.phone}" class="text-blue-600 hover:text-blue-800">
                    ${resource.resource_data.phone}
                  </a>
                </div>
              ` : ''}
              ${resource.resource_data.website ? `
                <div class="flex items-center text-sm mt-1">
                  <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
                  </svg>
                  <a href="${resource.resource_data.website}" target="_blank" class="text-blue-600 hover:text-blue-800">
                    Visit Website
                  </a>
                </div>
              ` : ''}
              <p class="text-xs text-gray-500 mt-2">${resource.resource_data.availability}</p>
            </div>
          `).join('')}
        </div>
        
        ${severity >= 8 ? `
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 class="font-medium text-red-800 mb-2">Emergency Situations</h3>
            <p class="text-sm text-red-700 mb-3">If you're in immediate danger or having thoughts of self-harm:</p>
            <div class="space-y-2">
              <a href="tel:911" class="block bg-red-600 text-white text-center py-2 px-4 rounded font-medium hover:bg-red-700">
                Call 911 (Emergency)
              </a>
              <a href="tel:988" class="block bg-blue-600 text-white text-center py-2 px-4 rounded font-medium hover:bg-blue-700">
                Call 988 (Crisis Lifeline)
              </a>
            </div>
          </div>
        ` : ''}
        
        <div class="flex gap-3">
          <button id="crisis-modal-close" class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded font-medium hover:bg-gray-200">
            I'm okay, continue
          </button>
          <button id="crisis-modal-help" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700">
            Get help now
          </button>
        </div>
      </div>
    `;

        // Add event listeners
        const closeBtn = modal.querySelector('#crisis-modal-close');
        const helpBtn = modal.querySelector('#crisis-modal-help');

        closeBtn?.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        helpBtn?.addEventListener('click', () => {
            window.open('tel:988', '_self');
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        document.body.appendChild(modal);
    }

    /**
     * Log crisis flag to database
     */
    private async logCrisisFlag(
        userId: string,
        text: string,
        keywords: string[],
        severity: number
    ): Promise<void> {
        try {
            // Don't log if we're in development mode
            if (process.env.NODE_ENV === 'development') {
                console.warn('Crisis indicators detected:', { keywords, severity, context: text.substring(0, 100) });
                return;
            }

            await supabase
                .from('crisis_flags')
                .insert({
                    user_id: userId,
                    severity_score: severity,
                    keywords_detected: keywords,
                    context_snippet: text.substring(0, 200),
                    ai_assessment: `Automatic detection - severity ${severity}/10`
                });
        } catch (error) {
            console.error('Error logging crisis flag:', error);
        }
    }

    /**
     * Get default crisis resources when database is unavailable
     */
    private getDefaultCrisisResources(): CrisisResource[] {
        return [
            {
                id: 'default-1',
                resource_type: 'hotline',
                resource_name: 'National Suicide Prevention Lifeline',
                resource_data: {
                    phone: '988',
                    website: 'https://suicidepreventionlifeline.org',
                    description: '24/7 crisis support and prevention',
                    availability: '24/7'
                },
                priority_level: 5,
                is_active: true
            },
            {
                id: 'default-2',
                resource_type: 'online_chat',
                resource_name: 'Crisis Text Line',
                resource_data: {
                    phone: 'Text HOME to 741741',
                    website: 'https://www.crisistextline.org',
                    description: 'Text-based crisis counseling',
                    availability: '24/7'
                },
                priority_level: 4,
                is_active: true
            },
            {
                id: 'default-3',
                resource_type: 'hotline',
                resource_name: 'SAMHSA Helpline',
                resource_data: {
                    phone: '1-800-662-4357',
                    website: 'https://www.samhsa.gov/find-help/national-helpline',
                    description: 'Mental health and substance abuse support',
                    availability: '24/7'
                },
                priority_level: 3,
                is_active: true
            }
        ];
    }
} 