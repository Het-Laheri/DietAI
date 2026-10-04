import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mobileNotificationService, MobileNotificationPayload } from '../services/mobileNotificationService';
import { Bell, MessageSquare, Utensils, Sparkles, X, ChevronRight, Volume2 } from 'lucide-react';

export default function InAppNotificationToast() {
  const [activeToast, setActiveToast] = useState<MobileNotificationPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = mobileNotificationService.subscribeToToast((payload) => {
      setActiveToast(payload);
      setIsVisible(true);
    });

    return () => unsubscribe();
  }, []);

  // Auto-dismiss after 6.5 seconds
  useEffect(() => {
    if (!isVisible || !activeToast) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 6500);

    return () => clearTimeout(timer);
  }, [isVisible, activeToast]);

  if (!activeToast || !isVisible) return null;

  const handleClick = () => {
    setIsVisible(false);
    if (activeToast.link) {
      navigate(activeToast.link);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  let IconComp = Bell;
  let iconBg = 'bg-orange-500 text-white';
  if (activeToast.type === 'QUERY_SUBMITTED') {
    IconComp = MessageSquare;
    iconBg = 'bg-sky-500 text-white';
  } else if (activeToast.type === 'QUERY_ANSWERED') {
    IconComp = MessageSquare;
    iconBg = 'bg-emerald-500 text-white';
  } else if (activeToast.type === 'MEAL_PLAN_PUBLISHED') {
    IconComp = Utensils;
    iconBg = 'bg-amber-500 text-white';
  } else if (activeToast.type === 'CLINICAL_NOTE') {
    IconComp = Sparkles;
    iconBg = 'bg-purple-500 text-white';
  }

  return (
    <div 
      className="fixed top-3 sm:top-5 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-[9999] pointer-events-auto transition-all duration-300 ease-out transform translate-y-0"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div 
        onClick={handleClick}
        className="cursor-pointer bg-white/95 backdrop-blur-md border border-orange-200/90 shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 hover:shadow-orange-100 transition-all group ring-2 ring-orange-500/20 active:scale-[0.99]"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg} shadow-md relative`}>
          <IconComp className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h4 className="text-xs font-black text-stone-900 truncate tracking-tight">
              {activeToast.title}
            </h4>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Volume2 className="w-2.5 h-2.5 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-orange-600 group-hover:text-orange-700">
            <span>Tap to open & respond</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 -mr-1 -mt-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
