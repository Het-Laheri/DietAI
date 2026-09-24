import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, X, Clock, RefreshCw, Search, Trash2, 
  Send, Sparkles, User, ExternalLink, CheckCircle2, 
  MessageSquare, AlertCircle, Bot
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  updateQuery, 
  deleteQuery, 
  getPatients, 
  Query as PatientQuery, 
  PatientProfile 
} from '../../services/db';

type FilterTab = 'pending' | 'answered' | 'all';

export default function MessageInbox() {
  const [queries, setQueries] = useState<PatientQuery[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [loading, setLoading] = useState(true);
  const [editReplies, setEditReplies] = useState<Record<string, string>>({});
  const [aiDrafts, setAiDrafts] = useState<Record<string, string>>({});
  const [generatingAi, setGeneratingAi] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live real-time Firestore sync
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'queries'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as PatientQuery));
      setQueries(loaded);

      // Pre-generate / assign smart clinical drafts for pending queries
      loaded.forEach(item => {
        if (item.id && item.status === 'pending' && !aiDrafts[item.id]) {
          generateDraftForQuery(item);
        }
      });

      setLoading(false);
    }, (err) => {
      console.error('Error listening to queries:', err);
      setLoading(false);
    });

    // Load patients for context
    getPatients().then(pts => setPatients(pts)).catch(console.error);

    return () => unsubscribe();
  }, []);

  // Generate an AI clinical draft for a patient query
  const generateDraftForQuery = async (q: PatientQuery) => {
    if (!q.id) return;
    setGeneratingAi(prev => ({ ...prev, [q.id!]: true }));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'dietician',
          context: { patientName: q.patientName, query: q.question },
          messages: [{
            role: 'user',
            parts: [{ text: `You are an expert clinical nutrition assistant working under a lead dietician. Draft a concise, empathetic, and clinically sound 2-3 sentence response for the dietician to review and approve for this patient query: "${q.question}".` }]
          }]
        })
      });

      const data = await res.json();
      const draft = data?.text?.trim() || generateFallbackDraft(q.question);
      setAiDrafts(prev => ({ ...prev, [q.id!]: draft }));
      if (!editReplies[q.id!]) {
        setEditReplies(prev => ({ ...prev, [q.id!]: draft }));
      }
    } catch (e) {
      console.warn('AI endpoint unavailable, using smart clinical heuristic draft:', e);
      const fallback = generateFallbackDraft(q.question);
      setAiDrafts(prev => ({ ...prev, [q.id!]: fallback }));
      if (!editReplies[q.id!]) {
        setEditReplies(prev => ({ ...prev, [q.id!]: fallback }));
      }
    } finally {
      setGeneratingAi(prev => ({ ...prev, [q.id!]: false }));
    }
  };

  const generateFallbackDraft = (question: string) => {
    const qLower = question.toLowerCase();
    if (qLower.includes('swap') || qLower.includes('replace') || qLower.includes('paneer') || qLower.includes('tofu')) {
      return "Yes, you can make this substitution! Both offer high quality protein. Ensure you maintain similar portion sizes (approx. 100g) to keep your macronutrient targets aligned.";
    }
    if (qLower.includes('snack') || qLower.includes('hungry') || qLower.includes('4 pm')) {
      return "For a balanced snack that controls blood sugar and sustains energy, choose roasted chana with cucumber slices or a small handful of unsalted almonds.";
    }
    if (qLower.includes('water') || qLower.includes('hydration')) {
      return "Aim for 2.5 to 3 liters of water spaced throughout the day. Drink 1-2 glasses 30 minutes before major meals to assist digestion.";
    }
    return "Thank you for reaching out! Based on your current clinical nutrition plan, focus on keeping your portion sizes balanced and staying consistent with your daily hydration. Let me know if symptoms persist.";
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveAndSend = async (q: PatientQuery) => {
    if (!q.id) return;
    const finalAnswer = (editReplies[q.id] || aiDrafts[q.id] || '').trim();
    if (!finalAnswer) {
      showToast('Please provide an answer before approving.');
      return;
    }

    setProcessing(q.id);
    try {
      await updateQuery(q.id, {
        reply: finalAnswer,
        status: 'answered'
      });
      showToast(`Answer approved and sent directly to ${q.patientName}!`);
    } catch (e) {
      console.error('Failed to send reply:', e);
      showToast('Error sending reply. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete query from ${name}?`)) return;
    try {
      await deleteQuery(id);
      showToast('Query deleted.');
    } catch (e) {
      console.error('Failed to delete query:', e);
      showToast('Error deleting query.');
    }
  };

  const pendingCount = queries.filter(q => q.status === 'pending').length;
  const answeredCount = queries.filter(q => q.status === 'answered').length;

  const filtered = queries.filter(q => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const qLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      (q.patientName && q.patientName.toLowerCase().includes(qLower)) ||
      (q.question && q.question.toLowerCase().includes(qLower)) ||
      (q.reply && q.reply.toLowerCase().includes(qLower));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-md">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-stone-900">
                Patient Queries & AI Approval Portal
              </h1>
              {pendingCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 font-bold border border-orange-300">
                  {pendingCount} Awaiting Review
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Lead Dietician Portal • All incoming patient questions arrive here. Review AI recommendations, customize answers, and approve delivery to patients.
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => setFilter('pending')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            filter === 'pending' 
              ? 'bg-orange-50/70 border-orange-300 ring-2 ring-orange-400/20 shadow-xs' 
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-orange-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Your Approval</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">{pendingCount}</div>
          <p className="text-xs text-stone-500 mt-1">Pending clinical review</p>
        </div>

        <div 
          onClick={() => setFilter('answered')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            filter === 'answered' 
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs' 
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Approved & Sent</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">{answeredCount}</div>
          <p className="text-xs text-stone-500 mt-1">Delivered to patient screens</p>
        </div>

        <div 
          onClick={() => setFilter('all')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            filter === 'all' 
              ? 'bg-stone-100 border-stone-300 ring-2 ring-stone-400/20 shadow-xs' 
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-stone-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">All History</span>
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-3xl font-serif font-bold text-stone-900">{queries.length}</div>
          <p className="text-xs text-stone-500 mt-1">Total patient inquiries</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-xl">
          {(['pending', 'answered', 'all'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                filter === tab 
                  ? 'bg-white text-stone-900 shadow-sm' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab === 'pending' ? 'Pending Review' : tab === 'answered' ? 'Answered' : 'All Queries'}
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
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Query Cards */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-orange-500" />
          <p className="text-sm font-medium">Connecting to live query feed...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-stone-200 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">
            {filter === 'pending' ? 'All caught up! No queries awaiting approval.' : 'No queries found.'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            {filter === 'pending' 
              ? 'When any patient submits a question from their portal, it will instantly appear here for your review and approval.' 
              : 'Try switching filters or clearing your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(q => {
            const patient = patients.find(p => p.id === q.patientId);
            const isPending = q.status === 'pending';
            const isProcessing = processing === q.id;
            const isGenerating = generatingAi[q.id!];

            return (
              <div 
                key={q.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs transition-all ${
                  isPending 
                    ? 'border-orange-300 ring-1 ring-orange-300/40' 
                    : 'border-stone-200'
                }`}
              >
                {/* Header */}
                <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b ${
                  isPending ? 'bg-orange-50/40 border-orange-100' : 'bg-stone-50/70 border-stone-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {q.patientName ? q.patientName.charAt(0) : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{q.patientName}</span>
                        {patient && (
                          <Link 
                            to={`/dietician/patients/${patient.id}`}
                            className="text-[11px] text-orange-600 hover:text-orange-800 flex items-center gap-1 font-bold underline"
                          >
                            Profile <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400">
                        Submitted {q.date}
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
                            Target: {patient.targetWeightKg}kg
                          </span>
                        )}
                      </div>
                    )}

                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                      isPending 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {isPending ? 'Awaiting Approval' : 'Delivered'}
                    </span>

                    <button
                      onClick={() => q.id && handleDelete(q.id, q.patientName)}
                      title="Delete query"
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
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
                      Patient Query
                    </span>
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 leading-relaxed font-sans font-medium">
                      "{q.question}"
                    </div>
                  </div>

                  {/* AI Pre-generated Answer / Editable Response Box */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 text-stone-500">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        {isPending ? 'AI Suggested Response (Review & Edit Before Sending)' : 'Authorized Clinical Answer'}
                      </span>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => generateDraftForQuery(q)}
                            disabled={isGenerating}
                            className="text-[11px] text-orange-600 hover:text-orange-800 underline font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                            Regenerate AI Draft
                          </button>
                          <span className="text-stone-300">•</span>
                          <button
                            type="button"
                            onClick={() => q.id && setEditReplies(p => ({ ...p, [q.id!]: '' }))}
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
                          value={editReplies[q.id!] ?? aiDrafts[q.id!] ?? ''}
                          onChange={e => q.id && setEditReplies(p => ({ ...p, [q.id!]: e.target.value }))}
                          placeholder="Type or modify the clinical answer that will be sent to the patient..."
                          className="w-full p-4 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent font-sans leading-relaxed resize-y shadow-inner"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm text-stone-800 leading-relaxed font-sans">
                        <p className="whitespace-pre-wrap">{q.reply}</p>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Authorized by Lead Dietician • Visible on Patient's Screen
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer for Pending */}
                {isPending && (
                  <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-stone-500 italic">
                      You can edit the AI answer above or type your own before clicking approve.
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApproveAndSend(q)}
                        disabled={isProcessing}
                        className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        {isProcessing ? 'Authorizing...' : 'Approve & Send to User'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
