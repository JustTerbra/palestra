
import { createClient } from '@supabase/supabase-js';

// Configured with provided credentials
const supabaseUrl: string = "https://coiwbffihsbzbggcrsvp.supabase.co";
const supabaseAnonKey: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvaXdiZmZpaHNiemJnZ2Nyc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzg4MzUsImV4cCI6MjA3OTMxNDgzNX0.BJ9FWmxJsvoE0nnL00k_-bn_MBfPLWl8PiG6G1Zau9E";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
    return supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Helper to transform data for the frontend
export const parseJsonData = (data: any, fallback: any) => {
    if (!data) return fallback;
    return data;
};
