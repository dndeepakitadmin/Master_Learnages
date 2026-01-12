
import React, { useState, useEffect } from 'react';
import {
  Crown, X, CreditCard, Loader2, CheckCircle2,
  AlertCircle, LogIn, Copy, Check, ShieldCheck
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, RAZORPAY_KEY_ID, APP_LOGO, APP_NAME } from '../constants';
import { userService } from '../services/userService';
import { UserProfile } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  moduleName: string;
  onClose: () => void;
  onSubscribe: (days: number, paymentId: string) => Promise<void>;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  moduleName,
  onClose,
  onSubscribe
}) => {
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      userService.getCurrentUser().then(setUser);
      setIsProcessing(false);
      setIsSuccess(false);
      setError('');
      setOrderId('');
      setPaymentId('');
      setSelectedPlan(SUBSCRIPTION_PLANS.find(p => p.bestValue) || SUBSCRIPTION_PLANS[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRazorpay = async () => {
    if (!user?.isAuthenticated) {
      setError('You must be logged in to purchase Pro access.');
      return;
    }

    if (!window.Razorpay) {
      setError('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // 1️⃣ Create order via Supabase Edge Function
      const order = await userService.createRazorpayOrder(selectedPlan.price);

      const options = {
        key: RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: `${APP_NAME} Pro`,
        description: `Access for ${moduleName}`,
        image: APP_LOGO || undefined,

        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },

        handler: async (response: any) => {
          // CRITICAL: A tiny delay ensures the browser cleans up the heavy native Razorpay frame
          // before React attempts an intense re-render. Prevents mobile engine crashes.
          setTimeout(async () => {
            try {
              // 2️⃣ Activate subscription AFTER payment success
              await onSubscribe(selectedPlan.days, response.razorpay_payment_id);

              setOrderId(response.razorpay_order_id || order.id);
              setPaymentId(response.razorpay_payment_id);
              setIsSuccess(true);
            } catch (err: any) {
              console.error("Activation failed", err);
              setError(
                'Payment was successful but activation failed. Please contact support with Payment ID: ' +
                response.razorpay_payment_id
              );
            } finally {
              setIsProcessing(false);
            }
          }, 300);
        },

        modal: {
          ondismiss: () => {
            if (!isSuccess) setIsProcessing(false);
          }
        },

        theme: { color: '#1d4683' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isProcessing ? onClose : undefined} />

      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#1d4683] to-indigo-900 p-6 text-white relative">
          <button onClick={onClose} disabled={isProcessing} className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100">
            <X size={18} />
          </button>
          <div className="flex flex-col items-center">
            {isSuccess ? <CheckCircle2 size={48} className="text-green-400 animate-in zoom-in" /> : <Crown size={48} />}
            <h2 className="mt-2 font-black tracking-wide text-lg">
              {isSuccess ? 'Access Unlocked' : 'Upgrade to Pro'}
            </h2>
          </div>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-slate-600">Your Pro access for <b>{moduleName}</b> is now active.</p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Transaction Reference</p>
                <div className="flex justify-center items-center gap-3">
                  <code className="text-xs font-mono text-slate-500">{orderId.slice(0, 16)}...</code>
                  <button onClick={() => copyText(orderId)} className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />}
                  </button>
                </div>
              </div>

              <button onClick={onClose} className="w-full py-4 bg-[#1d4683] text-white rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                Start Learning Now
              </button>
            </div>
          ) : !user?.isAuthenticated ? (
            <div className="text-center py-6 space-y-4">
              <AlertCircle size={48} className="mx-auto text-amber-500" />
              <p className="font-bold text-slate-700">Registration Required</p>
              <p className="text-sm text-slate-500 px-4">Please log in to your account to purchase and sync Pro access across your devices.</p>
              <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                <LogIn size={18} /> Close & Go to Login
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {SUBSCRIPTION_PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
                      plan.id === selectedPlan.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    {plan.bestValue && <div className="absolute -right-6 top-1 bg-indigo-600 text-white text-[8px] font-black uppercase py-1 px-8 rotate-45">Best</div>}
                    <p className="text-2xl font-black text-slate-900">₹{plan.price}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{plan.days} Days Access</p>
                  </button>
                ))}
              </div>

              {error && (
                <div className="text-red-600 text-xs mb-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0" /> 
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <button
                onClick={handleRazorpay}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 transition-all"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                {isProcessing ? 'Initializing...' : `Secure Checkout • ₹${selectedPlan.price}`}
              </button>

              <div className="mt-4 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1 uppercase font-black tracking-widest">
                <ShieldCheck size={14} className="text-green-500" /> Payment Protected & Encrypted
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
