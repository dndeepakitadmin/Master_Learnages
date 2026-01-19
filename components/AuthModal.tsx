import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, Lock, Loader2, UserCheck,
  UserPlus, Eye, EyeOff, Smartphone, ArrowRight, CheckCircle2, ShieldCheck, Key, Hash, User, AlertCircle
} from 'lucide-react';

import { supabase } from '../lib/supabaseClient';
import { userService } from '../services/userService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', label: 'IN +91' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'GB +44' },
  { code: '+971', label: 'AE +971' },
  { code: '+65', label: 'SG +65' }
];

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.93H12V14.1H18.17C17.91 15.65 17.06 16.93 15.82 17.77V20.34H19.61C21.6 18.44 22.56 15.63 22.56 12.25Z" fill="#4285F4"/>
      <path d="M12 23C15.03 23 17.58 21.99 19.61 20.34L15.82 17.77C14.77 18.48 13.49 18.93 12 18.93C9.07 18.93 6.59 16.94 5.68 14.38H1.75V17.04C3.75 20.94 7.59 23 12 23Z" fill="#34A853"/>
      <path d="M5.68 14.38C5.43 13.67 5.3 12.87 5.3 12C5.3 11.13 5.43 10.33 5.68 9.62V6.96H1.75V17.04L5.68 14.38Z" fill="#FBBC05"/>
      <path d="M12 5.07C13.61 5.07 15.11 5.64 16.23 6.7L19.69 3.24C17.58 1.24 15.03 0 12 0C7.59 0 3.75 2.06 1.75 5.96L5.68 8.62C6.59 6.06 9.07 4.07 12 4.07V5.07Z" fill="#EA4335"/>
    </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('mobile');

  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [otp, setOtp] = useState('');
  const [resolvedEmailForOtp, setResolvedEmailForOtp] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginCountryCode, setLoginCountryCode] = useState('+91');
  
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountryCode, setRegCountryCode] = useState('+91');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('reset_password')) {
        setMode('forgot');
        setForgotStep(3);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    if (isOpen) {
      setError('');
      setMessage('');
      setPassword('');
      setConfirmPassword('');
      setLoginEmail('');
      setLoginPhone('');
      setForgotStep(1);
      setOtp('');
      setResolvedEmailForOtp('');
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * 🛡️ Advanced Error Extractor
   * Prevents "[object Object]" and handles hidden non-enumerable properties in standard JS Errors.
   */
  const extractErrorString = (err: any): string => {
    if (!err) return '';
    
    console.group("Auth System Diagnostic");
    console.error("Error Object:", err);
    if (err instanceof Error) {
      console.error("Error Name:", err.name);
      console.error("Error Message:", err.message);
    }
    if (err.status) console.error("HTTP Status:", err.status);
    if (err.code) console.error("Error Code:", err.code);
    console.groupEnd();
    
    if (typeof err === 'string') return err;
    
    const extractedMsg = 
      err.message || 
      err.error_description || 
      err.error?.message || 
      err.msg || 
      err.details ||
      err.hint;
    
    if (extractedMsg && typeof extractedMsg === 'string') {
      if (extractedMsg.includes('Failed to fetch') || extractedMsg.includes('NetworkError')) {
        return "Connection Error: The authentication server could not be reached.";
      }
      return extractedMsg;
    }

    if (err.status) {
      if (err.status === 400 || err.code === 'PGRST116') {
        return "Account not found or invalid credentials. Please check and try again.";
      }
      if (err.status === 429) {
        return "Too many attempts. Please wait a few minutes before trying again.";
      }
      if (err.status === 422) {
        return "Validation failed: The verification code may have expired.";
      }
    }

    if (typeof err === 'object') {
      try {
        const stringified = JSON.stringify(err);
        if (stringified && stringified !== '{}') return `Auth Error: ${stringified}`;
      } catch (e) {}
    }
    
    return "An unexpected error occurred. Please verify your details and connection.";
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const parts = email.split('@');
    const user = parts[0];
    const domain = parts[1];
    const visible = user.length > 3 ? user.substring(0, 3) : user.substring(0, 1);
    return `${visible}***@${domain}`;
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      let emailToLogin = '';
      if (!password) throw new Error("Password required");
      if (loginMethod === 'mobile') {
        if (!loginPhone.trim()) throw new Error("Mobile number required");
        const resolvedEmail = await userService.getEmailByPhone(loginPhone, loginCountryCode);
        if (!resolvedEmail) throw new Error("No account linked to this mobile number");
        emailToLogin = resolvedEmail.toLowerCase().trim();
      } else {
        if (!loginEmail.trim()) throw new Error("Email address required");
        emailToLogin = loginEmail.trim().toLowerCase();
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password
      });
      if (authError) throw authError;
      if (data.user) {
        await userService.getCurrentUser();
        onSuccess();
      }
    } catch (err: any) {
      setError(extractErrorString(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (password !== confirmPassword) throw new Error("Passwords do not match");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      const cleanEmail = regEmail.trim().toLowerCase();
      if (!regPhone.trim()) throw new Error("A valid mobile number is required");
      const finalPhone = userService.formatPhone(regPhone, regCountryCode);
      const fullName = `${firstName} ${lastName}`.trim();
      if (!fullName) throw new Error("Please provide your full name");
      
      const exists = await userService.checkPhoneExists(regPhone, regCountryCode);
      if (exists) throw new Error("This mobile number is already registered.");
      
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { 
          data: { full_name: fullName, phone: finalPhone },
          emailRedirectTo: window.location.origin
        }
      });
      if (authError) throw authError;
      
      if (data.user) {
        await userService.createProfile(data.user.id, cleanEmail, finalPhone, fullName);
        setMessage("Account created! Please check your email for verification.");
        setMode('login');
      }
    } catch (err: any) {
      setError(extractErrorString(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      let emailToSend = '';
      if (loginMethod === 'mobile') {
        const resolvedEmail = await userService.getEmailByPhone(loginPhone, loginCountryCode);
        if (!resolvedEmail) throw new Error('No account found for this mobile number');
        emailToSend = resolvedEmail.toLowerCase().trim();
      } else {
        emailToSend = loginEmail.trim().toLowerCase();
        if (!emailToSend) throw new Error('Please enter your email address');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        emailToSend,
        { redirectTo: window.location.origin }
      );

      if (error) throw error;

      setResolvedEmailForOtp(emailToSend);
      setForgotStep(2);
      setMessage(`Security code sent to: ${maskEmail(emailToSend)}`);
    } catch (err: any) {
      setError(extractErrorString(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const emailToVerify = resolvedEmailForOtp.toLowerCase().trim();
      const { data, error } = await supabase.auth.verifyOtp({
        email: emailToVerify,
        token: otp.trim(),
        type: 'recovery' 
      });

      if (error) throw error;
      if (!data.session) throw new Error('Identity verified but session handover failed.');

      setForgotStep(3);
      setMessage('Identity verified. Please set your new password.');
    } catch (err: any) {
      setError(extractErrorString(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalPasswordReset = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage('Password updated successfully!');
      await userService.getCurrentUser();
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(extractErrorString(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(extractErrorString(err));
      setIsLoading(false);
    }
  };

  const renderMethodToggle = () => (
    <div className="bg-[#f1f5f9] p-1.5 rounded-2xl flex mb-8">
        <button 
          onClick={() => { setLoginMethod('mobile'); setError(''); setMessage(''); }}
          className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-3 transition-all ${loginMethod === 'mobile' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Smartphone size={18} /> Mobile
        </button>
        <button 
          onClick={() => { setLoginMethod('email'); setError(''); setMessage(''); }}
          className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-3 transition-all ${loginMethod === 'email' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Mail size={18} /> Email
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 max-h-[95vh] overflow-y-auto">
        
        <div className="bg-[#0f172a] p-8 text-center relative">
          <div className="flex justify-center bg-[#1e293b] p-1 rounded-full w-fit mx-auto mb-8">
            <button 
              onClick={() => { setMode('login'); setForgotStep(1); setError(''); setMessage(''); }} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${mode === 'login' ? 'bg-[#4f46e5] text-white shadow-lg' : 'text-slate-400'}`}
            >
              <UserCheck size={14} /> Login
            </button>
            <button 
              onClick={() => { setMode('register'); setForgotStep(1); setError(''); setMessage(''); }} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${mode === 'register' ? 'bg-[#4f46e5] text-white shadow-lg' : 'text-slate-400'}`}
            >
              <UserPlus size={14} /> Join
            </button>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            {mode === 'forgot' ? 'Reset Password' : mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h2>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl border border-green-100 flex items-start gap-3 animate-in slide-in-from-top-2">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">{message}</p>
            </div>
          )}

          {mode === 'login' && (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all flex justify-center items-center gap-3 shadow-sm"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Or</span>
                </div>
              </div>
              {renderMethodToggle()}
              <div className="space-y-4">
                {loginMethod === 'mobile' ? (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase ml-1">Mobile Number</label>
                    <div className="flex gap-2">
                      <select value={loginCountryCode} onChange={e => setLoginCountryCode(e.target.value)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#4f46e5]/20">
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                      <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#4f46e5]/20" placeholder="9876543210" maxLength={10} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase ml-1">Email Address</label>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#4f46e5]/20" placeholder="you@example.com" />
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase ml-1">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-12 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#4f46e5]/20" placeholder="Enter password" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleLogin} disabled={isLoading} className="w-full bg-[#4f46e5] text-white font-black py-5 rounded-2xl shadow-xl flex justify-center items-center gap-3 uppercase text-sm active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <User size={20}/>} 
                {isLoading ? "Verifying..." : "Login"}
              </button>
              
              <button onClick={() => { setMode('forgot'); setForgotStep(1); setError(''); setMessage(''); }} className="w-full text-xs text-[#4f46e5] font-black uppercase text-center hover:underline tracking-widest mt-2">Forgot Password?</button>
            </>
          )}

          {mode === 'register' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="John" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Mobile Number</label>
                <div className="flex gap-2">
                  <select value={regCountryCode} onChange={e => setRegCountryCode(e.target.value)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                     {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                  <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="9876543210" maxLength={10} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Email Address</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="you@example.com" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Create Password" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Confirm Password" />
              </div>

              <button onClick={handleSignup} disabled={isLoading} className="w-full bg-[#4f46e5] text-white font-black py-5 rounded-2xl shadow-xl flex justify-center items-center gap-3 uppercase text-sm active:scale-95 transition-all mt-4">
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <UserPlus size={20}/>} {isLoading ? "Joining..." : "Create Account"}
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              {forgotStep === 1 && (
                <>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-6 text-center leading-relaxed">Identity verification via security code.</p>
                  {renderMethodToggle()}
                  {loginMethod === 'mobile' ? (
                    <div className="space-y-1.5 mb-6">
                      <label className="text-[11px] font-black text-slate-500 uppercase">Registered Mobile</label>
                      <div className="flex gap-2">
                        <select value={loginCountryCode} onChange={e => setLoginCountryCode(e.target.value)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                          {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                        <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="9035887175" maxLength={10} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 mb-6">
                        <label className="text-[11px] font-black text-slate-500 uppercase">Registered Email</label>
                        <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="you@example.com" />
                    </div>
                  )}
                  <button onClick={handleSendOtp} disabled={isLoading} className="w-full bg-[#4f46e5] text-white font-black py-5 rounded-[1.5rem] flex justify-center items-center gap-3 uppercase text-xs shadow-xl active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <ArrowRight size={20}/>} Send Security Code
                  </button>
                  <button onClick={() => setMode('login')} className="w-full mt-4 text-[10px] font-black uppercase text-slate-400 hover:text-[#4f46e5] transition-colors text-center">Back to Login</button>
                </>
              )}

              {forgotStep === 2 && (
                <div className="space-y-8 text-center py-2">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#4f46e5] shadow-inner"><Hash size={40} /></div>
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Verify Identity</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Code Sent to: <span className="text-[#4f46e5]">{maskEmail(resolvedEmailForOtp)}</span></p>
                  </div>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full p-5 border-2 border-indigo-100 rounded-[2rem] bg-slate-50 text-3xl font-black tracking-[0.5em] text-center outline-none focus:border-[#4f46e5] transition-all" placeholder="000000" maxLength={6} />
                  <button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6} className="w-full py-5 bg-[#4f46e5] text-white font-black rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 uppercase text-xs active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Confirm Identity
                  </button>
                  <button onClick={() => setForgotStep(1)} className="text-[10px] font-black uppercase text-slate-400 hover:text-[#4f46e5] transition-colors">Wrong email or number? Go back</button>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6"><Key size={48} className="mx-auto text-green-500 mb-4"/><h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Set New Password</h3></div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">New Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#4f46e5]/20" placeholder="Min 6 characters" />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-300 hover:text-slate-500 transition-colors">
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Confirm New Password</label>
                        <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#4f46e5]/20" placeholder="Confirm New Password" />
                    </div>
                  </div>
                  <button onClick={handleFinalPasswordReset} disabled={isLoading} className="w-full bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 uppercase text-xs active:scale-95 transition-all mt-4">
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>} Complete Update
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
