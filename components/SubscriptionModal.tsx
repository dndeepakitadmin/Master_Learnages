
import React, { useState, useEffect } from 'react';
import { Crown, X, Sparkles, CreditCard, Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { SUBSCRIPTION_PLANS, RAZORPAY_KEY_ID } from '../constants';

interface SubscriptionModalProps {
  isOpen: boolean;
  moduleName: string; 
  onClose: () => void;
  onSubscribe: (days: number, paymentId: string) => Promise<void>;
}

declare global {
    interface Window {
        Razorpay: any;
        Capacitor?: any;
    }
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, moduleName, onClose, onSubscribe }) => {
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS[1]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isNativeAAB, setIsNativeAAB] = useState(false);

  useEffect(() => {
    const isNative = window.Capacitor?.isNativePlatform?.();
    setIsNativeAAB(!!isNative);
  }, []);

  if (!isOpen) return null;

  const handleRazorpay = () => {
    setIsProcessing(true);
    setError('');

    if (!window.Razorpay) {
        setError("Payment SDK not loaded. Check connection.");
        setIsProcessing(false);
        return;
    }

    const options = {
        key: RAZORPAY_KEY_ID,
        amount: Math.round(selectedPlan.price * 100), // In Paise
        currency: "INR",
        name: "Learnages Pro",
        description: `Unlock ${moduleName}`,
        image: "./logo.png",
        // NOTE: Without a backend order_id, payments may go to 'Authorized' status.
        // Ensure your Razorpay Dashboard > Settings > Automatic Capture is ENABLED.
        handler: async function (response: any) {
            setIsSuccess(true);
            try {
                await onSubscribe(selectedPlan.days, response.razorpay_payment_id);
            } catch (err: any) {
                console.error("Post-payment sync failed", err);
            }
        },
        prefill: {
            name: "Learner",
            email: "learner@learnages.com"
        },
        theme: { color: "#1d4683" },
        modal: {
            ondismiss: function() { setIsProcessing(false); }
        }
    };

    try {
        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (e) {
        setError("Failed to open Razorpay.");
        setIsProcessing(false);
    }
  };

  const handleGooglePlayBilling = async () => {
    setIsProcessing(true);
    setError('');
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await onSubscribe(selectedPlan.days, "GPA-MOCK-ID");
        setIsProcessing(false);
        setIsSuccess(true);
    } catch (err: any) {
        setError("Store connection failed.");
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95">
        <div className="h-40 bg-gradient-to-br from-[#1d4683] to-indigo-900 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="bg-white/20 backdrop-blur-xl p-5 rounded-full border border-white/30 mb-2">
                {isSuccess ? <CheckCircle2 className="w-12 h-12 text-white" /> : <Crown className="w-12 h-12 text-white" fill="currentColor" />}
            </div>
            <div className="z-10 text-white font-black text-sm tracking-widest uppercase">
                {isSuccess ? "Access Unlocked" : "Premium Access"}
            </div>
            {!isSuccess && <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-20"><X size={16} /></button>}
        </div>

        <div className="p-8">
            {isSuccess ? (
                <div className="text-center py-8 space-y-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Enjoy Pro Access!</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">Your professional subscription for <b>{moduleName}</b> is now active. Refreshing your Knowledge Deck...</p>
                    <div className="flex justify-center pt-4">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                </div>
            ) : (
                <>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Select Your Pass</h2>
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Full access to {moduleName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {SUBSCRIPTION_PLANS.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan)}
                                className={`relative p-5 rounded-3xl border-2 text-left transition-all ${selectedPlan.id === plan.id ? 'border-[#1d4683] bg-indigo-50/50 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                            >
                                {plan.bestValue && (
                                    <span className="absolute -top-3 left-4 bg-amber-400 text-amber-900 text-[8px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">Best Value</span>
                                )}
                                <p className={`text-[10px] font-black uppercase mb-1 ${selectedPlan.id === plan.id ? 'text-[#1d4683]' : 'text-slate-400'}`}>{plan.name}</p>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-3xl font-black text-slate-900">₹{plan.price}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">/{plan.days}d</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {error && <div className="bg-red-50 text-red-600 text-xs p-4 rounded-2xl mb-6 text-center font-bold border border-red-100 flex items-center gap-2 justify-center"><AlertCircle size={14}/> {error}</div>}

                    <button 
                        onClick={isNativeAAB ? handleGooglePlayBilling : handleRazorpay}
                        disabled={isProcessing}
                        className="w-full py-5 text-white font-black rounded-[1.5rem] shadow-xl bg-slate-900 hover:bg-black flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> Secure Pay ₹{selectedPlan.price}</>}
                    </button>
                    
                    <div className="mt-6 flex flex-col items-center gap-1">
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Secured with Razorpay Standard Checkout</p>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
