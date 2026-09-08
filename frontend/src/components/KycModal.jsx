import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function KycModal({ isOpen, onClose, onSuccess }) {
  const [ghanaCard, setGhanaCard] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanCard = ghanaCard.trim().toUpperCase();
    if (!cleanCard.startsWith('GHA-') || cleanCard.length < 13) {
      setError('Format must be GHA-XXXXXXXXX-X (e.g. GHA-123456789-0)');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('coratech_token');
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ghana_card_number: cleanCard,
          full_name: fullName.trim(),
          dob,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Identity verification failed');
      }

      setVerified(true);
      confetti({
        particleCount: 80,
        spread: 70,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Error verifying Ghana Card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-zinc-100">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {verified ? (
          <div className="flex flex-col items-center text-center py-6 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Identity Verified!</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Your Ghana Card has been validated under Bank of Ghana regulatory requirements. You can now issue virtual Visa cards.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold tracking-wide transition-all shadow-lg"
            >
              Continue to Card Issuance
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-bold text-white">Ghana Card Verification</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bank of Ghana compliance requires one-time identity verification before card creation.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Ghana Card Pin Number
              </label>
              <input
                type="text"
                value={ghanaCard}
                onChange={(e) => setGhanaCard(e.target.value.toUpperCase())}
                placeholder="GHA-123456789-0"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm uppercase font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Full Name on Ghana Card
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="KWAME MENSAH"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm uppercase text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Verify & Unlock Cards</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
