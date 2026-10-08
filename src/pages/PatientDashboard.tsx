import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { auth } from '../services/firebase';
import { 
  Home, 
  ClipboardList, 
  Camera, 
  Activity, 
  MessageCircle, 
  LogOut, 
  CreditCard, 
  Lock,
  Bell,
  CheckCheck,
  Utensils,
  MessageSquare,
  Sparkles,
  Clock,
  X,
  ChevronRight
} from 'lucide-react';
import { isPatientSubscribed } from '../services/subscription';
import { Notification } from '../services/db';
import { useNotification } from '../contexts/NotificationContext';
import PatientOverview from './Patient/PatientOverview';
import MealNotepad from './Patient/MealNotepad';
import BuildMyPlate from './Patient/BuildMyPlate';
import FoodScanner from './Patient/FoodScanner';
import Progress from './Patient/Progress';
import Inbox from './Patient/Inbox';
import SubscriptionPage from './Patient/SubscriptionPage';
import PatientProfileModal from '../components/PatientProfileModal';
import NotificationPermissionBanner from '../components/NotificationPermissionBanner';
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

export default function PatientDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubscribed, setIsSubscribed] = useState(() => isPatientSubscribed(profile));
  const { notifications, unreadCount, markRead, markAllRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    setIsSubscribed(isPatientSubscribed(profile));
    const handleSubChange = () => setIsSubscribed(isPatientSubscribed(profile));
    window.addEventListener('nutrisnap:subscription_change', handleSubChange);
    return () => window.removeEventListener('nutrisnap:subscription_change', handleSubChange);
  }, [profile]);

  const handleNotificationClick = async (n: Notification) => {
    if (n.id) {
      await markRead(n.id);
    }
    setShowNotifications(false);
    if (n.link) {
      navigate(n.link);
    } else {
      navigate('/patient/meals');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/patient', 
      icon: Home,
      activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25',
      iconActive: 'text-white',
      hoverClass: 'hover:text-emerald-700 hover:bg-emerald-50/80',
      iconInactive: 'text-emerald-500'
    },
    { 
      name: "Build My Plate", 
      path: '/patient/plate', 
      icon: Utensils, 
      locked: !isSubscribed,
      activeClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25',
      iconActive: 'text-white',
      hoverClass: 'hover:text-orange-700 hover:bg-orange-50/80',
      iconInactive: 'text-orange-500'
    },
    { 
      name: 'AI Scanner', 
      path: '/patient/scanner', 
      icon: Camera,
      activeClass: 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/25',
      iconActive: 'text-white',
      hoverClass: 'hover:text-purple-700 hover:bg-purple-50/80',
      iconInactive: 'text-purple-500'
    },
    { 
      name: 'Progress', 
      path: '/patient/progress', 
      icon: Activity,
      activeClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25',
      iconActive: 'text-white',
      hoverClass: 'hover:text-sky-700 hover:bg-sky-50/80',
      iconInactive: 'text-sky-500'
    },
    { 
      name: 'Ask Dietician', 
      path: '/patient/inbox', 
      icon: MessageCircle,
      activeClass: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-pink-500/25',
      iconActive: 'text-white',
      hoverClass: 'hover:text-rose-700 hover:bg-rose-50/80',
      iconInactive: 'text-rose-500'
    },
    { 
      name: 'Membership', 
      path: '/patient/subscription', 
      icon: CreditCard,
      activeClass: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25',
      iconActive: 'text-white',
      hoverClass: 'hover:text-indigo-700 hover:bg-indigo-50/80',
      iconInactive: 'text-indigo-500'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-slate-50 to-orange-50/20 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white/90 backdrop-blur-md border-b border-orange-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <Link to="/patient" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-500 p-0.5 shadow-sm flex items-center justify-center">
            <img src="/logo.jpg" alt="NutriSnap" className="h-full w-full object-cover rounded-[6px]" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500">NutriSnap</h2>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/patient/subscription">
            {isSubscribed ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                ★ Premium
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                Upgrade
              </span>
            )}
          </Link>
          {/* Mobile Bell Button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-stone-600 hover:text-orange-500 hover:bg-orange-50/60 rounded-lg transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            title="Edit Health Profile & Metrics"
            className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 via-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-sm hover:scale-105 transition-transform cursor-pointer"
          >
            {profile?.name?.charAt(0) || 'P'}
          </button>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-stone-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-white/90 backdrop-blur-md border-r border-orange-100/80 flex-col z-10 shadow-sm shrink-0">
        <div className="p-6 pb-4">
          <Link to="/" className="flex items-center gap-2.5 mb-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-500 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <img src="/logo.jpg" alt="NutriSnap" className="h-full w-full object-cover rounded-[10px]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 leading-none">NutriSnap</h2>
              <span className="text-[10px] uppercase tracking-widest text-orange-600 font-bold">Patient Portal</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-3 py-4 flex flex-col space-y-1.5">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active 
                    ? item.activeClass
                    : `text-stone-600 ${item.hoverClass}`
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  active ? 'bg-white/20' : 'bg-stone-100/80'
                }`}>
                  <Icon className={`w-4 h-4 ${active ? item.iconActive : item.iconInactive}`} />
                </div>
                <span>{item.name}</span>
                {item.locked && (
                  <Lock className="w-3.5 h-3.5 text-amber-500 ml-auto" />
                )}
              </Link>
            );
          })}

          {/* Desktop Sidebar Notification Button */}
          <button
            onClick={() => setShowNotifications(true)}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-stone-600 hover:text-purple-600 hover:bg-purple-50/80 transition-all text-left mt-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <span>Notifications</span>
            </div>
            {unreadCount > 0 ? (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-xs">
                {unreadCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-stone-200" />
            )}
          </button>
        </nav>

        <div className="p-6 border-t border-stone-100">
          {/* Clickable Patient Icon & Name */}
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            role="button"
            tabIndex={0}
            title="Click to view & edit your health details, weight target, and clinical goals"
            className="flex items-center gap-3 mb-6 p-2 -mx-2 rounded-xl hover:bg-stone-100/80 transition-all cursor-pointer group text-left"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                {profile?.name?.charAt(0) || 'P'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-stone-200 flex items-center justify-center text-[9px] text-stone-600 shadow-2xs group-hover:bg-orange-500 group-hover:text-white transition-colors">
                ✎
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-stone-900 truncate group-hover:text-orange-600 transition-colors">
                {profile?.name || 'Patient'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-stone-400 group-hover:text-stone-600">Edit Details</span>
                <Link 
                  to="/patient/subscription" 
                  onClick={e => e.stopPropagation()}
                  className="hover:opacity-80 transition-opacity ml-auto"
                >
                  {isSubscribed ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      ★ Premium
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      Upgrade
                    </span>
                  )}
                </Link>
              </div>
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

      {/* Patient Profile & Health Details Modal */}
      {profile?.uid && (
        <PatientProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          patientId={profile.uid}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-28 md:pb-8 bg-gradient-to-br from-amber-50/40 via-slate-50 to-orange-50/30 relative">
        {/* Ambient atmospheric color glows */}
        <div className="fixed top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-orange-300/20 via-pink-300/15 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="fixed bottom-0 left-64 w-[450px] h-[450px] bg-gradient-to-tr from-emerald-300/20 via-teal-300/15 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-r from-sky-300/10 via-violet-300/10 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 p-4 md:p-6 pb-0">
          <NotificationPermissionBanner userRole="patient" userName={profile?.name} className="mb-4" />
        </div>

        <div className="relative z-10">
          <ErrorBoundary fallbackTitle="Could not load patient screen">
            <Routes>
              <Route path="/" element={<PatientOverview />} />
              <Route path="/overview" element={<PatientOverview />} />
              <Route path="/plate" element={<BuildMyPlate />} />
              <Route path="/meals" element={<BuildMyPlate />} />
              <Route path="/today" element={<BuildMyPlate />} />
              <Route path="/swap" element={<BuildMyPlate />} />
              <Route path="/scanner" element={<FoodScanner />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/ai" element={<Inbox />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/billing" element={<SubscriptionPage />} />
              {/* Fallback route for any unknown subpath */}
              <Route path="*" element={<Navigate to="/patient" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Fixed Bottom Nav with Elevated Center Scanner Action */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-orange-100/90 flex items-center justify-around pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_20px_rgba(249,115,22,0.1)]">
        {[
          { name: 'Dashboard', path: '/patient', icon: Home, isCenter: false },
          { name: 'Build Plate', path: '/patient/plate', icon: Utensils, isCenter: false, locked: !isSubscribed },
          { name: 'AI Scan', path: '/patient/scanner', icon: Camera, isCenter: true },
          { name: 'Progress', path: '/patient/progress', icon: Activity, isCenter: false },
          { name: 'Consult', path: '/patient/inbox', icon: MessageCircle, isCenter: false }
        ].map(item => {
          const active = location.pathname === item.path || (item.path === '/patient' && location.pathname === '/patient/overview');
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5 relative z-10 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all active:scale-90 ${
                  active
                    ? 'bg-gradient-to-tr from-orange-600 via-rose-600 to-pink-600 shadow-orange-500/40 text-white scale-105 ring-2 ring-orange-300'
                    : 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-orange-500/30 text-white hover:scale-105'
                }`}>
                  <Camera className="w-5 h-5 text-white drop-shadow-xs" />
                </div>
                <span className={`text-[10px] font-black mt-1 ${
                  active ? 'text-orange-600 font-extrabold' : 'text-stone-500'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all relative ${
                active ? 'text-orange-600 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-orange-50 text-orange-600' : ''}`}>
                <Icon className={`w-5 h-5 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
                {item.locked && (
                  <Lock className="w-2.5 h-2.5 text-amber-500 absolute -top-0.5 -right-0.5" />
                )}
              </div>
              <span className="truncate max-w-[56px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Interactive Notification Slide-Over Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-0 md:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowNotifications(false)}
          />
          <div className="relative w-full md:max-w-md bg-white h-full md:h-[620px] rounded-none md:rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden border border-stone-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Notifications</h3>
                  <p className="text-[10px] text-stone-500">
                    {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors hover:underline mr-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
              {notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-3 text-orange-500">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-stone-800 text-sm">No notifications yet</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs">
                    When your dietician publishes your weekly meal plans or answers your consultations, you'll see them right here.
                  </p>
                </div>
              ) : (
                notifications.map(n => {
                  let IconComp = Bell;
                  let iconColor = 'text-stone-600 bg-stone-100';

                  if (n.type === 'MEAL_PLAN_PUBLISHED') {
                    IconComp = Utensils;
                    iconColor = 'text-orange-600 bg-orange-50';
                  } else if (n.type === 'QUERY_ANSWERED') {
                    IconComp = MessageSquare;
                    iconColor = 'text-sky-600 bg-sky-50';
                  } else if (n.type === 'CLINICAL_NOTE' || n.type === 'TARGET_UPDATED') {
                    IconComp = Sparkles;
                    iconColor = 'text-emerald-600 bg-emerald-50';
                  } else if (n.type === 'SUBSCRIPTION_UPGRADE') {
                    IconComp = CreditCard;
                    iconColor = 'text-purple-600 bg-purple-50';
                  }

                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-4 flex items-start gap-3.5 hover:bg-stone-50/80 transition-colors ${!n.read ? 'bg-orange-50/30' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor} mt-0.5`}>
                        <IconComp className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={`text-xs truncate ${!n.read ? 'font-bold text-stone-900' : 'font-semibold text-stone-700'}`}>
                            {n.title || 'Dietician Update'}
                          </p>
                          <span className="text-[10px] text-stone-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${!n.read ? 'text-stone-800' : 'text-stone-500'}`}>
                          {n.message}
                        </p>
                        {n.link && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-orange-600">
                            <span>View details</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
