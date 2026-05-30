import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, CheckCircle, ArrowLeft, ShieldCheck, Key, AlertTriangle, Sparkles } from 'lucide-react';
import { saasApi, setAuthToken } from '../lib/authSupport';
import { UserSession } from '../types';

interface AuthViewsProps {
  onAuthSuccess: (user: UserSession) => void;
  onClose: () => void;
}

type Mode = 'login' | 'signup' | 'forgot' | 'verify-email' | 'reset-password';

export default function AuthViews({ onAuthSuccess, onClose }: AuthViewsProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Field states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Sandbox testing helper state to capture generated codes on UI
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
    setSimulatedCode(null);
  };

  // Google Sign-In Flow Handler
  const handleGoogleSignIn = async () => {
    resetMessages();
    setLoading(true);
    try {
      // 1. Construct the absolute redirect URI pointing to our callback
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;

      // 2. Fetch the target auth URL from backend
      const response = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) {
        throw new Error('Failed to retrieve Google login route parameters.');
      }
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('Invalid URL returned from authentication config.');
      }

      // 3. Open the popup window displaying Google's Auth URL (or the Sandbox)
      const popupWidth = 500;
      const popupHeight = 650;
      const left = window.screen.width / 2 - popupWidth / 2;
      const top = window.screen.height / 2 - popupHeight / 2;
      
      const authWindow = window.open(
        data.url,
        'google_oauth_popup',
        `width=${popupWidth},height=${popupHeight},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );

      if (!authWindow) {
        throw new Error('SignIn Popup was blocked by your browser. Please allow popups for CanvaCloud.');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In initialization failed.');
      setLoading(false);
    }
  };

  // Listen for the cross-origin postMessage containing session payload
  React.useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      // Confirm the origin is trusted (ours or localhost)
      const origin = event.origin;
      const hostIsTrusted = origin.endsWith('.run.app') || origin.includes('localhost') || origin.includes('127.0.0.1');
      if (!hostIsTrusted) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user } = event.data;
        if (token && user) {
          setAuthToken(token);
          onAuthSuccess(user);
        } else {
          setError('Google response parsed but was missing token descriptors.');
        }
        setLoading(false);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [onAuthSuccess]);

  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please check that all fields are filled.');
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      const res = await saasApi.sendOtp(email, 'signup');
      setSuccessMsg('Verification code sent to your email.');
      if (res.otpSimulated) {
        setSimulatedCode(res.otpSimulated);
      }
      setMode('verify-email');
    } catch (err: any) {
      setError(err.message || 'OTP dispatch failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please fill in the 6-digit OTP verification code.');
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      const res = await saasApi.signup({ name, email, password, phone, otpCode });
      setAuthToken(res.token);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Verification rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      const res = await saasApi.login({ email, password });
      setAuthToken(res.token);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please specify your registered account email.');
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      const res = await saasApi.forgotPassword(email);
      setSuccessMsg('Reset code dispatched to your registered address.');
      if (res.otpSimulated) {
        setSimulatedCode(res.otpSimulated);
      }
      setMode('reset-password');
    } catch (err: any) {
      setError(err.message || 'Verification coordinate failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) {
      setError('Verification code and new password are required.');
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      await saasApi.resetPassword({ email, otpCode, newPassword });
      setSuccessMsg('Password updated flawlessly. Please log in.');
      setMode('login');
      // Clear password states
      setPassword('');
      setNewPassword('');
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Reset rejected.');
    } finally {
      setLoading(false);
    }
  };

  // Quick automated test accounts login to facilitate user access
  const handleQuickLogin = async (type: 'admin' | 'user') => {
    resetMessages();
    setLoading(true);
    const targetEmail = type === 'admin' ? 'admin@canvascloud.com' : 'user@canvascloud.com';
    const targetPassword = type === 'admin' ? 'admin123' : 'user123';
    try {
      const res = await saasApi.login({ email: targetEmail, password: targetPassword });
      setAuthToken(res.token);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Outer bounding box card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/95 border border-slate-200 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden flex flex-col relative"
        id="auth-modal-card"
      >
        {/* Background gradient design flares Consistent with Canva UI */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500" />
        
        {/* Header decoration */}
        <div className="px-6 pt-8 pb-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-bold font-sans">C</span>
            </div>
            <span className="font-bold text-base tracking-tight text-slate-800 font-sans">CanvasCloud Suite</span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 font-bold text-xs p-1"
            id="auth-btn-close"
          >
            ✕
          </button>
        </div>

        {/* Messaging Area */}
        <div className="px-6 pt-3">
          {error && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold leading-relaxed"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold leading-relaxed mt-2"
            >
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {simulatedCode && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl mt-2 font-sans"
              id="auth-simulation-toast"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>SMTP SANDBOX INTERCEPTOR</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                SMTP coordinates are blank (sandbox mode). We intercepted your 6-digit passcode:
              </p>
              <div className="mt-2 flex items-center justify-center bg-amber-100 text-amber-900 font-mono font-black text-lg py-1 rounded-md tracking-widest border border-amber-200">
                {simulatedCode}
              </div>
            </motion.div>
          )}
        </div>

        {/* Dynamic Views Carousel */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <AnimatePresence mode="wait">
            
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <motion.div
                key="login"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Sign in to your account</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">Welcome back! Input your credential details to authenticate.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. name@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        id="auth-login-email"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">Password</label>
                      <button 
                        type="button" 
                        onClick={() => { resetMessages(); setMode('forgot'); }} 
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        id="auth-login-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-sans text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
                    id="auth-login-submit"
                  >
                    {loading ? 'Authenticating...' : 'Sign in'}
                  </button>
                </form>

                <div className="relative flex py-2 items-center my-1.5">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold tracking-wider font-mono uppercase">Or Continue With</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs font-semibold rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
                  id="auth-btn-google-sign-in"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.618a5.66 5.66 0 0 1-2.455 3.71v3.08h3.953c2.31-2.13 3.632-5.26 3.632-8.64z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.953-3.08c-1.1.74-2.51 1.18-3.977 1.18-3.06 0-5.65-2.07-6.574-4.86H1.488v3.18A12 12 0 0 0 12 24z"/>
                    <path fill="#FBBC05" d="M5.426 14.33a7.166 7.166 0 0 1-.37-2.33c0-.8.13-1.6.37-2.33V6.49H1.488a11.96 11.96 0 0 0 0 11.02l3.938-3.18z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.488 6.49l3.938 3.18c.924-2.79 3.514-4.92 6.574-4.92z"/>
                  </svg>
                  <span>Google Sign-In</span>
                </button>

                <div className="mt-4 text-center">
                  <span className="text-xs text-slate-400">New around here? </span>
                  <button 
                    type="button" 
                    onClick={() => { resetMessages(); setMode('signup'); }} 
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all font-sans"
                  >
                    Create a free account
                  </button>
                </div>

                {/* Quick Test Logins Container */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <span className="block text-[9px] font-bold text-center text-slate-400 uppercase tracking-widest font-mono mb-3">ADMIN / VISITOR SANDBOX LOGINS</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleQuickLogin('user')}
                      type="button"
                      className="py-1.5 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg text-center cursor-pointer transition-colors font-sans"
                    >
                      👤 Free Visitor Account
                    </button>
                    <button 
                      onClick={() => handleQuickLogin('admin')}
                      type="button"
                      className="py-1.5 px-3 border border-violet-200 hover:border-violet-300 hover:bg-violet-50 text-violet-700 text-xs font-semibold rounded-lg text-center cursor-pointer transition-colors font-sans"
                    >
                      👑 Admin Dashboard
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-2.5 font-sans leading-relaxed">
                    Instantly demo both states without needing active signup integrations.
                  </p>
                </div>
              </motion.div>
            )}

            {/* SIGNUP MODE */}
            {mode === 'signup' && (
              <motion.div
                key="signup"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Create your account</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">Let's set up your profile and secure your credentials.</p>
                </div>

                <form onSubmit={handleSendSignupOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        id="auth-signup-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="John@example.com"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        id="auth-signup-email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">Password (Min. 6 chars)</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        id="auth-signup-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">Mobile Number (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555-0000"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        id="auth-signup-phone"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-sans text-xs font-bold rounded-xl cursor-pointer active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? 'Dispatched Access Code...' : 'Send OTP Verification'}
                  </button>
                </form>

                <div className="relative flex py-2 items-center my-1.5">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold tracking-wider font-mono uppercase">Or Instant Sign Up</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs font-semibold rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
                  id="auth-btn-google-sign-up"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.618a5.66 5.66 0 0 1-2.455 3.71v3.08h3.953c2.31-2.13 3.632-5.26 3.632-8.64z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.953-3.08c-1.1.74-2.51 1.18-3.977 1.18-3.06 0-5.65-2.07-6.574-4.86H1.488v3.18A12 12 0 0 0 12 24z"/>
                    <path fill="#FBBC05" d="M5.426 14.33a7.166 7.166 0 0 1-.37-2.33c0-.8.13-1.6.37-2.33V6.49H1.488a11.96 11.96 0 0 0 0 11.02l3.938-3.18z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.488 6.49l3.938 3.18c.924-2.79 3.514-4.92 6.574-4.92z"/>
                  </svg>
                  <span>Sign up with Google</span>
                </button>

                <div className="mt-4 text-center">
                  <span className="text-xs text-slate-400">Already a registered user? </span>
                  <button 
                    type="button" 
                    onClick={() => { resetMessages(); setMode('login'); }} 
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all font-sans"
                  >
                    Log in
                  </button>
                </div>
              </motion.div>
            )}

            {/* OTP VERIFY MODE */}
            {mode === 'verify-email' && (
              <motion.div
                key="verify-email"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <div className="mb-5 text-center">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 font-sans">Verify your email address</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-sans">
                    We dispatched a secure 6-digit confirmation key code to <strong className="text-slate-800">{email}</strong>. Please input the code below.
                  </p>
                </div>

                <form onSubmit={handleVerifySignup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider text-center mb-2 font-mono">6-Digit Access OTP</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.trim())}
                        placeholder="000000"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-mono"
                        id="auth-verify-code-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-sans text-xs font-bold rounded-xl cursor-pointer active:scale-98 transition-all"
                  >
                    {loading ? 'Verifying Account setup...' : 'Confirm OTP and Register'}
                  </button>
                </form>

                <div className="mt-5 flex items-center justify-between">
                  <button 
                    type="button" 
                    onClick={() => { resetMessages(); setMode('signup'); }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Signup
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
                      resetMessages(); 
                      const res = await saasApi.sendOtp(email, 'signup');
                      setSuccessMsg('New security code re-sent to your address.');
                      if (res.otpSimulated) setSimulatedCode(res.otpSimulated);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-bold font-sans"
                  >
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}

            {/* FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Recover your account</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">Specify your registered account email below to receive a secure passcode to update your credentials.</p>
                </div>

                <form onSubmit={handleForgotTrigger} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        id="auth-forgot-email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-sans text-xs font-bold rounded-xl cursor-pointer active:scale-98 transition-all"
                  >
                    {loading ? 'Dispatched Code...' : 'Get Security Reset Link'}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button 
                    type="button" 
                    onClick={() => { resetMessages(); setMode('login'); }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors font-semibold mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Log In
                  </button>
                </div>
              </motion.div>
            )}

            {/* RESET PASSWORD IMPLEMENTATION MODE */}
            {mode === 'reset-password' && (
              <motion.div
                key="reset-password"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Confirm Password Reset</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">Please check your email and input your reset credentials.</p>
                </div>

                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">6-Digit Reset Passcode</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.trim())}
                        placeholder="000000"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">Specify New Password (Min. 6 chars)</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-sans text-xs font-bold rounded-xl cursor-pointer active:scale-98 transition-all"
                  >
                    {loading ? 'Updating Credentials...' : 'Save and Set New Password'}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button 
                    type="button" 
                    onClick={() => { resetMessages(); setMode('login'); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors font-sans"
                  >
                    Return to Login Page
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
