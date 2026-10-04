import { Link } from 'react-router-dom';
import {
  Camera,
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
  CheckCircle2,
  Zap,
  ClipboardList,
  Bot,
  Sparkles,
  GraduationCap,
  BookOpen,
  Stethoscope,
  ExternalLink
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
    desc: 'Monitor calorie budgets, macro breakdowns, weight trends, and wellness routines with interactive charts and real-time adherence scoring.',
    gradient: 'from-pink-500 to-fuchsia-600'
  },
  {
    icon: Bot,
    title: 'AI Nutrition Coach',
    desc: 'Your 24/7 AI assistant answers nutrition questions, suggests healthy alternatives, and provides clinical guidance.',
    gradient: 'from-fuchsia-600 to-purple-600'
  }
];

const BLOGS = [
  {
    image: '/blog-nutrition.jpg',
    source: 'The Quint Fit',
    tag: 'Heart Health',
    title: 'World Heart Day: 5 Heart-Healthy Foods You Must Add to Your Daily Plate',
    excerpt: 'Clinical nutrition inputs on how fiber-rich grains, antioxidant fruits, and omega-3 foods protect your arteries and reduce cardiovascular risks.',
    date: 'World Heart Day Special',
    tagColor: 'bg-rose-100 text-rose-700',
    url: 'https://fit.thequint.com/hindi/heart-news/heart-healthy-foods?utm_source=WhatsApp_mWEB&utm_medium=Social&utm_campaign=socialsharebuttons&utm_content=c6d299e3-b37e-4c00-a380-057a7c594314_1601383016895'
  },
  {
    image: '/blog-nutrition.jpg',
    source: 'NDTV Food',
    tag: 'Immunity & Seasonal Diet',
    title: '10 Diet Mistakes You Must Avoid During Season Change to Build Immunity',
    excerpt: 'Expert guide on common dietary missteps during weather transitions and how simple nutrient shifts keep infections and seasonal flu at bay.',
    date: 'NDTV Food Feature',
    tagColor: 'bg-orange-100 text-orange-700',
    url: 'https://food.ndtv.com/food-drinks/immunity-10-diet-mistakes-you-must-avoid-during-season-change-to-build-immunity-2305929'
  },
  {
    image: '/blog-nutrition.jpg',
    source: 'NDTV Food (Hindi)',
    tag: 'रोग प्रतिरोधक क्षमता',
    title: 'मौसम बदलने पर खान-पान में न करें ये 10 गलतियां, जानिए इम्युनिटी बढ़ाने के सही टिप्स',
    excerpt: 'मौसम के बदलाव के दौरान सेहत और पाचन तंत्र को दुरुस्त रखने के लिए किन गलतियों से बचना चाहिए और क्या खाना चाहिए।',
    date: 'NDTV Hindi Feature',
    tagColor: 'bg-amber-100 text-amber-800',
    url: 'https://food.ndtv.com/hindi/you-must-avoid-these-10-mistakes-during-season-change-2306581'
  },
  {
    image: '/blog-nutrition.jpg',
    source: 'NDTV Food',
    tag: 'Hypertension Management',
    title: 'Garlic for Hypertension: Why and 6 Effective Ways to Eat Garlic for High BP',
    excerpt: 'How allicin in garlic aids vascular dilation and blood pressure management, along with 6 practical kitchen methods to consume it daily.',
    date: 'NDTV Clinical Feature',
    tagColor: 'bg-emerald-100 text-emerald-700',
    url: 'https://food.ndtv.com/health/garlic-for-hypertension-why-should-you-eat-garlic-to-manage-high-bp-6-ways-to-have-garlic-2307588'
  },
  {
    image: '/blog-nutrition.jpg',
    source: 'NDTV Food',
    tag: 'PCOS & Hormonal Health',
    title: 'PCOS Diet: 5 Low Glycaemic Foods You Should Add to Your Routine',
    excerpt: 'Clinical insights on managing insulin spikes and hormonal fluctuations in PCOS through specific low-GI kitchen staples.',
    date: 'NDTV Health Focus',
    tagColor: 'bg-fuchsia-100 text-fuchsia-700',
    url: 'https://food.ndtv.com/health/pcos-5-low-glycaemic-foods-you-should-add-to-your-pcos-diet-2307730'
  },
  {
    image: '/blog-nutrition.jpg',
    source: 'NDTV Food',
    tag: 'Diabetes Diet',
    title: 'Diabetes Diet: Is Rava / Suji Safe for Diabetics? 4 Nutritious Recipes That Help',
    excerpt: 'A clinical breakdown of suji’s glycemic impact for diabetics, with 4 fiber-fortified recipe modifications that keep glucose steady.',
    date: 'NDTV Food Feature',
    tagColor: 'bg-blue-100 text-blue-700',
    url: 'https://food.ndtv.com/food-drinks/diabetes-diet-is-rava-or-suji-safe-for-diabetics-4-recipes-thatll-steal-your-heart-2318847?amp=1&akamai-rum=off'
  },
  {
    image: '/blog-nutrition.jpg',
    source: 'NDTV Food',
    tag: 'Blood Sugar Control',
    title: 'Easy Moong Dal Palak Idli to Help Manage Blood Sugar Levels',
    excerpt: 'A low-carb, protein and iron rich breakfast innovation combining yellow lentils and spinach for stable postprandial glucose levels.',
    date: 'NDTV Recipe Feature',
    tagColor: 'bg-teal-100 text-teal-700',
    url: 'https://food.ndtv.com/food-drinks/diabetes-diet-this-easy-moong-dal-palak-idli-may-help-manage-blood-sugar-levels-2319363'
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
              <img src="/logo.jpg" alt="NutriSnap" className="h-12 w-auto rounded-lg shadow-sm" />
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 hidden sm:block">NutriSnap</span>
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
              <div className="relative w-full max-w-md group">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 via-pink-500 to-fuchsia-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 translate-y-8"></div>
                <img
                  src="/Nutrisnap.png"
                  alt="NutriSnap — AI Nutrition Assistant"
                  className="relative w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out"
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
                icon: ClipboardList
              },
              {
                step: '02',
                title: 'Get Your AI Meal Plan',
                desc: 'Your dietitian generates a personalized 7-day plan with recipes, ingredients, and macro targets powered by AI.',
                gradient: 'from-pink-500 to-fuchsia-600',
                icon: Heart
              },
              {
                step: '03',
                title: 'Track, Scan & Thrive',
                desc: 'Snap your meals for instant analysis, track progress, and stay connected with your dietitian.',
                gradient: 'from-fuchsia-600 to-purple-600',
                icon: Activity
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-stone-50 p-8 rounded-3xl border border-stone-100 hover:border-pink-200 transition-colors shadow-sm hover:shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-stone-900">Step {item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-3">{item.title}</h3>
                  <p className="text-stone-500 leading-relaxed text-sm">{item.desc}</p>
                </div>
              );
            })}
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
          <div className="grid md:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Photo */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/10 border-8 border-stone-50 max-w-md w-full">
                <img
                  src="/doctor.jpg"
                  alt="Clinical Dietitian & Founder"
                  className="w-full h-auto object-cover aspect-[4/5] object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 border-t border-stone-100 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-stone-900 font-black text-xl leading-tight">Welcome to NutriSnap!</p>
                      <p className="text-orange-600 text-xs font-bold mt-1">14+ Years in Clinical Nutrition & Dietetics</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-200">
                      RD Honorary
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio & Philosophy */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <span className="inline-flex items-center gap-2 text-[12px] uppercase tracking-widest font-bold text-orange-600 mb-3 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  <Sparkles className="w-3.5 h-3.5" /> Founder & Clinical Lead
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                  Food is the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500">First Medicine</span>
                </h2>
              </div>

              <div className="space-y-4 text-stone-600 leading-relaxed text-base">
                <p>
                  I created <strong>NutriSnap</strong> with one simple mission — to bring expert nutrition care to your doorstep, no matter where you are. Because good health should not have to wait for a long travel or appointment.
                </p>

                <p>
                  In my <strong>14+ years of journey in clinical nutrition</strong>, I have seen that <em>Food is the First Medicine</em>. The right food, at the right time, in the right quantity can prevent, manage and even reverse many health conditions.
                </p>

                <p>
                  I have learned that every single food we eat has the power to heal. At NutriSnap, we don't give you fad diets — we help you understand your body and choose what is best for <strong>YOU</strong>. When combined with simple lifestyle changes and exercise, food becomes your most powerful medicine.
                </p>
              </div>

              {/* Founder Promise Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 border border-orange-200/80 shadow-xs">
                <p className="text-xs font-black uppercase tracking-wider text-orange-700 mb-1 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> My Promise to You
                </p>
                <p className="text-sm font-semibold text-stone-800 italic">
                  &ldquo;Simple, practical, and sustainable diet plans that fit into your real life — not the other way around.&rdquo;
                </p>
              </div>

              {/* Credentials & Achievements */}
              <div>
                <h3 className="text-xs uppercase tracking-widest font-black text-stone-900 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" /> Credentials & Achievements
                </h3>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {[
                    { icon: GraduationCap, title: 'Post Graduate in Clinical Nutrition & Dietetics', color: 'text-orange-500' },
                    { icon: Shield, title: 'Registered Dietician Honorary (RD)', color: 'text-pink-500' },
                    { icon: Stethoscope, title: 'Certified Diabetes Educator (CDE)', color: 'text-rose-500' },
                    { icon: Award, title: 'Management Graduate — ISB Hyderabad', color: 'text-purple-500' },
                    { icon: BookOpen, title: 'Active Researcher & Nutrition Educator', color: 'text-teal-600' },
                    { icon: Heart, title: 'Creator of Heart-Healthy Recipe (National Paper Presentation)', color: 'text-amber-600' }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100 hover:border-orange-200 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                          <IconComponent className={`w-3.5 h-3.5 ${item.color}`} />
                        </div>
                        <span className="text-xs font-bold text-stone-800 leading-snug">{item.title}</span>
                      </div>
                    );
                  })}
                </div>
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
                Clinical Media Coverage & Articles
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
                Featured Across National Health Media
              </h2>
              <p className="text-stone-500 text-sm md:text-base mt-2">
                Evidence-based nutrition insights, clinical guidance, and therapeutic recipes authored by our Clinical Dietitian.
              </p>
            </div>
            <a href="#blog" className="text-sm font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 transition-colors">
              Featured Articles ({BLOGS.length})
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOGS.map((b, i) => (
              <article
                key={i}
                className="bg-white rounded-3xl overflow-hidden border border-stone-100 hover:shadow-xl hover:border-orange-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 items-center">
                      <span className={`px-3 py-1 ${b.tagColor} text-xs font-bold rounded-full shadow-xs`}>
                        {b.tag}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-0.5 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-bold rounded-md shadow-xs">
                        {b.source}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">{b.source}</p>
                      <span className="text-[11px] font-medium text-stone-400">{b.date}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-3 leading-snug group-hover:text-orange-600 transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500 leading-relaxed line-clamp-3 mb-4">{b.excerpt}</p>
                  </div>
                </div>
                <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-0 border-t border-stone-50">
                  <a 
                    href={b.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors pt-3"
                  >
                    <span>Read Full Coverage</span>
                    <ExternalLink className="w-3.5 h-3.5" />
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
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.jpg" alt="NutriSnap" className="h-10 w-auto rounded" />
                <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 block">NutriSnap</span>
              </div>
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
