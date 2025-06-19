import { supabase } from '../lib/supabase';

export const StorageUtils = {
    // Compress audio before upload
    compressAudio: async (audioBlob: Blob): Promise<Blob> => {
        // For now, return original blob
        // In production, you'd use Web Audio API to compress
        return audioBlob;
    },

    // Clean up orphaned audio files
    cleanupOrphanedFiles: async (userId: string): Promise<void> => {
        try {
            // Get all files for user
            const { data: files, error: listError } = await supabase.storage
                .from('voice-recordings')
                .list(userId);

            if (listError) throw listError;

            if (!files || files.length === 0) return;

            // Get all referenced files from database
            const { data: entries, error: dbError } = await supabase
                .from('entries')
                .select('voice_note_url, ai_response_url')
                .eq('user_id', userId);

            if (dbError) throw dbError;

            const referencedFiles = new Set<string>();
            entries?.forEach(entry => {
                if (entry.voice_note_url) {
                    const fileName = entry.voice_note_url.split('/').pop();
                    if (fileName) referencedFiles.add(fileName);
                }
                if (entry.ai_response_url) {
                    const fileName = entry.ai_response_url.split('/').pop();
                    if (fileName) referencedFiles.add(fileName);
                }
            });

            // Delete unreferenced files older than 7 days
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const filesToDelete = files.filter(file => {
                const isReferenced = referencedFiles.has(file.name);
                const isOld = new Date(file.updated_at || file.created_at) < sevenDaysAgo;
                return !isReferenced && isOld;
            });

            if (filesToDelete.length > 0) {
                const fileNames = filesToDelete.map(f => `${userId}/${f.name}`);
                const { error: deleteError } = await supabase.storage
                    .from('voice-recordings')
                    .remove(fileNames);

                if (deleteError) {
                    console.error('Error deleting orphaned files:', deleteError);
                } else {
                    console.log(`Cleaned up ${filesToDelete.length} orphaned files`);
                }
            }
        } catch (error) {
            console.error('Error in cleanup process:', error);
        }
    },

    // Get storage usage for user
    getStorageUsage: async (userId: string): Promise<{ fileCount: number; totalSize: number }> => {
        try {
            const { data: files, error } = await supabase.storage
                .from('voice-recordings')
                .list(userId);

            if (error) throw error;

            if (!files || files.length === 0) {
                return { fileCount: 0, totalSize: 0 };
            }

            const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

            return {
                fileCount: files.length,
                totalSize
            };
        } catch (error) {
            console.error('Error getting storage usage:', error);
            return { fileCount: 0, totalSize: 0 };
        }
    },

    // Format file size for display
    formatFileSize: (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Validate file type and size
    validateFile: (file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } => {
        const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm'];

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Invalid file type. Please upload an audio file.' };
        }

        const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
        if (file.size > maxSize) {
            return { valid: false, error: `File too large. Maximum size is ${maxSizeMB}MB.` };
        }

        return { valid: true };
    }
}; 