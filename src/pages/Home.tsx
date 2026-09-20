import { Link } from 'react-router-dom';
import {
  Camera,
  Sparkles,
  Utensils,
  Phone,
  Activity,
  MessageCircle,
  ChevronRight,
  Star,
  ArrowRight,
  BookOpen,
  Award,
  Heart,
  Zap,
  Shield,
  Menu,
  X,
  Play,
  Users,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

/* ───────────────────────── DATA ───────────────────────── */

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Food Scanner',
    desc: 'Snap a photo of any meal — our advanced vision AI instantly identifies every item, calculates calories, protein, carbs, fat & fiber.',
    gradient: 'from-violet-500 to-indigo-600',
    bgGlow: 'bg-violet-500/10'
  },
  {
    icon: Activity,
    title: 'Progress Tracking',
    desc: 'Monitor calorie budgets, macro breakdowns, weight trends, and hydration logs with interactive charts and real-time adherence scoring.',
    gradient: 'from-rose-500 to-pink-600',
    bgGlow: 'bg-rose-500/10'
  },
  {
    icon: Sparkles,
    title: 'AI Nutrition Coach',
    desc: 'Your 24/7 AI assistant answers nutrition questions, suggests healthy alternatives, and provides clinical guidance.',
    gradient: 'from-indigo-500 to-blue-600',
    bgGlow: 'bg-indigo-500/10'
  }
];

const BLOGS = [
  {
    image: '/blog-nutrition.jpg',
    tag: 'Nutrition Science',
    title: 'Why Protein Timing Matters More Than You Think',
    excerpt: 'How distributing protein intake across meals can optimize muscle synthesis, improve satiety, and support metabolic health.',
    date: 'Sep 10, 2026',
    tagColor: 'bg-violet-100 text-violet-700'
  },
  {
    image: '/blog-ai-scanner.jpg',
    tag: 'AI & Technology',
    title: 'How AI Food Scanning Is Revolutionizing Diet Tracking',
    excerpt: 'From calorie counting to macro analysis — how multimodal AI vision is making nutrition logging effortless.',
    date: 'Sep 5, 2026',
    tagColor: 'bg-sky-100 text-sky-700'
  },
  {
    image: '/blog-whatsapp.jpg',
    tag: 'Patient Care',
    title: 'The Power of WhatsApp in Clinical Dietetics Practice',
    excerpt: 'How direct WhatsApp communication is improving patient adherence, engagement, and clinical outcomes.',
    date: 'Aug 28, 2026',
    tagColor: 'bg-amber-100 text-amber-700'
  }
];

const STATS = [
  { value: '10K+', label: 'Meals Analyzed', icon: Camera },
  { value: '500+', label: 'Happy Patients', icon: Users },
  { value: '98%', label: 'Accuracy Rate', icon: TrendingUp },
  { value: '24/7', label: 'AI Support', icon: Zap }
];

