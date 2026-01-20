
import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, Lock, Loader2, UserCheck,
  UserPlus, Eye, EyeOff, Smartphone, ArrowRight, CheckCircle2, ShieldCheck, Key, Hash, User, AlertCircle, X
} from 'lucide-react';

import { supabase } from '../lib/supabaseClient.ts';
import { userService } from '../services/userService.ts';

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

  const extractErrorString = (err: any): string => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    const message = err.message || err.error_description || err.error?.message || err.msg || "An error occurred during authentication.";
    if (message.includes('Failed to fetch')) return "Network error: The matrix could not be reached.";
    return message;
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [user, domain] = email.split('@');
    return `${user.substring(0, 3)}***@${domain}`;
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      let emailToLogin = '';
      if (!password) throw new Error("Password field cannot be empty.");
      
      if (loginMethod === 'mobile') {
        if (!loginPhone.trim()) throw new Error("Mobile number field cannot be empty.");
        const resolvedEmail = await userService.getEmailByPhone(loginPhone, loginCountryCode);
        if (!resolvedEmail) throw new Error("No account found with this phone number.");
        emailToLogin = resolvedEmail;
      } else {
        if (!loginEmail.trim()) throw new Error("Email address field cannot be empty.");
        emailToLogin = loginEmail.trim().toLowerCase();
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password
      });

      if (authError) throw authError;
      onSuccess();
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
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");
      
      const fullPhone = userService.formatPhone(regPhone, regCountryCode);
      const exists = await userService.checkPhoneExists(regPhone, regCountryCode);
      if (exists) throw new Error("This phone number is already registered.");

      const { data, error: authError } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            phone: fullPhone
          }
        }
      });

      if (authError) throw authError;
      if (data.user) {
        await userService.createProfile(data.user.id, regEmail, fullPhone, `${firstName} ${lastName}`.trim());
        setMessage("Account created! Please check your email to verify your account.");
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
    try {
      let emailToSend = '';
      if (loginMethod === 'mobile') {
        if (!loginPhone.trim()) throw new Error("Please enter your mobile number.");
        const resolvedEmail = await userService.getEmailByPhone(loginPhone, loginCountryCode);
        if (!resolvedEmail) throw new Error("This mobile number is not registered.");
        emailToSend = resolvedEmail;
      } else {
        emailToSend = loginEmail.trim().toLowerCase();
        if (!emailToSend) throw new Error("Please enter your email address.");
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: emailToSend,
        options: { shouldCreateUser: false }
      });

      if (error) throw error;

      setResolvedEmailForOtp(emailToSend);
      setForgotStep(2);
      setMessage(`Verification code sent to ${maskEmail(emailToSend)}`);
    } catch (err: any) {
      setError(extractErrorString(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: resolvedEmailForOtp,
        token: otp,
        type: 'email'
      });

      if (error) throw error;
      if (data.session) {
        setForgotStep(3);
        setMessage("Identity verified. Please set your new secure password.");
      }
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
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage("Password updated successfully! Redirecting...");
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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(extractErrorString(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        <div className="bg-[#0f172a] p-8 text-center relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="flex justify-center bg-[#1e293b] p-1 rounded-full w-fit mx-auto mb-8">
            <button 
              onClick={() => { setMode('login'); setForgotStep(1); setError(''); setMessage(''); }} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              <UserCheck size={14} /> Login
            </button>
            <button 
              onClick={() => { setMode('register'); setForgotStep(1); setError(''); setMessage(''); }} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${mode === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              <UserPlus size={14} /> Join
            </button>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            {mode === 'forgot' ? 'Secure Recovery' : mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h2>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-start gap-3 animate-in shake duration-300">
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
                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all flex justify-center items-center gap-3 shadow-sm active:scale-[0.98]"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center"><span className="bg-white px-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Or</span></div>
              </div>

              <div className="bg-slate-100 p-1 rounded-2xl flex mb-4">
                  <button 
                    onClick={() => setLoginMethod('mobile')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${loginMethod === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Smartphone size={14} /> Mobile
                  </button>
                  <button 
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${loginMethod === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Mail size={14} /> Email
                  </button>
              </div>

              <div className="space-y-4">
                {loginMethod === 'mobile' ? (
                  <div className="flex gap-2">
                    <select value={loginCountryCode} onChange={e => setLoginCountryCode(e.target.value)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="9876543210" maxLength={10} />
                  </div>
                ) : (
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="you@example.com" />
                )}
                
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-12 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Password" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              <button onClick={handleLogin} disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl flex justify-center items-center gap-3 uppercase text-sm active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <ArrowRight size={20}/>} 
                {isLoading ? "Unlocking..." : "Login to Learnages"}
              </button>
              
              <button onClick={() => { setMode('forgot'); setForgotStep(1); setError(''); setMessage(''); }} className="w-full text-[10px] text-indigo-600 font-black uppercase text-center hover:underline tracking-widest">Forgot Password?</button>
            </>
          )}

          {mode === 'register' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="First Name" />
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Last Name" />
              </div>

              <div className="flex gap-2">
                <select value={regCountryCode} onChange={e => setRegCountryCode(e.target.value)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                   {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Mobile Number" maxLength={10} />
              </div>

              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Email Address" />
              
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Create Password (min 6)" />
              </div>

              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Confirm Password" />

              <button onClick={handleSignup} disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl flex justify-center items-center gap-3 uppercase text-sm active:scale-95 transition-all mt-4">
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <UserPlus size={20}/>} {isLoading ? "Processing..." : "Create Account"}
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              {forgotStep === 1 && (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Identify yourself to receive a matrix code</p>
                  </div>

                  <div className="bg-slate-100 p-1 rounded-2xl flex mb-4">
                    <button 
                      onClick={() => setLoginMethod('mobile')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${loginMethod === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      <Smartphone size={14} /> Mobile
                    </button>
                    <button 
                      onClick={() => setLoginMethod('email')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${loginMethod === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      <Mail size={14} /> Email
                    </button>
                  </div>

                  {loginMethod === 'mobile' ? (
                    <div className="flex gap-2">
                      <select value={loginCountryCode} onChange={e => setLoginCountryCode(e.target.value)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                      <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="9876543210" maxLength={10} />
                    </div>
                  ) : (
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none" placeholder="Enter registered email" />
                  )}

                  <button onClick={handleSendOtp} disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] flex justify-center items-center gap-3 uppercase text-xs shadow-xl active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <Key size={20}/>} Request Recovery Code
                  </button>
                  <button onClick={() => setMode('login')} className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 text-center">Return to Login</button>
                </div>
              )}

              {forgotStep === 2 && (
                <div className="space-y-8 text-center py-2">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                    <Hash size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Verify Identity</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Matrix Code sent to your inbox</p>
                  </div>
                  <input 
                    type="text" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    className="w-full p-5 border-2 border-indigo-100 rounded-[2rem] bg-slate-50 text-4xl font-black tracking-[0.5em] text-center outline-none focus:border-indigo-600 transition-all" 
                    placeholder="000000" 
                    maxLength={6} 
                  />
                  <button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6} className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 uppercase text-xs active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Verify Code
                  </button>
                  <button onClick={() => setForgotStep(1)} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600">Incorrect details? Go back</button>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                      <Key size={32} />
                    </div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Reset Password</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Set your new matrix entry key</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                        <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
                        <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-12 p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="New Password" />
                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400">
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Confirm New Password" />
                  </div>

                  <button onClick={handleFinalPasswordReset} disabled={isLoading} className="w-full bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 uppercase text-xs active:scale-95 transition-all mt-4">
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>} Update & Log In
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
              <ShieldCheck size={14} className="text-green-500" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">E2E Matrix Encryption Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
