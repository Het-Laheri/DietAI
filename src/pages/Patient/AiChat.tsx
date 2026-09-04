import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AiChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !profile) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'patient',
          context: { 
            patientProfile: profile,
            note: "Patient asking about their plan, nutrition advice, or alternatives. Remember you are an AI assistant and must not prescribe medical changes. Direct them to their dietician for major updates."
          },
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }))
        })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: data.error || 'Unable to get response from AI. Please try again.' }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: 'Error communicating with AI assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto h-full md:h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">AI Nutrition Coach</h1>
      
      <div className="bg-white rounded-none  border border-stone-100 flex-1 flex flex-col overflow-hidden mb-16 md:mb-0">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-stone-500 mt-10">
              <p>Hello! I'm your AI assistant. I can help explain your plan, suggest healthy snacks, or answer general nutrition questions.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-none max-w-[85%] ${m.role === 'user' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-900'}`}>
                <p className="whitespace-pre-wrap text-sm md:text-base">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-4 rounded-none bg-stone-50 text-stone-500 text-sm md:text-base">
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
            className="px-4 py-2 bg-stone-900 text-white font-medium rounded-none hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
