import {
  UserProfile,
  PaymentHistoryItem,
  SupportTicket,
  LessonItem,
  MatrixEntry,
  MatrixLangData
} from '../types';

import {
  SUBSCRIPTION_DAYS,
  LIMIT_CHARS,
  LIMIT_CHATS,
  LIMIT_QUIZZES
} from '../constants';

import {
  supabase,
  forceLogoutStorageClear,
  SUPABASE_ANON_KEY,
  SUPABASE_URL
} from '../lib/supabaseClient';

export const getModuleKey = (
  source: string,
  target: string,
  type: 'chars' | 'chats' | 'quizzes' | 'score' = 'chars'
) => `${source}-${target}-${type}`;

export const userService = {

  /* ---------------- BASIC HELPERS ---------------- */

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

  /* ---------------- AUTH / PROFILE ---------------- */

  async createProfile(id: string, email: string, phone: string, name: string) {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id, email, phone: phone || null, name }, { onConflict: 'id' });
    if (error) throw error;
  },

  async updateProfile(id: string, updates: { name?: string, phone?: string }) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    
    const cached = localStorage.getItem('learnages_user');
    if (cached) {
      const user = JSON.parse(cached);
      localStorage.setItem('learnages_user', JSON.stringify({ ...user, ...updates }));
    }
    return true;
  },

  async getCurrentUser(): Promise<UserProfile> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return {
          name: 'Learner',
          email: '',
          phone: '',
          isAuthenticated: false,
          subscriptions: {},
          usage: {}
        };
      }

      const userId = session.user.id;
      const userEmail = session.user.email || '';

      // 🔄 SYNC CHECK: Ensure profile exists in DB
      let { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        const meta = session.user.user_metadata;
        const capturedName = meta?.full_name || meta?.name || 'Learner';
        // Auto-create profile for Google/Social users
        await this.createProfile(userId, userEmail, '', capturedName);
        // Re-fetch to be sure
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        profile = newProfile;
      }

      const [usageRes, subRes] = await Promise.all([
        supabase.from('usage_logs').select('module, usage_count').eq('user_id', userId),
        supabase.from('subscriptions').select('module, expiry').eq('user_id', userId)
      ]);

      const user: UserProfile = {
        id: userId,
        email: userEmail,
        name: profile?.name || 'Learner',
        phone: profile?.phone || '',
        isAuthenticated: true,
        usage: {},
        subscriptions: {}
      };

      if (usageRes.data) {
        usageRes.data.forEach((r: any) => {
          user.usage[r.module] = r.usage_count;
        });
      }

      if (subRes.data) {
        subRes.data.forEach((r: any) => {
          user.subscriptions[r.module] = new Date(r.expiry).getTime();
        });
      }

      localStorage.setItem('learnages_user', JSON.stringify(user));
      return user;

    } catch (e) {
      console.warn("User sync failed", e);
      const cached = localStorage.getItem('learnages_user');
      return cached ? JSON.parse(cached) : { name: 'Learner', email: '', phone: '', isAuthenticated: false, subscriptions: {}, usage: {} };
    }
  },

  /* ---------------- RAZORPAY ---------------- */

  async createRazorpayOrder(amount: number) {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount }
      });
      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      throw new Error(err.message || "Gateway unreachable.");
    }
  },

  /* ---------------- MATRIX & LESSONS ---------------- */

  async saveMatrixEntry(entry: MatrixEntry) {
    try {
      const anchor = entry.en_anchor?.toLowerCase().trim();
      if (!anchor) return;
      const { data: existing } = await supabase.from('global_matrix').select('matrix_data').eq('en_anchor', anchor).maybeSingle();
      const merged = existing ? { ...existing.matrix_data, ...entry.matrix_data } : entry.matrix_data;
      await supabase.from('global_matrix').upsert({ en_anchor: anchor, category: entry.category || 'General', matrix_data: merged }, { onConflict: 'en_anchor' });
    } catch (e) { console.warn("Matrix sync failure", e); }
  },

  async searchGlobalMatrix(searchText: string, langCode: string): Promise<MatrixEntry | null> {
    try {
      const clean = searchText.toLowerCase().trim();
      const { data } = await supabase.from('global_matrix').select('*').or(`en_anchor.eq.${clean},matrix_data->${langCode}->>n.ilike.%${clean}%`).limit(1).maybeSingle();
      return data as MatrixEntry;
    } catch { return null; }
  },

  async getRecentMatrixEntries(sourceLang: string, targetLang: string): Promise<LessonItem[]> {
    try {
      const { data } = await supabase.from('global_matrix').select('*').order('created_at', { ascending: false }).limit(100);
      if (!data) return [];
      return data.filter(e => e.matrix_data[sourceLang] && e.matrix_data[targetLang]).map(e => ({
          source_native: e.matrix_data[sourceLang].n,
          source_transliteration: e.matrix_data[sourceLang].l,
          target_native: e.matrix_data[targetLang].n,
          target_transliteration: e.matrix_data[targetLang].l,
          target_in_source_script: '', 
          meaning_english: e.en_anchor,
          note: e.category || 'Collective Knowledge',
          is_custom: true
        }));
    } catch { return []; }
  },

  async getUserLessons(sourceLang: string, targetLang: string): Promise<LessonItem[]> {
    let combined: LessonItem[] = [];
    try {
      const { data } = await supabase.from('user_lessons').select('*').eq('source_lang', sourceLang).eq('target_lang', targetLang).order('created_at', { ascending: false });
      if (data) combined = data.map(i => ({ source_native: i.original, source_transliteration: '', target_native: i.translated, target_transliteration: '', target_in_source_script: i.bridge, meaning_english: '', note: i.category || 'Contribution', is_custom: true }));
    } catch {}
    return combined;
  },

  async saveUserLesson(original: string, translated: string, bridge: string, sourceLang: string, targetLang: string, aiCategory?: string) {
    const payload: any = { source_lang: sourceLang, target_lang: targetLang, original: original.trim(), translated: translated.trim(), bridge: bridge.trim(), category: aiCategory || 'General' };
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user?.id) { payload.user_id = session.session.user.id; await supabase.from('user_lessons').insert(payload); }
    } catch {}
  },

  /* ---------------- STATUS ---------------- */

  async getModuleStatus(source: string, target: string) {
    const user = await this.getCurrentUser();
    const proKey = `${source}-${target}`;
    const expiry = user.subscriptions?.[proKey];
    return { isPro: !!(expiry && expiry > Date.now()), usageChars: user.usage?.[getModuleKey(source, target, 'chars')] || 0, usageChats: user.usage?.[getModuleKey(source, target, 'chats')] || 0, usageQuizzes: user.usage?.[getModuleKey(source, target, 'quizzes')] || 0, limitChars: LIMIT_CHARS, limitChats: LIMIT_CHATS, limitQuizzes: LIMIT_QUIZZES, expiry, isAuthenticated: user.isAuthenticated };
  },

  async incrementUsage(source: string, target: string, amount: number, type: 'chars' | 'chats' | 'quizzes' = 'chars') {
    const user = await this.getCurrentUser();
    const key = getModuleKey(source, target, type);
    if (!user.usage) user.usage = {};
    user.usage[key] = (user.usage[key] || 0) + amount;
    localStorage.setItem('learnages_user', JSON.stringify(user));
    if (user.id) await supabase.from('usage_logs').upsert({ user_id: user.id, module: key, usage_count: user.usage[key] }, { onConflict: 'user_id,module' });
    return user.usage[key];
  },

  /**
   * 🛠️ ROBUST ACTIVATION ENGINE
   * Solves "Activation Failed" by ensuring fresh user session via getUser()
   * and using a safer UPSERT implementation for the subscription table.
   */
  async subscribeToModule(source: string, target: string, days: number = SUBSCRIPTION_DAYS, paymentId?: string) {
    // 🛡️ CRITICAL: Use getUser() to verify the token with the server and get fresh metadata
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) throw new Error("Authentication failed. Please sign in again.");

    const userId = user.id;
    const expiryDate = new Date(); 
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const moduleKey = `${source}-${target}`;
    
    // Perform robust upsert to handle both first-time buyers and renewals
    const { error } = await supabase.from('subscriptions').upsert({ 
      user_id: userId, 
      module: moduleKey, 
      expiry: expiryDate.toISOString(), 
      payment_id: paymentId || null 
    }, { onConflict: 'user_id,module' });

    if (error) {
        console.error("Database Activation Error:", error);
        throw new Error(`Sync Error: ${error.message || 'Database rejected activation'}`);
    }

    // Refresh Local Storage
    localStorage.removeItem('learnages_user');
    return await this.getCurrentUser();
  },

  async getQuizScore(source: string, target: string): Promise<number> {
    const user = await this.getCurrentUser();
    return user.usage?.[getModuleKey(source, target, 'score')] || 0;
  },

  async updateQuizScore(source: string, target: string, score: number): Promise<number> {
    const user = await this.getCurrentUser();
    const key = getModuleKey(source, target, 'score');
    if (!user.usage) user.usage = {};
    const total = (user.usage[key] || 0) + score;
    user.usage[key] = total;
    localStorage.setItem('learnages_user', JSON.stringify(user));
    if (user.id) await supabase.from('usage_logs').upsert({ user_id: user.id, module: key, usage_count: total }, { onConflict: 'user_id,module' });
    return total;
  },

  async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    const user = await this.getCurrentUser();
    if (!user.id) return [];
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    return (data || []).map((i: any) => ({ id: i.id || String(Math.random()), user_id: i.user_id, module: i.module, expiry: i.expiry, created_at: i.created_at }));
  },

  async getTicketHistory(): Promise<SupportTicket[]> {
    const user = await this.getCurrentUser();
    if (!user.id) return [];
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    return data || [];
  },

  /**
   * 🛡️ SECURE PASSWORD CHANGE
   * Verifies current credentials before allowing an update.
   */
  async changePassword(currentPass: string, newPass: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email;
    if (!email) throw new Error("No active session found.");

    // 1. Validate current password via a re-auth check
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: email,
      password: currentPass,
    });

    if (verifyError) {
      throw new Error("Present password is incorrect.");
    }

    // 2. Apply new password
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
  },

  async createSupportTicket(category: string, message: string): Promise<string> {
    const user = await this.getCurrentUser();
    const { data } = await supabase.from('support_tickets').insert({ category, message, user_id: user.id || null }).select('id').single();
    return data?.id || 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  },

  async logoutUser() {
    localStorage.removeItem('learnages_user');
    forceLogoutStorageClear();
    try { await supabase.auth.signOut(); } catch {}
    window.location.reload();
  }
};