/* ───────────────────────── COMPONENT ──────────────────── */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 md:h-20">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <img src="/logo.jpg" alt="NutriSnap" className="h-14 md:h-16 w-auto rounded-lg shadow-sm" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['About', 'Features', 'Our Dietitian', 'Blog'].map(link => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
                  className="text-[13px] font-semibold text-stone-500 hover:text-stone-900 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-indigo-500 after:transition-all hover:after:w-full"
                >
                  {link}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="px-5 py-2.5 text-[13px] font-semibold text-stone-600 hover:text-stone-900 transition-colors">
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-bold rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                Get Started Free →
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/40 px-4 pb-6 pt-2 space-y-1 animate-slide-up">
            {['About', 'Features', 'Our Dietitian', 'Blog'].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setMobileMenuOpen(false)} className="block py-3 text-stone-700 font-semibold text-[15px]">
                {link}
              </a>
            ))}
            <div className="pt-4 border-t border-stone-200 flex flex-col gap-3">
              <Link to="/login" className="text-center py-3 text-stone-700 font-semibold">Sign In</Link>
              <Link to="/login" className="text-center py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-full">Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 bg-stone-900 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-full blur-[100px] animate-float" />
          <div className="absolute top-1/2 -left-60 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/20 to-cyan-500/10 rounded-full blur-[100px] animate-float-delayed" />
          <div className="absolute -bottom-20 right-1/3 w-[400px] h-[400px] bg-gradient-to-br from-rose-500/20 to-amber-500/10 rounded-full blur-[100px] animate-float" />
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left copy */}
            <div className="order-2 md:order-1">
              <div className="animate-slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest">Clinical Nutrition Platform</span>
                </div>
              </div>

              <h1 className="animate-slide-up-delay-1 text-[2.8rem] sm:text-5xl lg:text-[3.5rem] font-heading font-extrabold text-white leading-[1.08] mb-6">
                Your Nutrition,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 animate-gradient">
                  Reimagined
                </span>
                <br />with AI.
              </h1>

              <p className="animate-slide-up-delay-2 text-base md:text-lg text-stone-300 leading-relaxed mb-10 max-w-xl">
                NutriSnap connects patients and dietitians through <strong className="text-white">AI-powered meal planning</strong>,
                instant food photo analysis, real-time progress tracking, and seamless <strong className="text-white">WhatsApp communication</strong>.
              </p>

              <div className="animate-slide-up-delay-3 flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-full hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 text-sm"
                >
                  Start Your Journey
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-all text-sm backdrop-blur-sm"
                >
                  <Play className="w-4 h-4 text-indigo-300" />
                  See How It Works
                </a>
              </div>

              {/* Trust row */}
              <div className="animate-slide-up-delay-3 flex flex-wrap items-center gap-5 text-stone-400">
                {[
                  { icon: Shield, text: 'HIPAA Compliant', color: 'text-indigo-400' },
                  { icon: Zap, text: 'Advanced AI', color: 'text-amber-400' },
                  { icon: Heart, text: 'Clinically Validated', color: 'text-rose-400' }
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Logo hero card */}
            <div className="order-1 md:order-2 flex justify-center animate-slide-up">
              <div className="relative group cursor-pointer perspective-1000">
                <div className="absolute -inset-6 bg-gradient-to-tr from-indigo-500/30 via-violet-500/20 to-rose-500/30 rounded-[2rem] blur-2xl animate-float group-hover:blur-3xl group-hover:from-indigo-400/40 transition-all duration-700" />
                <div className="relative bg-gradient-to-br from-white/10 to-stone-50/5 rounded-3xl p-4 shadow-2xl border border-white/20 backdrop-blur-sm group-hover:shadow-indigo-500/40 group-hover:-translate-y-2 transition-all duration-500">
                  <div className="overflow-hidden rounded-2xl relative">
                    <img
                      src="/logo.jpg"
                      alt="NutriSnap — AI Nutrition Assistant"
                      className="w-72 sm:w-80 md:w-[22rem] h-auto group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700"
                    />
                    {/* Hover scan line effect */}
                    <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-white/80 shadow-[0_0_15px_3px_rgba(255,255,255,0.7)] transform -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -bottom-4 -right-4 glass rounded-2xl px-4 py-3 shadow-lg border border-white/60 animate-float-delayed">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-stone-800">AI Powered</p>
                        <p className="text-[10px] text-stone-500">Advanced AI</p>
                      </div>
                    </div>
                  </div>
                  {/* Floating stat */}
                  <div className="absolute -top-3 -left-3 glass rounded-2xl px-4 py-3 shadow-lg border border-white/60 animate-float">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-stone-800">98% Accurate</p>
                        <p className="text-[10px] text-stone-400">Food Scanning</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────────────────── */}
      <section className="relative py-14 md:py-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="text-center group">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-white/15 rounded-xl mb-3 group-hover:bg-white/25 transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-1">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-widest font-bold text-white/60">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── ABOUT / HOW IT WORKS ───────────────────────────── */}
      <section id="about" className="py-20 md:py-28 bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-indigo-600 mb-5">
              <span className="w-8 h-[2px] bg-indigo-400 rounded" />
              How it works
              <span className="w-8 h-[2px] bg-indigo-400 rounded" />
            </span>
            <h2 className="text-3xl md:text-[2.5rem] font-heading font-extrabold text-stone-900 mb-5">
              Three Steps to a Healthier You
            </h2>
            <p className="text-base text-stone-500 leading-relaxed">
              From onboarding to results — NutriSnap makes evidence-based nutrition effortless, personal, and fun.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up & Set Goals',
                desc: 'Complete your clinical onboarding — health conditions, allergies, dietary preferences, and wellness goals.',
                gradient: 'from-indigo-500 to-violet-600',
                emoji: '🎯'
              },
              {
                step: '02',
                title: 'Get Your AI Meal Plan',
                desc: 'Your dietitian generates a personalized 7-day plan with recipes, ingredients, and macro targets powered by AI.',
                gradient: 'from-amber-500 to-orange-600',
                emoji: '🍽️'
              },
              {
                step: '03',
                title: 'Track, Scan & Thrive',
                desc: 'Snap your meals for instant analysis, track progress, and stay connected with your dietitian via WhatsApp.',
                gradient: 'from-rose-500 to-pink-600',
                emoji: '📈'
              }
            ].map((item, i) => (
              <div key={i} className="group relative">
                <div className="relative bg-white p-8 md:p-10 rounded-2xl border border-stone-100 hover:shadow-2xl hover:shadow-stone-900/8 transition-all duration-500 hover:-translate-y-2 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg text-white font-heading font-extrabold text-sm`}>
                      {item.step}
                    </div>
                    <span className="text-2xl">{item.emoji}</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-stone-900 mb-3">{item.title}</h3>
                  <p className="text-stone-500 leading-relaxed text-[15px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-white relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-50/50 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-violet-600 mb-5">
              <span className="w-8 h-[2px] bg-violet-400 rounded" />
              Features
              <span className="w-8 h-[2px] bg-violet-400 rounded" />
            </span>
            <h2 className="text-3xl md:text-[2.5rem] font-heading font-extrabold text-stone-900 mb-5">
              Everything You Need for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Smarter Nutrition</span>
            </h2>
            <p className="text-base text-stone-500">
              From multimodal AI analysis to clinical recipe databases — cutting-edge technology at every step.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group bg-white border border-stone-100 rounded-2xl p-7 hover:shadow-2xl hover:shadow-stone-900/8 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                >
                  {/* Glow on hover */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 ${f.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-stone-900 mb-2">{f.title}</h3>
                    <p className="text-stone-500 text-[14px] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── DOCTOR ─────────────────────────────────────────── */}
      <section id="our-dietitian" className="py-20 md:py-28 bg-stone-50/50 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-violet-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Photo */}
            <div className="relative flex justify-center">
              <div className="absolute -inset-8 bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-rose-200/30 rounded-[2rem] blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-stone-900/15 max-w-md border-4 border-white">
                <img
                  src="/doctor.jpg"
                  alt="Dt. Jyoti Bhatt — Clinical Dietitian"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/90 via-stone-900/50 to-transparent p-6 pt-20">
                  <p className="text-white font-heading font-bold text-xl">Dt. Jyoti Bhatt</p>
                  <p className="text-stone-300 text-sm">M.Sc. Clinical Nutrition & Dietetics</p>
                </div>

                {/* Floating reviews badge */}
                <div className="absolute top-4 right-4 glass rounded-xl px-3 py-2 shadow-md border border-white/50">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(j => (
                      <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-stone-700 mt-0.5">500+ Reviews</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-rose-500 mb-5">
                <span className="w-8 h-[2px] bg-rose-400 rounded" />
                Meet Your Dietitian
              </span>
              <h2 className="text-3xl md:text-[2.5rem] font-heading font-extrabold text-stone-900 mb-6 leading-tight">
                Evidence-Based Care,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Personalized for You</span>
              </h2>

              <p className="text-stone-500 leading-relaxed mb-5 text-[15px]">
                Dt. Jyoti Bhatt is a certified clinical dietitian with extensive experience in therapeutic nutrition,
                metabolic health management, and lifestyle disease intervention. Her approach blends cutting-edge
                nutritional science with traditional Indian dietary wisdom.
              </p>

              <p className="text-stone-500 leading-relaxed mb-8 text-[15px]">
                Specializing in diabetes management, PCOS nutrition, cardiovascular health, gut rehabilitation,
                and sports nutrition — she has helped hundreds of patients achieve transformative health outcomes
                through AI-powered monitoring and personalized dietary protocols.
              </p>

              {/* Credentials */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Award, text: 'M.Sc. Clinical Nutrition', gradient: 'from-indigo-500 to-violet-600' },
                  { icon: Star, text: '8+ Years Experience', gradient: 'from-amber-500 to-orange-600' },
                  { icon: Heart, text: 'PCOS & Diabetes Specialist', gradient: 'from-rose-500 to-pink-600' },
                  { icon: Shield, text: 'Certified by IDDA', gradient: 'from-sky-500 to-cyan-600' }
                ].map((c, i) => {
                  const CIcon = c.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center shrink-0`}>
                        <CIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[12px] font-bold text-stone-700">{c.text}</span>
                    </div>
                  );
                })}
              </div>


            </div>
          </div>
        </div>
      </section>


      {/* ─── BLOG ───────────────────────────────────────────── */}
      <section id="blog" className="py-20 md:py-28 bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-sky-600 mb-5">
                <span className="w-8 h-[2px] bg-sky-400 rounded" />
                Latest Articles
              </span>
              <h2 className="text-3xl md:text-[2.5rem] font-heading font-extrabold text-stone-900">
                From the NutriSnap Blog
              </h2>
            </div>
            <a href="#blog" className="group text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {BLOGS.map((b, i) => (
              <article
                key={i}
                className="group bg-white border border-stone-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-stone-900/8 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="relative overflow-hidden aspect-[16/10]">
                  <img
                    src={b.image}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 ${b.tagColor} text-[11px] font-bold rounded-full shadow-sm`}>
                      {b.tag}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[11px] font-semibold text-stone-400 mb-3 uppercase tracking-wider">{b.date}</p>
                  <h3 className="text-[17px] font-heading font-bold text-stone-900 mb-3 group-hover:text-indigo-700 transition-colors leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed mb-4">{b.excerpt}</p>
                  <a href="#blog" className="group/link inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Read More <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-8">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Free to Get Started</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-6 leading-tight">
            Ready to Transform Your<br />Nutrition Journey?
          </h2>
          <p className="text-base md:text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Join hundreds of patients who have achieved their health goals with NutriSnap's AI-powered clinical nutrition platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-indigo-700 font-extrabold rounded-full hover:bg-stone-100 transition-all hover:shadow-2xl hover:shadow-white/20 text-sm active:scale-95"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#our-dietitian"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all text-sm"
            >
              Meet the Dietitian
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-stone-950 py-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <img src="/logo.jpg" alt="NutriSnap" className="h-10 w-auto mb-4 brightness-200 invert opacity-70 rounded" />
              <p className="text-stone-500 text-sm leading-relaxed max-w-md mb-6">
                NutriSnap is an AI-powered clinical nutrition platform by Dt. Jyoti Bhatt.
                Connecting patients and dietitians through intelligent meal planning,
                food analysis, and seamless WhatsApp communication.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                <p className="text-stone-600 text-[11px] font-bold uppercase tracking-wider">
                  Powered by AI
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-stone-400 uppercase tracking-widest mb-5">Quick Links</h4>
              <div className="space-y-3">
                {['About NutriSnap', 'Features', 'Our Dietitian', 'Blog'].map(link => (
                  <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`} className="block text-sm text-stone-500 hover:text-white transition-colors">{link}</a>
                ))}
                <Link to="/login" className="block text-sm text-stone-500 hover:text-white transition-colors">Sign In</Link>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-stone-400 uppercase tracking-widest mb-5">Get In Touch</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                  <span>WhatsApp Support</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <span>+91 XXXX-XXXX</span>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[12px] font-bold rounded-full hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                  Patient Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-stone-600">
              © {new Date().getFullYear()} NutriSnap by Jyoti Bhatt. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-[11px] text-stone-600 hover:text-stone-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-[11px] text-stone-600 hover:text-stone-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
