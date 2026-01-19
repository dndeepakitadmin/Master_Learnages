
import React, { useState, useEffect } from 'react';
import { Shield, Users, CreditCard, MessageSquare, X, Check, Loader2, Search, Trash2, LayoutGrid, Filter } from 'lucide-react';
import { UserProfile, SupportTicket, UserRole } from '../types';
import { userService } from '../services/userService';
import { supabase } from '../lib/supabaseClient';

interface AdminDashboardProps {
  currentUserRole: UserRole;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUserRole, onBack }) => {
  // Role Permissions
  const canSeeUsers = currentUserRole === 'global_admin' || currentUserRole === 'admin';
  const canSeeMatrix = currentUserRole === 'global_admin';
  const canManageBilling = currentUserRole === 'global_admin';

  // Default to tickets for support agent, users for admins
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'matrix'>(
    canSeeUsers ? 'users' : 'tickets'
  );
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users' && canSeeUsers) {
        // Fetch profiles directly
        const { data, error } = await supabase.from('profiles').select('*').limit(200);
        if (error) {
          console.error("Error fetching profiles:", error.message || JSON.stringify(error));
        }
        setUsers(data || []);
      } else if (activeTab === 'tickets') {
        // STEP 1: Fetch Tickets WITHOUT any joins to avoid "relationship not found" schema error
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (ticketError) {
          console.error("Error fetching tickets:", ticketError.message || JSON.stringify(ticketError));
          setTickets([]);
          setLoading(false);
          return;
        }

        const rawTickets = ticketData || [];

        // STEP 2: Manually fetch user emails for these tickets to bypass join requirement
        const userIds = Array.from(new Set(rawTickets.map(t => t.user_id).filter(id => !!id)));
        
        if (userIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds);

          if (!profileError && profileData) {
            // Create a lookup map for efficiency
            const emailMap = Object.fromEntries(profileData.map(p => [p.id, p.email]));
            
            // Merge emails into ticket objects
            setTickets(rawTickets.map(t => ({
              ...t,
              user_email: emailMap[t.user_id] || 'Unknown'
            })));
          } else {
            // Fallback if profiles can't be fetched
            setTickets(rawTickets.map(t => ({ ...t, user_email: 'Anonymous' })));
          }
        } else {
          // All tickets are guest/anonymous
          setTickets(rawTickets.map(t => ({ ...t, user_email: 'Guest' })));
        }
      }
    } catch (e: any) {
      console.error("Admin Dashboard Load Exception:", e?.message || JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const updateTicketStatus = async (id: string, status: 'resolved' | 'open') => {
    try {
        const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
        if (error) throw error;
        loadData();
    } catch (err: any) {
        console.error("Update Status Error:", err.message || JSON.stringify(err));
    }
  };

  const safeRoleName = (role?: string) => (role || 'user').replace('_', ' ');

  return (
    <div className="fixed inset-0 z-[110] bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-indigo-400" />
          <div>
            <h2 className="font-black text-lg uppercase tracking-tight">
              {currentUserRole === 'global_admin' ? 'Global Admin Control' : 'Support Control Center'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Role: {safeRoleName(currentUserRole)}</p>
          </div>
        </div>
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 flex overflow-x-auto shrink-0">
        {canSeeUsers && (
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            Users & Subs
          </button>
        )}
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'tickets' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
        >
          Support Tickets
        </button>
        {canSeeMatrix && (
          <button 
            onClick={() => setActiveTab('matrix')}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'matrix' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            Language Matrix
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0">
         <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl text-sm outline-none transition-all"
            />
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-bold text-xs uppercase">Fetching Registry...</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {activeTab === 'tickets' && (
              <div className="space-y-4">
                {tickets.length > 0 ? (
                  tickets.filter(t => 
                    (t.message || '').toLowerCase().includes(search.toLowerCase()) || 
                    (t.ticket_no || '').toLowerCase().includes(search.toLowerCase()) ||
                    (t.user_email || '').toLowerCase().includes(search.toLowerCase())
                  ).map(t => (
                    <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex wrap items-center gap-3">
                          <span className="text-sm font-black text-indigo-600">{t.ticket_no}</span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${t.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {t.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{t.message}</p>
                        <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                          <Users size={12}/> {t.user_email} • {t.created_at ? new Date(t.created_at).toLocaleString() : 'Date Unknown'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         {t.status === 'open' ? (
                           <button 
                             onClick={() => updateTicketStatus(t.id, 'resolved')}
                             className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black uppercase hover:bg-green-700 transition-all"
                           >
                             <Check size={14}/> Resolve
                           </button>
                         ) : (
                           <button 
                             onClick={() => updateTicketStatus(t.id, 'open')}
                             className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all"
                           >
                             <MessageSquare size={14}/> Reopen
                           </button>
                         )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 opacity-30 font-black text-xs uppercase tracking-widest">
                    <MessageSquare size={48} className="mx-auto mb-4" />
                    No tickets found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && canSeeUsers && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {users.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">User</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Role</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Phone</th>
                        {canManageBilling && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.filter(u => 
                        (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (u.email || '').toLowerCase().includes(search.toLowerCase())
                      ).map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-600">
                              {safeRoleName(u.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{u.phone || '-'}</td>
                          {canManageBilling && (
                            <td className="px-6 py-4">
                              <button className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-20 opacity-30 font-black text-xs uppercase tracking-widest">
                    <Users size={48} className="mx-auto mb-4" />
                    No users found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matrix' && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <LayoutGrid size={48} className="text-indigo-600 mb-4" />
                <h3 className="text-lg font-black text-slate-800 uppercase">Global Linguistic Matrix</h3>
                <p className="text-sm text-slate-500 max-w-xs">Matrix Management tools are accessible for Global Admins only.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
