import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { saveAiCoachMessage, AiCoachMessage } from '../../services/db';
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
      const data = await res.json();
      
      if (res.ok && data.aiDraft) {
        await saveAiCoachMessage({
          patientId: profile.uid,
          patientName: profile.name,
          question: questionText,
          aiDraft: data.aiDraft,
          approvedAnswer: '',
          status: 'pending'
        });
      } else {
        alert(data.error || 'Failed to generate AI response.');
      }
    } catch (e: any) {
      console.error('AI Coach error:', e);
      alert('Error communicating with AI assistant.');
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
            <div className="text-center text-stone-500 mt-10">
              <p>Hello! I'm your AI assistant.</p>
              <p className="text-sm mt-2">I will generate advice that your dietician reviews before sending back to you.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="p-4 rounded-none max-w-[85%] bg-stone-900 text-white">
                  <p className="whitespace-pre-wrap text-sm md:text-base">{m.question}</p>
                </div>
              </div>
              
              {/* AI/Dietician Response */}
              <div className="flex justify-start">
                <div className={`p-4 rounded-none max-w-[85%] border-l-4 ${m.status === 'approved' ? 'bg-stone-50 text-stone-900 border-emerald-500' : m.status === 'rejected' ? 'bg-red-50 text-red-900 border-red-500' : 'bg-amber-50 text-amber-900 border-amber-500'}`}>
                  {m.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-pulse text-amber-600" />
                      <p className="text-sm italic">AI has drafted a response. Waiting for your dietician's approval...</p>
                    </div>
                  ) : m.status === 'rejected' ? (
                    <p className="text-sm italic text-red-700">This question was declined by your dietician. Please reach out in your Inbox.</p>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm md:text-base">{m.approvedAnswer}</p>
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
