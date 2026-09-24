import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { getNotifications, markNotificationRead, Notification } from '../services/db';
import { LayoutDashboard, Users, MessageSquare, LogOut, Bell, Wand2, BookOpen, Bot, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import Overview from './Dietician/Overview';
import PatientsList from './Dietician/PatientsList';
import PatientProfileView from './Dietician/PatientProfileView';
import PatientForm from './Dietician/PatientForm';
import MessageInbox from './Dietician/MessageInbox';
import AiAssistant from './Dietician/AiAssistant';
import KnowledgeBase from './Dietician/KnowledgeBase';
import MealPlanGenerator from './Dietician/MealPlanGenerator';

export default function DieticianDashboard() {

  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      const notifs = await getNotifications();
      setNotifications(notifs);
    }
    loadNotifications();
    // In a real app we would use onSnapshot for real-time updates.
    const interval = setInterval(loadNotifications, 10000); // Poll every 10s for demo
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read && n.id) {
      await markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    // Navigate if appropriate based on type
    if (n.type === 'NEW_PATIENT') navigate('/dietician/patients');
    if (n.type === 'AI_COACH_MESSAGE' || n.type === 'SYSTEM') navigate('/dietician/inbox');
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const pendingApprovalsCount = notifications.filter(n => (n.type === 'AI_COACH_MESSAGE' || n.type === 'SYSTEM') && !n.read).length;

  const navItems = [
    { name: 'Dashboard', path: '/dietician', icon: LayoutDashboard },
    { name: 'Patients', path: '/dietician/patients', icon: Users },
    { name: 'Message Inbox', path: '/dietician/inbox', icon: MessageSquare, badge: pendingApprovalsCount },
    { name: 'Plan Generator', path: '/dietician/generator', icon: Wand2 },
    { name: 'Knowledge Base', path: '/dietician/knowledge', icon: BookOpen },
    { name: 'AI Assistant', path: '/dietician/ai', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-100 flex flex-col shadow-sm z-10">
        <div className="p-8 pb-4">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <img src="/logo.jpg" alt="NutriSnap" className="h-8 w-auto rounded-md shadow-sm" />
            <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">NutriSnap</h2>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-pink-600 font-bold mt-1">Clinical Portal</p>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${active ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-200' : 'border border-transparent text-stone-500 hover:text-orange-500 hover:bg-orange-50/50'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-pink-500' : 'text-stone-400'}`} />
                  {item.name}
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-stone-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {profile?.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">{profile?.name}</p>
              <p className="text-xs text-stone-500">Lead Dietician</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-sm font-bold text-stone-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-stone-50/50">
        {/* Top Header for Notifications */}
        <header className="h-16 border-b border-stone-100 bg-white/80 backdrop-blur-md flex items-center justify-end px-8 shrink-0">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-stone-500 hover:text-orange-500 transition-colors focus:outline-none"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-fuchsia-500 border-2 border-white shadow-sm"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 shadow-lg z-50 rounded-md overflow-hidden">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <h3 className="font-bold text-stone-900 text-sm">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-sm">No notifications yet.</div>
                  ) : (
                    notifications.map(n => (
                      <button 
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left p-4 border-b border-stone-100 hover:bg-stone-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                      >
                        <p className={`text-sm ${!n.read ? 'font-bold text-stone-900' : 'font-medium text-stone-600'}`}>
                          {n.message}
                        </p>
                        <span className="text-xs text-stone-400 mt-1 block">
                          {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString() : 'Just now'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/patients" element={<PatientsList />} />
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id/*" element={<PatientProfileView />} />
            <Route path="/inbox" element={<MessageInbox />} />
            <Route path="/ai-approvals" element={<MessageInbox />} />
            <Route path="/generator" element={<MealPlanGenerator />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/ai" element={<AiAssistant />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
