import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getQueries, submitQuery, Query } from '../../services/db';
import { MessageSquare, Send } from 'lucide-react';

export default function Inbox() {
  const { profile } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (profile) {
        setQueries(await getQueries(undefined, profile.uid));
      }
      setLoading(false);
    }
    load();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent, viaWhatsApp: boolean = false) => {
    e.preventDefault();
    if (!profile || !question.trim()) return;
    setSubmitting(true);

    const sourceChannel = viaWhatsApp ? 'whatsapp' : 'app';

    await submitQuery({
      patientId: profile.uid,
      patientName: profile.name,
      question,
      source: sourceChannel,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    });

    if (viaWhatsApp) {
      const encoded = encodeURIComponent(`Hi Doctor, my name is ${profile.name}.\n\nQuestion: ${question}`);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }

    setQuestion('');
    setQueries(await getQueries(undefined, profile.uid));
    setSubmitting(false);
  };

  if (loading) return <div className="p-8">Loading inbox...</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto flex flex-col h-full md:h-screen">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Ask Your Dietician</h1>
      <p className="text-stone-500 text-sm mb-6">Send questions directly to your dietician via In-App message or WhatsApp.</p>
      
      <div className="bg-white rounded-none border border-stone-200 p-6 mb-8 shadow-sm">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
            Have a question about your meal plan or symptoms?
          </label>
          <textarea 
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
            className="w-full border border-stone-300 p-3 text-sm outline-none focus:border-stone-900 resize-none h-24 mb-4 font-sans"
            placeholder="E.g. Can I swap dal with paneer today, or how should I adjust dinner?"
          />
          <div className="flex flex-wrap gap-3 justify-end">
            <button 
              type="button"
              disabled={submitting || !question.trim()}
              onClick={(e) => handleSubmit(e as any, true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Ask on WhatsApp
            </button>
            <button 
              type="submit" 
              disabled={submitting || !question.trim()}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-16">
        <h2 className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Previous Queries</h2>
        {queries.map(q => (
          <div key={q.id} className="bg-white border border-stone-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-2 items-center">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${q.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                  {q.status === 'pending' ? 'Pending Review' : 'Answered'}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${q.source === 'whatsapp' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-600'}`}>
                  {q.source === 'whatsapp' ? <MessageSquare className="w-3 h-3 text-emerald-600" /> : null}
                  {q.source === 'whatsapp' ? 'WhatsApp' : 'In-App'}
                </span>
              </div>
              <span className="text-xs text-stone-500">{q.date}</span>
            </div>
            
            <p className="text-stone-900 text-sm mb-4 leading-relaxed">{q.question}</p>
            
            {q.reply && (
              <div className="bg-brand-50 p-4 border border-brand-200">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-900 mb-1">Dietician's Reply</p>
                <p className="text-brand-950 text-sm leading-relaxed">{q.reply}</p>
              </div>
            )}
          </div>
        ))}
        {queries.length === 0 && (
          <div className="text-center text-stone-400 p-8 border border-dashed border-stone-200 text-xs">
            No previous questions sent yet.
          </div>
        )}
      </div>
    </div>
  );
}
