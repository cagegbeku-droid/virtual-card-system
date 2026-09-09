import React, { useState, useEffect, Component } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Shield,
  ShieldAlert,
  Snowflake,
  DollarSign,
  Lock,
  LogOut,
  User,
  ExternalLink,
  CheckCircle2,
  Server,
  ShoppingCart,
  Terminal,
  Code2,
  Zap,
} from 'lucide-react';

import { safeFetch } from './api';
import VirtualCard3D from './components/VirtualCard3D';
import MoMoTopupModal from './components/MoMoTopupModal';
import CardControlsModal from './components/CardControlsModal';
import IssueCardModal from './components/IssueCardModal';
import CashoutModal from './components/CashoutModal';
import TransactionLedger from './components/TransactionLedger';
import AuthModal from './components/AuthModal';
import KycModal from './components/KycModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import LegalModal from './components/LegalModal';
import MerchantSimulatorModal from './components/MerchantSimulatorModal';

// Defensive Error Boundary to eliminate any possibility of a blank screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Render Error caught by Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d1117] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 bg-[#161b22] border border-[#30363d] rounded-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Interface Reload Required</h2>
            <p className="text-xs text-slate-400 font-mono">
              A temporary render state occurred. Click below to reset to clean developer state.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('coratech_token');
                window.location.reload();
              }}
              className="py-2 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              Reload Developer Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <CoratechApp />
    </ErrorBoundary>
  );
}

function CoratechApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('coratech_token'));
  const [cards, setCards] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [cardDetails, setCardDetails] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [fxInfo, setFxInfo] = useState({ fx_rate: 15.50, fee_percent: 1.5 });

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showCashout, setShowCashout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [legalTab, setLegalTab] = useState('TERMS');

  // Fetch FX Rate
  useEffect(() => {
    safeFetch('/api/fx-rate').then((res) => {
      if (res.ok && res.data) {
        setFxInfo(res.data);
      }
    });
  }, []);

  const fetchUserData = async () => {
    const currentToken = localStorage.getItem('coratech_token');
    const isDemo = localStorage.getItem('coratech_demo_mode') === 'true';

    if (!currentToken && !isDemo) {
      setCurrentUser(null);
      setCards([]);
      setTransactions([]);
      setStats(null);
      return;
    }

    // 1. Fetch user
    const userRes = await safeFetch('/api/auth/me');
    if (!userRes.ok) {
      if (userRes.status === 401 && !isDemo) {
        localStorage.removeItem('coratech_token');
        setCurrentUser(null);
      }
      return;
    }
    setCurrentUser(userRes.data);

    // 2. Fetch cards
    const cardsRes = await safeFetch('/api/cards');
    if (cardsRes.ok && Array.isArray(cardsRes.data)) {
      setCards(cardsRes.data);
      if (cardsRes.data.length > 0) {
        const cId = activeCardId && cardsRes.data.some((c) => c.id === activeCardId) ? activeCardId : cardsRes.data[0].id;
        setActiveCardId(cId);
        loadCardTransactions(cId);
      } else {
        setActiveCardId(null);
        setTransactions([]);
      }
    }

    // 3. Fetch stats
    const statsRes = await safeFetch('/api/stats');
    if (statsRes.ok && statsRes.data) {
      setStats(statsRes.data);
    }
  };

  const loadCardTransactions = async (cardId) => {
    const res = await safeFetch(`/api/cards/${cardId}/transactions`);
    if (res.ok && Array.isArray(res.data)) {
      setTransactions(res.data);
    }
  };

  const loadCardDetails = async (cardId) => {
    const res = await safeFetch(`/api/cards/${cardId}/reveal`);
    if (res.ok && res.data) setCardDetails(res.data);
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  useEffect(() => {
    if (activeCardId) {
      loadCardTransactions(activeCardId);
      if (revealed) loadCardDetails(activeCardId);
    }
  }, [activeCardId]);

  const handleToggleReveal = async () => {
    if (!revealed) {
      if (activeCardId) await loadCardDetails(activeCardId);
      setRevealed(true);
    } else {
      setRevealed(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!activeCard) return;
    const newStatus = activeCard.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    
    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === activeCard.id ? { ...c, status: newStatus } : c))
    );

    await safeFetch(`/api/cards/${activeCard.id}/controls`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchUserData();
  };

  const handleLaunchDemo = () => {
    localStorage.setItem('coratech_demo_mode', 'true');
    localStorage.setItem('coratech_token', 'demo_jwt_token_kwame');
    setToken('demo_jwt_token_kwame');
    fetchUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem('coratech_token');
    localStorage.removeItem('coratech_demo_mode');
    setToken(null);
    setCurrentUser(null);
    setCards([]);
    setTransactions([]);
  };

  const handleOpenIssueCard = () => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    if (currentUser.kyc_status !== 'VERIFIED') {
      setShowKyc(true);
      return;
    }
    setShowIssue(true);
  };

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      <div>
        {/* DEVELOPER NAVBAR (Stripe / GitHub / Linear style) */}
        <header className="bg-[#161b22] border-b border-[#30363d] px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-emerald-400 font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">Coratech</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-slate-300 border border-[#30363d]">
                  v2.4
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Paystack Rails
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Ghana MoMo • Visa Platinum USD Infrastructure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live FX Rate */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#21262d] border border-[#30363d] text-xs font-mono text-slate-300">
              <span className="text-slate-500">FX:</span>
              <span className="text-emerald-400 font-semibold">1 USD = {fxInfo.fx_rate} GHS</span>
            </div>

            {/* Operator Console / Admin Button */}
            <button
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-xs font-mono border border-[#30363d] transition-colors"
              title="Open Operator Admin Console"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Admin Portal</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenIssueCard}
                  className="flex items-center gap-1 py-1.5 px-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Card</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-[#30363d]">
                  <div className="text-right hidden lg:block font-mono text-xs">
                    <p className="font-semibold text-white">{currentUser.full_name}</p>
                    <p className="text-[10px] text-slate-400">{currentUser.phone_number}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-rose-400 border border-[#30363d] transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLaunchDemo}
                  className="hidden sm:flex items-center gap-1 py-1.5 px-3 rounded-md bg-[#21262d] hover:bg-[#30363d] text-emerald-400 text-xs font-mono border border-[#30363d] transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Interactive Demo</span>
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* KYC Notification Alert */}
        {currentUser && currentUser.kyc_status !== 'VERIFIED' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-4">
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <div>
                  <span className="font-semibold block text-white font-mono">Tier-1 Ghana Card Verification Required</span>
                  <span className="text-slate-400 text-[11px]">Bank of Ghana regulatory compliance requires Ghana Card registration prior to issuing international payment cards.</span>
                </div>
              </div>
              <button
                onClick={() => setShowKyc(true)}
                className="py-1 px-3 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 transition-colors"
              >
                Submit Ghana Card
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTAINER */}
        <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
          {!currentUser ? (
            /* CLEAN HUMAN DEVELOPER PRODUCT LANDING (Stripe / GitHub / Wise style) */
            <div className="py-10 sm:py-16 max-w-4xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#161b22] border border-[#30363d] text-xs font-mono text-slate-300 mb-6">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Paystack MoMo Rails • Visa Platinum USD</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                  Virtual Visa cards funded directly via Ghana Mobile Money.
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed mb-8">
                  Issue 3D-Secure USD Visa cards denominated in dollars. Top up with MTN MoMo, Telecel Cash, or AT Money. Pay for AWS, GitHub Copilot, DigitalOcean, OpenAI, and overseas subscriptions without bank card rejections.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleLaunchDemo}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Launch Interactive Demo</span>
                  </button>
                  <button
                    onClick={() => setShowAuth(true)}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-md bg-[#161b22] hover:bg-[#21262d] text-slate-200 font-semibold text-xs border border-[#30363d] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowAdmin(true)}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-md bg-[#21262d] hover:bg-[#30363d] text-slate-300 font-mono text-xs border border-[#30363d] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Back-Office</span>
                  </button>
                </div>
              </div>

              {/* Developer Technical Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <div className="w-8 h-8 rounded-md bg-[#21262d] flex items-center justify-center text-emerald-400 mb-3 border border-[#30363d]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">Instant Visa Minting</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    16-digit PAN, CVV2, and 3DS authentication ready in seconds following Ghana Card verification.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <div className="w-8 h-8 rounded-md bg-[#21262d] flex items-center justify-center text-teal-400 mb-3 border border-[#30363d]">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">Direct MoMo Liquidity</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Fund cards instantly from MTN MoMo or Telecel Cash using automated Paystack webhook fulfillment.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <div className="w-8 h-8 rounded-md bg-[#21262d] flex items-center justify-center text-cyan-400 mb-3 border border-[#30363d]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">Bank-Grade Controls</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Toggle freeze, customize daily transaction limits, and sweep remaining USD balances back to Ghana Cedi.
                  </p>
                </div>
              </div>

              {/* API Integration Snippet */}
              <div className="p-5 rounded-lg bg-[#161b22] border border-[#30363d]">
                <div className="flex items-center justify-between pb-3 border-b border-[#30363d] text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span>developer_example.sh</span>
                  </div>
                  <span>cURL API</span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`# Issue a new virtual card funded via Paystack Ghana MoMo
curl -X POST https://api.coratech.dev/api/cards \\
  -H "Authorization: Bearer <CORATECH_JWT>" \\
  -H "Content-Type: application/json" \\
  -d '{"card_type": "VISA_PLATINUM_USD", "initial_topup_ghs": 775.00}'`}
                </pre>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED DEVELOPER DASHBOARD */
            <div className="space-y-6">
              {/* TOP METRICS GRID (Developer density) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Card Balance</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                    ${((activeCard?.balance ?? stats?.total_balance_usd) ?? 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ≈ GH₵ {(((activeCard?.balance ?? stats?.total_balance_usd) ?? 0) * fxInfo.fx_rate).toFixed(2)} GHS
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>MoMo Total Loaded</span>
                    <ArrowDownLeft className="w-4 h-4 text-teal-400" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                    ${(stats?.total_topup ?? 350.0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Paystack settlement</p>
                </div>

                <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Online Spend</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                    ${(stats?.total_spent ?? 67.20).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">AWS, GitHub, SaaS</p>
                </div>

                <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Active Virtual Cards</span>
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                    {cards.length} Card{cards.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5">Visa 3DS Enabled</p>
                </div>
              </div>

              {/* MAIN CONTENT SPLIT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: PHYSICAL CARD & CONTROLS */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Card Selector (if multiple cards) */}
                  {cards.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {cards.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveCardId(c.id)}
                          className={`py-1 px-3 rounded-md text-xs font-mono transition-colors border ${
                            activeCard?.id === c.id
                              ? 'bg-[#21262d] text-white border-emerald-500'
                              : 'bg-[#161b22] text-slate-400 border-[#30363d] hover:text-white'
                          }`}
                        >
                          {c.cardholder_name} ({c.masked_number.slice(-4)})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Visa Card Display */}
                  <VirtualCard3D
                    card={activeCard}
                    details={cardDetails}
                    revealed={revealed}
                    onToggleReveal={handleToggleReveal}
                    onOpenTopup={() => setShowTopup(true)}
                    onOpenControls={() => setShowControls(true)}
                  />

                  {/* Primary Action Button Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      onClick={() => setShowSimulator(true)}
                      className="p-3 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-left transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-white">Test Payment</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Simulate AWS or Netflix debit</p>
                    </button>

                    <button
                      onClick={handleToggleFreeze}
                      className="p-3 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-left transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {activeCard?.status === 'FROZEN' ? (
                          <Snowflake className="w-4 h-4 text-sky-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-semibold text-white">
                          {activeCard?.status === 'FROZEN' ? 'Unfreeze' : 'Freeze Card'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Instant authorization lock</p>
                    </button>

                    <button
                      onClick={() => setShowControls(true)}
                      className="p-3 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-left transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-white">Card Limits</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Configure spend ceiling</p>
                    </button>

                    <button
                      onClick={() => setShowCashout(true)}
                      className="p-3 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-left transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-white">MoMo Cashout</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Sweep balance back to GHS</p>
                    </button>
                  </div>

                  {/* Card Telemetry Details */}
                  <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs font-mono space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Card Status:</span>
                      <span className="text-emerald-400 font-semibold">{activeCard?.status || 'ACTIVE'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Monthly Spend Limit:</span>
                      <span className="text-white">
                        ${((activeCard?.spend_limit ?? activeCard?.daily_limit) ?? 1000).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Billing Country:</span>
                      <span className="text-white">Ghana (GH) • 3DS Verified</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: TRANSACTION LEDGER */}
                <div className="lg:col-span-7">
                  <TransactionLedger transactions={transactions} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DEVELOPER FOOTER */}
      <footer className="mt-16 border-t border-[#30363d] py-6 text-xs text-slate-400 font-mono bg-[#161b22]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Coratech Global. Paystack Ghana rails • Neon PostgreSQL.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setLegalTab('TERMS');
                setShowLegal(true);
              }}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setLegalTab('PRIVACY');
                setShowLegal(true);
              }}
              className="hover:text-white transition-colors"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setLegalTab('FEES');
                setShowLegal(true);
              }}
              className="hover:text-white transition-colors"
            >
              Fee Schedule
            </button>
            <span>•</span>
            <button
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Operator Console</span>
            </button>
          </div>
        </div>
      </footer>

      {/* SYSTEM MODALS */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={(u, t) => {
          setToken(t);
          setCurrentUser(u);
          fetchUserData();
        }}
      />

      <KycModal
        isOpen={showKyc}
        onClose={() => setShowKyc(false)}
        onSuccess={() => fetchUserData()}
      />

      <MoMoTopupModal
        card={activeCard}
        fxRate={fxInfo.fx_rate}
        feePercent={fxInfo.fee_percent}
        isOpen={showTopup}
        onClose={() => setShowTopup(false)}
        onSuccess={() => fetchUserData()}
      />

      <CardControlsModal
        card={activeCard}
        details={cardDetails}
        isOpen={showControls}
        onClose={() => setShowControls(false)}
        onUpdated={() => fetchUserData()}
        onTerminated={() => fetchUserData()}
      />

      <IssueCardModal
        isOpen={showIssue}
        onClose={() => setShowIssue(false)}
        onSuccess={() => fetchUserData()}
      />

      <CashoutModal
        card={activeCard}
        fxRate={fxInfo.fx_rate}
        isOpen={showCashout}
        onClose={() => setShowCashout(false)}
        onSuccess={() => fetchUserData()}
      />

      <AdminDashboardModal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />

      <MerchantSimulatorModal
        card={activeCard}
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        onSuccess={() => fetchUserData()}
      />

      <LegalModal
        isOpen={showLegal}
        initialTab={legalTab}
        onClose={() => setShowLegal(false)}
      />
    </div>
  );
}
