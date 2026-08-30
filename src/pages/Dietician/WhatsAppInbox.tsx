import { useEffect, useState } from 'react';
import { 
  getWhatsAppConversations, 
  getWhatsAppMessages, 
  markWhatsAppConversationRead, 
  getPatients, 
  WhatsAppConversation, 
  WhatsAppMessage, 
  PatientProfile 
} from '../../services/db';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  RefreshCw, 
  Clock,
  Phone,
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';

export default function WhatsAppInbox() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [health, setHealth] = useState<{ connected: boolean; configured: boolean; phoneNumberId?: string; error?: string }>({
    connected: false,
    configured: false
  });

  // Check Meta connection status
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/whatsapp/health');
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      setHealth({ connected: false, configured: false, error: 'Health check request failed' });
    }
  };

  const loadConversations = async () => {
    const convs = await getWhatsAppConversations();
    setConversations(convs);
    if (!selectedConvId && convs.length > 0) {
      setSelectedConvId(convs[0].id!);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await checkHealth();
      await loadConversations();
      const pts = await getPatients();
      setPatients(pts);
      setLoading(false);
    }
    init();

    // Poll conversations every 10 seconds for realtime sync
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when selected conversation changes
  useEffect(() => {
    async function loadMsgs() {
      if (!selectedConvId) return;
      setLoadingMsgs(true);
      const msgs = await getWhatsAppMessages(selectedConvId);
      setMessages(msgs);
      await markWhatsAppConversationRead(selectedConvId);
      setLoadingMsgs(false);
    }
    loadMsgs();
  }, [selectedConvId]);

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  // Send WhatsApp reply via Meta Cloud API
  const handleSendReply = async () => {
    if (!selectedConv || !replyText.trim()) return;
    setSending(true);

    try {
      const res = await fetch('/api/whatsapp/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: selectedConv.whatsappNumber,
          replyText,
          patientName: selectedConv.patientName,
          conversationId: selectedConv.id,
          patientId: selectedConv.patientId
        })
      });

      const data = await res.json();
      if (data.success) {
        setReplyText('');
        // Reload messages
        const msgs = await getWhatsAppMessages(selectedConv.id!);
        setMessages(msgs);
        await loadConversations();
      } else {
        alert(`Failed to send WhatsApp message: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Send error: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  // AI draft suggestion generator
  const handleAiSuggest = () => {
    if (!messages.length) return;
    const lastIncoming = [...messages].reverse().find(m => m.direction === 'INCOMING');
    if (lastIncoming?.aiSuggestedReply) {
      setReplyText(lastIncoming.aiSuggestedReply);
    } else {
      setReplyText("Hello! Thank you for reaching out. Please continue following your assigned meal plan and drink plenty of water today.");
    }
  };

  if (loading) {
    return <div className="p-8 text-stone-500 font-medium">Loading WhatsApp Cloud API channel...</div>;
  }

  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-screen flex flex-col">
      {/* Meta API Status Banner */}
      <div className="mb-6 bg-white border border-stone-200 p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${health.connected ? 'bg-emerald-500 animate-pulse' : health.configured ? 'bg-amber-500' : 'bg-red-500'}`} />
          <div>
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              Meta WhatsApp Cloud API
              {health.connected && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold uppercase rounded border border-emerald-300">
                  Connected & Active
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-500">
              {health.connected 
                ? `Phone ID: ${health.phoneNumberId} • Official Graph API Channel` 
                : health.configured 
                  ? `Configured but error: ${health.error}`
                  : 'Meta Cloud API environment variables not set in .env'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4 text-stone-400" />
            <span>Unread: <strong className="text-stone-900">{unreadTotal}</strong></span>
          </div>
          <button 
            onClick={checkHealth}
            className="p-1.5 hover:bg-stone-100 text-stone-500 rounded transition-colors"
            title="Refresh Connection Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="bg-white border border-stone-200 flex-1 overflow-hidden flex flex-col md:flex-row shadow-sm">
        
        {/* Left List: Conversations */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col bg-stone-50/50">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-600 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              WhatsApp Chats ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {conversations.map(c => {
              const isSelected = selectedConvId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id!)}
                  className={`w-full text-left p-4 hover:bg-stone-100 transition-colors relative ${isSelected ? 'bg-white border-l-4 border-emerald-600 shadow-xs' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                      {c.patientName}
                      {c.status === 'UNRECOGNIZED' && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Unrecognized</span>
                      )}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 truncate mb-1">+{c.whatsappNumber}</p>
                  <p className="text-xs text-stone-700 truncate font-sans">{c.lastMessagePreview}</p>
                  
                  {c.unreadCount > 0 && (
                    <span className="absolute right-4 bottom-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}

            {conversations.length === 0 && (
              <div className="p-8 text-center text-xs text-stone-400">
                No WhatsApp conversations yet. Messages sent by patients to your Meta Business Number will appear here automatically.
              </div>
            )}
          </div>
        </div>

        {/* Right Detail: Message Thread */}
        <div className="flex-1 flex flex-col bg-[#FAFAFA]">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-stone-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-stone-900 flex items-center gap-2">
                    {selectedConv.patientName}
                    <span className="text-xs font-normal text-stone-500 font-mono">+{selectedConv.whatsappNumber}</span>
                  </h3>
                  <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Meta Cloud API Direct Channel
                  </p>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {loadingMsgs ? (
                  <div className="text-center text-xs text-stone-400">Loading chat thread...</div>
                ) : (
                  messages.map(m => {
                    const isIncoming = m.direction === 'INCOMING';
                    return (
                      <div key={m.id} className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] p-4 rounded-lg shadow-xs ${isIncoming ? 'bg-white text-stone-900 border border-stone-200' : 'bg-emerald-700 text-white'}`}>
                          {m.mediaUrl && (
                            <div className="mb-2 rounded overflow-hidden border border-stone-200">
                              <img src={m.mediaUrl} alt="Attached Media" className="max-h-60 w-full object-cover" />
                            </div>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{m.body}</p>

                          {isIncoming && m.aiSuggestedReply && (
                            <div className="mt-3 p-2.5 bg-brand-50 border border-brand-200 text-xs text-brand-900 rounded">
                              <span className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-brand-700 mb-1">
                                <Sparkles className="w-3 h-3" /> AI Suggested Clinical Reply
                              </span>
                              <p className="italic">"{m.aiSuggestedReply}"</p>
                              <button 
                                onClick={() => setReplyText(m.aiSuggestedReply!)}
                                className="mt-2 text-[10px] font-bold uppercase tracking-wider text-brand-800 hover:underline"
                              >
                                Use This Suggestion
                              </button>
                            </div>
                          )}

                          <div className={`text-[10px] mt-1.5 text-right ${isIncoming ? 'text-stone-400' : 'text-emerald-200'}`}>
                            {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {messages.length === 0 && !loadingMsgs && (
                  <div className="text-center text-xs text-stone-400 my-auto">No message history available for this thread.</div>
                )}
              </div>

              {/* Reply Box */}
              <div className="p-4 bg-white border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <button 
                    onClick={handleAiSuggest}
                    className="px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider rounded border border-brand-200 hover:bg-brand-100 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Auto-Draft Reply
                  </button>
                </div>

                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your clinical response to send directly via Meta WhatsApp..."
                  className="w-full border border-stone-300 p-3 text-sm outline-none focus:border-emerald-600 resize-none h-20 mb-3 font-sans"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-stone-400">Replies dispatch via Meta Graph API v21.0</span>
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending via Meta...' : 'Send WhatsApp'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 stroke-1 mb-3 text-stone-300" />
              <p className="text-sm font-medium">Select a WhatsApp conversation from the left to view messages and reply.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
