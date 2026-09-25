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
      {/* Sidebar Desktop / Bottom Nav Mobile */}
      <aside className="w-full md:w-64 bg-white border-r border-stone-100 flex flex-col z-10 shadow-sm">
        <div className="p-8 pb-4 hidden md:block">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <img src="/logo.jpg" alt="NutriSnap" className="h-8 w-auto rounded-md shadow-sm" />
            <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">NutriSnap</h2>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-orange-600 font-bold mt-1">Patient Portal</p>
        </div>
        
        <nav className="flex-1 p-0 md:px-4 md:py-8 flex md:flex-col overflow-x-auto border-t md:border-t-0 border-stone-100 bg-white md:bg-transparent shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-4 md:py-3.5 md:rounded-xl text-xs md:text-sm font-bold transition-all flex-1 md:flex-none ${active ? 'md:bg-orange-50 text-orange-600 md:shadow-sm md:border-orange-200 border-b-2 md:border-b border-orange-500' : 'text-stone-500 hover:text-orange-500 md:hover:bg-orange-50/50'}`}
              >
                <Icon className={`w-5 h-5 md:w-4 md:h-4 ${active ? 'text-pink-500' : 'text-stone-400'}`} />
                <span className="hidden md:inline">{item.name}</span>
                {item.locked && (
                  <Lock className="w-3 h-3 text-amber-500 ml-auto hidden md:inline" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-stone-100 hidden md:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {profile?.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">{profile?.name}</p>
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
      <main className="flex-1 overflow-auto pb-16 md:pb-0 bg-[#FAFAFA]">
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
    </div>
  );
}
