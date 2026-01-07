
import React from 'react';
import { BookOpen, MessageCircle, GraduationCap, User as UserIcon, Headphones, Crown, Lock, LogIn, HelpCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: 'translate' | 'chat' | 'quiz' | 'about';
  onTabChange: (tab: 'translate' | 'chat' | 'quiz' | 'about') => void;
  isPro: boolean;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenSupport: () => void;
  onOpenSubscribe: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user, activeTab, onTabChange, isPro,
  onOpenAuth, onOpenProfile, onOpenSupport, onOpenSubscribe
}) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 w-full no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* LEFT SECTION: Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1">
            <NavTab 
              active={activeTab === 'translate'} 
              onClick={() => onTabChange('translate')} 
              icon={<BookOpen size={18} />} 
              label="Study" 
            />
            <NavTab 
              active={activeTab === 'chat'} 
              onClick={() => onTabChange('chat')} 
              icon={<MessageCircle size={18} />} 
              label="Conversation" 
            />
            <NavTab 
              active={activeTab === 'quiz'} 
              onClick={() => onTabChange('quiz')} 
              icon={<GraduationCap size={18} />} 
              label="Quiz"
              locked={!isPro}
            />
            <NavTab 
              active={activeTab === 'about'} 
              onClick={() => onTabChange('about')} 
              icon={<HelpCircle size={18} />} 
              label="About"
            />
          </div>

          {/* RIGHT SECTION: Actions + BRANDING (Top Right Corner) */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 mr-1 sm:mr-3 border-r pr-3 sm:pr-4 border-slate-100">
                <button 
                    onClick={onOpenSubscribe}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isPro ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                    <Crown size={14} className={isPro ? "fill-amber-500 text-amber-600" : "text-slate-400"} />
                    {isPro ? "PRO" : "Go Pro"}
                </button>

                <button onClick={onOpenSupport} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Support">
                    <Headphones size={20} />
                </button>

                {user?.isAuthenticated ? (
                    <button onClick={onOpenProfile} className="p-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-full transition-all group">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <UserIcon size={16} />
                        </div>
                    </button>
                ) : (
                    <button onClick={onOpenAuth} className="p-2 bg-slate-900 text-white rounded-full hover:bg-black transition-all shadow-lg active:scale-95" title="Login">
                        <LogIn size={16} />
                    </button>
                )}
            </div>

            {/* 🖼️ BRANDING: Anchor far right beside user actions */}
            <div 
              className="flex items-center gap-2 cursor-pointer group select-none" 
              onClick={() => onTabChange('translate')}
            >
              <span className="text-xl font-black text-[#1d4683] tracking-tighter uppercase hidden xs:block">Learnages</span>
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-slate-100 shadow-md bg-white transition-all group-hover:scale-110 group-active:scale-95 group-hover:shadow-indigo-200">
                <img 
                  src="./logo.png" 
                  alt="Learnages Logo" 
                  className="w-full h-full object-cover scale-105" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.className = "w-full h-full bg-[#1d4683] flex items-center justify-center text-white font-black text-[10px]";
                    placeholder.innerText = "LA";
                    e.currentTarget.parentElement?.appendChild(placeholder);
                  }} 
                />
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Mobile Tab Bar */}
      <div className="md:hidden border-t border-slate-100 flex justify-around p-2 bg-white/80 backdrop-blur-md sticky top-16 z-30">
         <MobileTab active={activeTab === 'translate'} onClick={() => onTabChange('translate')} icon={<BookOpen size={20} />} label="Study" />
         <MobileTab active={activeTab === 'chat'} onClick={() => onTabChange('chat')} icon={<MessageCircle size={20} />} label="Chat" />
         <MobileTab active={activeTab === 'quiz'} onClick={() => onTabChange('quiz')} icon={<GraduationCap size={20} />} label="Quiz" locked={!isPro} />
         <MobileTab active={activeTab === 'about'} onClick={() => onTabChange('about')} icon={<HelpCircle size={20} />} label="About" />
      </div>
    </nav>
  );
};

const NavTab = ({ active, onClick, icon, label, locked }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
      active 
        ? 'bg-indigo-50 text-[#1d4683] shadow-sm ring-1 ring-indigo-100' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span>{label}</span>
    {locked && <Lock size={12} className="text-slate-400" />}
  </button>
);

const MobileTab = ({ active, onClick, icon, label, locked }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all ${active ? 'text-[#1d4683] bg-indigo-50' : 'text-slate-400'}`}>
        <div className="relative">
            {icon}
            {locked && <div className="absolute -top-1 -right-2 bg-slate-100 rounded-full p-[2px] border border-white"><Lock size={8} /></div>}
        </div>
        <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
);
