
import React, { useEffect, useState } from 'react';
import {
  LogOut, X, Phone, Mail, Receipt, Loader2,
  MessageSquare, CreditCard, UserCircle, KeyRound, Check, AlertCircle,
  Clock, Edit2, Save, Trophy, Eye, EyeOff, FileText
} from 'lucide-react';

import { UserProfile, PaymentHistoryItem, SupportTicket } from '../types';
import { userService } from '../services/userService';
import { PRICE_INR, LANGUAGES } from '../constants';
import { SupportModal } from './SupportModal';

interface ProfileModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onLogout: () => void;
  // Added onOpenAuth prop to ProfileModalProps
  onOpenAuth: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onLogout,
  // Destructure onOpenAuth prop
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'subscriptions' | 'tickets'>('info');
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showRaiseTicket, setShowRaiseTicket] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [showPassChange, setShowPassChange] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const usageValues = user?.usage ? (Object.values(user.usage) as number[]) : [];
  const totalUsageCount = usageValues.reduce((a: number, b: number) => a + b, 0);
  const usagePercent = Math.min(100, Math.floor((totalUsageCount / 500) * 100));

  useEffect(() => {
    if (isOpen && user?.isAuthenticated) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      if (activeTab === 'subscriptions') loadData('sub');
      if (activeTab === 'tickets') loadData('tkt');
    }
  }, [isOpen, activeTab, user]);

  const loadData = async (type: 'sub' | 'tkt') => {
    setLoading(true);
    try {
      if (type === 'sub') setPayments(await userService.getPaymentHistory());
      else setTickets(await userService.getTicketHistory());
    } catch (e: any) {
      console.warn("Failed to load profile data:", e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  const resolveFullModuleName = (key: string) => {
    if (!key) return 'General Access';
    const parts = key.split(/[-→]/).map(p => p.trim());
    if (parts.length !== 2) return key;
    const s = LANGUAGES.find(l => l.code === parts[0])?.name || parts[0];
    const t = LANGUAGES.find(l => l.code === parts[1])?.name || parts[1];
    return `${s} to ${t}`;
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    setProfileLoading(true);
    try {
      await userService.updateProfile(user.id, { name: editName, phone: editPhone });
      setMsg({ type: 'success', text: 'Profile updated!' });
      setIsEditing(false);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Update failed' });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handlePasswordChange = async () => {
    if (!passForm.current || !passForm.new || !passForm.confirm) {
        setMsg({ type: 'error', text: 'All fields are required.' });
        return;
    }
    if (passForm.new !== passForm.confirm) {
        setMsg({ type: 'error', text: 'New passwords do not match.' });
        return;
    }
    if (passForm.new.length < 6) {
        setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
        return;
    }

    setLoading(true);
    try {
        await userService.changePassword(passForm.current, passForm.new);
        setMsg({ type: 'success', text: 'Password updated successfully!' });
        setPassForm({ current: '', new: '', confirm: '' });
        setShowPassChange(false);
    } catch (e: any) {
        setMsg({ type: 'error', text: e.message || 'Failed to update password.' });
    } finally {
        setLoading(false);
        setTimeout(() => setMsg(null), 4000);
    }
  };

  const ProgressRing = ({ percent }: { percent: number }) => {
    const radius = 35;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;
    return (
      <div className="relative flex items-center justify-center">
        <svg height="80" width="80">
          <circle stroke="#e2e8f0" strokeWidth="6" fill="transparent" r={radius} cx="40" cy="40"/>
          <circle stroke="#bf953f" strokeWidth="6" strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset: offset }} strokeLinecap="round" fill="transparent" r={radius} cx="40" cy="40" className="progress-ring__circle" />
        </svg>
        <div className="absolute text-[10px] font-black text-slate-800">{percent}%</div>
      </div>
    );
  };

  if (!isOpen || !user) return null;

  // Robust check for pro status background
  const hasProSub = user.subscriptions && typeof user.subscriptions === 'object' && Object.keys(user.subscriptions).length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Fixed SupportModal: added missing onOpenAuth property */}
      <SupportModal isOpen={showRaiseTicket} onClose={() => setShowRaiseTicket(false)} onOpenAuth={onOpenAuth} />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">
        
        <div className={`p-8 flex flex-col items-center relative shrink-0 ${hasProSub ? 'bg-premium text-slate-900' : 'bg-[#1d4683] text-white'}`}>
          <button onClick={onClose} className="absolute top-6 right-6 opacity-50 hover:opacity-100"><X size={24} /></button>
          <div className="flex items-center gap-6 mb-4">
             <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                <UserCircle size={40} />
             </div>
             {user.usage && <ProgressRing percent={usagePercent} />}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{user.name || 'Learner'}</h2>
          <p className="text-xs font-black uppercase tracking-widest opacity-70">
            Role: {(user.role || 'user').replace('_', ' ')}
          </p>
        </div>

        <div className="flex border-b bg-slate-50/50 overflow-x-auto scrollbar-hide shrink-0">
          {['info', 'subscriptions', 'tickets'].map((t: any) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 px-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === t ? 'border-[#1d4683] text-[#1d4683]' : 'border-transparent text-slate-400'}`}>{t}</button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'info' && (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Profile Engine</span>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                  ) : (
                    <button onClick={handleUpdateProfile} disabled={profileLoading} className="text-[10px] font-black text-green-600 uppercase flex items-center gap-1">{profileLoading ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Save</button>
                  )}
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <Mail size={18} className="text-slate-300"/>
                  <span className="text-sm font-bold text-slate-400">{user.email}</span>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white border-indigo-200 ring-2 ring-indigo-50' : 'bg-slate-50 border-slate-100'} flex items-center gap-4`}>
                  <UserCircle size={18} className={isEditing ? 'text-indigo-600' : 'text-slate-300'}/>
                  {isEditing ? <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full text-sm font-bold bg-transparent outline-none"/> : <span className="text-sm font-bold text-slate-700">{user.name}</span>}
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white border-indigo-200 ring-2 ring-indigo-50' : 'bg-slate-50 border-slate-100'} flex items-center gap-4`}>
                  <Phone size={18} className={isEditing ? 'text-indigo-600' : 'text-slate-300'}/>
                  {isEditing ? <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full text-sm font-bold bg-transparent outline-none" placeholder="Add Phone"/> : <span className="text-sm font-bold text-slate-700">{user.phone || 'Set Phone'}</span>}
                </div>
              </div>

              {msg && <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}><AlertCircle size={14}/> {msg.text}</div>}

              <button 
                onClick={() => { setShowPassChange(!showPassChange); setMsg(null); }} 
                className="text-xs font-black uppercase text-[#1d4683] flex items-center gap-2 hover:underline"
              >
                <KeyRound size={14}/> Update Password
              </button>
              
              {showPassChange && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Present Password</label>
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      placeholder="Enter current password" 
                      value={passForm.current} 
                      onChange={e => setPassForm({...passForm, current: e.target.value})} 
                      className="w-full p-3 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">New Password</label>
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      placeholder="Min 6 characters" 
                      value={passForm.new} 
                      onChange={e => setPassForm({...passForm, new: e.target.value})} 
                      className="w-full p-3 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Confirm New Password</label>
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      placeholder="Repeat new password" 
                      value={passForm.confirm} 
                      onChange={e => setPassForm({...passForm, confirm: e.target.value})} 
                      className="w-full p-3 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <button 
                      onClick={() => setShowPasswords(!showPasswords)} 
                      className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"
                    >
                      {showPasswords ? <EyeOff size={12}/> : <Eye size={12}/>} {showPasswords ? 'Hide' : 'Show'} Characters
                    </button>
                  </div>
                  <button 
                    onClick={handlePasswordChange} 
                    disabled={loading}
                    className="w-full py-3 bg-[#1d4683] text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14}/>} Update Password
                  </button>
                </div>
              )}

              <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-600 font-black uppercase text-[10px] rounded-2xl border border-red-100 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors">
                <LogOut size={16}/> Sign Out
              </button>
            </>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  <p className="text-[10px] font-black uppercase">Loading Subscriptions...</p>
                </div>
              ) : payments.map(p => (
                <div key={p.id} className="p-5 border rounded-3xl space-y-3 bg-white shadow-sm border-slate-100">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-black text-slate-800">{resolveFullModuleName(p.module)}</h4>
                    <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">Active</div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold"><Clock size={12}/> Valid: {new Date(p.expiry).toLocaleDateString()}</div>
                </div>
              ))}
              {!loading && payments.length === 0 && <div className="text-center py-10 opacity-30 font-black text-xs uppercase tracking-widest"><CreditCard size={32} className="mx-auto mb-2"/> No active modules</div>}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  <p className="text-[10px] font-black uppercase">Loading Tickets...</p>
                </div>
              ) : tickets.map(t => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-[10px] font-black text-[#1d4683] uppercase mb-2">
                    <span>Ref: {t.ticket_no || t.id.slice(0,8)}</span>
                    <span className={t.status === 'resolved' ? 'text-green-600' : 'text-amber-600'}>{t.status}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{t.message}</p>
                  <p className="text-[8px] text-slate-400 mt-2">{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</p>
                </div>
              ))}
              {!loading && tickets.length === 0 && <div className="text-center py-10 opacity-30 font-black text-xs uppercase tracking-widest"><MessageSquare size={32} className="mx-auto mb-2"/> No inquiry logs</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
