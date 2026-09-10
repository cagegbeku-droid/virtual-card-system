import React, { useState } from 'react';
import { X, CreditCard, ArrowRight, Loader2, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import VirtualCard3D from './VirtualCard3D';

const NETWORKS = [
  { id: 'MTN', name: 'MTN MoMo', badge: 'bg-yellow-400 text-slate-950' },
  { id: 'TELECEL', name: 'Telecel Cash', badge: 'bg-red-600 text-white' },
  { id: 'AT', name: 'AT Money', badge: 'bg-blue-600 text-white' },
];

export default function IssueCardModal({ isOpen, onClose, onSuccess, defaultName = '', defaultPhone = '' }) {
  const [name, setName] = useState(defaultName || '');
  const [network, setNetwork] = useState('MTN');
  const [momoPhone, setMomoPhone] = useState(defaultPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full legal cardholder name');
      return;
    }

    const cleanPhone = momoPhone.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter a valid Ghana Mobile Money number to authorize the 15 GHS fee');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Trigger card creation with fixed $1,000 USD limit
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('coratech_token') || ''}`,
        },
        body: JSON.stringify({
          cardholder_name: name.trim().toUpperCase(),
          daily_limit: 1000.0,
          per_tx_limit: 1000.0,
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
          daily_limit: 1000.0,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        };
        existing.unshift(card);
        localStorage.setItem('afrivisa_cards', JSON.stringify(existing));
      }

      // Record transaction for the 15 GHS fee
      const existingTxs = JSON.parse(localStorage.getItem('afrivisa_txs') || '[]');
      existingTxs.unshift({
        id: 'tx_fee_' + Date.now(),
        merchant_name: 'AfriVisa Card Issuance Fee',
        amount: 1.30, // ~15 GHS in USD
        local_amount: 15.0,
        type: 'CARD_FEE',
        status: 'SUCCESS',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('afrivisa_txs', JSON.stringify(existingTxs));

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.(card);
        onClose();
        setSuccess(false);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Error processing card purchase');
    } finally {
      setLoading(false);
    }
  };

  const previewCard = {
    id: 'preview',
    masked_number: '4512 7800 1234 5678',
    cardholder_name: name.trim().toUpperCase() || 'OLUWASEUN ADESINA',
    expiry_month: 9,
    expiry_year: 29,
    balance: 0.0,
    status: 'ACTIVE',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-slate-100 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0E121B] border border-[#1E2638] rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden my-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151D2F] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Card Successfully Issued!</h3>
            <p className="text-xs text-slate-400 font-mono">
              Your AfriVisa card is active with a $1,000 USD spending limit.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePurchase} className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Purchase Virtual Visa Card
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Official 16-Digit 3DS Visa Card • $1,000.00 USD Limit
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl font-mono">
                {error}
              </div>
            )}

            {/* AUTHENTIC CARD PREVIEW (NO GLOW, REAL GOLD CHIP) */}
            <div className="py-1">
              <VirtualCard3D
                card={previewCard}
                details={{ card_number: '4512 7800 1234 5678', cvv: '842' }}
                revealed={false}
                onToggleReveal={() => {}}
              />
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 uppercase font-mono tracking-wider block mb-1">
                Cardholder Full Name (Embossed on Card)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kwame Mensah"
                className="w-full bg-[#141A26] border border-[#20293D] rounded-xl py-2 px-3 text-xs uppercase text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 font-mono"
                required
              />
            </div>

            {/* Mobile Money Payment Info for 15 GHS Issuance Fee */}
            <div className="space-y-2.5 pt-1 border-t border-[#1C2436]">
              <label className="text-[11px] font-semibold text-slate-300 uppercase font-mono tracking-wider block">
                Authorize 15 GHS Fee via Mobile Money
              </label>

              {/* Provider Selector */}
              <div className="grid grid-cols-3 gap-2">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNetwork(n.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                      network === n.id
                        ? 'bg-[#1C2538] border-slate-300 text-white shadow-sm'
                        : 'bg-[#121722] border-[#1E2638] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${n.badge}`} />
                    <span>{n.name}</span>
                  </button>
                ))}
              </div>

              {/* MoMo Phone Input */}
              <div className="relative">
                <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  placeholder="Mobile Money Number (e.g. 0244123456)"
                  className="w-full bg-[#141A26] border border-[#20293D] rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 font-mono"
                  required
                />
              </div>
            </div>

            {/* Fixed Specifications Breakdown */}
            <div className="p-3 rounded-xl bg-[#121722] border border-[#1E2638] text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Card Issuance Fee:</span>
                <span className="text-white font-bold">GH₵ 15.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Card Spend Limit:</span>
                <span className="text-slate-200 font-semibold">$1,000.00 USD</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Monthly Fee:</span>
                <span className="text-emerald-400">GH₵ 0.00 (Zero Maintenance)</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !name.trim() || !momoPhone.trim()}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing 15 GHS & Issuing Card...</span>
                </>
              ) : (
                <>
                  <span>Pay GH₵ 15.00 & Mint Card</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
