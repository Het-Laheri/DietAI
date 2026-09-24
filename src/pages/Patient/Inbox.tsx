import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submitQuery, createNotification, Query } from '../../services/db';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MessageSquare, Send, Clock, CheckCircle2, User, Sparkles, HelpCircle } from 'lucide-react';

export default function Inbox() {
  const { profile } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Live real-time listener for patient's queries
  useEffect(() => {
    if (!profile?.uid) return;
    setLoading(true);

    const q = query(
      collection(db, 'queries'),
      where('patientId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as Query));
      setQueries(loaded);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to patient queries:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !question.trim()) return;
    const questionText = question.trim();
    setSubmitting(true);

    try {
      await submitQuery({
        patientId: profile.uid,
        patientName: profile.name,
        question: questionText,
        source: 'app',
        status: 'pending',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      // Clear textarea and show success toast immediately
      setQuestion('');
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3500);

      // Create notification in background without blocking UI
      try {
        await createNotification({
          type: 'SYSTEM',
          patientId: profile.uid,
          patientName: profile.name,
          message: `New clinical query from ${profile.name}: "${questionText.slice(0, 50)}..."`,
          read: false
        });
      } catch (notifErr) {
        console.warn('Background notification notice:', notifErr);
      }
    } catch (err: any) {
      console.error('Failed to submit query:', err);
      setErrorToast(err?.message || 'Could not submit query. Please check your network and try again.');
      setTimeout(() => setErrorToast(null), 4500);
    } finally {
      setSubmitting(false);
    }
  };

  const starterChips = [
    'Can I swap white rice with quinoa for dinner?',
    'What are good high-protein vegetarian snacks?',
    'How should I adjust my meal if I feel fatigued?',
    'Can I have green tea or coffee between meals?'
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen flex flex-col">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Query sent directly to your lead dietician!
        </div>
      )}

      {errorToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-red-700 animate-in fade-in slide-in-from-bottom-2">
          <HelpCircle className="w-4 h-4 text-red-300" />
          {errorToast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">Ask Your Lead Dietician</h1>
            <p className="text-xs text-stone-500">
              Direct clinical consultation • Submit questions regarding your meal plan, symptoms, or food choices
            </p>
          </div>
        </div>
      </div>

      {/* Query Form */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 mb-8 shadow-sm">
        <form onSubmit={handleSubmit}>
          <label className="block text-xs uppercase tracking-widest font-bold text-stone-600 mb-2">
            Have a question about your diet or meal plan?
          </label>
          <textarea 
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
            rows={3}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl p-4 text-sm text-stone-900 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-y mb-3 font-sans transition-all placeholder:text-stone-400"
            placeholder="Type your question here (e.g., Can I substitute paneer with tofu for lunch?)..."
          />

          {/* Quick starter chips */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-400" /> Quick suggestions:
            </span>
            {starterChips.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => setQuestion(chip)}
                className="text-xs px-3 py-1 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-stone-600 rounded-full border border-stone-200 transition-colors"
              >
                "{chip}"
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-stone-100">
            <span className="text-xs text-stone-400 italic">
              Your query goes straight to your dietician's clinical admin portal.
            </span>
            <button 
              type="submit" 
              disabled={submitting || !question.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send to Dietician'}
            </button>
          </div>
        </form>
      </div>

      {/* Query History */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-16">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase tracking-widest font-bold text-stone-500">
            Your Consultation History ({queries.length})
          </h2>
          <span className="text-[11px] text-stone-400">Updates in real-time</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-400">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
            <p className="text-xs">Loading queries...</p>
          </div>
        ) : queries.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-10 text-center text-stone-400">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 text-stone-300" />
            <p className="font-bold text-sm text-stone-700">No questions submitted yet</p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Whenever you have questions about your meal swaps, hunger, or clinical symptoms, type them above. Your lead dietician will review and answer you directly.
            </p>
          </div>
        ) : (
          queries.map(q => {
            const isPending = q.status === 'pending';
            return (
              <div 
                key={q.id} 
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                  isPending ? 'border-amber-300 ring-1 ring-amber-300/30' : 'border-stone-200'
                }`}
              >
                {/* Query Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                      isPending 
                        ? 'bg-amber-50 text-amber-800 border-amber-300' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {isPending ? (
                        <>
                          <Clock className="w-3 h-3 animate-pulse text-amber-600" />
                          Awaiting Dietician Review
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Answered by Dietician
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400 font-medium">{q.date}</span>
                </div>
                
                {/* Question */}
                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1">
                    Your Question
                  </span>
                  <p className="text-stone-900 text-sm font-medium leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                    "{q.question}"
                  </p>
                </div>
                
                {/* Dietician Response */}
                {q.reply ? (
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                        D
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">Lead Dietician Response</span>
                        <span className="text-[10px] text-emerald-700 font-medium">Verified Clinical Advice</span>
                      </div>
                    </div>
                    <p className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap pl-8">
                      {q.reply}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 italic pl-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Your question has reached the lead dietician's admin portal. You will see their authorized answer here once reviewed.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
