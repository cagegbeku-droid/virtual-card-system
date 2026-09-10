import React, { useState } from 'react';
import { X, FileText, Shield, Scale, HelpCircle } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'TERMS' }) {
  const [tab, setTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in text-zinc-100">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Coratech Legal & Regulatory Center</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 my-4 border-b border-zinc-800 pb-3">
          {[
            { id: 'TERMS', label: 'Terms of Service' },
            { id: 'PRIVACY', label: 'Privacy Policy (DPA Ghana)' },
            { id: 'FEES', label: 'Fee Schedule & FX Disclosure' },
            { id: 'REFUNDS', label: 'Refunds & Disputes' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="text-xs text-zinc-300 space-y-4 leading-relaxed pr-2">
          {tab === 'TERMS' && (
            <div>
              <h4 className="text-base font-bold text-white mb-2">1. Cardholder Agreement & Service Terms</h4>
              <p>
                By requesting or using an AfriVisa virtual Visa card issued through Coratech Global ("Coratech", "we", "us"), you agree to these Terms. Cards are denominated in United States Dollars (USD) and issued for electronic, web-based purchases.
              </p>
              <h5 className="text-sm font-semibold text-white mt-4 mb-1">2. Identity Verification (KYC)</h5>
              <p>
                In compliance with Bank of Ghana anti-money laundering (AML) and combating the financing of terrorism (CFT) directives, all users must verify their identity using a valid Ghana Card issued by the National Identification Authority (NIA) before card issuance.
              </p>
              <h5 className="text-sm font-semibold text-white mt-4 mb-1">3. Permitted & Prohibited Transactions</h5>
              <p>
                Cards may be used at authorized merchants supporting 3D Secure (3DS). Cards may not be used for unlawful betting, cryptocurrency purchases without licenses, or unauthorized high-risk transactions.
              </p>
            </div>
          )}

          {tab === 'PRIVACY' && (
            <div>
              <h4 className="text-base font-bold text-white mb-2">Ghana Data Protection Act 2012 (Act 843) Compliance</h4>
              <p>
                Coratech Global values your privacy. We collect personal information (name, mobile money phone number, Ghana Card number) exclusively to establish identity, prevent fraud, and execute payment orders.
              </p>
              <h5 className="text-sm font-semibold text-white mt-4 mb-1">Data Storage & Encryption</h5>
              <p>
                Card numbers and security credentials are tokenized and transmitted using TLS 1.3 encryption. We never sell or distribute your personal data to unauthorized third parties.
              </p>
            </div>
          )}

          {tab === 'FEES' && (
            <div>
              <h4 className="text-base font-bold text-white mb-2">Fee Schedule & Foreign Exchange Disclosure</h4>
              <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Card Creation Fee:</span>
                  <span className="text-white font-bold">GH₵ 15.00</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Mobile Money Top-up Fee:</span>
                  <span className="text-white font-bold">1.5% pass-through telco fee</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>FX Conversion Spread:</span>
                  <span className="text-white font-bold">Transparent daily rate (typically 2.0% above interbank)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Card Unfreeze / Freeze:</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'REFUNDS' && (
            <div>
              <h4 className="text-base font-bold text-white mb-2">Refunds & Chargeback Policy</h4>
              <p>
                If an online merchant initiates a refund for a returned purchase or cancelled subscription, the refund is credited directly to your virtual Visa card balance upon receipt of the settlement advice from Visa.
              </p>
              <h5 className="text-sm font-semibold text-white mt-4 mb-1">Card Sweep / Cashout</h5>
              <p>
                You may withdraw unused USD funds from your virtual card back to your registered Mobile Money wallet at any time using the Cashout feature.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
