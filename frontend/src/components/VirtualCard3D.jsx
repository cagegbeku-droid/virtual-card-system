import React, { useState, useRef } from 'react';
import { Snowflake, Copy, Check } from 'lucide-react';

export default function VirtualCard3D({
  card,
  details,
  revealed,
  onToggleReveal,
}) {
  const [copied, setCopied] = useState(false);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  if (!card) return null;

  const isFrozen = card.status === 'FROZEN';

  // Subtle natural 3D tilt tracking (without artificial glare or neon glow)
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setRotX(rotateX);
    setRotY(rotateY);
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  const handleCopyNumber = (e) => {
    e.stopPropagation();
    const panToCopy = revealed && details?.card_number
      ? details.card_number.replace(/\s+/g, '')
      : (card.masked_number || '').replace(/\s+/g, '');
    navigator.clipboard.writeText(panToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayPan = revealed && details?.card_number
    ? details.card_number
    : card.masked_number || '4512 7800 1234 5678';
  
  const displayCvv = revealed && details?.cvv ? details.cvv : '***';
  const displayExpiry = `${String(card.expiry_month || 9).padStart(2, '0')}/${String(card.expiry_year || 27).slice(-2)}`;
  const cardholder = (card.cardholder_name || 'OLUWASEUN ADESINA').toUpperCase();

  return (
    <div
      className="relative w-full max-w-[440px] select-none mx-auto perspective-[1000px]"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 
        AUTHENTIC PHYSICAL VISA CARD:
        - No colored neon glow in background
        - Realistic subtle physical drop shadow onto desk/surface
        - Standard CR80 bank card proportions (85.6mm x 53.98mm ~ 1.58:1)
      */}
      <div
        ref={cardRef}
        className="relative w-full h-[260px] sm:h-[268px] rounded-2xl p-6 sm:p-7 text-white overflow-hidden border border-slate-700/80 transition-transform duration-200 ease-out will-change-transform shadow-[0_16px_36px_rgba(0,0,0,0.65)]"
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
          transformStyle: 'preserve-3d',
          // Realistic brushed dark titanium alloy texture
          background: 'linear-gradient(135deg, #222631 0%, #161922 45%, #0D0F15 100%)',
        }}
      >
        {/* Subtle realistic brushed metal horizontal grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)`,
          }}
        />

        {/* Subtle physical card edge highlight (matte plastic/metal rim) */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

        {/* Frozen Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-[#070A12]/92 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-slate-200">
            <div className="p-3 bg-slate-800 rounded-full mb-2 border border-slate-700 shadow-lg">
              <Snowflake className="w-6 h-6 text-sky-400" />
            </div>
            <span className="font-bold text-xs tracking-widest uppercase font-mono text-slate-200">
              Card Suspended
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Online transactions blocked</span>
          </div>
        )}

        {/* TOP ROW: BRAND & AUTHENTIC WHITISH VISA LOGO (NO GLOW) */}
        <div className="flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] sm:text-xs tracking-[0.18em] text-slate-200 uppercase font-sans">
              AFRIVISA
            </span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.14em] text-slate-400 uppercase font-sans">
              GLOBAL VIRTUAL CARD
            </span>
          </div>

          {/* Genuine Crisp Whitish VISA Logo (No glow, authentic wordmark styling) */}
          <div className="relative flex items-center">
            <svg
              className="h-7 w-auto fill-white"
              viewBox="0 0 100 32"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="VISA"
            >
              {/* Official Visa Wordmark Geometry */}
              <path d="M37.8 2.2L26.4 29.5H19.2L11.7 8.3C11.3 6.6 11 6 9.6 5.2C7.3 4 3.4 2.8 0 2.1L0.2 1.1H13.6C15.4 1.1 16.9 2.3 17.3 4.4L20.6 22L29.3 2.2H37.8ZM70.4 20.2C70.4 12.5 59.8 12.1 59.9 8.6C60 7.6 61 6.4 63.3 6.1C64.4 5.9 67.7 5.8 71.3 7.5L72.6 1.6C70.9 1 68.6 0.4 65.7 0.4C57.6 0.4 52 4.7 51.9 10.9C51.8 15.5 56 18 59.1 19.5C62.4 21.1 63.5 22.1 63.5 23.5C63.4 25.7 60.8 26.6 58.4 26.7C54.3 26.7 52 25.6 50.1 24.7L48.7 30.8C50.5 31.6 53.9 32.3 57.4 32.4C66.1 32.4 71.6 28 71.7 21.3L70.4 20.2ZM91.8 29.5H98.1L92.7 2.2H86.9C85.3 2.2 84 3.1 83.4 4.6L71.3 29.5H79.3L80.9 25.1H90.7L91.8 29.5ZM83 19.6L87.2 8.3L89.6 19.6H83ZM49.9 2.2L43.6 29.5H36.3L42.6 2.2H49.9Z" />
            </svg>
          </div>
        </div>

        {/* MIDDLE-LEFT: PHOTOREALISTIC GOLD EMV SIM PLATE & CONTACTLESS SYMBOL */}
        <div className="flex items-center gap-3.5 mt-5 sm:mt-6 z-10 relative">
          {/* 
            AUTHENTIC REALISTIC GOLD EMV SMART CHIP (ISO/IEC 7816-2)
            Segmented micro-pad contact traces, matte/brushed gold finish
          */}
          <div className="relative w-12 h-9 rounded-md overflow-hidden border border-[#967126] shadow-inner">
            <svg
              className="w-full h-full"
              viewBox="0 0 54 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="goldPlate" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5D061" />
                  <stop offset="35%" stopColor="#E5B537" />
                  <stop offset="70%" stopColor="#C49320" />
                  <stop offset="100%" stopColor="#DFB035" />
                </linearGradient>
                <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A07416" />
                  <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#966B10" />
                </linearGradient>
              </defs>

              {/* Gold Chip Background Plate */}
              <rect width="54" height="40" rx="3" fill="url(#goldPlate)" />

              {/* Realistic Contact Pad Isolation Grooves (Thin Dark Etched Lines) */}
              <g stroke="#614309" strokeWidth="1.2" strokeLinecap="round">
                {/* Horizontal Center Divider */}
                <line x1="0" y1="20" x2="54" y2="20" />

                {/* Left/Right Contact Separators */}
                <line x1="16" y1="0" x2="16" y2="40" />
                <line x1="38" y1="0" x2="38" y2="40" />

                {/* Center Pad Curve Inner Box */}
                <rect x="20" y="10" width="14" height="20" rx="2" fill="none" />
                <circle cx="27" cy="20" r="3.5" fill="none" />
              </g>

              {/* Metallic Specular Highlights */}
              <rect width="54" height="40" rx="3" fill="url(#goldShine)" opacity="0.18" pointerEvents="none" />
            </svg>
          </div>

          {/* Genuine Contactless Symbol (3 Radio Waves) */}
          <svg
            className="w-5 h-5 text-slate-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-label="Contactless"
          >
            <path d="M8.5 16.5a5 5 0 0 1 0-9" />
            <path d="M12 19a8.5 8.5 0 0 0 0-14" />
            <path d="M15.5 21.5a12 12 0 0 0 0-19" />
          </svg>
        </div>

        {/* 16-DIGIT EMBOSSED MONOSPACE NUMBER (Realistic Physical Stamping) */}
        <div className="mt-4 sm:mt-5 z-10 relative flex items-center justify-between group/num">
          <p
            className="font-mono text-xl sm:text-[22px] tracking-[0.2em] text-slate-100 font-semibold"
            style={{
              textShadow: '0 1px 1px rgba(255,255,255,0.25), 0 -1px 2px rgba(0,0,0,0.9)',
              letterSpacing: '0.18em',
            }}
          >
            {displayPan}
          </p>
          <button
            onClick={handleCopyNumber}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy Card Number"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* BOTTOM ROW: EXPIRY DATE, CARDHOLDER NAME & CVV */}
        <div className="mt-3 sm:mt-4 z-10 relative flex items-end justify-between font-mono">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] uppercase tracking-wider text-slate-400">VALID THRU</span>
              <span
                className="text-slate-100 font-bold text-xs"
                style={{ textShadow: '0 1px 1px rgba(255,255,255,0.2), 0 -1px 1px rgba(0,0,0,0.8)' }}
              >
                {displayExpiry}
              </span>
            </div>
            <span
              className="block text-slate-100 font-bold text-xs sm:text-[13px] uppercase tracking-wider mt-1"
              style={{ textShadow: '0 1px 1px rgba(255,255,255,0.2), 0 -1px 1px rgba(0,0,0,0.8)' }}
            >
              {cardholder}
            </span>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5">CVV</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-100 font-bold tracking-widest text-xs min-w-[28px] text-right">
                {displayCvv}
              </span>
              {/* Clean CVV Toggle (No neon glows) */}
              <button
                type="button"
                onClick={onToggleReveal}
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 border ${
                  revealed
                    ? 'bg-slate-600 border-slate-400'
                    : 'bg-slate-800 border-slate-700'
                }`}
                title={revealed ? 'Hide CVV' : 'Reveal CVV'}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    revealed ? 'translate-x-4' : 'translate-x-0'
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
