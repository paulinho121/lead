
import { supabase } from './supabase';

/**
 * AI Bridge Service
 * 
 * This service acts as a secure bridge between the client and AI models 
 * via Supabase Edge Functions, keeping API keys hidden from the frontend.
 */
export const aiBridge = {
    async callAiFunction(action: string, payload: any) {
        if (!supabase) throw new Error('Supabase client not initialized');

        try {
            const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                body: { action, ...payload }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`AI Bridge Error [${action}]:`, error);
            throw error;
        }
    }
};
