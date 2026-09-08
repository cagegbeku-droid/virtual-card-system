import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, XCircle, CheckCircle, Clock, Filter, Receipt, X } from 'lucide-react';

export default function TransactionLedger({ transactions = [] }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  const filtered = transactions.filter((tx) => {
    if (filter === 'TOPUP' && tx.type !== 'TOPUP') return false;
    if (filter === 'PURCHASE' && (tx.type !== 'PURCHASE' || tx.status !== 'SUCCESS')) return false;
    if (filter === 'DECLINED' && tx.status !== 'DECLINED') return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        tx.merchant_name.toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q) ||
        tx.merchant_category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Activity Ledger</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {filtered.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-400">Real-time mobile money deposits & Visa card authorizations</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['ALL', 'TOPUP', 'PURCHASE', 'DECLINED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                filter === tab
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'TOPUP' ? 'MoMo Topups' : tab === 'PURCHASE' ? 'Purchases' : 'Declines'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative my-3">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by merchant, reference or category..."
          className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
        />
      </div>

      {/* Transactions List */}
      <div className="space-y-2 mt-2 max-h-96 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No transactions found matching criteria.</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isTopup = tx.type === 'TOPUP';
            const isDeclined = tx.status === 'DECLINED';

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="p-3 rounded-2xl bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-800/60 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDeclined
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : isTopup
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}
                  >
                    {isDeclined ? (
                      <XCircle className="w-5 h-5" />
                    ) : isTopup ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {tx.merchant_name}
                      </p>
                      {isDeclined && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          DECLINED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span>{tx.merchant_category}</span>
                      <span>•</span>
                      <span>{formatDate(tx.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-xs font-mono font-bold ${
                      isDeclined
                        ? 'text-zinc-500 line-through'
                        : isTopup
                        ? 'text-emerald-400'
                        : 'text-zinc-200'
                    }`}
                  >
                    {isTopup ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                  </p>
                  {tx.local_amount > 0 && (
                    <p className="text-[10px] text-zinc-400 font-mono">
                      GHS {tx.local_amount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Receipt Drawer Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 pb-4 border-b border-zinc-800">
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
                  selectedTx.status === 'DECLINED' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {selectedTx.status === 'DECLINED' ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
              </div>
              <h4 className="font-bold text-lg text-white">{selectedTx.merchant_name}</h4>
              <p
                className={`text-xl font-mono font-bold mt-1 ${
                  selectedTx.status === 'DECLINED' ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {selectedTx.type === 'TOPUP' ? `+$${selectedTx.amount.toFixed(2)}` : `-$${selectedTx.amount.toFixed(2)} USD`}
              </p>
              <span className="text-[11px] text-zinc-400">{selectedTx.merchant_category}</span>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className={`font-semibold ${selectedTx.status === 'DECLINED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedTx.status}
                </span>
              </div>
              {selectedTx.decline_reason && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300">
                  <span className="font-bold block">Decline Reason:</span>
                  {selectedTx.decline_reason}
                </div>
              )}
              {selectedTx.local_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Local Currency</span>
                  <span className="font-mono text-zinc-200">GHS {selectedTx.local_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Date & Time</span>
                <span>{formatDate(selectedTx.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Reference ID</span>
                <span className="font-mono text-[11px] text-zinc-400">{selectedTx.reference}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-all"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
