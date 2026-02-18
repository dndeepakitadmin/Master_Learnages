import React from 'react';
import { 
  Globe2, CheckCircle2,
  BookOpen, Layers, Activity, HardDrive
} from 'lucide-react';
import { LANGUAGES, SUBSCRIPTION_PLANS, LIMIT_CHARS } from '../constants';

export const AboutSection: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 space-y-20">
      
      <section className="text-center py-12 px-4">
        <div className="inline-flex p-4 bg-[#1d4683] rounded-3xl shadow-xl mb-6">
            <BookOpen className="text-white" size={36} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Master 20+ Languages <br/><span className="text-[#1d4683]">Made Simple</span></h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Learnages is a cutting-edge linguistic engine designed to break down language barriers through phonetic bridging. Whether you're navigating a new city or connecting with global friends, we help you speak correctly from day one.
        </p>
      </section>

      <section className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
            <Activity className="text-[#1d4683]" />
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">The Linguistic Matrix</h2>
        </div>
        <div className="space-y-12">
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              At the heart of Learnages is the <b>Linguistic Matrix Engine</b>. Unlike traditional translators that only give you text, our engine builds a multidimensional map for every phrase. It connects the <b>Language You Know</b> directly to the <b>Target Language</b> using a "Phonetic Bridge"—showing you exactly how to pronounce native scripts using your own language's alphabet.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-[#1d4683] rounded-2xl flex items-center justify-center"><Layers size={24}/></div>
              <h3 className="text-xl font-black text-slate-800">80+ Core Phrases</h3>
              <p className="text-sm text-slate-600 font-medium">Our Knowledge Deck contains curated phrases for Travel, Medical, Social, and Market interactions, manually verified for absolute accuracy.</p>
            </div>
            <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center"><Globe2 size={24}/></div>
              <h3 className="text-xl font-black text-slate-800">Smart Transliteration</h3>
              <p className="text-sm text-slate-600 font-medium">Use our proprietary phonetic typing system. Type the sound of a word on your standard keyboard and see it turn into perfect Native script.</p>
            </div>
            <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center"><HardDrive size={24}/></div>
              <h3 className="text-xl font-black text-slate-800">Verified Precision</h3>
              <p className="text-sm text-slate-600 font-medium">Every time someone uses the Transliterate engine, the results are stored in our global matrix, creating a verified community library of knowledge.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black mb-4">Empowering Learners Everywhere</h2>
                <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                    Our mission is to make high-quality language acquisition accessible. We offer a <b>{LIMIT_CHARS}-character trial</b> for every language pair to let you experience the power of the matrix before you commit.
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {SUBSCRIPTION_PLANS.map(plan => (
                    <div key={plan.id} className={`p-8 rounded-[2.5rem] border-2 transition-all ${plan.bestValue ? 'bg-blue-600/10 border-[#1d4683]' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black">{plan.name}</h3>
                                <p className="text-xs text-blue-400 font-black uppercase tracking-widest mt-1">{plan.days} Day Access</p>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-8 border-b border-white/5 pb-6">
                            <span className="text-6xl font-black text-white">₹{plan.price}</span>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-300 text-sm font-medium"><CheckCircle2 size={18} className="text-blue-400" /> <b>Unlimited Transliteration:</b> No character caps.</li>
                            <li className="flex items-center gap-3 text-slate-300 text-sm font-medium"><CheckCircle2 size={18} className="text-blue-400" /> <b>Full Knowledge Deck:</b> Access all 80+ foundational entries.</li>
                            <li className="flex items-center gap-3 text-slate-300 text-sm font-medium"><CheckCircle2 size={18} className="text-blue-400" /> <b>Interactive Training:</b> Unlimited AI chat & evaluation sessions.</li>
                        </ul>
                    </div>
                ))}
            </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Supported Languages</h2>
            <p className="text-slate-500 font-medium">Explore the matrix across our extensive network of global and regional languages:</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {LANGUAGES.map(lang => (
                <div key={lang.code} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:shadow-md transition-all group">
                    <div className="w-10 h-10 bg-slate-50 group-hover:bg-blue-50 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:text-[#1d4683] text-[10px] uppercase">{lang.code}</div>
                    <span className="font-bold text-slate-700 text-sm">{lang.name}</span>
                </div>
            ))}
        </div>
      </section>

      <section className="text-center pt-10 border-t border-slate-100 mt-12">
        <p className="text-sm text-slate-500 mb-2">
          © {new Date().getFullYear()} Learnages. All rights reserved. Our platform uses verified linguistic matrices and secured cloud synchronization to ensure your learning progress is never lost.
        </p>
        <a 
          href="https://www.learnages.in/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-[#1d4683] hover:underline font-medium"
        >
          Official Website & Privacy Policy
        </a>
      </section>

    </div>
  );
};