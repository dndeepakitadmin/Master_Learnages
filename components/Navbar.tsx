
import React, { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, GraduationCap, User as UserIcon, Crown, LogIn, HelpCircle, Flame, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import { APP_LOGO, APP_NAME } from '../constants';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: 'translate' | 'chat' | 'quiz' | 'about' | 'library';
  onTabChange: (tab: 'translate' | 'chat' | 'quiz' | 'about' | 'library') => void;
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
  const [streak, setStreak] = useState(1);
  const [logoSrc, setLogoSrc] = useState(APP_LOGO);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const lastVisit = localStorage.getItem('last_visit');
    const today = new Date().toDateString();
    const currentStreak = parseInt(localStorage.getItem('streak') || '1');
    
    if (lastVisit !== today) {
      localStorage.setItem('last_visit', today);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastVisit === yesterday.toDateString()) {
        const nextStreak = currentStreak + 1;
        setStreak(nextStreak);
        localStorage.setItem('streak', nextStreak.toString());
      } else {
        setStreak(1);
        localStorage.setItem('streak', '1');
      }
    } else {
      setStreak(currentStreak);
    }
  }, []);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 w-full no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
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

          <div className="flex items-center gap-1.5 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3 border-r pr-2 sm:pr-4 border-slate-100">
                {/* ⚡ DAILY STREAK DISPLAY */}
                <div 
                  className="flex items-center gap-1 px-2 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-xs font-black border border-orange-100 cursor-help" 
                  title="Your Learning Streak: Number of consecutive days you have practiced."
                >
                    <Flame size={14} className="fill-orange-500 text-orange-600" />
                    <span className="text-sm">{streak}</span>
                </div>

                <button 
                    onClick={onOpenSubscribe}
                    title={isPro ? "Pro Status: Unlimited access to all modules active." : "Go Pro: Unlock all language pairs, quizzes, and contribution rewards."}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all border ${isPro ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                    <Crown size={14} className={isPro ? "fill-amber-500 text-amber-600" : "text-slate-400"} />
                    <span className="hidden sm:inline">{isPro ? "PRO" : "Go Pro"}</span>
                </button>

                {user?.isAuthenticated ? (
                    <button 
                      onClick={onOpenProfile} 
                      title="Profile & Settings: Manage your account, phone number, and subscriptions."
                      className="p-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-full transition-all group"
                    >
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <UserIcon size={16} />
                        </div>
                    </button>
                ) : (
                    <button onClick={onOpenAuth} className="p-2 bg-slate-900 text-white rounded-full hover:bg-black transition-all shadow-lg active:scale-95" title="Sign In: Sync your progress and contribute to the dictionary.">
                        <LogIn size={16} />
                    </button>
                )}
            </div>

            <div 
              className="flex items-center gap-2 cursor-pointer group select-none" 
              onClick={() => onTabChange('translate')}
            >
              <span className="text-xl font-black text-[#1d4683] tracking-tighter uppercase hidden sm:block">{APP_NAME}</span>
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 border-white shadow-lg bg-white transition-all group-hover:scale-105">
                {!imageError ? (
                  <img 
                    src={logoSrc} 
                    alt="Logo" 
                    className="w-full h-full object-contain p-0.5" 
                    onError={() => {
                      if (logoSrc.startsWith('/')) {
                        setLogoSrc('./Logo.png');
                      } else {
                        setImageError(true);
                      }
                    }} 
                  />
                ) : (
                  <div className="w-full h-full bg-[#1d4683] flex items-center justify-center text-white font-black text-[10px]">
                    LA
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <div className="md:hidden border-t border-slate-100 flex justify-around p-2 bg-white/95 backdrop-blur-md sticky top-16 z-30">
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
            {locked && <div className="absolute -top-1 -right-2 bg-slate-100 rounded-full p-[2px] border border-white"><Lock size={8} className="text-slate-500" /></div>}
        </div>
        <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
);
