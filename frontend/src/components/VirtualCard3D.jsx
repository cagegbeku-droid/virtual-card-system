import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Copy, Check, Lock, Snowflake, Wifi } from 'lucide-react';

export default function VirtualCard3D({
  card,
  details,
  revealed,
  onToggleReveal,
  onOpenTopup,
  onOpenControls,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const isFrozen = card.status === 'FROZEN';

  const handleCopyNumber = (e) => {
    e.stopPropagation();
    const panToCopy = revealed && details?.card_number ? details.card_number.replace(/\s+/g, '') : card.masked_number.replace(/\s+/g, '');
    navigator.clipboard.writeText(panToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayPan = revealed && details?.card_number ? details.card_number : card.masked_number;
  const displayCvv = revealed && details?.cvv ? details.cvv : '•••';

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* 3D Physical Card */}
      <div
        className="w-full h-60 perspective-1000 cursor-pointer select-none relative"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`w-full h-full relative duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br from-[#181D2A] via-[#10141F] to-[#0A0D14] border border-[#2A344A] shadow-xl backface-hidden overflow-hidden flex flex-col justify-between"
          >
            {/* Subtle brushed finish */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

            {/* Frozen Banner */}
            {isFrozen && (
              <div className="absolute inset-0 bg-[#0B1220]/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-slate-200 border-2 border-slate-600/50 rounded-2xl">
                <div className="p-2.5 bg-slate-800/80 rounded-full mb-2">
                  <Snowflake className="w-6 h-6 text-sky-400" />
                </div>
                <span className="font-bold text-xs tracking-wider uppercase">Card Frozen</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Authorizations blocked</span>
              </div>
            )}

            {/* Top Bar: Chip & Visa Logo */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {/* Real-style Metallic EMV Chip */}
                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow border border-amber-300/40 flex flex-col justify-around px-1">
                  <div className="h-[1px] bg-amber-900/40 w-full" />
                  <div className="flex justify-between">
                    <div className="w-2 h-2.5 border border-amber-900/50 rounded-xs" />
                    <div className="w-2 h-2.5 border border-amber-900/50 rounded-xs" />
                  </div>
                  <div className="h-[1px] bg-amber-900/40 w-full" />
                </div>
                <Wifi className="w-4 h-4 text-slate-400 rotate-90" />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black italic tracking-tighter text-white">
                  VISA
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 px-1 py-0.5 bg-white/10 rounded">
                  PLATINUM
                </span>
              </div>
            </div>

            {/* Middle: Card Number */}
            <div className="z-10 my-auto">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xl sm:text-2xl tracking-[0.18em] text-slate-100 font-semibold">
                  {displayPan}
                </p>
                <button
                  onClick={handleCopyNumber}
                  className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                  title="Copy Card Number"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                {copied ? 'Copied to clipboard' : 'Click card to flip'}
              </p>
            </div>

            {/* Bottom Bar: Name, Expiry, Balance */}
            <div className="flex items-end justify-between z-10 text-xs">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Cardholder</p>
                <p className="font-semibold text-slate-200 tracking-wide uppercase">
                  {card.cardholder_name}
                </p>
              </div>

              <div className="text-center">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Expires</p>
                <p className="font-mono text-slate-200 font-semibold">
                  {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Balance</p>
                <p className="font-bold text-emerald-400 font-mono text-sm">
                  ${card.balance.toFixed(2)} USD
                </p>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl bg-[#10141F] border border-[#2A344A] shadow-xl backface-hidden rotate-y-180 overflow-hidden flex flex-col justify-between py-5"
          >
            <div className="w-full h-9 bg-black/90 mt-1" />

            <div className="px-6 flex items-center justify-between">
              <div className="flex-1 h-8 bg-slate-200 rounded-sm flex items-center justify-between px-3 text-slate-900 font-mono text-xs">
                <span className="italic text-[9px] text-slate-600 select-none">Authorized Signature</span>
                <span className="font-bold tracking-widest text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                  {displayCvv}
                </span>
              </div>
              <div className="ml-3 text-[10px] text-slate-400 font-mono">
                CVV2
              </div>
            </div>

            <div className="px-6 flex items-center justify-between text-[8px] text-slate-500">
              <p className="max-w-[260px] leading-tight">
                Issued for electronic commerce and internet subscription transactions. Standard cross-border limits apply.
              </p>
              <div className="w-7 h-7 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center font-bold text-[8px] text-slate-400">
                CORA
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        <button
          onClick={onToggleReveal}
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-[#141A26] hover:bg-[#1C2434] text-slate-200 border border-[#1E2536] transition-colors"
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{revealed ? 'Hide' : 'Reveal'}</span>
        </button>

        <button
          onClick={onOpenTopup}
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
        >
          <span>Top Up MoMo</span>
        </button>

        <button
          onClick={onOpenControls}
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-[#141A26] hover:bg-[#1C2434] text-slate-200 border border-[#1E2536] transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Controls</span>
        </button>
      </div>
    </div>
  );
}
