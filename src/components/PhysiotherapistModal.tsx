import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Copy, 
  Check, 
  MessageCircle, 
  HeartPulse, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Navigation,
  Image as ImageIcon,
  CreditCard,
  Building2,
  CalendarCheck
} from 'lucide-react';

interface PhysiotherapistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhysiotherapistModal({ isOpen, onClose }: PhysiotherapistModalProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'photo'>('card');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const thaneAddress = "Shop# 7, A4 Anamay, Kanchanpushp Complex, Opp. Suraj Water Park, Kavesar, Thane West, Thane - 400607";
  const thaneMapUrl = "https://www.google.com/maps/search/?api=1&query=Kanchanpushp+Complex+Opp+Suraj+Water+Park+Kavesar+Thane+West+400607";

  const goregaonAddress = "Shop# 20, Sant Mukta C.H.S., Perubaug, Jay Prakash Nagar, Goregaon East, Mumbai - 400063";
  const goregaonMapUrl = "https://www.google.com/maps/search/?api=1&query=Sant+Mukta+CHS+Perubaug+Jay+Prakash+Nagar+Goregaon+East+Mumbai+400063";

  const phoneNumber = "+91-9967-919-828";
  const rawPhone = "+919967919828";
  const whatsappUrl = `https://wa.me/919967919828?text=${encodeURIComponent(
    "Hello Dr. Namrata, I got your contact through NutriSnap and would like to inquire about a physiotherapy consultation."
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 px-6 py-5 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md shrink-0">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-black bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-white/95">
                    Clinical Partner
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" /> Verified
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-white mt-0.5">
                  Dr. Namrata's Physio Plus
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
            <button
              onClick={() => setActiveTab('card')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'card'
                  ? 'bg-white text-cyan-800 shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Interactive Card & Details
            </button>
            <button
              onClick={() => setActiveTab('photo')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'photo'
                  ? 'bg-white text-cyan-800 shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Original Visiting Card Photo
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {activeTab === 'card' ? (
            <>
              {/* Digital Business Card Replica */}
              <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-200 border border-cyan-300/80 shadow-lg shadow-cyan-500/10 text-stone-900 overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Top row with Logo and Doctor Details */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-cyan-300/60">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-700 text-white flex items-center justify-center shadow-md p-2 shrink-0">
                        <HeartPulse className="w-8 h-8 text-cyan-200" />
                      </div>
                      <div>
                        <p className="text-xs uppercase font-extrabold tracking-wider text-cyan-800">Physiotherapy & Rehabilitation</p>
                        <h3 className="text-2xl font-black tracking-tight text-stone-900 leading-tight">
                          Dr. Namrata's <span className="text-sky-700">Physio Plus</span>
                        </h3>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <h4 className="text-base sm:text-lg font-bold text-stone-900">
                        Dr. Namrata Bhatt <span className="text-stone-600 font-semibold">(Oza)</span>
                      </h4>
                      <p className="text-xs font-extrabold text-sky-800 tracking-wide mt-0.5">
                        (B.P.T / C.M.M.T / M.I.A.P)
                      </p>
                      <div className="flex sm:justify-end items-center gap-1.5 mt-2">
                        <Phone className="w-3.5 h-3.5 text-sky-700" />
                        <a 
                          href={`tel:${rawPhone}`}
                          className="text-sm font-black text-sky-900 hover:text-sky-700 underline decoration-sky-400"
                        >
                          {phoneNumber}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Qualifications Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-1">
                    <div className="bg-white/80 backdrop-blur-xs rounded-xl p-2.5 border border-cyan-200 shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-sky-700 block">B.P.T</span>
                      <span className="text-[11px] font-bold text-stone-700">Bachelor of Physiotherapy</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs rounded-xl p-2.5 border border-cyan-200 shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-sky-700 block">C.M.M.T</span>
                      <span className="text-[11px] font-bold text-stone-700">Cert. Manual Medical Therapist</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs rounded-xl p-2.5 border border-cyan-200 shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-sky-700 block">M.I.A.P</span>
                      <span className="text-[11px] font-bold text-stone-700">Member Indian Assoc. Physio</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Connect Action Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={`tel:${rawPhone}`}
                  className="flex-1 min-w-[140px] py-3 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {phoneNumber}</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>

                <button
                  onClick={() => copyToClipboard(rawPhone, 'phone')}
                  className="py-3 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy Phone Number"
                >
                  {copiedField === 'phone' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-black">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-600" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Clinic Addresses */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-stone-500">
                    Clinic Centers (Mumbai & Thane)
                  </h4>
                </div>

                {/* Thane Center */}
                <div className="bg-stone-50/90 rounded-2xl p-4 border border-stone-200/80 hover:border-sky-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-900">Thane West Center</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                            Opp. Suraj Water Park
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed">
                          {thaneAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyToClipboard(thaneAddress, 'thane')}
                        className="p-1.5 text-stone-500 hover:text-sky-700 hover:bg-stone-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Copy Thane Address"
                      >
                        {copiedField === 'thane' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={thaneMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Directions</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Goregaon East Center */}
                <div className="bg-stone-50/90 rounded-2xl p-4 border border-stone-200/80 hover:border-sky-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-900">Goregaon East Center</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                            Mumbai
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed">
                          {goregaonAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyToClipboard(goregaonAddress, 'goregaon')}
                        className="p-1.5 text-stone-500 hover:text-teal-700 hover:bg-stone-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Copy Goregaon Address"
                      >
                        {copiedField === 'goregaon' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={goregaonMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Directions</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Scope & Benefits */}
              <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-black text-stone-900">Key Clinical Specialties</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-semibold text-stone-700">
                  <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Manual Therapy & Mobilization
                  </div>
                  <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Spine & Posture Rehab
                  </div>
                  <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Sports Injury Conditioning
                  </div>
                  <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Pre & Post-Surgery Rehab
                  </div>
                  <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Chronic Pain Management
                  </div>
                  <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Ergonomic Assessment
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Original Card Photo View */
            <div className="space-y-4">
              <div className="bg-stone-900 rounded-2xl p-2 sm:p-4 shadow-inner flex items-center justify-center">
                <img 
                  src="/physio-card.jpg" 
                  alt="Dr. Namrata's Physio Plus Visiting Card"
                  className="max-h-[60vh] w-auto object-contain rounded-xl shadow-lg border border-stone-800"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <span className="text-stone-600 font-medium">
                  Official physical card for Dr. Namrata Bhatt (Oza)
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${rawPhone}`}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call {phoneNumber}
                  </a>
                  <a
                    href="/physio-card.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Full Size
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-stone-700">Recommended Physiotherapy Clinic</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
