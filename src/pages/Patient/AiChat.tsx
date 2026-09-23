import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { saveAiCoachMessage, createNotification, AiCoachMessage } from '../../services/db';
import { Clock } from 'lucide-react';

export default function AiChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<AiCoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, 'ai_coach_messages'),
      where('patientId', '==', profile.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id } as AiCoachMessage));
      setMessages(loaded);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleSend = async () => {
    if (!input.trim() || !profile) return;
    const questionText = input.trim();
    setInput('');
    setLoading(true);

    try {
      let aiDraft = '';
      try {
        const res = await fetch('/api/ai/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: profile.uid,
            patientName: profile.name,
            question: questionText,
            patientProfile: profile
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.aiDraft) {
            aiDraft = data.aiDraft;
          }
        }
      } catch (fetchErr) {
        console.warn('AI endpoint draft warning, using clinical fallback draft:', fetchErr);
      }

      // If AI draft generation is delayed or failed, ensure dietician can still review and answer
      if (!aiDraft) {
        aiDraft = "Thank you for reaching out! To best support your nutritional goals, ensure you are staying hydrated and spacing your protein intake throughout the day. Your lead dietician will provide your customized clinical recommendation shortly.";
      }

      await saveAiCoachMessage({
        patientId: profile.uid,
        patientName: profile.name,
        question: questionText,
        aiDraft: aiDraft,
        approvedAnswer: '',
        status: 'pending'
      });

      await createNotification({
        type: 'AI_COACH_MESSAGE',
        patientId: profile.uid,
        patientName: profile.name,
        message: `New AI Coach message from ${profile.name} awaiting approval.`,
        read: false
      });
    } catch (e: any) {
      console.error('AI Coach submission error:', e);
      alert('Could not submit message. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto h-[calc(100vh-64px)] md:h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">AI Nutrition Coach</h1>
      <p className="text-sm text-stone-500 mb-6">Ask questions about your diet. Your dietician will review and approve all AI advice.</p>
      
      <div className="bg-white rounded-none border border-stone-100 flex-1 flex flex-col overflow-hidden mb-16 md:mb-0">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-stone-500 py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-800">Ask Your Nutrition Coach</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-6">
                Ask any question about your diet. The AI will draft clinical advice, which your lead dietician authorizes before delivering it to you.
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {[
                  'Can I swap white rice with quinoa for dinner?',
                  'What are good high-protein vegetarian snacks?',
                  'How much water should I drink on workout days?'
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-xs px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-full transition-colors text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="p-4 rounded-xl max-w-[85%] bg-stone-900 text-white shadow-xs">
                  <p className="whitespace-pre-wrap text-sm md:text-base">{m.question}</p>
                </div>
              </div>
              
              {/* AI/Dietician Response */}
              <div className="flex justify-start">
                <div className={`p-4 rounded-xl max-w-[85%] border-l-4 shadow-xs ${
                  m.status === 'approved' 
                    ? 'bg-emerald-50/40 text-stone-900 border-emerald-500' 
                    : m.status === 'rejected' 
                    ? 'bg-rose-50 text-rose-900 border-rose-500' 
                    : 'bg-amber-50 text-amber-900 border-amber-500'
                }`}>
                  {m.status === 'pending' ? (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1 w-fit mb-2">
                        <Clock className="w-3 h-3 animate-pulse" />
                        Pending Dietician Approval
                      </span>
                      <p className="text-xs md:text-sm text-amber-800 italic">
                        AI has drafted an answer. Your lead dietician is currently reviewing and verifying it before delivery...
                      </p>
                    </div>
                  ) : m.status === 'rejected' ? (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded w-fit mb-2 block">
                        Declined
                      </span>
                      <p className="text-xs md:text-sm italic text-rose-700">
                        This query was declined by your dietician. Please consult your dietician during your next review or ask another question.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 w-fit mb-2">
                        ✓ Authorized by Lead Dietician
                      </span>
                      <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed text-stone-800">
                        {m.approvedAnswer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-4 rounded-none bg-stone-50 text-stone-500 text-sm md:text-base border-l-4 border-stone-300">
                Thinking...
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-stone-100 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 border border-stone-200 rounded-none px-4 py-2 outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 text-sm md:text-base"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-stone-900 text-white font-medium rounded-none hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
