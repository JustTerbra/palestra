
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export function useUserData<T>(tableName: string, initialValue: T, userId: string | undefined): [T, (value: T | ((val: T) => T)) => void, boolean] {
  // 1. Initialize state from Local Storage immediately.
  // This prevents a "flash" of empty content and ensures the app works offline or on error.
  const [data, setData] = useState<T>(() => {
    try {
      const localItem = window.localStorage.getItem(`local_${tableName}`);
      return localItem ? JSON.parse(localItem) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Keep a ref to the current data so we can read it synchronously in saveData
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Loading is true only if we are actually going to fetch from DB
  const [loading, setLoading] = useState(false);

  // Initial Fetch
  useEffect(() => {
    // If no user, or it's a local-only user, or Supabase isn't configured, stop here.
    if (!userId || userId === 'local_user' || !isSupabaseConfigured()) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: dbData, error } = await supabase
          .from('user_data')
          .select('data_value')
          .eq('user_id', userId)
          .eq('data_key', tableName)
          .single();

        if (error) {
          // Handle specific Supabase errors
          // PGRST116: Row not found (normal for new user data)
          // 42P01: Relation/Table does not exist (schema not run yet)
          // Check message for schema cache error which happens when table is missing in client cache
          const isTableMissing = error.code === '42P01' || error.message?.includes('Could not find the table');

          if (error.code === 'PGRST116' || isTableMissing) {
            if (isTableMissing) {
              // Only warn once per session ideally, but for now just a subtle warn
              console.warn(`Table 'user_data' missing or not accessible. Falling back to local storage for ${tableName}.`);
            }
            // Do nothing else, keep initial/local value loaded in useState
          } else {
            // Log other actual errors
            console.error(`Error fetching ${tableName}:`, error.message || JSON.stringify(error));
          }
        } else if (dbData && dbData.data_value !== null) {
          // DB has data, update state and cache
          setData(dbData.data_value as T);
          window.localStorage.setItem(`local_${tableName}`, JSON.stringify(dbData.data_value));
        }
      } catch (err) {
        console.error("Unexpected error fetching data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, tableName]);

  // Save Function
  const saveData = useCallback(async (value: T | ((val: T) => T)) => {
    // Calculate new state synchronously using the ref
    const currentValue = dataRef.current;
    const newValue = value instanceof Function ? value(currentValue) : value;

    setData(newValue);

    // 1. Always save to Local Storage (Cache/Offline backup)
    try {
      if (newValue !== undefined) {
        window.localStorage.setItem(`local_${tableName}`, JSON.stringify(newValue));
      }
    } catch (e) {
      console.error("Local storage save error", e);
    }

    // 2. Save to Supabase if connected
    if (userId && userId !== 'local_user' && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('user_data')
          .upsert({
            user_id: userId,
            data_key: tableName,
            data_value: newValue ?? null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, data_key' });

        if (error) {
          // Silence missing table error on save as well
          const isTableMissing = error.code === '42P01' || error.message?.includes('Could not find the table');
          if (!isTableMissing) {
            console.error(`Error saving ${tableName}:`, error.message || JSON.stringify(error));
          }
        }
      } catch (err) {
        console.error("Supabase write error", err);
      }
    }
  }, [userId, tableName]);

  return [data, saveData, loading];
}
