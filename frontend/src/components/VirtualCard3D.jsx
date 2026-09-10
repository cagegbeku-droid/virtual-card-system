import React, { useState } from 'react';
import { Wifi, Snowflake, Copy, Check } from 'lucide-react';

export default function VirtualCard3D({
  card,
  details,
  revealed,
  onToggleReveal,
}) {
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const isFrozen = card.status === 'FROZEN';

  const handleCopyNumber = (e) => {
    e.stopPropagation();
    const panToCopy = revealed && details?.card_number
      ? details.card_number.replace(/\s+/g, '')
      : card.masked_number.replace(/\s+/g, '');
    navigator.clipboard.writeText(panToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayPan = revealed && details?.card_number
    ? details.card_number
    : card.masked_number || '4512 7800 1234 5678';
  
  const displayCvv = revealed && details?.cvv ? details.cvv : '***';
  const displayExpiry = `${String(card.expiry_month || 9).padStart(2, '0')}/${String(card.expiry_year || 27).slice(-2)}`;
  const cardholder = card.cardholder_name || 'OLUWASEUN ADESINA';

  return (
    <div className="relative w-full max-w-[440px] select-none mx-auto">
      {/* CARD BODY WITH RADIAL BRUSHED TITANIUM TEXTURE & CYAN GLOW */}
      <div
        className="relative w-full h-[255px] rounded-2xl p-6 text-white overflow-hidden shadow-2xl border border-slate-700/60 transition-all duration-300"
        style={{
          background: 'radial-gradient(circle at 45% 45%, #242938 0%, #151924 45%, #0B0E17 100%)',
          boxShadow: '0 18px 45px -8px rgba(6, 182, 212, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12) inset',
        }}
      >
        {/* Subtle Conic Brushed Metallic Lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.15) 60deg, transparent 120deg, rgba(255,255,255,0.15) 180deg, transparent 240deg, rgba(255,255,255,0.15) 300deg, transparent 360deg)',
          }}
        />

        {/* Frozen Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-[#070A12]/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-slate-200">
            <div className="p-2.5 bg-slate-800 rounded-full mb-1.5 border border-slate-700">
              <Snowflake className="w-5 h-5 text-sky-400" />
            </div>
            <span className="font-bold text-xs tracking-wider uppercase">Card Frozen</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Authorizations blocked</span>
          </div>
        )}

        {/* Top Header: Brand & Visa Logo */}
        <div className="flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-[0.14em] text-slate-200 uppercase font-mono">
              AFRIVISA
            </span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-[10px] tracking-[0.12em] text-slate-400 uppercase font-mono">
              GLOBAL VIRTUAL CARD
            </span>
          </div>

          <div className="relative">
            <span
              className="text-2xl font-black italic tracking-tighter text-[#22D3EE] drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]"
              style={{ fontFamily: 'sans-serif' }}
            >
              VISA
            </span>
          </div>
        </div>

        {/* EMV Chip & Contactless Symbol */}
        <div className="flex items-center gap-3 mt-4 z-10 relative">
          {/* Metallic Cyan EMV Chip */}
          <div className="w-12 h-9 rounded-md bg-gradient-to-br from-cyan-200 via-teal-400 to-cyan-700 p-0.5 shadow-md border border-cyan-200/50 flex flex-col justify-around px-1">
            <div className="h-[1px] bg-teal-900/40 w-full" />
            <div className="flex justify-between">
              <div className="w-2.5 h-2 border border-teal-900/50 rounded-xs" />
              <div className="w-2.5 h-2 border border-teal-900/50 rounded-xs" />
            </div>
            <div className="h-[1px] bg-teal-900/40 w-full" />
          </div>

          {/* Contactless waves */}
          <Wifi className="w-5 h-5 text-cyan-300/80 rotate-90" />
        </div>

        {/* 16-Digit PAN with Copy Action */}
        <div className="mt-4 z-10 relative flex items-center justify-between group">
          <p className="font-mono text-xl sm:text-[22px] tracking-[0.18em] text-slate-100 font-semibold drop-shadow-sm">
            {displayPan}
          </p>
          <button
            onClick={handleCopyNumber}
            className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
            title="Copy Card Number"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Bottom Details: Expiry, CVV Toggle, Cardholder */}
        <div className="mt-4 z-10 relative flex items-end justify-between text-xs font-mono">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Expiry</span>
            <span className="text-slate-200 font-bold text-xs">{displayExpiry}</span>
            <span className="block text-slate-200 font-bold text-xs uppercase tracking-wider mt-1.5">
              {cardholder}
            </span>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">CVV</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-200 font-bold tracking-widest text-xs">{displayCvv}</span>
              {/* CVV Toggle Pill */}
              <button
                type="button"
                onClick={onToggleReveal}
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 border ${
                  revealed
                    ? 'bg-cyan-500/30 border-cyan-400'
                    : 'bg-slate-700/80 border-slate-600'
                }`}
                title={revealed ? 'Hide CVV' : 'Reveal CVV'}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    revealed ? 'translate-x-4 bg-cyan-300' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
