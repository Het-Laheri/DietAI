import { useState } from 'react';

export default function AiAssistant() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'dietician',
          context: { note: "Dietician asking general clinical nutrition or patient-related questions." },
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
    <div className="p-8 max-w-4xl mx-auto h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-stone-900 mb-8">AI Clinical Assistant</h1>
      
      <div className="bg-white rounded-none  border border-stone-100 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-stone-500 mt-10">
              <p>Ask me anything about clinical nutrition, meal plan ideas, or patient summaries.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-none max-w-[80%] ${m.role === 'user' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-900'}`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-4 rounded-none bg-stone-50 text-stone-500">
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
            placeholder="Ask a nutrition question..."
            className="flex-1 border border-stone-200 rounded-none px-4 py-2 outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-stone-900 text-white font-medium rounded-none hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
