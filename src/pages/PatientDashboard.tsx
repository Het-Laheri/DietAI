import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { Home, ClipboardList, Activity, MessageCircle, LogOut } from 'lucide-react';
import TodayPlan from './Patient/TodayPlan';
import FoodScanner from './Patient/FoodScanner';
import Progress from './Patient/Progress';
import Inbox from './Patient/Inbox';
import AiChat from './Patient/AiChat';

export default function PatientDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Today', path: '/patient', icon: Home },
    { name: 'Scanner', path: '/patient/scanner', icon: ClipboardList },
    { name: 'Progress', path: '/patient/progress', icon: Activity },
    { name: 'Inbox', path: '/patient/inbox', icon: MessageCircle },
    { name: 'AI Coach', path: '/patient/ai', icon: MessageCircle }, // Reusing icon for MVP
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col md:flex-row">
      {/* Sidebar Desktop / Bottom Nav Mobile */}
      <aside className="w-full md:w-64 bg-stone-50 border-r border-stone-200 flex flex-col z-10">
        <div className="p-8 pb-4 hidden md:block">
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">NutriSnap.</h2>
          <p className="text-xs uppercase tracking-widest text-stone-500 font-bold mt-1">Patient Portal</p>
        </div>
        
        <nav className="flex-1 p-0 md:px-4 md:py-8 flex md:flex-col overflow-x-auto border-t md:border-t-0 border-stone-200 bg-white md:bg-transparent">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-4 md:py-3 rounded-none text-xs md:text-sm transition-all flex-1 md:flex-none ${active ? 'md:border-l-2 md:border-b-0 border-b-2 border-stone-900 text-stone-900 font-bold md:bg-stone-200/50' : 'md:border-l-2 md:border-b-0 border-b-2 border-transparent text-stone-500 font-medium hover:text-stone-900 md:hover:bg-stone-100'}`}
              >
                <Icon className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-stone-200 hidden md:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-900 font-serif text-lg">
              {profile?.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">{profile?.name}</p>
              <p className="text-xs text-stone-500">Patient</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-none text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0 bg-[#FAFAFA]">
        <Routes>
          <Route path="/" element={<TodayPlan />} />
          <Route path="/scanner" element={<FoodScanner />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/ai" element={<AiChat />} />
        </Routes>
      </main>
    </div>
  );
}
