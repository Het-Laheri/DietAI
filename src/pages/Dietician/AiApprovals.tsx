import { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Clock, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { getAiCoachMessages, approveAiCoachMessage, rejectAiCoachMessage, AiCoachMessage } from '../../services/db';

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

export default function AiApprovals() {
  const [messages, setMessages] = useState<AiCoachMessage[]>([]);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [loading, setLoading] = useState(true);
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    const msgs = await getAiCoachMessages();
    setMessages(msgs);
    // Pre-fill edit drafts with AI drafts for pending messages
    const drafts: Record<string, string> = {};
    msgs.forEach(m => {
      if (m.status === 'pending' && m.id) {
        drafts[m.id] = m.aiDraft;
      }
    });
    setEditDrafts(prev => ({ ...prev, ...drafts }));
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (msg: AiCoachMessage) => {
    if (!msg.id) return;
    setProcessing(msg.id);
    const answer = editDrafts[msg.id] || msg.aiDraft;
    await approveAiCoachMessage(msg.id, answer);
    await loadMessages();
    setProcessing(null);
  };

  const handleReject = async (msg: AiCoachMessage) => {
    if (!msg.id) return;
    setProcessing(msg.id);
    await rejectAiCoachMessage(msg.id);
    await loadMessages();
    setProcessing(null);
  };

  const filtered = messages.filter(m => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const matchesSearch = !searchQuery || 
      m.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = messages.filter(m => m.status === 'pending').length;
  const approvedCount = messages.filter(m => m.status === 'approved').length;
  const rejectedCount = messages.filter(m => m.status === 'rejected').length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            AI Coach Approvals
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Review, edit, and approve AI-generated responses before patients see them
          </p>
        </div>
        <button
          onClick={loadMessages}
          className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-stone-100 p-1 rounded-lg w-fit">
        {([
          { key: 'pending' as FilterTab, label: 'Pending', count: pendingCount, color: 'text-amber-700 bg-amber-50' },
          { key: 'approved' as FilterTab, label: 'Approved', count: approvedCount, color: 'text-emerald-700 bg-emerald-50' },
          { key: 'rejected' as FilterTab, label: 'Rejected', count: rejectedCount, color: 'text-red-700 bg-red-50' },
          { key: 'all' as FilterTab, label: 'All', count: messages.length, color: 'text-stone-700 bg-stone-50' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              filter === tab.key
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? tab.color : 'bg-stone-200 text-stone-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search by patient name or question..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent"
        />
      </div>

      {/* Message Cards */}
      {loading && messages.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <Clock className="w-8 h-8 mx-auto mb-3 animate-pulse" />
          <p>Loading messages...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3" />
          <p className="text-lg font-medium text-stone-500">No {filter === 'all' ? '' : filter} messages</p>
          <p className="text-sm mt-1">AI coach messages from patients will appear here for your review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(msg => (
            <div
              key={msg.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all ${
                msg.status === 'pending'
                  ? 'border-amber-200 shadow-sm shadow-amber-50'
                  : msg.status === 'approved'
                  ? 'border-emerald-200'
                  : 'border-red-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-stone-50 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-700 font-bold text-sm">
                    {msg.patientName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{msg.patientName}</p>
                    <p className="text-xs text-stone-400">
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                  msg.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : msg.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {msg.status}
                </span>
              </div>

              {/* Patient Question */}
              <div className="px-5 py-4 border-b border-stone-100">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-1">Patient's Question</p>
                <p className="text-sm text-stone-800 leading-relaxed">{msg.question}</p>
              </div>

              {/* AI Draft / Editable Answer */}
              <div className="px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">
                  {msg.status === 'pending' ? '✏️ AI Draft — Edit Before Approving' : msg.status === 'approved' ? '✅ Approved Answer' : '❌ Rejected'}
                </p>
                {msg.status === 'pending' ? (
                  <textarea
                    value={editDrafts[msg.id!] ?? msg.aiDraft}
                    onChange={e => setEditDrafts(prev => ({ ...prev, [msg.id!]: e.target.value }))}
                    rows={4}
                    className="w-full p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-y"
                    placeholder="Edit the AI draft or type your own response..."
                  />
                ) : (
                  <p className="text-sm text-stone-700 bg-stone-50 rounded-lg p-3 leading-relaxed">
                    {msg.status === 'approved' ? msg.approvedAnswer : msg.aiDraft}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {msg.status === 'pending' && (
                <div className="flex items-center gap-3 px-5 py-3 bg-stone-50 border-t border-stone-100">
                  <button
                    onClick={() => handleApprove(msg)}
                    disabled={processing === msg.id}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {processing === msg.id ? 'Sending...' : 'Approve & Send'}
                  </button>
                  <button
                    onClick={() => handleReject(msg)}
                    disabled={processing === msg.id}
                    className="flex items-center gap-2 px-5 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                  <span className="ml-auto text-xs text-stone-400 italic">
                    You can freely edit the AI draft above before approving
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
