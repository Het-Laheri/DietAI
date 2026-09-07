import { useEffect, useState } from 'react';
import { getQueries, updateQuery, submitQuery, Query } from '../../services/db';
import { MessageSquare, Send, Sparkles, PhoneCall, Plus } from 'lucide-react';

export default function QueryInbox() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [aiSuggesting, setAiSuggesting] = useState(false);

  useEffect(() => {
    async function load() {
      const qs = await getQueries();
      setQueries(qs);
      setLoading(false);
    }
    load();
  }, []);

  const selectedQuery = queries.find(q => q.id === selectedId);

  const handleSuggestReply = async () => {
    if (!selectedQuery) return;
    setAiSuggesting(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'dietician',
          context: { patientName: selectedQuery.patientName, query: selectedQuery.question },
          messages: [{ role: 'user', parts: [{ text: `Draft a brief, empathetic response to this patient question: "${selectedQuery.question}". Keep it under 3 sentences.` }] }]
        })
      });
      const data = await res.json();
      setReplyText(data.text);
    } catch (e) {
      alert('Failed to generate response');
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedQuery || !replyText.trim()) return;
    
    await updateQuery(selectedQuery.id!, {
      reply: replyText,
      status: 'answered'
    });

    setQueries(await getQueries());
    setReplyText('');
    setSelectedId(null);
  };


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Patient Queries & Communications</h1>
          <p className="text-xs text-stone-500">View and respond to clinical questions received via In-App messaging.</p>
        </div>
      </div>

      <div className="bg-white rounded-none border border-stone-200 flex-1 overflow-hidden flex flex-col md:flex-row shadow-sm">
        {/* List */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-stone-200 overflow-y-auto">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-500">Conversations</span>
            <span className="text-xs font-bold bg-stone-200 px-2 py-0.5 rounded text-stone-700">{queries.length}</span>
          </div>
          <div className="divide-y divide-stone-100">
            {queries.map(q => (
              <button 
                key={q.id}
                onClick={() => {
                  setSelectedId(q.id!);
                  if (q.status === 'pending') updateQuery(q.id!, { status: 'viewed' });
                }}
                className={`w-full text-left p-4 hover:bg-stone-50 transition-colors ${selectedId === q.id ? 'bg-brand-50/60 border-l-4 border-brand-700' : ''}`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm text-stone-900">{q.patientName}</span>
                  <span className="text-xs text-stone-500">{q.date}</span>
                </div>
                <p className="text-xs text-stone-600 truncate mb-2">{q.question}</p>
                <div className="flex gap-2">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${q.status === 'pending' ? 'bg-amber-100 text-amber-800' : q.status === 'answered' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-700'}`}>
                    {q.status}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1 bg-stone-100 text-stone-600`}>
                    In-App
                  </span>
                </div>
              </button>
            ))}
            {queries.length === 0 && <div className="p-8 text-center text-xs text-stone-500">No queries found.</div>}
          </div>
        </div>

        {/* Detail View */}
        <div className="flex-1 flex flex-col bg-[#FAFAFA]">
          {selectedQuery ? (
            <>
              <div className="p-5 bg-white border-b border-stone-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                    {selectedQuery.patientName}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Received on {selectedQuery.date}
                  </p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="bg-white p-4 border border-stone-200 max-w-[85%] shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1">Patient Question</span>
                  <p className="text-stone-900 text-sm leading-relaxed">{selectedQuery.question}</p>
                </div>
                
                {selectedQuery.reply && (
                  <div className="flex justify-end">
                    <div className="bg-stone-900 text-white p-4 max-w-[85%] shadow-sm">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-200 block mb-1">Your Response</span>
                      <p className="text-sm leading-relaxed">{selectedQuery.reply}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {!selectedQuery.reply && (
                <div className="p-5 bg-white border-t border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      onClick={handleSuggestReply}
                      disabled={aiSuggesting}
                      className="px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider rounded border border-brand-200 hover:bg-brand-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiSuggesting ? 'Generating AI Response...' : 'AI Draft Suggestion'}
                    </button>
                  </div>
                  
                  <textarea 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your response to the patient..."
                    className="w-full border border-stone-300 p-3 text-sm outline-none focus:border-stone-900 resize-none h-24 mb-3 font-sans"
                  />
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => handleSendReply()}
                      className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send In-App
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 stroke-1 mb-3 text-stone-300" />
              <p className="text-sm font-medium">Select a patient query from the left list to respond via In-App.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
