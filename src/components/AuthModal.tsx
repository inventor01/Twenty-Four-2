import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!email || !password) throw new Error('Please fill all fields');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        await signUpWithEmail(email, password, name.trim() || undefined);
      } else {
        if (!email || !password) throw new Error('Please enter your email and password');
        await signInWithEmail(email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message?.replace('Firebase: ', '') || 'Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div
        className="w-full max-w-sm rounded-[32px] p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 120% at 50% 10%, #102636 0%, #0c1c28 45%, #08131d 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white/70 cursor-pointer"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1 mt-1">
          <div className="flex items-center gap-1 select-none">
            <span
              style={{
                font: '700 22px/1 Archivo, sans-serif',
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
              }}
            >
              twenty<span style={{ color: '#38BDF8' }}>four</span>
            </span>
          </div>
          <span
            style={{
              font: "600 10px/1 'JetBrains Mono', monospace",
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#38BDF8',
              marginTop: '4px',
            }}
          >
            {mode === 'signin' ? 'WELCOME BACK' : 'CREATE YOUR SANCTUARY'}
          </span>
          <p
            className="italic text-xs text-white/60 max-w-[240px] leading-relaxed mt-0.5"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '14.5px' }}
          >
            Your private 24-hour balance ledger, synchronized securely.
          </p>
        </div>

        {/* Google Auth Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center gap-3 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-[10px] font-mono text-white/40 uppercase">or with email</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-mono text-white/50">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-[#38BDF8] focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-mono text-white/50">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-[#38BDF8] focus:outline-none font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-mono text-white/50">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-[#38BDF8] focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-1 rounded-2xl font-bold text-xs bg-[#38BDF8] text-black shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? 'Processing...' : mode === 'signin' ? 'Sign In to Sanctuary' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="flex items-center justify-center text-xs text-white/60 gap-1.5 pt-1">
          <span>{mode === 'signin' ? "Don't have a sanctuary?" : 'Already have an account?'}</span>
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setErrorMsg(null);
            }}
            className="text-[#38BDF8] font-semibold hover:underline cursor-pointer"
          >
            {mode === 'signin' ? 'Create one' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
