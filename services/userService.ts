import {
  UserProfile,
  PaymentHistoryItem,
  SupportTicket,
  LessonItem,
  MatrixEntry,
  UserRole
} from '../types';

import {
  LIMIT_CHARS,
  LIMIT_CHATS,
  LIMIT_QUIZZES,
  GLOBAL_ADMIN_EMAILS
} from '../constants';

import {
  supabase,
  forceLogoutStorageClear
} from '../lib/supabaseClient';

const GUEST_USAGE_KEY = 'learnages_guest_usage';

const getDbModuleKey = (source: string, target: string, type: string) => `${source}-${target}-${type}`;

export const userService = {

  /* ---------------- GUEST TRACKING ---------------- */
  
  getGuestUsage(moduleName: string) {
    try {
      const data = localStorage.getItem(GUEST_USAGE_KEY);
      const usage = data ? JSON.parse(data) : {};
      const moduleData = usage[moduleName] || {};
      return {
        chars_count: Number(moduleData.chars_count) || 0,
        chats_count: Number(moduleData.chats_count) || 0,
        quizzes_count: Number(moduleData.quizzes_count) || 0,
        quiz_score: Number(moduleData.quiz_score) || 0
      };
    } catch {
      return { chars_count: 0, chats_count: 0, quizzes_count: 0, quiz_score: 0 };
    }
  },

  setGuestUsage(moduleName: string, updates: any) {
    try {
      const data = localStorage.getItem(GUEST_USAGE_KEY);
      const usage = data ? JSON.parse(data) : {};
      const current = usage[moduleName] || { chars_count: 0, chats_count: 0, quizzes_count: 0, quiz_score: 0 };
      usage[moduleName] = { ...current, ...updates };
      localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify(usage));
      return usage[moduleName];
    } catch {
      return updates;
    }
  },

  /* ---------------- AUTH / PROFILE ---------------- */

  async createProfile(id: string, email: string, phone: string, name: string) {
    const role: UserRole = GLOBAL_ADMIN_EMAILS.includes(email.toLowerCase())
      ? 'global_admin'
      : 'user';

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id, email: email.toLowerCase(), phone: phone || null, name, role },
        { onConflict: 'id' }
      );

    if (error) throw error;
  },

  async getCurrentUser(): Promise<UserProfile> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return {
          name: 'Learner',
          email: '',
          phone: '',
          role: 'user',
          isAuthenticated: false,
          subscriptions: {},
          usage: {}
        };
      }

      const userId = session.user.id;
      const userEmail = session.user.email || '';

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        await this.createProfile(userId, userEmail, '', 'Learner');
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        profile = newProfile;
      }

      const user: UserProfile = {
        id: userId,
        email: userEmail,
        name: profile?.name || 'Learner',
        phone: profile?.phone || '',
        role: profile?.role || 'user',
        isAuthenticated: true,
        usage: {},
        subscriptions: {}
      };

      localStorage.setItem('learnages_user', JSON.stringify(user));
      return user;
    } catch {
      const cached = localStorage.getItem('learnages_user');
      return cached
        ? JSON.parse(cached)
        : { name: 'Learner', email: '', phone: '', role: 'user', isAuthenticated: false, subscriptions: {}, usage: {} };
    }
  },

  formatPhone(phone: string, countryCode: string): string {
    const cleaned = (phone || '').replace(/\D/g, '');
    return `${countryCode}${cleaned}`;
  },

  async checkPhoneExists(phone: string, countryCode: string): Promise<boolean> {
    const fullPhone = this.formatPhone(phone, countryCode);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', fullPhone)
      .maybeSingle();
    return !!data;
  },

  async getEmailByPhone(phone: string, countryCode: string): Promise<string | null> {
    const fullPhone = this.formatPhone(phone, countryCode);
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('phone', fullPhone)
      .maybeSingle();
    if (error) return null;
    return data?.email || null;
  },

  /* ---------------- USAGE & SUBSCRIPTIONS ---------------- */

  async getModuleStatus(source: string, target: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const pairName = `${source}-${target}`;
    const guestUsage = this.getGuestUsage(pairName);

    if (!session) {
      return {
        isPro: false,
        usageChars: guestUsage.chars_count || 0,
        usageChats: guestUsage.chats_count || 0,
        usageQuizzes: guestUsage.quizzes_count || 0,
        limitChars: LIMIT_CHARS,
        limitChats: LIMIT_CHATS,
        limitQuizzes: LIMIT_QUIZZES,
        expiry: 0,
        isAuthenticated: false
      };
    }

    const userId = session.user.id;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('module', pairName)
      .gt('expiry', new Date().toISOString())
      .maybeSingle();
    
    const { data: usageRows } = await supabase
      .from('usage_logs')
      .select('module, usage_count')
      .eq('user_id', userId)
      .ilike('module', `${pairName}-%`);

    const usageMap: Record<string, number> = {};
    (usageRows || []).forEach(row => {
      const type = row.module.split('-').pop() || '';
      usageMap[type] = (usageMap[type] || 0) + Number(row.usage_count);
    });

    return {
      isPro: !!sub,
      usageChars: (usageMap['chars'] || 0) + (guestUsage.chars_count || 0),
      usageChats: (usageMap['chats'] || 0) + (guestUsage.chats_count || 0),
      usageQuizzes: (usageMap['quizzes'] || 0) + (guestUsage.quizzes_count || 0),
      limitChars: LIMIT_CHARS,
      limitChats: LIMIT_CHATS,
      limitQuizzes: LIMIT_QUIZZES,
      expiry: sub ? new Date(sub.expiry).getTime() : 0,
      isAuthenticated: true
    };
  },

  async incrementUsage(source: string, target: string, amount: number, type: 'chars' | 'chats' | 'quizzes'): Promise<number> {
    const { data: { session } } = await supabase.auth.getSession();
    const pairName = `${source}-${target}`;
    const dbModule = getDbModuleKey(source, target, type);

    if (!session) {
      const current = this.getGuestUsage(pairName) as any;
      const field = `${type}_count`;
      const newVal = (current[field] || 0) + amount;
      this.setGuestUsage(pairName, { [field]: newVal });
      return newVal;
    }

    const guestUsage = this.getGuestUsage(pairName) as any;
    const guestVal = Number(guestUsage[`${type}_count`]) || 0;

    const { data: current } = await supabase
      .from('usage_logs')
      .select('id, usage_count')
      .eq('user_id', session.user.id)
      .eq('module', dbModule)
      .maybeSingle();

    const baseVal = current ? (Number(current.usage_count) || 0) : 0;
    const newVal = baseVal + guestVal + amount; 

    if (current) {
      await supabase
        .from('usage_logs')
        .update({ usage_count: newVal })
        .eq('id', current.id);
    } else {
      await supabase
        .from('usage_logs')
        .insert({
          user_id: session.user.id,
          module: dbModule,
          usage_count: newVal
        });
    }

    this.setGuestUsage(pairName, { [`${type}_count`]: 0 });
    return newVal;
  },

  async createRazorpayOrder(amount: number) {
    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: { amount }
    });
    if (error) throw error;
    return data;
  },

  async subscribeToModule(source: string, target: string, days: number, paymentId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required to synchronize Pro access.");
    
    const pairName = `${source}-${target}`;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);

    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: session.user.id,
        module: pairName,
        expiry: expiry.toISOString()
      }, { onConflict: 'user_id,module' });

    if (subError) throw subError;

    await supabase.from('payment_history').insert({
      user_id: session.user.id,
      module: pairName,
      expiry: expiry.toISOString()
    });
  },

  async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    return (data || []) as PaymentHistoryItem[];
  },

  /* ---------------- LINGUISTIC MATRIX (CLOUD DECK) ---------------- */

  async getGlobalMatrixDeck(): Promise<MatrixEntry[]> {
    try {
      const { data, error } = await supabase
        .from('global_matrix')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MatrixEntry[];
    } catch (e) {
      console.warn("Matrix fetch failed:", e);
      return [];
    }
  },

  async saveUserLesson(sourceText: string, targetText: string, pronunciation: string, sourceLang: string, targetLang: string, category: string = 'General') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('user_lessons').insert({
      user_id: session.user.id,
      source_text: sourceText,
      target_text: targetText,
      pronunciation,
      source_lang: sourceLang,
      target_lang: targetLang,
      category
    });
  },

  async getUserLessons(source: string, target: string): Promise<LessonItem[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data } = await supabase
        .from('user_lessons')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('source_lang', source)
        .eq('target_lang', target)
        .order('created_at', { ascending: false });
      
      return (data || []).map(d => ({
        source_native: d.source_text,
        source_transliteration: '',
        target_native: d.target_text,
        target_transliteration: '',
        target_in_source_script: d.pronunciation,
        meaning_english: 'Recent Matrix Addition',
        note: d.category || 'My Findings',
        is_custom: true
      }));
    } catch { return []; }
  },

  async searchGlobalMatrix(searchText: string, langCode: string): Promise<MatrixEntry | null> {
    try {
      const clean = (searchText || '').toString().toLowerCase().trim();
      if (!clean) return null;
      
      const { data } = await supabase
        .from('global_matrix')
        .select('*')
        .or(`en_anchor.eq.${clean},matrix_data->${langCode}->>n.ilike.${clean}%,matrix_data->${langCode}->>l.ilike.${clean}%`)
        .limit(1)
        .maybeSingle();

      return data as MatrixEntry;
    } catch {
      return null;
    }
  },

  /**
   * 🌐 GLOBAL SUGGESTION ENGINE
   * Searches across ALL languages in the matrix for phonetic or anchor matches.
   */
  async searchMatrixSuggestions(prefix: string, sourceLang: string, targetLang: string): Promise<LessonItem[]> {
    if (!prefix || prefix.length < 3) return [];
    const cleanPrefix = (prefix || '').toString().toLowerCase();
    const results: LessonItem[] = [];

    try {
      // 🕵️ GLOBAL QUERY: Check anchors and JSON data across the whole matrix table
      const { data: matrixData } = await supabase
        .from('global_matrix')
        .select('*')
        .or(`en_anchor.ilike.%${cleanPrefix}%`)
        .limit(15);

      (matrixData || []).forEach(m => {
        // If the entry has data for our specific current pair, include it
        if (m.matrix_data[sourceLang] && m.matrix_data[targetLang]) {
          results.push({
            source_native: m.matrix_data[sourceLang].n,
            source_transliteration: m.matrix_data[sourceLang].l,
            target_native: m.matrix_data[targetLang].n,
            target_transliteration: m.matrix_data[targetLang].l,
            target_in_source_script: m.matrix_data[targetLang].b?.[sourceLang] || '',
            meaning_english: m.en_anchor,
            note: m.category,
            is_custom: false
          });
        }
      });

      return results;
    } catch (e) {
      console.error("DB Suggestion Error:", e);
      return [];
    }
  },

  async saveMatrixEntry(entry: Partial<MatrixEntry>) {
    const { error } = await supabase
      .from('global_matrix')
      .upsert({
        en_anchor: entry.en_anchor,
        category: entry.category,
        matrix_data: entry.matrix_data
      }, { onConflict: 'en_anchor' });
    if (error) throw error;
  },

  /* ---------------- QUIZ & XP ---------------- */

  async getQuizScore(source: string, target: string): Promise<number> {
    const pairName = `${source}-${target}`;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return this.getGuestUsage(pairName).quiz_score;
    }

    const { data } = await supabase
      .from('profiles')
      .select('usage')
      .eq('id', session.user.id)
      .maybeSingle();
    
    const usage = data?.usage || {};
    return Number(usage[`${pairName}-score`]) || 0;
  },

  async updateQuizScore(source: string, target: string, score: number): Promise<number> {
    const pairName = `${source}-${target}`;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      const current = this.getGuestUsage(pairName);
      const newScore = (current.quiz_score || 0) + score;
      this.setGuestUsage(pairName, { quiz_score: newScore });
      return newScore;
    }

    const currentScore = await this.getQuizScore(source, target);
    const newScore = currentScore + score;

    const { data: profile } = await supabase
      .from('profiles')
      .select('usage')
      .eq('id', session.user.id)
      .maybeSingle();

    const updatedUsage = { ...(profile?.usage || {}), [`${pairName}-score`]: newScore };

    await supabase
      .from('profiles')
      .update({ usage: updatedUsage })
      .eq('id', session.user.id);

    return newScore;
  },

  /* ---------------- SUPPORT SYSTEM ---------------- */

  async createSupportTicket(category: string, message: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const ticketNo = `SR${Math.floor(100000 + Math.random() * 900000)}`;
    const { error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: session?.user.id,
        category,
        message,
        ticket_no: ticketNo,
        status: 'open'
      });
    if (error) throw error;
    return ticketNo;
  },

  async getTicketHistory(): Promise<SupportTicket[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    return (data || []) as SupportTicket[];
  },

  /* ---------------- PROFILE MANAGEMENT ---------------- */

  async updateProfile(id: string, updates: { name: string; phone: string }) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async changePassword(current: string, newPass: string) {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
  },

  async logoutUser() {
    localStorage.removeItem('learnages_user');
    forceLogoutStorageClear();
    try {
      await supabase.auth.signOut();
    } catch {}
    window.location.reload();
  }
};