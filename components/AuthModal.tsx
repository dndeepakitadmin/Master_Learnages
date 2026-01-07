
import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, Lock, Loader2, UserCheck,
  UserPlus, Eye, EyeOff, Smartphone, ArrowRight, CheckCircle2
} from 'lucide-react';

import { supabase } from '../lib/supabaseClient';
import { userService } from '../services/userService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' }
];

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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      let emailToLogin = '';

      if (!password) {
        throw new Error("Please enter your password");
      }

      if (loginMethod === 'mobile') {
        if (!loginPhone.trim()) {
          throw new Error("Please enter your mobile number");
        }
        
        if (loginCountryCode === '+91' && loginPhone.length !== 10) {
           throw new Error("Please enter a valid 10-digit mobile number.");
        }

        const resolvedEmail = await userService.getEmailByPhone(loginPhone, loginCountryCode);
        
        if (!resolvedEmail) {
          throw new Error("No account found for this mobile number. Have you signed up yet?");
        }
        
        emailToLogin = resolvedEmail;
      } 
      else {
        if (!loginEmail.trim()) {
          throw new Error("Please enter your email address");
        }
        emailToLogin = loginEmail.trim().toLowerCase();
      }

      const { data, error: authError } = await (supabase.auth as any).signInWithPassword({
        email: emailToLogin,
        password
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("invalid login")) {
           throw new Error("Incorrect password or email. Please try again.");
        }
        throw authError;
      }

      if (data.user) {
        await userService.getCurrentUser();
        onSuccess();
      } else {
        throw new Error("Authentication failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const cleanEmail = regEmail.trim().toLowerCase();
      
      if (!regPhone.trim()) throw new Error("Mobile number is required");
      if (regCountryCode === '+91' && regPhone.length !== 10) {
        throw new Error("Please enter a valid 10-digit mobile number");
      }
      
      const finalPhone = userService.formatPhone(regPhone, regCountryCode);

      if (!cleanEmail.includes('@')) {
        throw new Error("Invalid email address");
      }

      const fullName = `${firstName} ${lastName}`.trim();
      if (!fullName) {
        throw new Error("Please enter your name");
      }

      const exists = await userService.checkPhoneExists(regPhone, regCountryCode);
      if (exists) {
        throw new Error("This mobile number is already registered.");
      }

      const { data, error: authError } = await (supabase.auth as any).signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: finalPhone
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        await userService.createProfile(data.user.id, cleanEmail, finalPhone, fullName);
        await userService.getCurrentUser();
        setMessage("Signup successful! You can now log in.");
        setMode('login');
      }

    } catch (err: any) {
      setError(err.message || "Signup failed.");
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
        if (!loginPhone.trim()) throw new Error("Enter your mobile number");
        const resolvedEmail = await userService.getEmailByPhone(loginPhone, loginCountryCode);
        if (!resolvedEmail) throw new Error("No account found.");
        emailToSend = resolvedEmail;
      } else {
        if (!loginEmail.trim()) throw new Error("Enter your email");
        emailToSend = loginEmail.trim().toLowerCase();
      }

      const { error } = await (supabase.auth as any).resetPasswordForEmail(emailToSend);
      if (error) throw error;

      setResolvedEmailForOtp(emailToSend);
      setMessage(`Instructions sent to email.`);
      setForgotStep(2); 
    } catch (err: any) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMethodToggle = () => (
    <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
        <button 
        onClick={() => { setLoginMethod('mobile'); setError(''); setMessage(''); }}
        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${loginMethod === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
        <Smartphone size={16} /> Mobile
        </button>
        <button 
        onClick={() => { setLoginMethod('email'); setError(''); setMessage(''); }}
        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${loginMethod === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
        <Mail size={16} /> Email
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">

        <div className="bg-slate-900 p-6 text-center">
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => { setMode('login'); setError(''); setMessage(''); setForgotStep(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all
                ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <UserCheck size={14} /> Login
            </button>
             <button
              onClick={() => { setMode('register'); setError(''); setMessage(''); setForgotStep(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all
                ${mode === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <UserPlus size={14} /> Join
            </button>
          </div>

          <h2 className="text-xl font-bold text-white uppercase tracking-tight">
            {mode === 'register' && 'Create Account'}
            {mode === 'login' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-xs bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-center font-medium">{error}</p>}
          {message && <p className="text-xs bg-green-50 text-green-600 p-3 rounded-xl border border-green-100 text-center font-bold">{message}</p>}

          {mode === 'login' && (
            <>
              {renderMethodToggle()}

              {loginMethod === 'mobile' ? (
                <div>
                   <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Mobile Number</label>
                   <div className="flex gap-2">
                       <select 
                         value={loginCountryCode}
                         onChange={(e) => setLoginCountryCode(e.target.value)}
                         className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                       >
                          {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                       </select>
                       <input
                            type="tel"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none font-medium tracking-wide"
                            placeholder="9876543210"
                            maxLength={10}
                        />
                   </div>
                </div>
              ) : (
                <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Email Address</label>
                    <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                        placeholder="you@example.com"
                    />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                    placeholder="Enter password"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button onClick={handleLogin} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2">
                 {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
                 {isLoading ? "Verifying..." : "Login"}
              </button>

              <button onClick={() => { setMode('forgot'); setError(''); setMessage(''); setForgotStep(1); }} className="w-full text-xs text-indigo-600 font-bold text-center mt-3 hover:underline">
                 Forgot Password?
              </button>
            </>
          )}

          {mode === 'register' && (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="John" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Mobile Number</label>
                <div className="flex gap-2">
                   <select value={regCountryCode} onChange={(e) => setRegCountryCode(e.target.value)} className="w-[90px] p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold outline-none">
                     {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                   </select>
                   <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none font-medium tracking-wide" placeholder="9876543210" maxLength={10} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Email Address</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="you@example.com" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="Create password" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="Confirm password" />
              </div>

              <button onClick={handleSignup} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl flex justify-center gap-2 mt-2 shadow-lg hover:bg-indigo-700 transition-all items-center">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                {isLoading ? "Joining..." : "Create Account"}
              </button>
            </>
          )}

          {mode === 'forgot' && forgotStep === 1 && (
            <>
              <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                Enter details to receive a <b>password reset link</b>.
              </p>

              {renderMethodToggle()}

              {loginMethod === 'mobile' ? (
                <div>
                   <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Mobile Number</label>
                   <div className="flex gap-2">
                       <select value={loginCountryCode} onChange={(e) => setLoginCountryCode(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                          {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                       </select>
                       <input type="tel" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none font-medium tracking-wide" placeholder="9876543210" maxLength={10} />
                   </div>
                </div>
              ) : (
                <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 ml-1">Email Address</label>
                    <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="you@example.com" />
                </div>
              )}

              <button onClick={handleSendOtp} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-4 flex justify-center hover:bg-indigo-700 items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                {isLoading ? "Sending..." : "Send Reset Email"}
              </button>
            </>
          )}

          {mode === 'forgot' && forgotStep === 2 && (
             <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><CheckCircle2 size={32} /></div>
                <h3 className="font-bold text-slate-800 text-lg">Instructions Sent</h3>
                <p className="text-sm text-slate-500 mt-2">Check your email for the reset link.</p>
                <button onClick={() => setMode('login')} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-6 shadow-md">Back to Login</button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
