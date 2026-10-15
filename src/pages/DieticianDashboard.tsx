import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { auth, db } from '../services/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Notification } from '../services/db';
import { useNotification } from '../contexts/NotificationContext';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  LogOut, 
  Bell, 
  Wand2, 
  BookOpen, 
  Bot, 
  ShieldCheck, 
  Menu, 
  X,
  CheckCheck,
  Utensils,
  CreditCard,
  Sparkles,
  Clock,
  HeartPulse
} from 'lucide-react';
import { useEffect } from 'react';
import Overview from './Dietician/Overview';
import PatientsList from './Dietician/PatientsList';
import PatientProfileView from './Dietician/PatientProfileView';
import PatientForm from './Dietician/PatientForm';
import MessageInbox from './Dietician/MessageInbox';
import AiAssistant from './Dietician/AiAssistant';
import KnowledgeBase from './Dietician/KnowledgeBase';
import MealPlanGenerator from './Dietician/MealPlanGenerator';
import NotificationPermissionBanner from '../components/NotificationPermissionBanner';
import PhysiotherapistModal from '../components/PhysiotherapistModal';
import { mobileNotificationService } from '../services/mobileNotificationService';

function formatRelativeTime(createdAt: any): string {
  if (!createdAt) return 'Just now';
  let date: Date;
  if (createdAt?.toDate && typeof createdAt.toDate === 'function') {
    date = createdAt.toDate();
  } else if (createdAt?.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    date = new Date(createdAt);
  } else {
    return 'Just now';
  }

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DieticianDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markRead, markAllRead, dismiss, clearRead } = useNotification();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTab, setNotifTab] = useState<'unread' | 'all'>('unread');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPhysioModalOpen, setIsPhysioModalOpen] = useState(false);

  // Live real-time listener on queries collection for consultation badge
  useEffect(() => {
    const q = query(collection(db, 'queries'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
      const pending = items.filter(i => i.status === 'pending');
      setPendingApprovalsCount(pending.length);
    }, (err) => {
      console.warn('Dietician queries stream note:', err);
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (n.id) {
      await markRead(n.id);
    }
    setShowNotifications(false);
    if (n.link) {
      navigate(n.link);
    } else {
      navigate('/dietician/inbox');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleDismissNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await dismiss(id);
  };

  const handleClearRead = async () => {
    await clearRead();
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

          {/* Physiotherapist Details (Directly below AI Clinical Assistant) */}
          <div className="pt-2 mt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setIsPhysioModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border border-transparent text-stone-600 hover:text-sky-700 hover:bg-sky-50/80 hover:border-sky-200 group text-left cursor-pointer"
              title="Click to view Dr. Namrata's Physio Plus card & details"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-100 transition-colors">
                  <HeartPulse className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="truncate">
                  <span className="block truncate font-bold text-stone-800 group-hover:text-sky-800">Physiotherapist</span>
                  <span className="text-[10px] text-stone-400 font-semibold group-hover:text-sky-600 truncate block">
                    Dr. Namrata's Physio Plus
                  </span>
                </div>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-sky-100 text-sky-700 rounded-md shrink-0">
                Card
              </span>
            </button>
          </div>
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
              className="relative p-2.5 text-stone-600 hover:text-orange-500 hover:bg-orange-50/60 rounded-xl transition-all focus:outline-none"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white border border-stone-200/80 shadow-2xl z-50 rounded-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 flex flex-col">
                  {/* Header */}
                  <div className="p-3.5 border-b border-stone-100 flex justify-between items-center bg-stone-50/80">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 text-sm">Notifications</h3>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {unreadCount} unread
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Caught up
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors hover:underline"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark read
                        </button>
                      )}
                      {notifications.some(n => n.read) && (
                        <button
                          onClick={handleClearRead}
                          className="text-[11px] font-medium text-stone-500 hover:text-stone-800 transition-colors hover:underline"
                          title="Remove already read notifications"
                        >
                          Clear read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabs: Unread vs All */}
                  <div className="flex border-b border-stone-100 bg-stone-50/40 px-3 pt-2 gap-2 text-xs font-semibold">
                    <button
                      onClick={() => setNotifTab('unread')}
                      className={`pb-2 px-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                        notifTab === 'unread'
                          ? 'border-orange-500 text-orange-600 font-bold'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <span>Unread</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        notifTab === 'unread' ? 'bg-orange-100 text-orange-700' : 'bg-stone-200/70 text-stone-600'
                      }`}>
                        {unreadCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setNotifTab('all')}
                      className={`pb-2 px-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                        notifTab === 'all'
                          ? 'border-orange-500 text-orange-600 font-bold'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <span>All</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        notifTab === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-stone-200/70 text-stone-600'
                      }`}>
                        {notifications.length}
                      </span>
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100">
                    {(() => {
                      const displayed = notifTab === 'unread'
                        ? notifications.filter(n => !n.read)
                        : notifications;

                      if (notifications.length === 0) {
                        return (
                          <div className="p-8 text-center">
                            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2 text-stone-400">
                              <Bell className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-stone-700">No notifications yet</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">Clinical events and patient questions will appear here.</p>
                          </div>
                        );
                      }

                      if (displayed.length === 0 && notifTab === 'unread') {
                        return (
                          <div className="p-8 text-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                              <CheckCheck className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-stone-700">All caught up!</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">Switch to the "All" tab to view read notifications.</p>
                          </div>
                        );
                      }

                      return displayed.map(n => {
                        let IconComp = Bell;
                        let iconColor = 'text-stone-600 bg-stone-100';
                        if (n.type === 'NEW_PATIENT') {
                          IconComp = Users;
                          iconColor = 'text-emerald-600 bg-emerald-50';
                        } else if (n.type === 'QUERY_SUBMITTED') {
                          IconComp = MessageSquare;
                          iconColor = 'text-sky-600 bg-sky-50';
                        } else if (n.type === 'MEAL_LOGGED') {
                          IconComp = Utensils;
                          iconColor = 'text-orange-600 bg-orange-50';
                        } else if (n.type === 'SUBSCRIPTION_UPGRADE') {
                          IconComp = CreditCard;
                          iconColor = 'text-purple-600 bg-purple-50';
                        }

                        return (
                          <div 
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`group relative w-full text-left p-3.5 flex items-start gap-3 hover:bg-stone-50 transition-colors cursor-pointer ${
                              !n.read ? 'bg-orange-50/30' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColor} mt-0.5`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 pr-5">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-xs truncate ${!n.read ? 'font-bold text-stone-900' : 'font-semibold text-stone-600'}`}>
                                  {n.title || (n.patientName ? `Update from ${n.patientName}` : 'Clinical Alert')}
                                </p>
                                <span className="text-[10px] text-stone-400 shrink-0">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>
                              <p className={`text-xs mt-0.5 line-clamp-2 ${!n.read ? 'text-stone-800 font-medium' : 'text-stone-500'}`}>
                                {n.message}
                              </p>
                            </div>
                            
                            {/* Actions on right */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-orange-500 mt-1" />
                              )}
                              {n.id && (
                                <button
                                  onClick={(e) => handleDismissNotification(e, n.id!)}
                                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 p-1 rounded-md transition-all hover:bg-stone-200/60"
                                  title="Dismiss notification"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 pb-0 max-w-7xl mx-auto">
            <NotificationPermissionBanner userRole="dietician" userName={profile?.name} className="mb-2" />
          </div>
          <ErrorBoundary fallbackTitle="Could not load dietician view">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/patients" element={<PatientsList />} />
              <Route path="/patients/new" element={<PatientForm />} />
              <Route path="/patients/:id/*" element={<PatientProfileView />} />
              <Route path="/inbox" element={<MessageInbox />} />
              <Route path="/ai-approvals" element={<MessageInbox />} />
              <Route path="/generator" element={<MealPlanGenerator />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/ai" element={<AiAssistant />} />
              {/* Fallback route for unknown dietician subpaths */}
              <Route path="*" element={<Navigate to="/dietician" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>

      {/* Physiotherapist Details & Card Modal */}
      <PhysiotherapistModal
        isOpen={isPhysioModalOpen}
        onClose={() => setIsPhysioModalOpen(false)}
      />
    </div>
  );
}
