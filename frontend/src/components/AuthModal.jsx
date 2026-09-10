import React, { useState, useEffect } from 'react';
import { X, Smartphone, Lock, User, ArrowRight, AlertCircle, Loader2, CheckCircle2, RefreshCw, Shield } from 'lucide-react';
import { safeFetch } from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'SIGN_IN' }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'REGISTER');
  const [step, setStep] = useState('FORM'); // 'FORM' or 'OTP'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    setIsRegister(initialMode === 'REGISTER');
    setStep('FORM');
    setError('');
    setInfoMessage('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter a valid Ghana mobile number (e.g. 0244123456)');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isRegister && !fullName.trim()) {
      setError('Please enter your full legal name as it appears on your Ghana Card');
      return;
    }

    setLoading(true);

    if (isRegister) {
      // Step 1: Register account -> backend creates user and automatically triggers Arkesel SMS OTP
      const res = await safeFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: cleanPhone,
          password,
          full_name: fullName.trim(),
        }),
      });

      if (!res.ok) {
        setError(res.error || 'Failed to create account. Please verify phone number.');
        setLoading(false);
        return;
      }

      setInfoMessage(`Security OTP code sent via SMS to ${cleanPhone}`);
      setStep('OTP');
      setLoading(false);
    } else {
      // Login flow
      const res = await safeFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: cleanPhone,
          password,
        }),
      });

      if (!res.ok) {
        setError(res.error || 'Invalid mobile number or password');
        setLoading(false);
        return;
      }

      const token = res.data.access_token;
      const user = res.data.user;
      localStorage.setItem('coratech_token', token);
      onAuthSuccess?.(user, token);
      onClose();
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.trim().length < 4) {
      setError('Please enter the 6-digit code received via SMS');
      return;
    }

    setLoading(true);
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '').replace(/-/g, '');

    const res = await safeFetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: cleanPhone,
        otp_code: otpCode.trim(),
      }),
    });

    if (!res.ok) {
      setError(res.error || 'Invalid verification code. Please try again.');
      setLoading(false);
      return;
    }

    // Success! Save JWT and session user
    const token = res.data.access_token;
    const user = res.data.user;
    localStorage.setItem('coratech_token', token);
    onAuthSuccess?.(user, token);
    onClose();
    setLoading(false);
  };

  const resetModal = () => {
    setStep('FORM');
    setError('');
    setInfoMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-slate-100">
      <div className="relative w-full max-w-md bg-[#0C101A] border border-[#1C2538] rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={resetModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151D2F] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'FORM' ? (
          <div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  AfriVisa Security
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {isRegister ? 'Create Your Account' : 'Sign In to AfriVisa'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {isRegister
                  ? 'Instantly issue virtual Visa cards funded with Mobile Money'
                  : 'Manage your virtual cards, balances, and real-time ledger'}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl mb-4 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitialSubmit} className="space-y-3.5 text-xs font-mono">
              {isRegister && (
                <div>
                  <label className="block text-[11px] text-slate-300 uppercase font-semibold mb-1">
                    Full Legal Name (Matching Ghana Card)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Kwame Mensah"
                      className="w-full bg-[#121826] border border-[#1E293F] rounded-xl py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-semibold mb-1">
                  Ghana Mobile Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="024 412 3456"
                    className="w-full bg-[#121826] border border-[#1E293F] rounded-xl py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Supports MTN MoMo, Telecel Cash, and AT Money
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-semibold mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#121826] border border-[#1E293F] rounded-xl py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 font-sans mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Continue to SMS OTP Verification' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-[#1C2538] text-center text-xs font-mono text-slate-400">
              {isRegister ? (
                <p>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                    }}
                    className="text-cyan-400 hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                    }}
                    className="text-cyan-400 hover:underline font-semibold"
                  >
                    Create Account
                  </button>
                </p>
              )}
            </div>
          </div>
        ) : (
          /* STEP 2: ARKESEL SMS OTP VERIFICATION */
          <div className="py-2">
            <div className="w-12 h-12 rounded-xl bg-[#121826] border border-[#1E293F] flex items-center justify-center mx-auto mb-3 text-cyan-400 shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-white">Enter SMS Verification Code</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                We sent a 6-digit security code via Arkesel SMS to:
              </p>
              <p className="text-xs font-bold text-cyan-400 font-mono mt-0.5">{phoneNumber}</p>
            </div>

            {infoMessage && (
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs rounded-xl mb-3 font-mono text-center">
                {infoMessage}
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl mb-3 font-mono text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-[#121826] border border-[#1E293F] rounded-xl py-3 text-center text-xl font-mono tracking-[0.3em] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 font-sans shadow-lg shadow-cyan-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Phone Number</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="hover:text-white"
                >
                  Change phone number
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '').replace(/-/g, '');
                    await safeFetch('/api/auth/send-otp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ phone_number: cleanPhone }),
                    });
                    setInfoMessage('New OTP code sent!');
                  }}
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend SMS</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
