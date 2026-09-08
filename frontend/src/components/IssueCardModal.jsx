import React, { useState } from 'react';
import { X, CreditCard, Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const THEMES = [
  { id: 'cyber_neon', name: 'Cyber Neon', gradient: 'from-slate-950 via-indigo-950 to-cyan-950 border-cyan-400' },
  { id: 'obsidian', name: 'Obsidian Carbon', gradient: 'from-zinc-800 to-black border-zinc-700' },
  { id: 'royal_gold', name: 'Royal Gold', gradient: 'from-amber-900 to-stone-950 border-amber-500' },
  { id: 'emerald', name: 'Emerald Jade', gradient: 'from-emerald-950 to-teal-950 border-emerald-500' },
];

export default function IssueCardModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('cyber_neon');
  const [dailyLimit, setDailyLimit] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full cardholder name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardholder_name: name.trim(),
          color_theme: theme,
          daily_limit: parseFloat(dailyLimit),
          per_tx_limit: Math.min(250, parseFloat(dailyLimit)),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to issue card');
      }

      const card = await response.json();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      onSuccess?.(card);
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating virtual card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-zinc-100">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Request Virtual Visa Card</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instantly issued with a Luhn-compliant 16-digit Visa PAN, CVV, and 3DS readiness.
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Cardholder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kwame Mensah"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm uppercase text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Theme Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Choose Card Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between bg-gradient-to-br ${t.gradient} ${
                    theme === t.id ? 'ring-2 ring-white/60 shadow-lg scale-[1.02]' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-xs font-semibold text-white drop-shadow-sm">{t.name}</span>
                  {theme === t.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Limit */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Initial Daily Limit
              </label>
              <span className="font-mono text-xs font-bold text-emerald-400">${dailyLimit} USD</span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero Issuance Fees for First Card</span>
            </div>
            <p>You can top up immediately using MTN MoMo, Telecel Cash, or AT Money upon creation.</p>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Minting Virtual Card...</span>
              </>
            ) : (
              <>
                <span>Issue My Virtual Visa Card</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
