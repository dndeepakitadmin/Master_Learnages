
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://pjbegfgiofgpwmssdzfu.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqYmVnZmdpb2ZncHdtc3NkemZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTQ1MDksImV4cCI6MjA3OTIzMDUwOX0.t69vSDwiamt4YQSU4oIfz8bNvM8ijIAp_B4xM6YSBDo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'learnages-auth-v2', // Incremented key to force clear old tokens
  },
});

// Handle global auth errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
    // Session is likely dead or invalid
    if (!session) {
      localStorage.removeItem('learnages_user');
    }
  }
});

export const forceLogoutStorageClear = () => {
  try {
    localStorage.removeItem('learnages-auth-v2');
    localStorage.removeItem('learnages_user');
    Object.keys(localStorage).forEach((key) => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn('Storage cleanup failed:', err);
  }
};
