import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { registerPatient } from '../services/db';
import { 
  Heart, 
  Dumbbell, 
  Zap, 
  Sparkles, 
  Activity, 
  Leaf, 
  ShieldAlert, 
  Baby, 
  Apple, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  ListFilter,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

const GOAL_OPTIONS = [
  { id: 'diabetes', label: 'Diabetes & Blood Sugar Control', icon: Activity, desc: 'Manage glucose levels & insulin sensitivity' },
  { id: 'pcos', label: 'PCOS & Hormonal Balance', icon: Sparkles, desc: 'Support endocrine & reproductive health' },
  { id: 'heart', label: 'Heart & Cholesterol Care', icon: Heart, desc: 'Optimize blood pressure & lipid levels' },
  { id: 'gut', label: 'Gut Health & Digestion', icon: Apple, desc: 'Relieve IBS, bloating & gut inflammation' },
  { id: 'muscle', label: 'Muscle Gain & Athletic Performance', icon: Dumbbell, desc: 'Build lean mass & sports conditioning' },
  { id: 'energy', label: 'Energy, Focus & Vitality', icon: Zap, desc: 'Beat fatigue & sustain daily vigor' },
  { id: 'plant', label: 'Plant-Based & Vegan Living', icon: Leaf, desc: 'Balanced plant-centric nutrition' },
  { id: 'allergies', label: 'Food Allergies & Sensitivities', icon: ShieldAlert, desc: 'Navigate intolerances safely' },
  { id: 'postpartum', label: 'Pregnancy & Postpartum Care', icon: Baby, desc: 'Maternal recovery & lactation support' },
  { id: 'wellness', label: 'Overall Wellness & Longevity', icon: Heart, desc: 'Build sustainable long-term healthy habits' },
];

const GOAL_SPECIFICS: Record<string, { title: string; options: string[] }> = {
  'Diabetes & Blood Sugar Control': {
    title: 'Diabetes & Glucose Specifics',
    options: ['Type 2 Diabetes', 'Type 1 Diabetes', 'Pre-Diabetes / Borderline', 'Gestational Diabetes', 'HbA1c Target Reduction', 'Reactive Hypoglycemia']
  },
  'PCOS & Hormonal Balance': {
    title: 'PCOS & Endocrine Specifics',
    options: ['Insulin Resistance Management', 'Irregular Menstrual Cycles', 'Hormonal Acne / Hair Loss', 'TTC & Fertility Support', 'Weight Management with PCOS']
  },
  'Heart & Cholesterol Care': {
    title: 'Cardiovascular Specifics',
    options: ['High LDL Cholesterol', 'Hypertension (High BP)', 'High Triglycerides', 'Post-Cardiac Event Recovery', 'Arterial Health & Lipid Balance']
  },
  'Gut Health & Digestion': {
    title: 'Gastrointestinal & Gut Specifics',
    options: ['Bloating & Abdominal Distension', 'Acid Reflux / GERD', 'IBS-C (Constipation Predominant)', 'IBS-D (Diarrhea Predominant)', 'Leaky Gut & Microbiome Repair', 'SIBO Support']
  },
  'Muscle Gain & Athletic Performance': {
    title: 'Muscle & Performance Specifics',
    options: ['Hypertrophy / Lean Mass Gain', 'Heavy Strength Training', 'Endurance & Distance Sports', 'Post-Workout Muscle Recovery', 'Protein Timing & Supplementation']
  },
  'Energy, Focus & Vitality': {
    title: 'Energy & Focus Specifics',
    options: ['Afternoon Energy Slumps', 'Chronic Fatigue Syndrome', 'Brain Fog & Concentration', 'Sleep Quality & Circadian Rhythm', 'Burnout Recovery']
  },
  'Plant-Based & Vegan Living': {
    title: 'Plant-Based Nutrition Specifics',
    options: ['Transitioning to Full Vegan', 'Whole-Food Plant-Based (WFPB)', 'Ensuring Complete Proteins, B12 & Iron', 'Flexitarian Balance']
  },
  'Food Allergies & Sensitivities': {
    title: 'Allergies & Intolerance Specifics',
    options: ['Celiac Disease / Gluten Sensitivity', 'Lactose Intolerance', 'Nut / Peanut Allergy', 'FODMAP Sensitivity', 'Histamine Intolerance']
  },
  'Pregnancy & Postpartum Care': {
    title: 'Maternal Care Specifics',
    options: ['First Trimester & Nausea Support', 'Second/Third Trimester Growth', 'Postpartum Nutrient Replenishment', 'Lactation & Milk Supply Boost']
  },
  'Overall Wellness & Longevity': {
    title: 'Wellness & Longevity Specifics',
    options: ['Anti-Inflammatory Eating', 'Metabolic Health Maintenance', 'Immune System Support', 'Sustainable Lifestyle Habits']
  }
};

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1); // 1: Acc Info, 2: Primary Goals, 3: Goal Details, 4: Diet & Health

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Record<string, string[]>>({});
  const [dietaryType, setDietaryType] = useState('Vegetarian');
  const [activityLevel, setActivityLevel] = useState('Moderate');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleGoal = (goalLabel: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalLabel) 
        ? prev.filter(g => g !== goalLabel) 
        : [...prev, goalLabel]
    );
  };

  const toggleGoalDetail = (goalLabel: string, detailOption: string) => {
    setSelectedGoalDetails(prev => {
      const currentArr = prev[goalLabel] || [];
      const updated = currentArr.includes(detailOption)
        ? currentArr.filter(o => o !== detailOption)
        : [...currentArr, detailOption];
      return { ...prev, [goalLabel]: updated };
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const metaEnv = (import.meta as any).env || {};
      const SPECIAL_ID = (metaEnv.VITE_DIETICIAN_EMAIL || 'admin@aidiet.com').toLowerCase();
      const SPECIAL_PASS = metaEnv.VITE_DIETICIAN_PASSWORD || 'Admin123!';

      const TEST_PATIENT_EMAIL = 'testpatient@nutrisnap.com';
      const TEST_PATIENT_PASS = 'Patient123!';

      if (email.toLowerCase() === SPECIAL_ID && password === SPECIAL_PASS) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          navigate('/dietician');
        } catch (authError: any) {
          if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
            // Dietician account doesn't exist yet, create it on the fly
            const { createDietician } = await import('../services/db');
            await createDietician(email, password, 'Lead Dietician');
            navigate('/dietician');
          } else {
            throw authError; // rethrow other errors
          }
        }
      } else if (email.toLowerCase() === TEST_PATIENT_EMAIL && password === TEST_PATIENT_PASS) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          const { saveLocalSubscription } = await import('../services/subscription');
          saveLocalSubscription(userCred.user.uid, {
            status: 'active',
            planId: '3_months',
            planName: '3 Months VIP Free Test Plan',
            amount: 0,
            startDate: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
          });
          navigate('/patient');
        } catch (authError: any) {
          if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
            const { registerPatient } = await import('../services/db');
            const { saveLocalSubscription } = await import('../services/subscription');
            const user = await registerPatient(email, password, 'Demo VIP Patient', {
              goals: ['Overall Wellness & Longevity', 'Energy, Focus & Vitality', 'Muscle Gain & Athletic Performance'],
              dietaryType: 'Vegetarian',
              activityLevel: 'Moderate',
              conditions: 'None',
              allergies: 'None'
            });

            const vipSub = {
              status: 'active' as const,
              planId: '3_months' as const,
              planName: '3 Months VIP Free Test Plan',
              amount: 0,
              startDate: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
            };

            saveLocalSubscription(user.uid, vipSub);
            navigate('/patient');
          } else {
            throw authError;
          }
        }
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const { createNotification } = await import('../services/db');
        createNotification({
          type: 'PATIENT_LOGIN',
          patientId: userCred.user.uid,
          patientName: userCred.user.displayName || email,
          message: `${userCred.user.displayName || email} just logged in.`,
          read: false
        }).catch(e => console.error('Failed to notify login:', e));
        navigate('/patient');
      }
    } catch (e: any) {
      console.error('Sign in error:', e);
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        // If they were trying to log in as admin, let them know if they got the password wrong
        const metaEnv = (import.meta as any).env || {};
        const SPECIAL_ID = (metaEnv.VITE_DIETICIAN_EMAIL || 'admin@aidiet.com').toLowerCase();
        if (email.toLowerCase() === SPECIAL_ID) {
          setError('Invalid dietician credentials. Check password.');
        } else {
          setError('Invalid credentials. Please try again.');
        }
      } else {
        setError(`Error (${e.code}): ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setSignUpStep(2);
  };

  const handleStep2Next = () => {
    if (selectedGoals.length === 0) {
      setError('Please select at least one primary health goal');
      return;
    }
    setError('');
    setSignUpStep(3);
  };

  const handleStep3Next = () => {
    setError('');
    setSignUpStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const userCred = await registerPatient(email, password, name, {
        goals: selectedGoals,
        goalDetails: selectedGoalDetails,
        dietaryType,
        activityLevel,
        conditions,
        allergies
      });
      
      const { createNotification } = await import('../services/db');
      await createNotification({
        type: 'NEW_PATIENT',
        patientId: userCred.uid,
        patientName: name,
        message: `${name} just registered as a new patient!`,
        read: false
      }).catch(e => console.error('Failed to notify registration:', e));
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else {
        setError(e.message || 'An error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 md:p-8">
      <div className="bg-white p-6 md:p-12 w-full max-w-2xl border border-stone-200 shadow-sm transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2 tracking-tight">
            NutriSnap
          </h2>
          <p className="text-stone-500 text-sm md:text-base">
            {isSignUp 
              ? `Clinical Onboarding Survey (Step ${signUpStep} of 4)`
              : 'Sign in to your clinical portal'
            }
          </p>
          
          {/* Progress bar for 4-step onboarding */}
          {isSignUp && (
            <div className="w-full bg-stone-100 h-1.5 mt-6 rounded-full overflow-hidden">
              <div 
                className="bg-brand-600 h-full transition-all duration-500 ease-out" 
                style={{ width: `${(signUpStep / 4) * 100}%` }} 
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-900 border border-red-100 text-sm font-medium">
            {error}
          </div>
        )}

        {/* SIGN IN FORM */}
        {!isSignUp && (
          <form onSubmit={handleSignIn} className="space-y-6 max-w-md mx-auto">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-0 py-3 border-b border-stone-300 bg-transparent focus:ring-0 focus:border-stone-900 outline-none transition-colors"
                placeholder="patient@example.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-0 py-3 pr-10 border-b border-stone-300 bg-transparent focus:ring-0 focus:border-stone-900 outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-4 bg-stone-900 text-stone-50 font-sans tracking-widest text-sm uppercase font-bold rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Quick Demo Access Box */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500">
                  Quick Demo Testing Accounts
                </span>
                <span className="text-[10px] text-orange-600 font-semibold">1-Click Auto Fill</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('testpatient@nutrisnap.com');
                    setPassword('Patient123!');
                  }}
                  className="p-3.5 rounded-2xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100/80 transition-all text-left flex flex-col justify-between shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-orange-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      Test Patient
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white px-1.5 py-0.5 rounded">
                      VIP Unlocked
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-stone-700 truncate">testpatient@nutrisnap.com</span>
                  <span className="text-[10px] text-stone-500 mt-1">Pass: Patient123!</span>
                  <span className="text-[10px] font-bold text-orange-600 mt-2 group-hover:underline">
                    Click to Auto-Fill & Test →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@aidiet.com');
                    setPassword('Admin123!');
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-all text-left flex flex-col justify-between shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
                      Lead Dietician
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-stone-900 text-white px-1.5 py-0.5 rounded">
                      Admin Portal
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-stone-700 truncate">admin@aidiet.com</span>
                  <span className="text-[10px] text-stone-500 mt-1">Pass: Admin123!</span>
                  <span className="text-[10px] font-bold text-stone-700 mt-2 group-hover:underline">
                    Click to Auto-Fill & Test →
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* SIGN UP STEP 1: Account Information */}
        {isSignUp && signUpStep === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-6 max-w-md mx-auto">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-0 py-3 border-b border-stone-300 bg-transparent focus:ring-0 focus:border-stone-900 outline-none transition-colors"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-0 py-3 border-b border-stone-300 bg-transparent focus:ring-0 focus:border-stone-900 outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-0 py-3 pr-10 border-b border-stone-300 bg-transparent focus:ring-0 focus:border-stone-900 outline-none transition-colors"
                  placeholder="At least 6 characters"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full py-4 mt-6 bg-stone-900 text-stone-50 font-sans tracking-widest text-sm uppercase font-bold rounded-full hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
            >
              Continue to Goals <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SIGN UP STEP 2: High-Level Primary Clinical Goals */}
        {isSignUp && signUpStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-stone-900 mb-1">What brings you to a dietician?</h3>
              <p className="text-xs text-stone-500">Select all clinical and health goals that apply to you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {GOAL_OPTIONS.map(goal => {
                const isSelected = selectedGoals.includes(goal.label);
                const IconComponent = goal.icon;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.label)}
                    className={`p-4 border text-left flex items-start gap-3 transition-all ${
                      isSelected 
                        ? 'border-brand-700 bg-brand-50/50 ring-1 ring-brand-700' 
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-full shrink-0 ${isSelected ? 'bg-brand-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-900">{goal.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-brand-700 shrink-0" />}
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-snug">{goal.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 pt-4 border-t border-stone-100">
              <button 
                type="button"
                onClick={() => setSignUpStep(1)}
                className="w-1/3 py-4 border border-stone-300 text-stone-700 font-sans tracking-widest text-xs uppercase font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="button"
                onClick={handleStep2Next}
                className="w-2/3 py-4 bg-stone-900 text-stone-50 font-sans tracking-widest text-xs uppercase font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
              >
                Next: Goal Specifics <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SIGN UP STEP 3: Goal-Specific Clarifying Questions */}
        {isSignUp && signUpStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-stone-900 mb-1 flex items-center justify-center gap-2">
                <ListFilter className="w-5 h-5 text-brand-700" />
                Specify Your Health Objectives
              </h3>
              <p className="text-xs text-stone-500">Tap specific details for each selected care goal</p>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
              {selectedGoals.map(goalLabel => {
                const specificObj = GOAL_SPECIFICS[goalLabel];
                if (!specificObj) return null;
                const activeDetails = selectedGoalDetails[goalLabel] || [];

                return (
                  <div key={goalLabel} className="p-4 border border-stone-200 bg-stone-50/50">
                    <h4 className="font-bold text-sm text-stone-900 mb-1">{specificObj.title}</h4>
                    <p className="text-xs text-stone-500 mb-3">Goal: <span className="font-semibold text-brand-800">{goalLabel}</span></p>
                    <div className="flex flex-wrap gap-2">
                      {specificObj.options.map(opt => {
                        const isOptSelected = activeDetails.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleGoalDetail(goalLabel, opt)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                              isOptSelected 
                                ? 'bg-stone-900 text-white border-stone-900' 
                                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                            }`}
                          >
                            {isOptSelected && <Check className="w-3 h-3 text-white" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 pt-4 border-t border-stone-100">
              <button 
                type="button"
                onClick={() => setSignUpStep(2)}
                className="w-1/3 py-4 border border-stone-300 text-stone-700 font-sans tracking-widest text-xs uppercase font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="button"
                onClick={handleStep3Next}
                className="w-2/3 py-4 bg-stone-900 text-stone-50 font-sans tracking-widest text-xs uppercase font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
              >
                Next: Dietary Profile <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SIGN UP STEP 4: Dietary Preferences & Health Info */}
        {isSignUp && signUpStep === 4 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-stone-900 mb-1">Your Dietary Profile</h3>
              <p className="text-xs text-stone-500">Finalize your profile for your dietician</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Dietary Preference</label>
                <select 
                  value={dietaryType}
                  onChange={e => setDietaryType(e.target.value)}
                  className="w-full p-3 border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 outline-none font-sans text-sm"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Jain">Jain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Daily Activity Level</label>
                <select 
                  value={activityLevel}
                  onChange={e => setActivityLevel(e.target.value)}
                  className="w-full p-3 border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 outline-none font-sans text-sm"
                >
                  <option value="Sedentary">Sedentary (Desk Job, Minimal Movement)</option>
                  <option value="Light">Lightly Active (1-3 days exercise/week)</option>
                  <option value="Moderate">Moderately Active (3-5 days exercise/week)</option>
                  <option value="High">Very Active (Heavy Exercise / Physical Job)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Medical Conditions or Diagnosis (Optional)</label>
                <input 
                  type="text" 
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  className="w-full p-3 border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 outline-none font-sans text-sm"
                  placeholder="e.g. Type 2 Diabetes, High BP, Hypothyroidism"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Food Allergies or Intolerances (Optional)</label>
                <input 
                  type="text" 
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  className="w-full p-3 border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 outline-none font-sans text-sm"
                  placeholder="e.g. Lactose, Gluten, Peanuts, Shellfish"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-stone-100">
              <button 
                type="button"
                onClick={() => setSignUpStep(3)}
                className="w-1/3 py-4 border border-stone-300 text-stone-700 font-sans tracking-widest text-xs uppercase font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="w-2/3 py-4 bg-brand-700 text-stone-50 font-sans tracking-widest text-xs uppercase font-bold hover:bg-brand-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Completing Registration...' : 'Complete & Sign Up'}
              </button>
            </div>
          </form>
        )}

        {/* TOGGLE BETWEEN LOGIN & SIGN UP */}
        <div className="mt-8 pt-8 border-t border-stone-100 text-center">
          <p className="text-sm text-stone-500 mb-2">
            {isSignUp ? 'Already registered?' : 'New Patient?'}
          </p>
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setSignUpStep(1);
              setError('');
            }} 
            className="text-xs uppercase tracking-widest text-brand-700 font-bold hover:text-brand-900 transition-colors"
          >
            {isSignUp ? 'Sign in to existing account' : 'Start Patient Onboarding Survey'}
          </button>
        </div>

      </div>
    </div>
  );
}
