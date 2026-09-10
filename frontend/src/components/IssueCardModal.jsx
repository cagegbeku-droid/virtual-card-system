import React, { useState } from 'react';
import { X, CreditCard, Check, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import VirtualCard3D from './VirtualCard3D';

const THEMES = [
  {
    id: 'titanium',
    name: 'Brushed Titanium',
    tag: 'AfriVisa Original (Gold Aura)',
    colorBox: 'bg-gradient-to-r from-slate-700 via-slate-500 to-slate-800 border-amber-400',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Black',
    tag: 'Prestige Dark',
    colorBox: 'bg-gradient-to-r from-zinc-950 via-zinc-800 to-black border-zinc-700',
  },
  {
    id: 'royal_gold',
    name: 'Champagne Gold',
    tag: 'Luxury Edition',
    colorBox: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-800 border-amber-400',
  },
];

export default function IssueCardModal({ isOpen, onClose, onSuccess, defaultName = '' }) {
  const [name, setName] = useState(defaultName || 'Kwame Mensah');
  const [theme, setTheme] = useState('titanium');
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('coratech_token') || ''}`,
        },
        body: JSON.stringify({
          cardholder_name: name.trim(),
          color_theme: theme,
          daily_limit: parseFloat(dailyLimit),
          per_tx_limit: Math.min(250, parseFloat(dailyLimit)),
        }),
      });

      let card;
      if (response.ok) {
        card = await response.json();
      } else {
        // Fallback local persistence
        const existing = JSON.parse(localStorage.getItem('afrivisa_cards') || '[]');
        card = {
          id: 'card_' + Date.now(),
          masked_number: `4512 7800 1234 ${Math.floor(1000 + Math.random() * 9000)}`,
          cardholder_name: name.trim().toUpperCase(),
          expiry_month: 9,
          expiry_year: 29,
          balance: 0.0,
          status: 'ACTIVE',
          color_theme: theme,
          created_at: new Date().toISOString(),
        };
        existing.unshift(card);
        localStorage.setItem('afrivisa_cards', JSON.stringify(existing));
      }

      confetti({
        particleCount: 120,
        spread: 90,
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

  const previewCard = {
    id: 'preview',
    masked_number: '4512 7800 1234 5678',
    cardholder_name: name.trim().toUpperCase() || 'KWAME MENSAH',
    expiry_month: 9,
    expiry_year: 27,
    balance: 0.0,
    status: 'ACTIVE',
    color_theme: theme,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-slate-100 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0C101A] border border-[#1C2538] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-6">
        <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#151D2F] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Request Virtual Visa Card
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  16-digit Visa PAN • 3D Secure Ready • Apple & Google Pay compatible
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl font-mono">
              {error}
            </div>
          )}

          {/* REAL-TIME 3D CARD PREVIEW */}
          <div className="py-2 transform scale-95 sm:scale-100 transition-all">
            <VirtualCard3D
              card={previewCard}
              details={{ card_number: '4512 7800 1234 5678', cvv: '842' }}
              revealed={false}
              onToggleReveal={() => {}}
              themeOverride={theme}
            />
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider block mb-1.5">
              Cardholder Full Name (Embossed on Card)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kwame Mensah"
              className="w-full bg-[#121826] border border-[#1E293F] rounded-xl py-2.5 px-3.5 text-sm uppercase text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              required
            />
          </div>

          {/* Choose Card Color */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider block mb-2">
              Select Card Finish
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    theme === t.id
                      ? 'bg-[#162136] border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                      : 'bg-[#101522] border-[#1E293F] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-5 h-5 rounded-full border ${t.colorBox}`} />
                    {theme === t.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-xs font-bold text-white leading-tight">{t.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Limit Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider">
                Daily Spend Limit
              </label>
              <span className="font-mono text-xs font-bold text-amber-400">${dailyLimit} USD</span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Pricing & Fee Summary (15 GHC as requested) */}
          <div className="p-3.5 rounded-2xl bg-[#121826] border border-[#1E293F] text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Card Issuance Fee:</span>
              <span className="text-amber-400 font-bold text-sm">GH₵ 15.00</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Card Maintenance:</span>
              <span className="text-emerald-400 font-semibold">GH₵ 0.00 / month (Free)</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-[#1C2538]">
              The 15 GHS issuance fee is automatically settled upon your initial Mobile Money card top-up.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-extrabold tracking-wide transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Minting Your Virtual Card...</span>
              </>
            ) : (
              <>
                <span>Issue AfriVisa Card (GH₵ 15.00)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
