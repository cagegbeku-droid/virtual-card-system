import React, { useState } from 'react';
import { X, Shield, Snowflake, Play, Sliders, Globe, ShoppingBag, KeyRound, MapPin, Trash2, Check, Loader2 } from 'lucide-react';

export default function CardControlsModal({
  card,
  details,
  isOpen,
  onClose,
  onUpdated,
  onTerminated,
}) {
  if (!isOpen || !card) return null;

  const [isFrozen, setIsFrozen] = useState(card.status === 'FROZEN');
  const [dailyLimit, setDailyLimit] = useState(card.daily_limit);
  const [perTxLimit, setPerTxLimit] = useState(card.per_tx_limit);
  const [onlineEnabled, setOnlineEnabled] = useState(card.online_enabled);
  const [intlEnabled, setIntlEnabled] = useState(card.intl_enabled);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleFreeze = async () => {
    const newStatus = isFrozen ? 'ACTIVE' : 'FROZEN';
    setSaving(true);
    try {
      const response = await fetch(`/api/cards/${card.id}/controls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setIsFrozen(!isFrozen);
        onUpdated?.();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimits = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/cards/${card.id}/controls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_limit: parseFloat(dailyLimit),
          per_tx_limit: parseFloat(perTxLimit),
          online_enabled: onlineEnabled,
          intl_enabled: intlEnabled,
        }),
      });
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        onUpdated?.();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTerminate = async () => {
    if (window.confirm('Are you sure you want to permanently deactivate and delete this virtual card? This cannot be undone.')) {
      setSaving(true);
      try {
        const response = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
        if (response.ok) {
          onTerminated?.();
          onClose();
        }
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Card Security & Controls</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Freeze Action */}
        <div className="my-6 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isFrozen ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isFrozen ? <Snowflake className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {isFrozen ? 'Card is Frozen' : 'Card is Active'}
              </p>
              <p className="text-xs text-zinc-400">
                {isFrozen ? 'All authorizations are declined' : 'Card ready for online transactions'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleFreeze}
            disabled={saving}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isFrozen
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-400/30'
            }`}
          >
            {isFrozen ? 'Unfreeze' : 'Freeze Card'}
          </button>
        </div>

        {/* Full Details & Billing Info (Always accessible in Security Modal) */}
        <div className="mb-6 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-1">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Card Credentials & Billing Details</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-zinc-400">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Full PAN</span>
              <span className="font-mono text-zinc-200">{details?.card_number || card.masked_number}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">CVV2</span>
              <span className="font-mono text-zinc-200 font-bold">{details?.cvv || '•••'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">ATM PIN</span>
              <span className="font-mono text-zinc-200 font-bold">{details?.pin || '1234'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Postal Code</span>
              <span className="font-mono text-zinc-200">{card.postal_code || 'GA-110-2345'}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-800/80 flex items-start gap-1.5 text-zinc-400">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500" />
            <span className="text-[11px]">{card.billing_address}</span>
          </div>
        </div>

        {/* Limits & Channel Preferences */}
        <form onSubmit={handleSaveLimits} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-zinc-400">Daily Spending Limit</label>
              <span className="font-mono text-xs font-bold text-white">${dailyLimit} USD</span>
            </div>
            <input
              type="range"
              min="20"
              max="2000"
              step="10"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-zinc-400">Per-Transaction Limit</label>
              <span className="font-mono text-xs font-bold text-white">${perTxLimit} USD</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={perTxLimit}
              onChange={(e) => setPerTxLimit(e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Channels */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Payment Channels
            </label>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-xs font-medium text-white">Online E-Commerce</p>
                  <p className="text-[10px] text-zinc-500">Allow payments on websites & web apps</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={onlineEnabled}
                onChange={(e) => setOnlineEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-xs font-medium text-white">International Usage</p>
                  <p className="text-[10px] text-zinc-500">Allow overseas merchants & multi-currency billing</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={intlEnabled}
                onChange={(e) => setIntlEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : null}
            <span>{saveSuccess ? 'Controls Saved!' : 'Save Limit Changes'}</span>
          </button>
        </form>

        {/* Delete / Terminate Card */}
        <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-rose-400">Danger Zone</p>
            <p className="text-[10px] text-zinc-500">Permanently deactivate this virtual card</p>
          </div>
          <button
            onClick={handleTerminate}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs border border-rose-800/40 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Terminate Card</span>
          </button>
        </div>
      </div>
    </div>
  );
}
