
import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------
// 🟢 ENV CONSTANTS — Supabase Project Keys
// ----------------------------------------------------------
const SUPABASE_URL = 'https://pjbegfgiofgpwmssdzfu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqYmVnZmdpb2ZncHdtc3NkemZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTQ1MDksImV4cCI6MjA3OTIzMDUwOX0.t69vSDwiamt4YQSU4oIfz8bNvM8ijIAp_B4xM6YSBDo';

// ----------------------------------------------------------
// 🟣 SUPABASE CLIENT
// ----------------------------------------------------------
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'learnages-auth-v1', // Bumped version to clear corrupted local storage
  },
});

// ----------------------------------------------------------
// 🔴 FORCE LOGOUT CLEANUP — Removes ALL Supabase Auth Tokens
// ----------------------------------------------------------
export const forceLogoutStorageClear = () => {
  try {
    localStorage.removeItem('learnages-auth-v1');
    localStorage.removeItem('learnages_user');
    
    // Clear any generic keys
    Object.keys(localStorage).forEach((key) => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

  } catch (err) {
    console.warn('Storage cleanup failed:', err);
  }
};

// ----------------------------------------------------------
// 🔵 REAL DB CONNECTION CHECK
// ----------------------------------------------------------
export const isDbConnected = async (): Promise<boolean> => {
  try {
    // Avoid querying specific tables that might have RLS for unauthenticated users.
    // We just check if the Supabase URL is reachable.
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: { 'apikey': SUPABASE_ANON_KEY }
    });
    return response.ok || response.status === 401; // 401 still means project is up
  } catch {
    return false;
  }
};
