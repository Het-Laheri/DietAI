import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { Home, ClipboardList, Camera, Activity, MessageCircle, LogOut, CreditCard, Lock } from 'lucide-react';
import { isPatientSubscribed } from '../services/subscription';
import PatientOverview from './Patient/PatientOverview';
import MealNotepad from './Patient/MealNotepad';
import FoodScanner from './Patient/FoodScanner';
import Progress from './Patient/Progress';
import Inbox from './Patient/Inbox';
import SubscriptionPage from './Patient/SubscriptionPage';

export default function PatientDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubscribed, setIsSubscribed] = useState(() => isPatientSubscribed(profile));

  useEffect(() => {
    setIsSubscribed(isPatientSubscribed(profile));
    const handleSubChange = () => setIsSubscribed(isPatientSubscribed(profile));
    window.addEventListener('nutrisnap:subscription_change', handleSubChange);
    return () => window.removeEventListener('nutrisnap:subscription_change', handleSubChange);
  }, [profile]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/patient', icon: Home },
    { name: "Today's Meals", path: '/patient/meals', icon: ClipboardList, locked: !isSubscribed },
    { name: 'AI Scanner', path: '/patient/scanner', icon: Camera },
    { name: 'Progress', path: '/patient/progress', icon: Activity },
    { name: 'Ask Dietician', path: '/patient/inbox', icon: MessageCircle },
    { name: 'Membership', path: '/patient/subscription', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <Link to="/patient" className="flex items-center gap-2">
          <img src="/logo.jpg" alt="NutriSnap" className="h-7 w-auto rounded-md shadow-xs" />
          <h2 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">NutriSnap</h2>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/patient/subscription">
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            {profile?.name?.charAt(0) || 'P'}
          </div>
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
      <aside className="hidden md:flex w-64 bg-white border-r border-stone-100 flex-col z-10 shadow-sm shrink-0">
        <div className="p-8 pb-4">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <img src="/logo.jpg" alt="NutriSnap" className="h-8 w-auto rounded-md shadow-sm" />
            <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">NutriSnap</h2>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-orange-600 font-bold mt-1">Patient Portal</p>
        </div>
        
        <nav className="flex-1 px-4 py-8 flex flex-col space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-start gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  active 
                    ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-200' 
                    : 'text-stone-500 hover:text-orange-500 hover:bg-orange-50/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-pink-500' : 'text-stone-400'}`} />
                <span>{item.name}</span>
                {item.locked && (
                  <Lock className="w-3 h-3 text-amber-500 ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-stone-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {profile?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 truncate max-w-[130px]">{profile?.name || 'Patient'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-stone-500">Patient</span>
                <Link to="/patient/subscription" className="hover:opacity-80 transition-opacity">
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24 md:pb-8 bg-[#FAFAFA]">
        <Routes>
          <Route path="/" element={<PatientOverview />} />
          <Route path="/meals" element={<MealNotepad />} />
          <Route path="/today" element={<MealNotepad />} />
          <Route path="/scanner" element={<FoodScanner />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/ai" element={<Inbox />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/billing" element={<SubscriptionPage />} />
        </Routes>
      </main>

      {/* Mobile Fixed Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 flex items-center justify-around py-2 px-1 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
                active ? 'text-orange-600' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-orange-500' : 'text-stone-400'}`} />
                {item.locked && (
                  <Lock className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1" />
                )}
              </div>
              <span className="truncate max-w-[58px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
