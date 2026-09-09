import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Lock,
  Download,
  Snowflake,
  Play,
  RefreshCw,
  Eye,
  Key,
} from 'lucide-react';

export default function AdminDashboardModal({ isOpen, onClose }) {
  const [passcode, setPasscode] = useState(localStorage.getItem('coratech_admin_pass') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, KYC, CARDS, USERS
  const [overview, setOverview] = useState(null);
  const [kycQueue, setKycQueue] = useState([]);
  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const fetchAdminData = async (adminKey = passcode) => {
    setLoading(true);
    setError('');
    const headers = { 'x-admin-key': adminKey };

    try {
      // 1. Overview & Profit
      const res = await fetch('/api/admin/overview', { headers });
      if (!res.ok) throw new Error('Invalid admin passcode');
      const ovData = await res.json();
      setOverview(ovData);
      setIsAuthenticated(true);
      localStorage.setItem('coratech_admin_pass', adminKey);

      // 2. Users
      const usersRes = await fetch('/api/admin/users', { headers });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData);
        setKycQueue(uData.filter((u) => u.kyc_status === 'UNVERIFIED' || u.kyc_status === 'PENDING'));
      }

      // 3. Cards
      const cardsRes = await fetch('/api/admin/cards', { headers });
      if (cardsRes.ok) setCards(await cardsRes.json());
    } catch (err) {
      setError(err.message || 'Access denied');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (passcode) {
      fetchAdminData(passcode);
    }
  }, []);

  const handleKycAction = async (userId, action) => {
    try {
      const res = await fetch('/api/admin/kyc-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': passcode,
        },
        body: JSON.stringify({ user_id: userId, action }),
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCard = async (cardId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/card-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': passcode,
        },
        body: JSON.stringify({ card_id: cardId, status: newStatus }),
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCsv = () => {
    window.open(`/api/admin/export-csv?x_admin_key=${encodeURIComponent(passcode)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in text-zinc-100">
      <div className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Coratech Global</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 uppercase font-mono tracking-wider">
                  Executive Back-Office
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          /* PASSCODE LOGIN */
          <div className="py-16 max-w-sm mx-auto text-center">
            <div className="w-14 h-14 bg-zinc-800 rounded-2xl mx-auto flex items-center justify-center mb-4 text-emerald-400 border border-zinc-700 shadow-inner">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Admin Authentication</h3>
            <p className="text-xs text-zinc-400 mb-6">Enter your Coratech executive passcode to proceed.</p>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl mb-4">
                {error}
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchAdminData(passcode);
              }}
              className="space-y-3"
            >
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Admin Passcode"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-center text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-500/20"
              >
                {loading ? 'Authenticating...' : 'Access Dashboard'}
              </button>
              <p className="text-[10px] text-zinc-500 mt-2">
                Default dev passcode: <code className="text-zinc-400">coratech_admin_2026_supersecure</code>
              </p>
            </form>
          </div>
        ) : (
          /* DASHBOARD TABS & DATA */
          <div className="mt-6 space-y-6">
            {/* Tabs Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800">
              <div className="flex gap-2">
                {[
                  { id: 'OVERVIEW', label: 'Financials & Profit' },
                  { id: 'KYC', label: `KYC Queue (${kycQueue.length})` },
                  { id: 'CARDS', label: `Cards (${cards.length})` },
                  { id: 'USERS', label: `Users (${users.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchAdminData()}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV Ledger</span>
                </button>
              </div>
            </div>

            {/* TAB: FINANCIALS & PROFIT */}
            {activeTab === 'OVERVIEW' && overview && (
              <div className="space-y-6">
                {/* Profit Ticker Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-zinc-950 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Coratech Global Net Profit Ticker
                      </span>
                      <h3 className="text-3xl font-black text-white mt-0.5 font-mono">
                        ${overview.profit.total_net_profit_usd.toFixed(2)} USD
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        ≈ GH₵ {overview.profit.total_net_profit_ghs.toFixed(2)} GHS net margin
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>

                  {/* 3 Margin Pillars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-emerald-500/20 text-xs">
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">FX Spread Margin (2%)</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">+${overview.profit.fx_spread_usd.toFixed(2)}</span>
                    </div>
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">MoMo Processing Net (0.5%)</span>
                      <span className="text-sm font-bold text-teal-400 font-mono">+${overview.profit.momo_fee_usd.toFixed(2)}</span>
                    </div>
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Card Issuance Fees ($3/card)</span>
                      <span className="text-sm font-bold text-cyan-400 font-mono">+${overview.profit.card_issuance_usd.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 font-medium block">Total MoMo Inflow</span>
                    <span className="text-lg font-bold text-white font-mono mt-1 block">
                      GH₵ {overview.total_momo_ghs.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">(${overview.total_topup_usd.toFixed(2)} USD)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 font-medium block">Total Card Spend</span>
                    <span className="text-lg font-bold text-white font-mono mt-1 block">
                      ${overview.total_spend_usd.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-zinc-400">Visa online debits</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 font-medium block">Virtual Cards</span>
                    <span className="text-lg font-bold text-white font-mono mt-1 block">
                      {overview.active_cards} Active
                    </span>
                    <span className="text-[10px] text-zinc-400">{overview.frozen_cards} frozen</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-500 font-medium block">Registered Users</span>
                    <span className="text-lg font-bold text-white font-mono mt-1 block">
                      {overview.total_users} Users
                    </span>
                    <span className="text-[10px] text-emerald-400">{overview.verified_users} KYC verified</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: KYC QUEUE */}
            {activeTab === 'KYC' && (
              <div className="space-y-3 text-xs">
                {kycQueue.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                    <p>All users are verified. No pending Ghana Card approvals.</p>
                  </div>
                ) : (
                  kycQueue.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">{u.full_name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                            {u.kyc_status}
                          </span>
                        </div>
                        <p className="text-zinc-400 font-mono mt-0.5">{u.phone_number}</p>
                        <p className="text-zinc-300 font-mono text-[11px] mt-1">
                          Ghana Card: <span className="font-bold text-emerald-400">{u.ghana_card_number || 'None'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleKycAction(u.id, 'APPROVE')}
                          className="py-1.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve KYC</span>
                        </button>
                        <button
                          onClick={() => handleKycAction(u.id, 'REJECT')}
                          className="py-1.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: VIRTUAL CARDS */}
            {activeTab === 'CARDS' && (
              <div className="space-y-2 text-xs">
                {cards.length === 0 ? (
                  <p className="text-center text-zinc-500 py-10">No cards issued yet.</p>
                ) : (
                  cards.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{c.cardholder_name}</p>
                          <p className="font-mono text-zinc-400 text-[11px]">{c.masked_number}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-emerald-400 font-mono">${c.balance.toFixed(2)} USD</p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-sky-500/10 text-sky-300'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleCard(c.id, c.status)}
                          className={`py-1.5 px-3 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                            c.status === 'ACTIVE'
                              ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-400/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? <Snowflake className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{c.status === 'ACTIVE' ? 'Freeze' : 'Unlock'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: USERS DIRECTORY */}
            {activeTab === 'USERS' && (
              <div className="space-y-2 text-xs">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-white">{u.full_name}</p>
                      <p className="text-zinc-400 font-mono text-[11px]">{u.phone_number}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-zinc-200">
                        {u.cards_count} card(s) • ${u.total_balance_usd.toFixed(2)}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          u.kyc_status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {u.kyc_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
