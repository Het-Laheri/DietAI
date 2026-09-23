import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Check, X, Clock, RefreshCw, Search, 
  Trash2, Send, Sparkles, Plus, User, ExternalLink, 
  CheckCircle2, Bot, MessageSquare, AlertCircle
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  approveAiCoachMessage, 
  rejectAiCoachMessage, 
  deleteAiCoachMessage,
  sendDirectPatientMessage,
  getPatients,
  AiCoachMessage,
  PatientProfile 
} from '../../services/db';

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

export default function MessageInbox() {
  const [messages, setMessages] = useState<AiCoachMessage[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [loading, setLoading] = useState(true);
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [dieticianNotes, setDieticianNotes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Direct Message Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composePatientId, setComposePatientId] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  // Real-time Firestore onSnapshot for instant updates
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'ai_coach_messages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as AiCoachMessage));
      setMessages(loaded);

      // Pre-populate editable drafts for pending messages
      setEditDrafts(prev => {
        const next = { ...prev };
        loaded.forEach(m => {
          if (m.id && m.status === 'pending' && next[m.id] === undefined) {
            next[m.id] = m.aiDraft || '';
          }
        });
        return next;
      });

      setLoading(false);
    }, (err) => {
      console.error('Error listening to AI coach messages:', err);
      setLoading(false);
    });

    // Also fetch patient list for compose modal and patient context
    getPatients().then(pts => setPatients(pts)).catch(console.error);

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = async (msg: AiCoachMessage) => {
    if (!msg.id) return;
    setProcessing(msg.id);
    const finalAnswer = editDrafts[msg.id]?.trim() || msg.aiDraft;
    const note = dieticianNotes[msg.id]?.trim();

    try {
      await approveAiCoachMessage(msg.id, finalAnswer, note);
      showToast(`Response approved and sent to ${msg.patientName}!`);
    } catch (e) {
      console.error('Failed to approve message:', e);
      showToast('Error approving message. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (msg: AiCoachMessage) => {
    if (!msg.id) return;
    setProcessing(msg.id);
    const note = dieticianNotes[msg.id]?.trim();

    try {
      await rejectAiCoachMessage(msg.id, note);
      showToast(`Message from ${msg.patientName} declined.`);
    } catch (e) {
      console.error('Failed to reject message:', e);
      showToast('Error updating message status.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete message history from ${name}?`)) return;
    try {
      await deleteAiCoachMessage(id);
      showToast('Message deleted.');
    } catch (e) {
      console.error('Failed to delete message:', e);
      showToast('Error deleting message.');
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composePatientId || !composeBody.trim()) return;

    const patient = patients.find(p => p.id === composePatientId);
    if (!patient) return;

    setComposeSending(true);
    try {
      await sendDirectPatientMessage(
        patient.id,
        patient.name,
        composeBody.trim(),
        composeSubject.trim() || 'Direct Dietician Recommendation'
      );
      showToast(`Direct message sent to ${patient.name}!`);
      setShowComposeModal(false);
      setComposePatientId('');
      setComposeSubject('');
      setComposeBody('');
    } catch (err) {
      console.error('Failed to send direct message:', err);
      showToast('Failed to send message.');
    } finally {
      setComposeSending(false);
    }
  };

  const pendingCount = messages.filter(m => m.status === 'pending').length;
  const approvedCount = messages.filter(m => m.status === 'approved').length;
  const rejectedCount = messages.filter(m => m.status === 'rejected').length;

  const filtered = messages.filter(m => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const qLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (m.patientName && m.patientName.toLowerCase().includes(qLower)) ||
      (m.question && m.question.toLowerCase().includes(qLower)) ||
      (m.aiDraft && m.aiDraft.toLowerCase().includes(qLower));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-50 px-5 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                Message Inbox & AI Approvals
                {pendingCount > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-sans bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    {pendingCount} Pending
                  </span>
                )}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Lead Dietician Portal • Review, modify, and authorize patient AI Coach messages
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Direct Message
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => setFilter('pending')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${filter === 'pending' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-stone-200 hover:border-stone-300'}`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Approval</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{pendingCount}</div>
          <p className="text-[11px] text-stone-500 mt-1">Requires your review</p>
        </div>

        <div 
          onClick={() => setFilter('approved')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${filter === 'approved' ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-stone-200 hover:border-stone-300'}`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Approved & Sent</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{approvedCount}</div>
          <p className="text-[11px] text-stone-500 mt-1">Active in patient app</p>
        </div>

        <div 
          onClick={() => setFilter('rejected')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${filter === 'rejected' ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-stone-200 hover:border-stone-300'}`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Declined</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{rejectedCount}</div>
          <p className="text-[11px] text-stone-500 mt-1">Not forwarded</p>
        </div>

        <div 
          onClick={() => setFilter('all')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${filter === 'all' ? 'bg-stone-100 border-stone-300 ring-2 ring-stone-400/20' : 'bg-white border-stone-200 hover:border-stone-300'}`}
        >
          <div className="flex items-center justify-between text-stone-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">All History</span>
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{messages.length}</div>
          <p className="text-[11px] text-stone-500 mt-1">Total interactions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
          {(['pending', 'approved', 'rejected', 'all'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                filter === tab 
                  ? 'bg-white text-stone-900 shadow-sm' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab === 'pending' ? 'Pending' : tab === 'approved' ? 'Approved' : tab === 'rejected' ? 'Declined' : 'All'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patient or question..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-stone-400" />
          <p className="text-sm">Connecting to live message stream...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-stone-200 rounded-xl p-8">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">
            {filter === 'pending' ? 'No pending approvals' : 'No messages found'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            {filter === 'pending' 
              ? 'All patient questions have been reviewed! New queries sent to AI Coach will appear here in real-time.' 
              : 'Try changing your search query or switching filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(msg => {
            const patient = patients.find(p => p.id === msg.patientId);
            const isPending = msg.status === 'pending';
            const isApproved = msg.status === 'approved';
            const isProcessing = processing === msg.id;

            return (
              <div 
                key={msg.id} 
                className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${
                  isPending 
                    ? 'border-amber-300 ring-1 ring-amber-300/40' 
                    : isApproved 
                    ? 'border-stone-200' 
                    : 'border-rose-200'
                }`}
              >
                {/* Header */}
                <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b ${
                  isPending ? 'bg-amber-50/40 border-amber-100' : 'bg-stone-50/60 border-stone-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {msg.patientName ? msg.patientName.charAt(0) : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{msg.patientName}</span>
                        {patient && (
                          <Link 
                            to={`/dietician/patients/${patient.id}`}
                            className="text-[11px] text-brand-700 hover:text-brand-900 flex items-center gap-1 font-medium underline"
                          >
                            Profile <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Patient Context Pills */}
                    {patient && (
                      <div className="hidden md:flex items-center gap-1.5 mr-2">
                        {patient.dietaryType && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                            {patient.dietaryType}
                          </span>
                        )}
                        {patient.targetWeightKg && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                            Goal: {patient.targetWeightKg}kg
                          </span>
                        )}
                      </div>
                    )}

                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                      isPending 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : isApproved 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {msg.status}
                    </span>

                    <button
                      onClick={() => msg.id && handleDelete(msg.id, msg.patientName)}
                      title="Delete message"
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Patient Question */}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1">
                      Patient Question
                    </span>
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 leading-relaxed font-sans font-medium">
                      "{msg.question}"
                    </div>
                  </div>

                  {/* AI Pre-generated Draft or Approved Answer */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 text-stone-500">
                        <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                        {isPending ? 'AI Pre-Generated Recommendation (Editable)' : 'Authorized Dietician Answer'}
                      </span>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => msg.id && setEditDrafts(p => ({ ...p, [msg.id!]: msg.aiDraft }))}
                            className="text-[11px] text-stone-500 hover:text-stone-900 underline font-medium"
                          >
                            Reset to AI Draft
                          </button>
                          <span className="text-stone-300">•</span>
                          <button
                            type="button"
                            onClick={() => msg.id && setEditDrafts(p => ({ ...p, [msg.id!]: '' }))}
                            className="text-[11px] text-stone-500 hover:text-stone-900 underline font-medium"
                          >
                            Clear & Type Custom
                          </button>
                        </div>
                      )}
                    </div>

                    {isPending ? (
                      <div className="space-y-3">
                        <textarea
                          rows={4}
                          value={editDrafts[msg.id!] ?? msg.aiDraft}
                          onChange={e => msg.id && setEditDrafts(p => ({ ...p, [msg.id!]: e.target.value }))}
                          placeholder="Type or modify the clinical answer that will be shown to the patient..."
                          className="w-full p-4 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-sans leading-relaxed resize-y shadow-inner"
                        />

                        <div>
                          <input
                            type="text"
                            placeholder="Optional Clinical Note for internal records..."
                            value={dieticianNotes[msg.id!] || ''}
                            onChange={e => msg.id && setDieticianNotes(p => ({ ...p, [msg.id!]: e.target.value }))}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-600 placeholder:text-stone-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg text-sm text-stone-800 leading-relaxed font-sans">
                        <p>{msg.approvedAnswer || msg.aiDraft}</p>
                        {msg.dieticianNote && (
                          <p className="mt-2 text-xs text-stone-500 italic border-t border-emerald-100 pt-2">
                            Note: {msg.dieticianNote}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Authorized by Lead Dietician • Visible in Patient AI Coach
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer for Pending */}
                {isPending && (
                  <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-stone-500 italic">
                      Editing above will send your custom answer directly to the patient's screen.
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleReject(msg)}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-stone-300 text-stone-700 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() => handleApprove(msg)}
                        disabled={isProcessing}
                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        {isProcessing ? 'Authorizing...' : 'Approve & Send to Patient'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-stone-900">Send Direct Message to Patient</h3>
              <button 
                onClick={() => setShowComposeModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendDirectMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Select Patient
                </label>
                <select
                  required
                  value={composePatientId}
                  onChange={e => setComposePatientId(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mobile || p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  placeholder="E.g., Dinner adjustment, Hydration reminder"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Clinical Advice / Message
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your clinical recommendation for this patient..."
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={composeSending || !composePatientId || !composeBody.trim()}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {composeSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
