import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  Heart, 
  Info, 
  X,
  Activity
} from 'lucide-react';
import { getDailyYogaPose, YogaPose } from '../data/yogaPoses';

interface YogaPoseCardProps {
  date?: Date | string;
  className?: string;
}

export default function YogaPoseCard({ date, className = '' }: YogaPoseCardProps) {
  const pose: YogaPose = getDailyYogaPose(date);
  const todayKey = new Date().toISOString().split('T')[0];
  const storagePracticeKey = `nutrisnap_yoga_practiced_${pose.id}_${todayKey}`;

  const [hasPracticed, setHasPracticed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(storagePracticeKey) === 'true';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructions' | 'benefits' | 'precautions'>('instructions');

  // Practice Timer State inside Modal
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      handleMarkPracticed();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleMarkPracticed = () => {
    setHasPracticed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storagePracticeKey, 'true');
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(45);
  };

  return (
    <>
      <div 
        className={`bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 rounded-2xl border border-teal-200/90 p-5 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between group relative overflow-hidden ${className}`}
      >
        <div>
          {/* Card Header & Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100/80 border border-teal-200 px-2 py-0.5 rounded-full inline-block">
                  Yoga Pose of the Day
                </span>
                <p className="text-[11px] font-bold text-stone-500 mt-0.5">Mindful Daily Movement</p>
              </div>
            </div>

            {hasPracticed ? (
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done
              </span>
            ) : (
              <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" /> Today's Asana
              </span>
            )}
          </div>

          {/* Pose Image with Banner Badge */}
          <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 border border-teal-200/70 group/img shadow-2xs bg-stone-100">
            <img 
              src={pose.imageUrl} 
              alt={pose.englishName} 
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            <div className="absolute bottom-2.5 left-3 right-3 text-white">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-200 uppercase tracking-wider">
                <span>{pose.level}</span>
                <span>•</span>
                <span>{pose.duration}</span>
              </div>
              <h4 className="text-base font-serif font-black tracking-tight drop-shadow-xs">
                {pose.englishName} <span className="text-teal-200 font-sans font-medium text-xs">({pose.sanskritName})</span>
              </h4>
            </div>
          </div>

          {/* Key Benefits Preview */}
          <div className="space-y-1.5 mb-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-teal-900 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500 fill-current" /> Key Clinical Benefits:
            </p>
            <ul className="text-xs text-stone-700 space-y-1 font-medium pl-1">
              {pose.keyBenefits.slice(0, 2).map((benefit, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Precaution Callout */}
          <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5 mb-3 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-snug line-clamp-2">
              <strong>Precaution:</strong> {pose.precautions[0]}
            </span>
          </div>

          {/* Authority Source Citation */}
          <div className="text-[10px] text-stone-500 flex items-center justify-between border-t border-teal-100 pt-2 mb-2">
            <span className="truncate pr-1">
              Source: <strong className="text-stone-700 font-semibold">{pose.source.name}</strong>
            </span>
            <a 
              href={pose.source.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 shrink-0"
              title="Read official source"
            >
              Verify <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Action Button: Opens Full Instructions & Practice Mode */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all hover:scale-101 cursor-pointer"
        >
          <span>View Pose Guide & Practice</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DETAILED YOGA POSE MODAL (INSTRUCTIONS, PRECAUTIONS, TIMER)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-teal-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header with Image */}
            <div className="relative h-48 bg-stone-900 text-white overflow-hidden">
              <img 
                src={pose.imageUrl} 
                alt={pose.englishName} 
                className="w-full h-full object-cover opacity-85" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
              
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-5 right-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-black uppercase tracking-wider">
                    {pose.category}
                  </span>
                  <span className="text-teal-200 text-xs font-semibold">
                    {pose.level} • {pose.duration}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight text-white flex items-baseline gap-2">
                  {pose.englishName}
                  <span className="text-sm font-sans font-normal text-teal-200 italic">
                    {pose.sanskritName} {pose.sanskritScript ? `(${pose.sanskritScript})` : ''}
                  </span>
                </h2>
              </div>
            </div>

            {/* Modal Interactive Timer Banner */}
            <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-b border-teal-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center font-mono font-black text-base shadow-sm">
                  {timerSeconds}s
                </div>
                <div>
                  <p className="text-xs font-black text-teal-950">Pose Practice Timer</p>
                  <p className="text-[11px] text-teal-700">Recommended hold: {pose.duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    isTimerRunning
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-teal-700 text-white hover:bg-teal-800'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  {isTimerRunning ? 'Pause' : 'Start Timer'}
                </button>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="p-2 bg-white border border-teal-200 text-teal-800 rounded-xl hover:bg-teal-50 transition-colors cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-stone-100 px-5 pt-3 gap-2">
              {[
                { id: 'instructions', label: 'Instructions' },
                { id: 'benefits', label: 'Key Benefits' },
                { id: 'precautions', label: 'Precautions & Safety' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2.5 px-2 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-900 font-black'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-5 space-y-4">
              {activeTab === 'instructions' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-900">
                    Step-by-Step Instructions:
                  </h4>
                  <ol className="space-y-2.5 text-xs text-stone-700 font-medium">
                    {pose.instructions.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-900 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {activeTab === 'benefits' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-900">
                    Documented Physical & Mental Benefits:
                  </h4>
                  <ul className="space-y-2 text-xs text-stone-700 font-medium">
                    {pose.keyBenefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'precautions' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-black text-rose-950">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Safety & Precaution Guidelines:
                    </div>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-800 font-medium">
                      {pose.precautions.map((precaution, idx) => (
                        <li key={idx}>{precaution}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Source Citation Footer inside Modal */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-stone-800">Verified Medical & Wellness Source:</span>
                  <p className="text-[11px] text-stone-500">{pose.source.authority}</p>
                </div>
                <a
                  href={pose.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-white border border-stone-200 text-teal-800 font-bold rounded-lg text-xs hover:bg-stone-50 transition-colors inline-flex items-center gap-1 shrink-0"
                >
                  Visit Source <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  handleMarkPracticed();
                  setIsModalOpen(false);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                  hasPracticed
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-600/25'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {hasPracticed ? 'Practiced Today ✓' : 'Mark as Practiced Today'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
