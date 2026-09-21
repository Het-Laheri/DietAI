import { Link } from 'react-router-dom';
import {
  Camera,
  Sparkles,
  Activity,
  Phone,
  MessageCircle,
  ChevronRight,
  Star,
  ArrowRight,
  Award,
  Heart,
  Shield,
  Menu,
  X,
  Play,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

/* ───────────────────────── DATA ───────────────────────── */

const FEATURES = [
  {
    icon: Camera,
    title: 'AI Food Scanner',
    desc: 'Snap a photo of any meal — our advanced vision AI instantly identifies every item, calculates calories, protein, carbs, fat & fiber.',
    gradient: 'from-orange-400 to-pink-500'
  },
  {
    icon: Activity,
    title: 'Progress Tracking',
    desc: 'Monitor calorie budgets, macro breakdowns, weight trends, and hydration logs with interactive charts and real-time adherence scoring.',
    gradient: 'from-pink-500 to-fuchsia-600'
  },
  {
    icon: Sparkles,
    title: 'AI Nutrition Coach',
    desc: 'Your 24/7 AI assistant answers nutrition questions, suggests healthy alternatives, and provides clinical guidance.',
    gradient: 'from-fuchsia-600 to-purple-600'
  }
];

const BLOGS = [
  {
    image: '/blog-nutrition.jpg',
    tag: 'Nutrition Science',
    title: 'Why Protein Timing Matters More Than You Think',
    excerpt: 'How distributing protein intake across meals can optimize muscle synthesis, improve satiety, and support metabolic health.',
    date: 'Sep 10, 2026',
    tagColor: 'bg-orange-100 text-orange-700'
  },
  {
    image: '/blog-ai-scanner.jpg',
    tag: 'AI & Technology',
    title: 'How AI Food Scanning Is Revolutionizing Diet Tracking',
    excerpt: 'From calorie counting to macro analysis — how multimodal AI vision is making nutrition logging effortless.',
    date: 'Sep 5, 2026',
    tagColor: 'bg-pink-100 text-pink-700'
  }
];

/* ───────────────────────── COMPONENT ──────────────────── */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden text-stone-800">

      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">NutriSnap</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['About', 'Features', 'Our Dietitian', 'Blog'].map(link => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
                  className="text-[14px] font-semibold text-stone-600 hover:text-orange-500 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-[14px] font-semibold text-stone-600 hover:text-stone-900 transition-colors">
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[14px] font-bold rounded-full hover:shadow-lg hover:shadow-orange-500/20 transition-all hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-stone-700">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-2 shadow-xl">
            {['About', 'Features', 'Our Dietitian', 'Blog'].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-stone-700 font-semibold">
                {link}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link to="/login" className="text-center py-2 text-stone-700 font-semibold">Sign In</Link>
              <Link to="/login" className="text-center py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl">Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-stone-50 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left copy */}
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full mb-6">
                <span className="text-[12px] font-bold text-orange-600 uppercase tracking-widest">Clinical Nutrition Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 leading-[1.1] mb-6 tracking-tight">
                Your Nutrition,<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-600">
                  Reimagined.
                </span>
              </h1>

              <p className="text-lg text-stone-500 leading-relaxed mb-8 max-w-xl">
                NutriSnap connects patients and dietitians through AI-powered meal planning,
                instant food photo analysis, and real-time progress tracking.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-orange-500/20 transition-all hover:-translate-y-0.5 text-sm"
                >
                  Start Your Journey
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-stone-700 font-bold rounded-full border border-stone-200 hover:bg-stone-50 transition-all text-sm"
                >
                  <Play className="w-4 h-4 text-pink-500" />
                  See How It Works
                </a>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-6 text-stone-500">
                {[
                  { icon: Shield, text: 'HIPAA Compliant' },
                  { icon: Zap, text: 'Advanced AI' },
                  { icon: Heart, text: 'Clinically Validated' }
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <t.icon className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative w-full max-w-md">
                <img
                  src="/hero-apple.png"
                  alt="NutriSnap — AI Nutrition Assistant"
                  className="w-full h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT / HOW IT WORKS ───────────────────────────── */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-[12px] uppercase tracking-widest font-bold text-pink-500 mb-4">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 mb-4 tracking-tight">
              Three Steps to a Healthier You
            </h2>
            <p className="text-stone-500 text-lg">
              From onboarding to results — NutriSnap makes evidence-based nutrition effortless, personal, and fun.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up & Set Goals',
                desc: 'Complete your clinical onboarding — health conditions, allergies, dietary preferences, and wellness goals.',
                gradient: 'from-orange-400 to-pink-500',
                emoji: '🎯'
              },
              {
                step: '02',
                title: 'Get Your AI Meal Plan',
                desc: 'Your dietitian generates a personalized 7-day plan with recipes, ingredients, and macro targets powered by AI.',
                gradient: 'from-pink-500 to-fuchsia-600',
                emoji: '🍽️'
              },
              {
                step: '03',
                title: 'Track, Scan & Thrive',
                desc: 'Snap your meals for instant analysis, track progress, and stay connected with your dietitian.',
                gradient: 'from-fuchsia-600 to-purple-600',
                emoji: '📈'
              }
            ].map((item, i) => (
              <div key={i} className="bg-stone-50 p-8 rounded-3xl border border-stone-100 hover:border-pink-200 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                    {item.step}
                  </div>
                  <span className="text-2xl">{item.emoji}</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3">{item.title}</h3>
                <p className="text-stone-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-[12px] uppercase tracking-widest font-bold text-orange-500 mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 mb-4 tracking-tight">
              Everything You Need for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">Smarter Nutrition</span>
            </h2>
            <p className="text-stone-500 text-lg">
              From multimodal AI analysis to clinical guidance — cutting-edge technology at every step.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white border border-stone-100 rounded-3xl p-8 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-3">{f.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── DOCTOR ─────────────────────────────────────────── */}
      <section id="our-dietitian" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Photo */}
            <div className="flex justify-center">
              <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-stone-200 border-8 border-stone-50 max-w-md">
                <img
                  src="/doctor.jpg"
                  alt="Dt. Jyoti Bhatt — Clinical Dietitian"
                  className="w-full h-auto object-cover aspect-[4/5]"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-6 border-t border-stone-100">
                  <p className="text-stone-900 font-black text-xl mb-1">Dt. Jyoti Bhatt</p>
                  <p className="text-pink-600 text-sm font-semibold">M.Sc. Clinical Nutrition & Dietetics</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <span className="inline-flex items-center gap-2 text-[12px] uppercase tracking-widest font-bold text-fuchsia-500 mb-4">
                Meet Your Dietitian
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-stone-900 mb-6 tracking-tight leading-tight">
                Evidence-Based Care,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">Personalized for You</span>
              </h2>

              <p className="text-stone-600 leading-relaxed mb-6">
                Dt. Jyoti Bhatt is a certified clinical dietitian with extensive experience in therapeutic nutrition,
                metabolic health management, and lifestyle disease intervention. Her approach blends cutting-edge
                nutritional science with traditional dietary wisdom.
              </p>

              <p className="text-stone-600 leading-relaxed mb-10">
                Specializing in diabetes management, PCOS nutrition, cardiovascular health, gut rehabilitation,
                and sports nutrition — she has helped hundreds of patients achieve transformative health outcomes
                through AI-powered monitoring and personalized dietary protocols.
              </p>

              {/* Credentials */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Award, text: 'M.Sc. Clinical Nutrition', color: 'text-orange-500' },
                  { icon: Star, text: '8+ Years Experience', color: 'text-pink-500' },
                  { icon: Heart, text: 'PCOS & Diabetes', color: 'text-fuchsia-500' },
                  { icon: Shield, text: 'Certified by IDDA', color: 'text-purple-500' }
                ].map((c, i) => {
                  const CIcon = c.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                        <CIcon className={`w-4 h-4 ${c.color}`} />
                      </div>
                      <span className="text-sm font-bold text-stone-700">{c.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BLOG ───────────────────────────────────────────── */}
      <section id="blog" className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-[12px] uppercase tracking-widest font-bold text-orange-500 mb-4">
                Latest Articles
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
                From the NutriSnap Blog
              </h2>
            </div>
            <a href="#blog" className="text-sm font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOGS.map((b, i) => (
              <article
                key={i}
                className="bg-white rounded-3xl overflow-hidden border border-stone-100 hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[16/10]">
                  <img
                    src={b.image}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 ${b.tagColor} text-xs font-bold rounded-full`}>
                      {b.tag}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-xs font-bold text-stone-400 mb-3 uppercase tracking-wider">{b.date}</p>
                  <h3 className="text-lg font-bold text-stone-900 mb-3 leading-tight">
                    {b.title}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed mb-6 line-clamp-3">{b.excerpt}</p>
                  <a href="#blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
                    Read More <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-8">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Free to Get Started</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Ready to Transform Your<br />Nutrition Journey?
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-xl mx-auto font-medium">
            Join hundreds of patients who have achieved their health goals with NutriSnap's AI-powered clinical nutrition platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-pink-600 font-black rounded-full hover:bg-stone-50 transition-colors text-sm shadow-xl shadow-pink-900/20"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-white py-16 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 block mb-6">NutriSnap</span>
              <p className="text-stone-500 text-sm leading-relaxed max-w-sm mb-6">
                NutriSnap is an AI-powered clinical nutrition platform by Dt. Jyoti Bhatt.
                Connecting patients and dietitians through intelligent meal planning and food analysis.
              </p>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <p className="text-stone-700 text-xs font-bold uppercase tracking-wider">
                  Powered by AI
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-6">Quick Links</h4>
              <div className="space-y-4">
                {['About NutriSnap', 'Features', 'Our Dietitian', 'Blog'].map(link => (
                  <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`} className="block text-sm text-stone-500 hover:text-orange-500 transition-colors font-medium">{link}</a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-6">Get In Touch</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-stone-500 font-medium">
                  <MessageCircle className="w-4 h-4 text-pink-500" />
                  <span>Support Chat</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-500 font-medium">
                  <Phone className="w-4 h-4 text-pink-500" />
                  <span>+91 XXXX-XXXX</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-stone-400 font-medium">
              © {new Date().getFullYear()} NutriSnap by Jyoti Bhatt. All rights reserved.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-xs text-stone-400 hover:text-stone-600 font-medium transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-stone-400 hover:text-stone-600 font-medium transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
