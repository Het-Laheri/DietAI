import { db } from '../services/firebase';
import { query, collection, onSnapshot } from 'firebase/firestore';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { getNotifications, markNotificationRead, Notification } from '../services/db';
import { LayoutDashboard, Users, MessageSquare, LogOut, Bell, Wand2, BookOpen, Bot, ShieldCheck, Menu, X } from 'lucide-react';
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live real-time listener on queries collection for consultation notifications & badge
  useEffect(() => {
    const q = query(collection(db, 'queries'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
      const pending = items.filter(i => i.status === 'pending');
      setPendingApprovalsCount(pending.length);

      // Convert recent queries into notification cards
      const notifCards = items.slice(0, 15).map(item => ({
        id: item.id,
        type: 'SYSTEM',
        read: item.status === 'answered',
        message: `${item.patientName || 'Patient'}: "${(item.question || '').slice(0, 50)}..."`,
        date: item.date || 'Recently',
        status: item.status
      }));
      setNotifications(notifCards);
    }, (err) => {
      console.warn('Dietician queries stream note:', err);
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationClick = async (n: any) => {
    navigate('/dietician/inbox');
    setShowNotifications(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Command Center', path: '/dietician', icon: LayoutDashboard },
    { name: 'Client Caseload', path: '/dietician/patients', icon: Users },
    { name: 'Consultation Inbox', path: '/dietician/inbox', icon: MessageSquare, badge: pendingApprovalsCount },
    { name: 'Meal Plan Studio', path: '/dietician/generator', icon: Wand2 },
    { name: 'Recipe Knowledge Base', path: '/dietician/knowledge', icon: BookOpen },
    { name: 'AI Clinical Assistant', path: '/dietician/ai', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-100 flex flex-col shadow-sm transition-transform duration-200 lg:static lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 pb-4">
          <Link to="/" className="flex items-center gap-2 mb-1">
            <img src="/logo.jpg" alt="NutriSnap" className="h-8 w-auto rounded-md shadow-sm" />
            <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">NutriSnap</h2>
          </Link>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Clinical Workspace</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  active 
                    ? 'bg-orange-50 text-orange-600 shadow-xs border border-orange-200' 
                    : 'border border-transparent text-stone-600 hover:text-orange-500 hover:bg-orange-50/50'
                }`}
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

        <div className="p-5 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'D'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-900 truncate">{profile?.name || 'Lead Dietician'}</p>
              <p className="text-[10px] text-stone-500 font-medium">Licensed Clinical Dietician</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full text-left rounded-lg text-xs font-bold text-stone-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-stone-50/50">
        {/* Top Header */}
        <header className="h-16 border-b border-stone-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-stone-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Clinical Practice Active</span>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-stone-500 hover:text-orange-500 transition-colors focus:outline-none"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white shadow-sm"></span>
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
