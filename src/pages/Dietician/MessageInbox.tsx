import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, X, Clock, RefreshCw, Search, Trash2, 
  Send, Sparkles, User, ExternalLink, CheckCircle2, 
  MessageSquare, AlertCircle, Bot, Activity, Heart, AlertTriangle, ShieldCheck,
  Plus, Sliders, BookOpen, ChevronDown, ChevronUp, Copy, Bookmark
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  updateQuery, 
  deleteQuery, 
  getPatients, 
  getLocalQueries,
  createNotification,
  evaluateLabBiomarkers,
  DEFAULT_SAMPLE_LABS,
  Query as PatientQuery, 
  PatientProfile 
} from '../../services/db';
import { DEFAULT_CLINICAL_RECIPES, EXCHANGE_SYSTEM_REFERENCE } from '../../services/defaultRecipes';

interface CustomTemplate {
  id: string;
  label: string;
  text: string;
}

const DEFAULT_CLINICAL_TEMPLATES: CustomTemplate[] = [
  {
    id: 'tmpl_1',
    label: 'Low-GI Complex Grain Swap',
    text: 'Recommended Exchange: Choose 1 Cereal Exchange (30g Daliya / Jowar / Oats = 100 kcal, 21g Carbs) cooked with 1 Vegetable Exchange (100g = 20 kcal) for low glycemic load.'
  },
  {
    id: 'tmpl_2',
    label: 'High Protein Satiety Rule',
    text: 'Target 15–20g protein for this meal: Incorporate 1 Pulse Exchange (30g = 90 kcal, 6.5g Protein) plus 1 Paneer Exchange (40g = 100 kcal, 7.5g Protein) or 2 Egg Whites.'
  },
  {
    id: 'tmpl_3',
    label: 'Hydration & Low Sodium Guidance',
    text: 'Drink 2.5–3 liters of water spaced evenly between meals. Maintain sodium below 1500mg daily by avoiding commercial sauces and packaged savory snacks.'
  },
  {
    id: 'tmpl_4',
    label: 'Evening Snack Alternative',
    text: 'For your evening 4 PM hunger, swap fried snacks with 1 Fresh Fruit Exchange (100g = 50 kcal, 3g Fiber) or 1/2 cup Sprouted Moong Chaat with lemon.'
  }
];

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
  const [editingAnsweredId, setEditingAnsweredId] = useState<string | null>(null);
  const draftedIdsRef = useRef<Set<string>>(new Set());

  // Manual Template Input & Quick Presets State
  const [manualTemplateInputs, setManualTemplateInputs] = useState<Record<string, string>>({});
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('nutrisnap_dietician_templates');
      return stored ? JSON.parse(stored) : DEFAULT_CLINICAL_TEMPLATES;
    } catch {
      return DEFAULT_CLINICAL_TEMPLATES;
    }
  });
  const [openTemplatePanel, setOpenTemplatePanel] = useState<Record<string, boolean>>({});
  const [templateTab, setTemplateTab] = useState<Record<string, 'manual' | 'biomarkers' | 'exchange' | 'recipes' | 'saved'>>({});
  const [recipeFilter, setRecipeFilter] = useState('');

  // Live real-time Firestore sync & persistent client cache fallback
  useEffect(() => {
    setLoading(true);

    const parseTime = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      if (val?.seconds) return val.seconds * 1000;
      if (typeof val?.toDate === 'function') return val.toDate().getTime();
      const parsed = new Date(val).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    const refreshMergedQueries = (remoteItems: PatientQuery[] = []) => {
      const localItems = getLocalQueries() as PatientQuery[];
      const map = new Map<string, PatientQuery>();
      const remoteKeys = new Set<string>();

      remoteItems.forEach(item => {
        if (item.id) {
          map.set(item.id, item);
          const key = `${item.patientId}_${(item.question || '').trim().toLowerCase()}`;
          remoteKeys.add(key);
        }
      });

      const cleanedLocalItems: PatientQuery[] = [];
      localItems.forEach(item => {
        if (!item.id) return;
        const key = `${item.patientId}_${(item.question || '').trim().toLowerCase()}`;
        const isTemporary = item.id.startsWith('temp_') || item.id.startsWith('query_');
        if (map.has(item.id) || (isTemporary && remoteKeys.has(key))) {
          return;
        }
        map.set(item.id, item);
        cleanedLocalItems.push(item);
      });

      if (cleanedLocalItems.length !== localItems.length && remoteItems.length > 0) {
        try {
          localStorage.setItem('nutrisnap_cached_queries', JSON.stringify(cleanedLocalItems));
        } catch {}
      }

      const combined = Array.from(map.values()).sort((a, b) => {
        return parseTime(b.createdAt) - parseTime(a.createdAt);
      });
      setQueries(combined);

      combined.forEach(item => {
        if (item.id && (item.status === 'pending' || item.status === 'viewed') && !draftedIdsRef.current.has(item.id)) {
          generateDraftForQuery(item);
        }
      });
      setLoading(false);
    };

    // Immediate initial display
    refreshMergedQueries([]);

    const q = query(collection(db, 'queries'));
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(q, (snap) => {
        const loaded = snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as PatientQuery));
        refreshMergedQueries(loaded);
      }, (err) => {
        console.warn('Notice: Firestore query stream error:', err);
        refreshMergedQueries([]);
      });
    } catch (e) {
      console.warn('Notice: onSnapshot failed to init:', e);
      refreshMergedQueries([]);
    }

    const handleLocalChange = () => refreshMergedQueries([]);
    window.addEventListener('nutrisnap:query_change', handleLocalChange);

    // Load patients for context
    getPatients().then(pts => setPatients(pts)).catch(console.error);

    return () => {
      unsubscribe();
      window.removeEventListener('nutrisnap:query_change', handleLocalChange);
    };
  }, []);

  // Generate an AI clinical draft for a patient query
  const generateDraftForQuery = async (q: PatientQuery) => {
    if (!q.id) return;
    if (draftedIdsRef.current.has(q.id)) return;
    draftedIdsRef.current.add(q.id);

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

      let draft = '';
      if (res.ok) {
        const data = await res.json().catch(() => null);
        draft = data?.text?.trim() || '';
      }
      if (!draft) {
        draft = generateFallbackDraft(q.question);
      }
      setAiDrafts(prev => ({ ...prev, [q.id!]: draft }));
      // Only set editReplies if user hasn't already modified or typed in it
      setEditReplies(prev => (prev[q.id!] !== undefined ? prev : { ...prev, [q.id!]: draft }));
    } catch (e) {
      console.warn('AI endpoint unavailable, using smart clinical heuristic draft:', e);
      const fallback = generateFallbackDraft(q.question);
      setAiDrafts(prev => ({ ...prev, [q.id!]: fallback }));
      setEditReplies(prev => (prev[q.id!] !== undefined ? prev : { ...prev, [q.id!]: fallback }));
    } finally {
      setGeneratingAi(prev => ({ ...prev, [q.id!]: false }));
    }
  };

  const generateFallbackDraft = (question: string) => {
    const qLower = question.toLowerCase();
    if (qLower.includes('tea') || qLower.includes('coffee') || qLower.includes('caffeine')) {
      return "Yes, having plain green tea or black coffee (without sugar or heavy creamers) is generally fine between meals. Keep intake to 1-2 cups daily and avoid drinking it within 45 minutes of main meals so it does not impair mineral and iron absorption.";
    }
    if (qLower.includes('swap') || qLower.includes('replace') || qLower.includes('paneer') || qLower.includes('tofu') || qLower.includes('substitute')) {
      return "Yes, you can make this substitution! Ensure you match similar portion weights (approx. 80-100g) to keep your protein and calorie targets consistent with your prescribed meal plan.";
    }
    if (qLower.includes('snack') || qLower.includes('hungry') || qLower.includes('4 pm') || qLower.includes('evening')) {
      return "For a balanced snack that controls blood sugar and sustains energy, choose roasted chana with cucumber slices, a small handful of unsalted almonds, or a bowl of sprouted moong.";
    }
    if (qLower.includes('water') || qLower.includes('hydration')) {
      return "Aim for 2.5 to 3 liters of water spaced throughout the day. Drink 1-2 glasses 30 minutes before major meals to assist digestion.";
    }
    if (qLower.includes('fruit') || qLower.includes('sugar') || qLower.includes('sweet')) {
      return "Whole fruits like apples, guava, or berries are great options due to their dietary fiber. Avoid fruit juices and have whole fruit between meals rather than late at night.";
    }
    if (qLower.includes('skip') || qLower.includes('fast') || qLower.includes('breakfast')) {
      return "Consistent meal timing stabilizes metabolism and blood glucose levels. If you are not hungry for a heavy meal, opt for a light protein shake or chia seed pudding instead of skipping entirely.";
    }
    return `Thank you for asking about "${question.slice(0, 45)}${question.length > 45 ? '...' : ''}"! Based on your clinical profile, keep portions consistent and stay hydrated. Let me know if you experience any digestive discomfort.`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleInsertTemplateText = (queryId: string, textToInsert: string) => {
    if (!textToInsert.trim()) return;
    setEditReplies(prev => {
      const current = (prev[queryId] ?? aiDrafts[queryId] ?? '').trim();
      const updated = current ? `${current}\n\n${textToInsert.trim()}` : textToInsert.trim();
      return { ...prev, [queryId]: updated };
    });
    showToast('Template value inserted into reply!');
  };

  const handleSaveCustomTemplate = (queryId: string) => {
    const text = (manualTemplateInputs[queryId] || '').trim();
    if (!text) {
      showToast('Please type a template value into the input field first.');
      return;
    }
    const label = text.length > 32 ? text.slice(0, 32) + '...' : text;
    const newTemplate: CustomTemplate = {
      id: `tmpl_${Date.now()}`,
      label,
      text
    };
    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    try {
      localStorage.setItem('nutrisnap_dietician_templates', JSON.stringify(updated));
    } catch {}
    showToast('Template saved to custom templates!');
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    const updated = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updated);
    try {
      localStorage.setItem('nutrisnap_dietician_templates', JSON.stringify(updated));
    } catch {}
    showToast('Template removed.');
  };

  const handleApproveAndSend = async (q: PatientQuery) => {
    if (!q.id) return;
    const finalAnswer = (editReplies[q.id] || aiDrafts[q.id] || q.reply || '').trim();
    if (!finalAnswer) {
      showToast('Please provide an answer before approving.');
      return;
    }

    setProcessing(q.id);
    try {
      // Optimistically update query state immediately
      setQueries(prev => prev.map(item => item.id === q.id ? { ...item, reply: finalAnswer, status: 'answered' } : item));

      await updateQuery(q.id, {
        reply: finalAnswer,
        status: 'answered',
        patientId: q.patientId,
        patientName: q.patientName
      });

      setEditingAnsweredId(null);
      showToast(`Answer approved and sent directly to ${q.patientName || 'patient'}!`);
    } catch (e) {
      console.error('Failed to send reply:', e);
      showToast('Error sending reply. Please try again.');
      // Revert status on failure
      setQueries(prev => prev.map(item => item.id === q.id ? { ...item, status: q.status } : item));
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete query from ${name}?`)) return;
    try {
      setQueries(prev => prev.filter(q => q.id !== id));
      await deleteQuery(id);
      showToast('Query deleted.');
    } catch (e) {
      console.error('Failed to delete query:', e);
      showToast('Error deleting query.');
    }
  };

  const pendingCount = queries.filter(q => q.status === 'pending' || q.status === 'viewed').length;
  const answeredCount = queries.filter(q => q.status === 'answered').length;

  const filtered = queries.filter(q => {
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'pending' 
        ? (q.status === 'pending' || q.status === 'viewed') 
        : q.status === filter;
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

      {/* Stat Cards - Unified Metric Strip */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs divide-y sm:divide-y-0 sm:divide-x divide-stone-100 grid grid-cols-1 sm:grid-cols-3 mb-6 overflow-hidden">
        <div 
          onClick={() => setFilter('pending')}
          className={`cursor-pointer p-4 md:p-5 transition-colors ${
            filter === 'pending' 
              ? 'bg-orange-50/60' 
              : 'hover:bg-stone-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-orange-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Awaiting Review</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-stone-900">{pendingCount}</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Pending clinical sign-off</p>
        </div>

        <div 
          onClick={() => setFilter('answered')}
          className={`cursor-pointer p-4 md:p-5 transition-colors ${
            filter === 'answered' 
              ? 'bg-emerald-50/60' 
              : 'hover:bg-stone-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved & Sent</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-stone-900">{answeredCount}</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Delivered to patient app</p>
        </div>

        <div 
          onClick={() => setFilter('all')}
          className={`cursor-pointer p-4 md:p-5 transition-colors ${
            filter === 'all' 
              ? 'bg-stone-100/70' 
              : 'hover:bg-stone-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-stone-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">All History</span>
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-stone-900">{queries.length}</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Total patient questions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
          {(['pending', 'answered', 'all'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all ${
                filter === tab 
                  ? 'bg-white text-stone-900 shadow-2xs font-bold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab === 'pending' ? 'Pending Review' : tab === 'answered' ? 'Answered' : 'All Queries'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patient or query..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Query Cards */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400">
          <RefreshCw className="w-6 h-6 animate-spin mb-3 text-orange-500" />
          <p className="text-xs font-medium">Connecting to live query feed...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-stone-200 rounded-xl p-8">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-2.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">
            {filter === 'pending' ? 'All caught up! No queries awaiting approval.' : 'No queries found.'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            {filter === 'pending' 
              ? 'When any patient submits a question from their portal, it will instantly appear here for your review and approval.' 
              : 'Try switching filters or clearing your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map(q => {
            const patient = patients.find(p => p.id === q.patientId);
            const isPending = q.status === 'pending' || q.status === 'viewed';
            const isProcessing = processing === q.id;
            const isGenerating = generatingAi[q.id!];

            return (
              <div 
                key={q.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs transition-all ${
                  isPending 
                    ? 'border-orange-200/90' 
                    : 'border-stone-200'
                }`}
              >
                {/* Header */}
                <div className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                  isPending ? 'bg-orange-50/30 border-orange-100' : 'bg-stone-50/60 border-stone-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {q.patientName ? q.patientName.charAt(0) : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{q.patientName}</span>
                        {patient && (
                          <Link 
                            to={`/dietician/patients/${patient.id}`}
                            className="text-[11px] text-orange-600 hover:text-orange-800 flex items-center gap-0.5 font-semibold underline"
                          >
                            Profile <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        Submitted {q.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Patient Context Pills */}
                    {patient && (
                      <div className="hidden md:flex items-center gap-1.5 mr-2">
                        {patient.dietaryType && (
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
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

                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                      isPending 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {isPending ? 'Awaiting Approval' : 'Delivered'}
                    </span>

                    <button
                      onClick={() => q.id && handleDelete(q.id, q.patientName)}
                      title="Delete query"
                      className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Patient Clinical Context Card */}
                  {patient && (
                    <div className="p-3.5 bg-stone-50 border border-stone-200/70 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Dietary Profile</span>
                        <span className="font-semibold text-stone-900">{patient.dietaryType || 'Standard Balanced'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Current / Target Wt</span>
                        <span className="font-semibold text-stone-900">
                          {patient.currentWeightKg ? `${patient.currentWeightKg}kg` : '--'} → {patient.targetWeightKg ? `${patient.targetWeightKg}kg` : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Adherence Rate</span>
                        <span className={`font-semibold ${
                          (patient.adherencePercentage ?? 75) >= 70 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {patient.adherencePercentage ?? 75}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Conditions / Allergies</span>
                        <div className="truncate">
                          {(patient.allergies && patient.allergies.length > 0) || (patient.healthInfo?.allergies && patient.healthInfo?.allergies !== 'None') ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.healthInfo?.allergies}
                            </span>
                          ) : (
                            <span className="text-stone-600 font-medium">None noted</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Patient Question */}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1">
                      Patient Query
                    </span>
                    <div className="p-3.5 bg-orange-50/30 border border-orange-200/50 rounded-lg text-xs md:text-sm text-stone-900 leading-relaxed font-sans font-medium">
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
                            className="text-[11px] text-orange-600 hover:text-orange-800 underline font-semibold flex items-center gap-1 disabled:opacity-50"
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
                          className="w-full p-3.5 bg-white border border-stone-300 rounded-lg text-xs md:text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent font-sans leading-relaxed resize-y shadow-2xs"
                        />

                        {/* Manual Template & Exchange Values Input Tool */}
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setOpenTemplatePanel(p => ({ ...p, [q.id!]: !p[q.id!] }))}
                              className="text-xs font-bold text-stone-800 flex items-center gap-1.5 hover:text-orange-700 transition-colors"
                            >
                              <Sliders className="w-3.5 h-3.5 text-orange-600" />
                              <span>Clinical Template & Exchange Values (Manual Input)</span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200">
                                200 Recipes & IFCT
                              </span>
                              {openTemplatePanel[q.id!] ? (
                                <ChevronUp className="w-3.5 h-3.5 text-stone-400 ml-1" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-1" />
                              )}
                            </button>

                            <div className="flex items-center gap-1">
                              {(['manual', 'biomarkers', 'exchange', 'recipes', 'saved'] as const).map(tabKey => (
                                <button
                                  key={tabKey}
                                  type="button"
                                  onClick={() => {
                                    setOpenTemplatePanel(p => ({ ...p, [q.id!]: true }));
                                    setTemplateTab(p => ({ ...p, [q.id!]: tabKey }));
                                  }}
                                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-colors ${
                                    (templateTab[q.id!] || 'manual') === tabKey
                                      ? 'bg-stone-900 text-white'
                                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/70'
                                  }`}
                                >
                                  {tabKey === 'manual' ? 'Manual Input' : tabKey === 'biomarkers' ? '13 Biomarkers' : tabKey === 'exchange' ? 'Exchanges' : tabKey === 'recipes' ? '200 Recipes' : `Saved (${savedTemplates.length})`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tab 1: Manual Input Field */}
                          {(templateTab[q.id!] || 'manual') === 'manual' && (
                            <div className="space-y-2.5 pt-1">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={manualTemplateInputs[q.id!] || ''}
                                  onChange={e => setManualTemplateInputs(prev => ({ ...prev, [q.id!]: e.target.value }))}
                                  placeholder="Input template values manually (e.g., 1 Cereal Ex. (30g) + 1 Veg A (100g) = 120 kcal, 4g Protein)..."
                                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-2xs font-sans"
                                />
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleInsertTemplateText(q.id!, manualTemplateInputs[q.id!] || '')}
                                    className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors whitespace-nowrap"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Insert into Reply
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCustomTemplate(q.id!)}
                                    className="px-3 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shadow-2xs"
                                    title="Save to Reusable Templates"
                                  >
                                    <Bookmark className="w-3.5 h-3.5 text-stone-500" />
                                    Save
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                                <span className="font-semibold text-stone-600">Quick inserts:</span>
                                <button
                                  type="button"
                                  onClick={() => handleInsertTemplateText(q.id!, "1 Cereal Exchange (30g = 100 kcal, 2.5g Protein, 21g Carbs) + 1 Vegetable Exchange (100g = 20 kcal, 2.5g Fiber).")}
                                  className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                                >
                                  + Low-GI Breakfast
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInsertTemplateText(q.id!, "Target 15–20g protein: 1 Pulse Exchange (30g = 90 kcal, 6.5g Protein) + 1 Paneer Exchange (40g = 100 kcal, 7.5g Protein).")}
                                  className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                                >
                                  + Protein Target
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInsertTemplateText(q.id!, "Drink 2.5–3L water daily spaced between meals. Limit sodium intake below 1500mg daily.")}
                                  className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                                >
                                  + Hydration & Sodium
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInsertTemplateText(q.id!, "Evening Snack: 1 Fruit Exchange (100g = 50 kcal, 3g Fiber) or 30g roasted chana.")}
                                  className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                                >
                                  + 4 PM Snack Swap
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Tab: 13 Core Clinical Lab Biomarkers (Discussion Panel) */}
                          {templateTab[q.id!] === 'biomarkers' && (() => {
                            const patientLabs = patient?.labBiomarkers || {};
                            const evaluatedBiomarkers = evaluateLabBiomarkers(patientLabs, patient?.gender || 'Female');

                            const handleInsertFullBiomarkerSummary = () => {
                              const abnormal = evaluatedBiomarkers.filter(b => b.status !== 'optimal');
                              const normal = evaluatedBiomarkers.filter(b => b.status === 'optimal');
                              const summaryText = `Clinical Biomarkers Assessment for ${patient?.name || 'Patient'}:\n` +
                                `• Priority Findings: ${abnormal.map(b => `${b.shortName}: ${b.value} ${b.unit} (${b.statusLabel})`).join(', ')}.\n` +
                                `• Stable Parameters: ${normal.map(b => `${b.shortName}: ${b.value} ${b.unit} (Normal)`).join(', ')}.\n` +
                                `• Dietitian Strategy: With HbA1c at ${patientLabs.hba1c}%, Triglycerides at ${patientLabs.triglycerides} mg/dL, and SGPT at ${patientLabs.sgpt} U/L, we have tailored your plan with low-glycemic complex carbohydrates (millets/daliya) and restricted saturated cooking fats to support liver recovery. Electrolytes (Sodium ${patientLabs.sodium} mEq/L, Potassium ${patientLabs.potassium} mEq/L) and renal filtration (Creatinine ${patientLabs.creatinine} mg/dL, BUN ${patientLabs.bun} mg/dL) remain completely healthy.`;
                              handleInsertTemplateText(q.id!, summaryText);
                            };

                            return (
                              <div className="space-y-3 pt-1">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-xl">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="font-bold text-xs text-stone-100">13 Clinical Biomarkers Panel</span>
                                      <span className="text-[10px] bg-stone-700 text-stone-300 px-1.5 py-0.2 rounded font-mono">
                                        Report: {patientLabs.testDate || 'Recent'}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-stone-300 mt-0.5">
                                      Discuss metabolic, lipid, liver, electrolyte, and renal biomarkers with evidence-based MNT guidance.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleInsertFullBiomarkerSummary}
                                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-2xs whitespace-nowrap transition-colors flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3 text-emerald-300" />
                                    Insert Full 13-Point Analysis into Reply
                                  </button>
                                </div>

                                {/* 13 Biomarkers Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                                  {evaluatedBiomarkers.map((b) => (
                                    <div
                                      key={b.key}
                                      className="p-2.5 bg-white border border-stone-200 rounded-xl space-y-1.5 hover:border-orange-300 transition-colors shadow-2xs"
                                    >
                                      <div className="flex items-start justify-between gap-1.5">
                                        <div>
                                          <span className="font-bold text-xs text-stone-900">{b.shortName}</span>
                                          <span className="text-[10px] text-stone-400 block truncate">{b.name}</span>
                                        </div>
                                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${b.badgeColor}`}>
                                          {b.statusLabel}
                                        </span>
                                      </div>

                                      <div className="flex items-baseline justify-between text-xs pt-0.5 border-t border-stone-100">
                                        <span className="font-extrabold text-stone-900">
                                          {b.value} <span className="text-[10px] font-normal text-stone-500">{b.unit}</span>
                                        </span>
                                        <span className="text-[9.5px] text-stone-400">Ref: {b.normalRange}</span>
                                      </div>

                                      <p className="text-[10px] text-stone-600 line-clamp-2 leading-tight bg-stone-50 p-1 rounded border border-stone-100">
                                        {b.dietaryAction}
                                      </p>

                                      <button
                                        type="button"
                                        onClick={() => handleInsertTemplateText(q.id!, `${b.shortName} (${b.value} ${b.unit} - ${b.statusLabel}): ${b.dietaryAction}`)}
                                        className="w-full py-1 text-center bg-stone-100 hover:bg-orange-50 hover:text-orange-900 hover:border-orange-200 border border-stone-200 rounded text-[10px] font-bold text-stone-700 transition-colors"
                                      >
                                        + Insert {b.shortName}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Tab 3: Standard IFCT Exchange System Reference */}
                          {templateTab[q.id!] === 'exchange' && (
                            <div className="space-y-2 pt-1 max-h-52 overflow-y-auto pr-1">
                              <p className="text-[11px] text-stone-500">
                                Click any exchange group to append its clinical portion & macro values into your reply:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {EXCHANGE_SYSTEM_REFERENCE.map((ex, idx) => {
                                  const textVal = `${ex.group} (${ex.portion}): ${ex.calories} kcal, ${ex.protein}g Protein, ${ex.carbs}g Carbs, ${ex.fat}g Fat${ex.fiber ? `, ${ex.fiber}g Fiber` : ''}.`;
                                  return (
                                    <div
                                      key={idx}
                                      className="p-2 bg-white border border-stone-200 rounded-lg flex items-center justify-between gap-2 hover:border-orange-300 transition-colors"
                                    >
                                      <div className="text-left overflow-hidden">
                                        <div className="text-[11px] font-bold text-stone-900 truncate">{ex.group}</div>
                                        <div className="text-[10px] text-stone-500">
                                          {ex.portion} • {ex.calories} kcal • P: {ex.protein}g • C: {ex.carbs}g
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setManualTemplateInputs(prev => ({ ...prev, [q.id!]: textVal }))}
                                          className="text-[10px] px-1.5 py-1 text-stone-600 hover:text-stone-900 rounded bg-stone-100 hover:bg-stone-200 font-semibold"
                                          title="Copy to manual input"
                                        >
                                          Fill
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleInsertTemplateText(q.id!, textVal)}
                                          className="text-[10px] px-2 py-1 bg-stone-900 hover:bg-black text-white rounded font-semibold whitespace-nowrap"
                                        >
                                          + Insert
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Tab 3: 200 Recipe Presets */}
                          {templateTab[q.id!] === 'recipes' && (
                            <div className="space-y-2.5 pt-1">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input
                                  type="text"
                                  value={recipeFilter}
                                  onChange={e => setRecipeFilter(e.target.value)}
                                  placeholder="Search from all 200 clinical recipes (e.g., Upma, Chilla, Daliya, Pancake, Quinoa)..."
                                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                              </div>
                              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                                {DEFAULT_CLINICAL_RECIPES.filter(r => {
                                  if (!recipeFilter) return true;
                                  const rf = recipeFilter.toLowerCase();
                                  return r.name.toLowerCase().includes(rf) ||
                                    (r.clinicalFocus && r.clinicalFocus.toLowerCase().includes(rf)) ||
                                    r.ingredients.some(i => i.toLowerCase().includes(rf));
                                }).slice(0, 15).map(rec => {
                                  const recText = `Prescribed Recipe: ${rec.name} (${rec.portionSize || '1 serving'})\n• Nutrition: ${rec.calories} kcal | Protein: ${rec.protein}g | Carbs: ${rec.carbs}g | Fat: ${rec.fat}g${rec.fiber ? ` | Fiber: ${rec.fiber}g` : ''}\n• Ingredients: ${rec.ingredients.join(', ')}\n• Method: ${rec.recipe.join(' ')}`;
                                  return (
                                    <div
                                      key={rec.id}
                                      className="p-2.5 bg-white border border-stone-200 rounded-lg flex items-center justify-between gap-3 hover:border-orange-300 transition-colors"
                                    >
                                      <div className="text-left">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-xs text-stone-900">{rec.name}</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium">
                                            {rec.dietaryType}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-stone-500 mt-0.5">
                                          {rec.calories} kcal • P: {rec.protein}g • C: {rec.carbs}g • F: {rec.fat}g{rec.fiber ? ` • Fib: ${rec.fiber}g` : ''} • {rec.clinicalFocus}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleInsertTemplateText(q.id!, recText)}
                                        className="px-2.5 py-1 bg-stone-900 hover:bg-black text-white text-[11px] font-semibold rounded-md whitespace-nowrap shadow-2xs"
                                      >
                                        + Insert Recipe
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Tab 4: Saved Custom Templates */}
                          {templateTab[q.id!] === 'saved' && (
                            <div className="space-y-2 pt-1 max-h-52 overflow-y-auto pr-1">
                              {savedTemplates.length === 0 ? (
                                <p className="text-xs text-stone-400 py-3 text-center">No saved templates yet. Type in Manual Input and click Save.</p>
                              ) : (
                                savedTemplates.map(tmpl => (
                                  <div
                                    key={tmpl.id}
                                    className="p-2.5 bg-white border border-stone-200 rounded-lg flex items-start justify-between gap-3 hover:border-orange-300 transition-colors"
                                  >
                                    <div className="text-left flex-1">
                                      <div className="text-xs font-bold text-stone-900">{tmpl.label}</div>
                                      <p className="text-[11px] text-stone-600 mt-0.5 whitespace-pre-wrap">{tmpl.text}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleInsertTemplateText(q.id!, tmpl.text)}
                                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-semibold whitespace-nowrap"
                                      >
                                        Insert
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCustomTemplate(tmpl.id)}
                                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                                        title="Delete template"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      editingAnsweredId === q.id ? (
                        <div className="space-y-3">
                          <textarea
                            rows={4}
                            value={editReplies[q.id!] ?? q.reply ?? ''}
                            onChange={e => q.id && setEditReplies(p => ({ ...p, [q.id!]: e.target.value }))}
                            placeholder="Edit the clinical answer..."
                            className="w-full p-3.5 bg-white border border-stone-300 rounded-lg text-xs md:text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans leading-relaxed resize-y shadow-2xs"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveAndSend(q)}
                              disabled={isProcessing}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-2xs disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {isProcessing ? 'Updating...' : 'Save & Update Answer'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAnsweredId(null)}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-lg text-xs md:text-sm text-stone-800 leading-relaxed font-sans">
                          <p className="whitespace-pre-wrap">{q.reply}</p>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Authorized by Lead Dietician • Visible on Patient's Screen
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (q.id) {
                                  setEditReplies(p => ({ ...p, [q.id!]: q.reply || '' }));
                                  setEditingAnsweredId(q.id);
                                }
                              }}
                              className="text-[11px] text-emerald-800 hover:text-emerald-950 underline font-semibold"
                            >
                              Edit Answer
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Actions Footer for Pending */}
                {isPending && (
                  <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-stone-500 italic">
                      Review or edit the response before sending to client.
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApproveAndSend(q)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 text-orange-400" />
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
