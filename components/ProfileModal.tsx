
import React, { useEffect, useState } from 'react';
import {
  User, LogOut, X, Phone, Mail, Receipt, Loader2,
  MessageSquare, CreditCard, UserCircle, KeyRound, Check, AlertCircle,
  Clock, ArrowRight, Zap, RefreshCw
} from 'lucide-react';

import { UserProfile, PaymentHistoryItem, SupportTicket } from '../types';
import { userService } from '../services/userService';
import { PRICE_INR, LANGUAGES } from '../constants';

interface ProfileModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'subscriptions' | 'tickets'>('info');
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Password
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load Data
  useEffect(() => {
    if (isOpen && user?.isAuthenticated) {
      if (activeTab === 'subscriptions') loadSubscriptions();
      if (activeTab === 'tickets') loadTickets();
    }
  }, [isOpen, user, activeTab]);

  const loadSubscriptions = async () => {
    setLoading(true);
    const data = await userService.getPaymentHistory();
    setPayments(data);
    setLoading(false);
  };

  const loadTickets = async () => {
    setLoading(true);
    const data = await userService.getTicketHistory();
    setTickets(data);
    setLoading(false);
  };

  /**
   * 🗺️ Resolves "hi → kn" to "Hindi to Kannada"
   */
  const resolveFullModuleName = (moduleKey: string) => {
    const codes = moduleKey.split(' → ');
    if (codes.length !== 2) return moduleKey;
    
    const sourceName = LANGUAGES.find(l => l.code === codes[0])?.name || codes[0];
    const targetName = LANGUAGES.find(l => l.code === codes[1])?.name || codes[1];
    
    return `${sourceName} to ${targetName}`;
  };

  const formatExpiryDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      });
    } catch {
      return dateStr;
    }
  };

  const isExpiringSoon = (dateStr: string) => {
    const expiry = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = expiry - now;
    return diff > 0 && diff < 172800000; // Less than 48 hours
  };

  const handleChangePassword = async () => {
    setMsg(null);
    if (!oldPass || !newPass || !confirmNewPass) {
      setMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (newPass !== confirmNewPass) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPass.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(oldPass, newPass);
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setOldPass("");
      setNewPass("");
      setConfirmNewPass("");
      setTimeout(() => setShowPasswordChange(false), 2000);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = (payment: PaymentHistoryItem) => {
    const date = payment.created_at ? new Date(payment.created_at) : new Date();
    const invoiceId = `INV-${payment.id.slice(0, 8)}-${date.getTime().toString().slice(-4)}`;
    const fullModule = resolveFullModuleName(payment.module);
    
    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice ${invoiceId}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #1d4683; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1d4683; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .footer { margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">LEARNAGES PRO INVOICE</div>
            <p>ID: ${invoiceId}</p>
          </div>
          <div class="row"><strong>User:</strong> <span>${user?.name || user?.email}</span></div>
          <div class="row"><strong>Subscription Module:</strong> <span>${fullModule}</span></div>
          <div class="row"><strong>Date of Purchase:</strong> <span>${date.toLocaleDateString()}</span></div>
          <div class="row"><strong>Amount Paid:</strong> <span>₹${PRICE_INR}</span></div>
          <div class="row"><strong>Access Expiry:</strong> <span>${formatExpiryDate(payment.expiry)}</span></div>
          <div class="footer">
            Thank you for choosing Learnages. This is a computer-generated document.
          </div>
          <script>window.print()</script>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(invoiceHTML);
      win.document.close();
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">

        {/* HEADER */}
        <div className="bg-[#1d4683] p-8 flex flex-col items-center relative shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>

          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner border border-white/20 mb-4">
            <UserCircle size={48} className="text-white" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            {user.name || 'Learner'}
          </h2>
          <p className="text-blue-200 text-xs font-black uppercase tracking-widest mt-1">Platform Account</p>
        </div>

        {/* TABS */}
        {user.isAuthenticated && (
          <div className="flex border-b bg-slate-50/50">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${
                activeTab === 'info' ? 'border-[#1d4683] text-[#1d4683]' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${
                activeTab === 'subscriptions' ? 'border-[#1d4683] text-[#1d4683]' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${
                activeTab === 'tickets' ? 'border-[#1d4683] text-[#1d4683]' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Support
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1">

          {activeTab === 'info' && (
            <div className="space-y-6">
              {user.isAuthenticated ? (
                <>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Connected Credentials</p>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Mail size={18} className="text-slate-400" />
                      <span className="text-sm text-slate-700 font-bold">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Phone size={18} className="text-slate-400" />
                      <span className="text-sm text-slate-700 font-bold">{user.phone}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowPasswordChange(!showPasswordChange);
                        setMsg(null);
                        setOldPass("");
                        setNewPass("");
                        setConfirmNewPass("");
                      }}
                      className="text-xs font-black uppercase tracking-wider text-[#1d4683] flex items-center gap-2 hover:underline"
                    >
                      <KeyRound size={14} /> Change Access Password
                    </button>

                    {showPasswordChange && (
                      <div className="mt-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-inner">
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={oldPass}
                          onChange={(e) => setOldPass(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={confirmNewPass}
                          onChange={(e) => setConfirmNewPass(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {msg && (
                          <div className={`text-xs p-3 rounded-xl flex items-center gap-2 font-bold ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {msg.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
                            {msg.text}
                          </div>
                        )}

                        <button
                          onClick={handleChangePassword}
                          disabled={loading}
                          className="w-full bg-[#1d4683] text-white rounded-xl py-3 text-xs font-black uppercase hover:bg-black transition-all disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'Update Password'}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onLogout}
                    className="w-full mt-8 py-4 bg-red-50 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-red-100 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut size={16} /> Sign Out of Engine
                  </button>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Guest Context Only</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Active Modules & Passes</p>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-200" size={32} /></div>
              ) : (
                payments.map((p) => {
                  const expiring = isExpiringSoon(p.expiry);
                  return (
                    <div key={p.id} className={`p-5 border bg-white rounded-3xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-all ${expiring ? 'border-amber-200 ring-1 ring-amber-50' : 'border-slate-100'}`}>
                      <div className="flex justify-between items-start">
                          <div>
                              <h4 className="text-sm font-black text-slate-900 leading-none mb-1.5">{resolveFullModuleName(p.module)}</h4>
                              <div className={`flex items-center gap-1.5 ${expiring ? 'text-amber-600' : 'text-indigo-600'}`}>
                                  <Clock size={12} />
                                  <span className="text-[10px] font-bold">Expires: {formatExpiryDate(p.expiry)}</span>
                              </div>
                          </div>
                          {expiring ? (
                             <div className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter animate-pulse">Expiring Soon</div>
                          ) : (
                             <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Pro Active</div>
                          )}
                      </div>

                      {expiring && (
                        <div className="bg-amber-50/50 p-3 rounded-2xl flex items-center justify-between gap-3 border border-amber-100">
                           <p className="text-[9px] font-bold text-amber-800 leading-tight">Access ending soon. Extend your journey to keep learning without limits.</p>
                           <button onClick={onClose} className="shrink-0 bg-amber-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase hover:bg-black transition-all">Renew Access</button>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Status: Professional</span>
                          <button
                            onClick={() => generateInvoice(p)}
                            className="text-[#1d4683] text-[10px] font-black uppercase flex items-center gap-1.5 hover:underline"
                          >
                            <Receipt size={14} /> View Invoice
                          </button>
                      </div>
                    </div>
                  );
                })
              )}

              {!loading && payments.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <CreditCard size={32} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No Active Subscriptions</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (activeTab === 'tickets' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Support Inquiries</p>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-200" size={32} /></div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-[#1d4683] uppercase tracking-tighter">REF: {t.id.slice(0, 8)}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{new Date(t.created_at || '').toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{t.message}</p>
                    <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-end">
                        <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Processing</span>
                    </div>
                  </div>
                ))
              )}

              {!loading && tickets.length === 0 && (
                 <div className="text-center py-12">
                    <MessageSquare size={32} className="text-slate-100 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">No support logs</p>
                 </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};
