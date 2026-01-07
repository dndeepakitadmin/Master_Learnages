
// FINAL USER SERVICE — Usage Tracking & Auto-Learning Global Dictionary

import { UserProfile, PaymentHistoryItem, SupportTicket, LessonItem } from '../types';
import { SUBSCRIPTION_DAYS, LIMIT_CHARS, LIMIT_CHATS, LIMIT_QUIZZES } from '../constants';
import { supabase, forceLogoutStorageClear } from '../lib/supabaseClient';

export const getModuleKey = (source: string, target: string, type: 'chars' | 'chats' | 'quizzes' | 'score' = 'chars') => {
  return `${source}-${target}-${type}`;
};

export const sanitizeForCache = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()!?]/g, "") 
    .replace(/\s{2,}/g, " ");
};

export const userService = {

  formatPhone(phone: string, countryCode: string = '+91'): string {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (countryCode === '+91' && digits.length > 10) {
      digits = digits.slice(-10);
    }
    return `${countryCode}${digits}`;
  },

  async getEmailByPhone(phoneInput: string, countryCode: string = '+91'): Promise<string | null> {
    const cleanInput = phoneInput.replace(/\D/g, '');
    if (cleanInput.length < 10) return null;
    const last10 = cleanInput.slice(-10);
    try {
      const { data } = await supabase.from('profiles').select('email').ilike('phone', `%${last10}`).maybeSingle();
      return data?.email || null;
    } catch { return null; }
  },

  async checkPhoneExists(phoneInput: string, countryCode: string = '+91'): Promise<boolean> {
    const cleanInput = phoneInput.replace(/\D/g, '');
    if (cleanInput.length < 10) return false;
    const last10 = cleanInput.slice(-10);
    try {
        const { data } = await supabase.from('profiles').select('id').ilike('phone', `%${last10}`).maybeSingle();
        return !!data;
    } catch { return false; }
  },

  maskEmail(email: string): string {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    return name.length > 2 ? `${name[0]}***${name[name.length-1]}@${domain}` : `${name[0]}**@${domain}`;
  },

  async createProfile(userId: string, email: string, phone: string, name: string) {
    const { error } = await supabase.from('profiles').upsert({ id: userId, email: email || '', phone: phone || '', name: name || '' }, { onConflict: 'id' });
    if (error) throw error;
  },

  async getCurrentUser(): Promise<UserProfile> {
    const localStr = localStorage.getItem('learnages_user');
    let user: UserProfile = localStr ? JSON.parse(localStr) : { name: 'Learner', email: '', phone: '', isAuthenticated: false, subscriptions: {}, usage: {} };

    try {
        const { data, error } = await (supabase.auth as any).getSession();
        if (error) {
           user.isAuthenticated = false;
           return user;
        }

        const session = data?.session;
        const authUser = session?.user;

        if (authUser) {
          user.isAuthenticated = true;
          user.email = authUser.email ?? '';
          user.id = authUser.id;

          try {
            const [profileRes, usageRes, subRes] = await Promise.allSettled([
                supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
                supabase.from('usage_logs').select('module, usage_count').eq('user_id', user.id),
                supabase.from('subscriptions').select('module, expiry').eq('user_id', user.id)
            ]);

            if (profileRes.status === 'fulfilled' && profileRes.value.data) {
                user.name = profileRes.value.data.name || user.name;
                user.phone = profileRes.value.data.phone || user.phone;
            }
            if (usageRes.status === 'fulfilled' && usageRes.value.data) {
                user.usage = {};
                usageRes.value.data.forEach((row: any) => { user.usage[row.module] = row.usage_count; });
            }
            if (subRes.status === 'fulfilled' && subRes.value.data) {
                user.subscriptions = {};
                subRes.value.data.forEach((row: any) => {
                    const exp = new Date(row.expiry).getTime();
                    if (exp > Date.now()) user.subscriptions[row.module] = exp;
                });
            }
          } catch { }

          localStorage.setItem('learnages_user', JSON.stringify(user));
        } else {
          user.isAuthenticated = false;
        }
    } catch { }
    
    return user;
  },

  async getUserLessons(sourceLang: string, targetLang: string): Promise<LessonItem[]> {
    // Get all global community phrases for this language pair
    const { data, error } = await supabase.from('user_lessons')
      .select('*')
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .eq('is_global', true)
      .order('created_at', { ascending: false });

    if (error) return [];
    
    return (data || []).map(item => ({
       source_native: item.original,
       source_transliteration: '',
       target_native: item.translated,
       target_transliteration: '',
       target_in_source_script: item.bridge,
       meaning_english: '',
       note: item.category || 'Community Match',
       is_custom: true
    }));
  },

  /**
   * 🚀 AUTO-LEARNING SAVE
   * Matches the exact schema from your screenshot.
   */
  async saveUserLesson(original: string, translated: string, bridge: string, sourceLang: string, targetLang: string) {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Auto-Learning Save: Marking as global makes it available for ALL users instantly
    const { error } = await supabase.from('user_lessons').insert({
      user_id: session?.user?.id || null, // Allow NULL for guests
      source_lang: sourceLang,
      target_lang: targetLang,
      original: original,
      translated: translated,
      bridge: bridge,
      is_global: true,
      tier: 'basic',
      category: 'General'
    });

    if (error) {
        // Error code 23505 is unique violation (already exists), which is fine for auto-save
        if (error.code !== '23505') {
            console.error("DB Save Error:", error.message);
        }
    }
  },

  async getModuleStatus(source: string, target: string) {
    const user = await this.getCurrentUser();
    const proKey = `${source}-${target}`;
    const expiry = user.subscriptions?.[proKey];
    const isPro = expiry ? expiry > Date.now() : false;

    return {
      isPro,
      usageChars: user.usage?.[getModuleKey(source, target, 'chars')] || 0,
      usageChats: user.usage?.[getModuleKey(source, target, 'chats')] || 0,
      usageQuizzes: user.usage?.[getModuleKey(source, target, 'quizzes')] || 0,
      limitChars: LIMIT_CHARS,
      limitChats: LIMIT_CHATS,
      limitQuizzes: LIMIT_QUIZZES,
      expiry,
      isAuthenticated: user.isAuthenticated
    };
  },

  async incrementUsage(source: string, target: string, amount: number, type: 'chars' | 'chats' | 'quizzes' = 'chars') {
    const user = await this.getCurrentUser();
    const key = getModuleKey(source, target, type);
    
    if (!user.usage) user.usage = {};
    const newUsage = (user.usage[key] || 0) + amount;
    user.usage[key] = newUsage;
    localStorage.setItem('learnages_user', JSON.stringify(user));

    if (user.isAuthenticated && user.id) {
      try {
        await supabase.from('usage_logs').upsert({ user_id: user.id, module: key, usage_count: newUsage }, { onConflict: 'user_id,module' });
      } catch { }
    }
    return newUsage;
  },

  async getQuizScore(source: string, target: string): Promise<number> {
    const user = await this.getCurrentUser();
    return user.usage?.[getModuleKey(source, target, 'score')] || 0;
  },

  async updateQuizScore(source: string, target: string, score: number): Promise<number> {
    const user = await this.getCurrentUser();
    const key = getModuleKey(source, target, 'score');
    if (!user.usage) user.usage = {};
    const newScore = (user.usage[key] || 0) + score;
    user.usage[key] = newScore;
    localStorage.setItem('learnages_user', JSON.stringify(user));

    if (user.isAuthenticated && user.id) {
      try {
        await supabase.from('usage_logs').upsert({ user_id: user.id, module: key, usage_count: newScore }, { onConflict: 'user_id,module' });
      } catch { }
    }
    return newScore;
  },

  async logoutUser() {
    localStorage.removeItem('learnages_user');
    forceLogoutStorageClear(); 
    try { await (supabase.auth as any).signOut(); } catch { }
    window.location.reload();
  },

  async subscribeToModule(source: string, target: string, days: number = SUBSCRIPTION_DAYS) {
    const user = await this.getCurrentUser();
    const key1 = `${source}-${target}`;
    const key2 = `${target}-${source}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    const ts = expiryDate.getTime();

    // 1. Optimistic Update (Local)
    if (!user.subscriptions) user.subscriptions = {};
    user.subscriptions[key1] = ts;
    user.subscriptions[key2] = ts;
    localStorage.setItem('learnages_user', JSON.stringify(user));

    // 2. Server Sync (Supabase)
    if (user.isAuthenticated && user.id) {
      const { error } = await supabase.from('subscriptions').upsert([
        { user_id: user.id, module: key1, expiry: expiryDate.toISOString() },
        { user_id: user.id, module: key2, expiry: expiryDate.toISOString() }
      ], { onConflict: 'user_id,module' });
      
      if (error) {
          console.error("Supabase Sync Error:", error.message);
          throw new Error("Failed to sync subscription with database.");
      }
    }
    return user;
  },

  async createSupportTicket(category: string, message: string): Promise<string> {
    const user = await this.getCurrentUser();
    const { data } = await supabase.from('support_tickets').insert({ user_id: user.id || null, category, message }).select('id').single();
    return data?.id || "GUEST_TICKET";
  },

  async getTicketHistory(): Promise<SupportTicket[]> {
    const user = await this.getCurrentUser();
    if (!user.id) return [];
    try {
      const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    } catch { return []; }
  },

  async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    const user = await this.getCurrentUser();
    if (!user.id) return [];
    try {
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return (data || []).map(d => ({ ...d, module: d.module.replace('-', ' → ') }));
    } catch { return []; }
  },

  async changePassword(oldPass: string, newPass: string) {
    const { error } = await (supabase.auth as any).updateUser({ password: newPass });
    if (error) throw error;
  }
};
