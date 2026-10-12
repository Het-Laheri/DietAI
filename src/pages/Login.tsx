import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { registerPatient, createDietician, createNotification } from '../services/db';
import { saveLocalSubscription } from '../services/subscription';
import { 
  Heart, 
  Dumbbell, 
  Sparkles, 
  Activity, 
  Leaf, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Scale,
  Target,
  Stethoscope,
  Briefcase,
  AlertTriangle,
  User,
  Clock,
  ChevronRight,
  Flame,
  Info
} from 'lucide-react';

const LIFE_STAGES = [
  { id: 'Adult', label: 'Adult', desc: 'Ages 18–60, general wellness & metabolic balance' },
  { id: 'Geriatric', label: 'Geriatric', desc: 'Ages 60+, bone density, vitality & gentle senior care' },
  { id: 'Gynaec', label: 'Gynaec', desc: 'PCOS, hormonal regulation, prenatal & maternal health' },
  { id: 'Pediatrics', label: 'Pediatrics', desc: 'Ages under 18, growth & adolescent nutrition' },
];

const WEIGHT_PRIMARY_GOALS = [
  { id: 'Weight Loss & Fat Reduction', label: 'Weight Loss & Fat Reduction', icon: Flame, desc: 'Healthy caloric deficit, visceral fat loss, preserving lean muscle' },
  { id: 'Weight Maintenance & Metabolic Balance', label: 'Weight Maintenance & Metabolic Balance', icon: Heart, desc: 'Lock in current weight, stabilize blood sugar & prevent rebound' },
  { id: 'Lean Muscle Mass & Healthy Gain', label: 'Lean Muscle Mass & Healthy Gain', icon: Dumbbell, desc: 'Clean caloric surplus, hypertrophy & athletic body tone' },
  { id: 'Clinical / Medical Weight Regulation', label: 'Clinical / Medical Weight Regulation', icon: Stethoscope, desc: 'Doctor-directed, post-op, cardiac care or fatty liver management' },
];

const WEIGHT_FOCUS_AREAS = [
  'Visceral & Belly Fat Reduction',
  'Preventing Weight Rebound (Anti-Yo-Yo)',
  'Breaking Through a Weight Plateau',
  'Postpartum Weight Reset',
  'Curbing Late-Night & Emotional Snacking',
  'Doctor-Prescribed Weight Reduction',
  'Lean Body Recomposition & Toning',
  'Portion Satiety & Cravings Management',
  'Insulin Resistance & Metabolic Boost'
];

const WEIGHT_PACES = [
  { id: 'Steady & Sustainable (0.5 kg / week)', label: 'Steady & Sustainable (0.5 kg / week)', badge: 'Recommended', desc: 'Clinically proven to protect metabolic rate and prevent weight rebound.' },
  { id: 'Active Progression (0.75 - 1.0 kg / week)', label: 'Active Progression (0.75 - 1.0 kg / week)', badge: 'Accelerated', desc: 'Strict deficit with higher protein intake and focused compliance.' },
  { id: 'Habit-First / Gentle Adjustment', label: 'Habit-First / Gentle Adjustment', badge: 'Mindful', desc: 'Prioritize food quality and eating habits before aggressive deficit.' }
];

const MEDICAL_CONDITIONS = [
  'Obstetrical / Gynaec (PCOS/PCOD)',
  'Diabetes (Type 1 or Type 2)',
  'Hypertension (High BP)',
  'Cardiac / Heart Condition',
  'Renal (Kidney) Disease',
  'Hepatic (Fatty Liver / Liver Care)',
  'Obesity / Metabolic Syndrome',
  'Thyroid Disorder (Hypo / Hyper)',
  'Neurological Condition',
  'Cancer / Oncology Recovery',
  'None / Healthy'
];

const ALLERGEN_OPTIONS = [
  'Dairy / Lactose',
  'Gluten / Wheat (Celiac)',
  'Peanuts & Tree Nuts',
  'Shellfish & Seafood',
  'Soy & Soy Products',
  'Eggs',
  'Sulfites / Preservatives'
];

const FOOD_PREFERENCES = [
  { id: 'Vegetarian', label: 'Vegetarian', desc: 'Plant-based with dairy, no meat or seafood' },
  { id: 'Non-Vegetarian', label: 'Non-Vegetarian', desc: 'Includes poultry, meat, seafood and eggs' },
  { id: 'Jain', label: 'Jain', desc: 'Strict vegetarian without root veggies, onions, or garlic' },
  { id: 'Vegan', label: 'Vegan', desc: '100% plant-based, no animal products or dairy' },
  { id: 'Eggetarian', label: 'Eggetarian', desc: 'Vegetarian diet including eggs' }
];

const OCCUPATIONS = [
  { id: 'Business / Employed', label: 'Business / Employed', desc: 'Desk job, corporate, IT, office work' },
  { id: 'Homemaker / Housewife', label: 'Homemaker / Housewife', desc: 'Managing household & family nutrition' },
  { id: 'Student', label: 'Student', desc: 'College/University, study schedule' },
  { id: 'Retired / Unemployed', label: 'Retired / Unemployed', desc: 'Flexible daily schedule' },
  { id: 'Fieldwork', label: 'Fieldwork / Physically Demanding', desc: 'Active shifts, travel, heavy movement' }
];

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1); // 1 to 5

  // Step 1: Account & Core Identity
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [age, setAge] = useState<string>('28');
  const [lifeStage, setLifeStage] = useState('Adult');
  const [mobile, setMobile] = useState('');

  // Step 2: Anthropometrics & Clinical BMI Gauge
  const [heightCm, setHeightCm] = useState<number>(165);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(68);
  const [waistInches, setWaistInches] = useState<number>(32);

  // Step 3: Specific Weight Management Goals
  const [weightPrimaryGoal, setWeightPrimaryGoal] = useState<string>('Weight Loss & Fat Reduction');
  const [targetWeightKg, setTargetWeightKg] = useState<number>(60);
  const [weightPace, setWeightPace] = useState<string>('Steady & Sustainable (0.5 kg / week)');
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([
    'Visceral & Belly Fat Reduction',
    'Preventing Weight Rebound (Anti-Yo-Yo)'
  ]);

  // Step 4: Clinical Screening & Medical History
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [diagnosisOrProcedure, setDiagnosisOrProcedure] = useState('');
  const [hasAllergies, setHasAllergies] = useState<boolean>(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');

  // Step 5: Dietary Preferences & Lifestyle
  const [dietaryType, setDietaryType] = useState('Vegetarian');
  const [occupation, setOccupation] = useState('Business / Employed');
  const [activityLevel, setActivityLevel] = useState('Moderate');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dynamic Anthropometric Calculations (from sheet)
  const heightM = heightCm > 0 ? heightCm / 100 : 1.65;
  const liveBmi = Number((currentWeightKg / (heightM * heightM)).toFixed(1));

  // Broca's Index: Male: Ht - 100, Female: Ht - 105
  const liveIBW = gender === 'Male' ? Math.max(35, heightCm - 100) : Math.max(35, heightCm - 105);

  const getBmiDetails = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight (< 18.4)', color: 'text-amber-800 bg-amber-50 border-amber-300', dot: 'bg-amber-500' };
    if (bmi < 25) return { label: 'Normal (18.5 – 24.9)', color: 'text-emerald-800 bg-emerald-50 border-emerald-300', dot: 'bg-emerald-500' };
    if (bmi < 30) return { label: 'Overweight (25 – 29.9)', color: 'text-orange-800 bg-orange-50 border-orange-300', dot: 'bg-orange-500' };
    if (bmi < 35) return { label: 'Obesity Grade I (30 – 34.9)', color: 'text-rose-800 bg-rose-50 border-rose-300', dot: 'bg-rose-500' };
    if (bmi < 40) return { label: 'Obesity Grade II (35 – 39.9)', color: 'text-red-800 bg-red-50 border-red-300', dot: 'bg-red-500' };
    return { label: 'Morbid Obesity (> 40)', color: 'text-purple-800 bg-purple-50 border-purple-300', dot: 'bg-purple-500' };
  };

  const bmiDetails = getBmiDetails(liveBmi);

  // Target delta
  const weightDiff = Number((currentWeightKg - targetWeightKg).toFixed(1));

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleCondition = (cond: string) => {
    if (cond === 'None / Healthy') {
      setSelectedConditions(['None / Healthy']);
      return;
    }
    setSelectedConditions(prev => {
      const filtered = prev.filter(c => c !== 'None / Healthy');
      return filtered.includes(cond) ? filtered.filter(c => c !== cond) : [...filtered, cond];
    });
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
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
      const MEALS_TEST_EMAIL = 'mealstest@nutrisnap.com';
      const MEALS_TEST_PASS = 'Meals123!';

      if (email.toLowerCase() === SPECIAL_ID && password === SPECIAL_PASS) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          navigate('/dietician');
        } catch (authError: any) {
          if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
            await createDietician(email, password, 'Lead Dietician');
            navigate('/dietician');
          } else {
            throw authError;
          }
        }
      } else if ((email.toLowerCase() === TEST_PATIENT_EMAIL && password === TEST_PATIENT_PASS) || (email.toLowerCase() === MEALS_TEST_EMAIL && password === MEALS_TEST_PASS)) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
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
            const isMealsTest = email.toLowerCase() === MEALS_TEST_EMAIL;
            const patientName = isMealsTest ? 'Meals Test Patient' : 'Demo VIP Patient';
            const user = await registerPatient(email, password, patientName, {
              gender: 'Female',
              age: 29,
              lifeStage: 'Adult',
              heightCm: 165,
              currentWeightKg: 68,
              targetWeightKg: 60,
              idealBodyWeightKg: 60,
              bmi: 25.0,
              bmiClassification: 'Overweight (25 - 29.9)',
              weightManagement: {
                primaryGoal: 'Weight Loss & Fat Reduction',
                targetPace: 'Steady & Sustainable (0.5 kg / week)',
                specificFocus: ['Visceral & Belly Fat Reduction', 'Preventing Weight Rebound (Anti-Yo-Yo)'],
                targetDifferenceKg: 8
              },
              medicalHistory: ['None / Healthy'],
              dietaryType: 'Vegetarian',
              activityLevel: 'Moderate'
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

  // Step Validation Handlers
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
    if (!age || Number(age) < 10 || Number(age) > 120) {
      setError('Please enter a valid age');
      return;
    }
    setError('');
    setSignUpStep(2);
  };

  const handleStep2Next = () => {
    if (!heightCm || heightCm < 100 || heightCm > 250) {
      setError('Please enter a valid height in cm (100 - 250 cm)');
      return;
    }
    if (!currentWeightKg || currentWeightKg < 30 || currentWeightKg > 300) {
      setError('Please enter a valid weight in kg (30 - 300 kg)');
      return;
    }
    // Default target weight to Broca's IBW if unset
    if (!targetWeightKg) {
      setTargetWeightKg(liveIBW);
    }
    setError('');
    setSignUpStep(3);
  };

  const handleStep3Next = () => {
    if (!targetWeightKg || targetWeightKg < 30 || targetWeightKg > 300) {
      setError('Please specify a realistic target weight in kg');
      return;
    }
    if (selectedFocusAreas.length === 0) {
      setError('Please pick at least one specific weight management focus area');
      return;
    }
    setError('');
    setSignUpStep(4);
  };

  const handleStep4Next = () => {
    setError('');
    setSignUpStep(5);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const allergySummary = hasAllergies 
        ? (selectedAllergies.length > 0 
            ? selectedAllergies.join(', ') + (customAllergy ? `, ${customAllergy}` : '') 
            : customAllergy || 'Yes') 
        : 'None';

      const userCred = await registerPatient(email, password, name, {
        mobile,
        gender,
        age: Number(age) || 28,
        lifeStage,
        heightCm,
        currentWeightKg,
        targetWeightKg,
        waistCm: Math.round(waistInches * 2.54),
        initialWaistCm: Math.round(waistInches * 2.54),
        inchLoss: 0,
        idealBodyWeightKg: liveIBW,
        bmi: liveBmi,
        bmiClassification: bmiDetails.label,
        weightManagement: {
          primaryGoal: weightPrimaryGoal,
          targetPace: weightPace,
          specificFocus: selectedFocusAreas,
          targetDifferenceKg: Math.abs(weightDiff),
          initialWeightKg: currentWeightKg,
          inchLoss: 0
        },
        medicalHistory: selectedConditions.length > 0 ? selectedConditions : ['None / Healthy'],
        diagnosisOrProcedure,
        occupation,
        activityLevel,
        dietaryType,
        goals: [weightPrimaryGoal, ...selectedFocusAreas.slice(0, 2)],
        allergies: allergySummary,
        conditions: selectedConditions.join(', ') + (diagnosisOrProcedure ? ` | Note: ${diagnosisOrProcedure}` : '')
      });

      await createNotification({
        type: 'NEW_PATIENT',
        patientId: userCred.uid,
        patientName: name,
        message: `${name} completed intake! Goal: ${weightPrimaryGoal} (BMI: ${liveBmi})`,
        read: false
      }).catch(e => console.error('Failed to notify registration:', e));

      navigate('/patient');
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
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-orange-100 selection:text-orange-900">
      <div className="bg-white p-6 md:p-10 w-full max-w-2xl border border-stone-200/90 rounded-3xl shadow-xl shadow-stone-200/40 transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-[11px] font-bold text-orange-900 uppercase tracking-widest">
              Clinical Nutrition Portal
            </span>
          </div>
          <h2 className="text-3xl font-serif font-black text-stone-900 tracking-tight">
            NutriSnap
          </h2>
          <p className="text-stone-500 text-xs md:text-sm mt-1">
            {isSignUp 
              ? `Clinical Nutrition Assessment & Intake (Step ${signUpStep} of 5)`
              : 'Sign in to access your personalized nutrition workspace'
            }
          </p>
          
          {/* Progress bar for 5-step onboarding */}
          {isSignUp && (
            <div className="mt-5 space-y-2">
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 via-orange-600 to-pink-500 h-full transition-all duration-500 ease-out rounded-full" 
                  style={{ width: `${(signUpStep / 5) * 100}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
                <span className={signUpStep >= 1 ? 'text-orange-600' : ''}>1. Identity</span>
                <span className={signUpStep >= 2 ? 'text-orange-600' : ''}>2. Anthropometrics</span>
                <span className={signUpStep >= 3 ? 'text-orange-600' : ''}>3. Weight Goals</span>
                <span className={signUpStep >= 4 ? 'text-orange-600' : ''}>4. Clinical</span>
                <span className={signUpStep >= 5 ? 'text-orange-600' : ''}>5. Lifestyle</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-900 border border-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── SIGN IN VIEW ────────────────────────────────────────────── */}
        {!isSignUp && (
          <form onSubmit={handleSignIn} className="space-y-5 max-w-md mx-auto">
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                Email Address
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm"
                placeholder="patient@example.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-black rounded-xl shadow-md shadow-stone-900/10 transition-all disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In to Portal'}
            </button>

            {/* Quick Demo Access Box */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-stone-500">
                  Quick Demo Testing Accounts
                </span>
                <span className="text-[10px] text-orange-600 font-bold">1-Click Auto Fill</span>
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
                  <span className="text-[10px] text-stone-500 mt-0.5">Pass: Patient123!</span>
                  <span className="text-[10px] font-bold text-orange-600 mt-2 group-hover:underline">
                    Auto-Fill & Sign In →
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
                  <span className="text-[10px] text-stone-500 mt-0.5">Pass: Admin123!</span>
                  <span className="text-[10px] font-bold text-stone-700 mt-2 group-hover:underline">
                    Auto-Fill & Sign In →
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ─── ONBOARDING STEP 1: Core Identity & Life Stage ───────────── */}
        {isSignUp && signUpStep === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                  Full Name *
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                  Mobile Number (Optional)
                </label>
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                  Email Address *
                </label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                  placeholder="priya@example.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                    placeholder="Min 6 characters"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Biological Gender & Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                  Biological Sex (Clinical Formula) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Female', 'Male', 'Other'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        gender === g 
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                  Age (Years) *
                </label>
                <input 
                  type="number" 
                  min="10"
                  max="115"
                  required
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                  placeholder="28"
                />
              </div>
            </div>

            {/* Life Stage Selection (From Assessment Sheet) */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                Life Stage & Clinical Category (From Hospital Assessment Sheet)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {LIFE_STAGES.map(stage => {
                  const isSelected = lifeStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setLifeStage(stage.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-400/40 shadow-xs' 
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-stone-900">{stage.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                      </div>
                      <p className="text-[10px] text-stone-500 leading-tight">{stage.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 mt-4 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-stone-900/10"
            >
              Continue to Anthropometrics <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ─── ONBOARDING STEP 2: Anthropometrics & Clinical BMI Gauge ─── */}
        {isSignUp && signUpStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-stone-900 flex items-center justify-center gap-2">
                <Scale className="w-5 h-5 text-orange-600" />
                Anthropometric Assessment
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Based on the clinical body composition screening standards
              </p>
            </div>

            {/* Height & Weight Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-extrabold text-stone-700">
                    Height (cm)
                  </label>
                  <span className="text-sm font-black font-mono text-stone-900">{heightCm} cm</span>
                </div>
                <input 
                  type="range"
                  min="120"
                  max="220"
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
                  <span>120 cm (3'11")</span>
                  <span>170 cm (5'7")</span>
                  <span>220 cm (7'2")</span>
                </div>
              </div>

              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-extrabold text-stone-700">
                    Current Weight (kg)
                  </label>
                  <span className="text-sm font-black font-mono text-stone-900">{currentWeightKg} kg</span>
                </div>
                <input 
                  type="range"
                  min="35"
                  max="180"
                  value={currentWeightKg}
                  onChange={e => setCurrentWeightKg(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
                  <span>35 kg</span>
                  <span>70 kg</span>
                  <span>180 kg</span>
                </div>
              </div>

              {/* Waist Circumference for Inch Loss tracking */}
              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-extrabold text-stone-700">
                    Baseline Waist Circumference (For Inch Loss Tracking)
                  </label>
                  <span className="text-sm font-black font-mono text-stone-900">
                    {waistInches} inches <span className="text-stone-400 font-normal">({Math.round(waistInches * 2.54)} cm)</span>
                  </span>
                </div>
                <input 
                  type="range"
                  min="20"
                  max="55"
                  step="0.5"
                  value={waistInches}
                  onChange={e => setWaistInches(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
                  <span>20 in (51 cm)</span>
                  <span>32 in (81 cm)</span>
                  <span>55 in (140 cm)</span>
                </div>
              </div>
            </div>

            {/* Real-Time Clinical BMI Dashboard Card */}
            <div className="p-5 rounded-3xl border border-stone-200/90 bg-stone-50/50 shadow-inner space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-stone-500">
                      Calculated Clinical BMI
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${bmiDetails.color}`}>
                      <span className={`w-2 h-2 rounded-full ${bmiDetails.dot}`} />
                      {bmiDetails.label}
                    </span>
                  </div>
                  <div className="text-3xl font-serif font-black text-stone-900 mt-1">
                    {liveBmi} <span className="text-xs font-sans font-normal text-stone-500">kg/m²</span>
                  </div>
                </div>

                {/* Broca's Ideal Body Weight Badge */}
                <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-orange-500" /> Broca's Ideal Weight (IBW)
                  </div>
                  <div className="text-lg font-black text-stone-900 mt-0.5">
                    ~{liveIBW} kg
                    <span className="text-[10px] text-stone-400 font-normal ml-1">
                      ({gender === 'Male' ? 'Ht - 100' : 'Ht - 105'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTargetWeightKg(liveIBW)}
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 mt-1.5 text-left underline"
                  >
                    Set as my target weight →
                  </button>
                </div>
              </div>

              {/* BMI Tier Standards Legend (Directly from Image 2) */}
              <div className="pt-3 border-t border-stone-200/80">
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block mb-2">
                  Clinical Classification Standards:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                  <div className="flex items-center gap-1 text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span>Underweight: <strong>&lt; 18.4</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Normal: <strong>18.5 – 24.9</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    <span>Overweight: <strong>25.0 – 29.9</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Obesity I: <strong>30.0 – 34.9</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    <span>Obesity II: <strong>35.0 – 39.9</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    <span>Morbid Obesity: <strong>&gt; 40.0</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-stone-100">
              <button 
                type="button"
                onClick={() => setSignUpStep(1)}
                className="w-1/3 py-3.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="button"
                onClick={handleStep2Next}
                className="w-2/3 py-3.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-stone-900/10"
              >
                Continue to Weight Goals <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── ONBOARDING STEP 3: Specific Weight Management Goals ─────── */}
        {isSignUp && signUpStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-stone-900 flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Weight Management Strategy
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Define your primary goal, target numbers, and specific focus areas
              </p>
            </div>

            {/* Primary Direction Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-2">
                1. Primary Weight Direction *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WEIGHT_PRIMARY_GOALS.map(item => {
                  const isSelected = weightPrimaryGoal === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWeightPrimaryGoal(item.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400/40 shadow-xs' 
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-stone-900">{item.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Weight & Live Delta Indicator */}
            <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-stone-700">
                  2. Target Goal Weight (kg) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black font-mono text-stone-900">{targetWeightKg} kg</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    weightDiff > 0 ? 'text-orange-700 bg-orange-50 border-orange-200' :
                    weightDiff < 0 ? 'text-blue-700 bg-blue-50 border-blue-200' :
                    'text-stone-700 bg-stone-100 border-stone-200'
                  }`}>
                    {weightDiff > 0 ? `-${weightDiff} kg to lose` :
                     weightDiff < 0 ? `+${Math.abs(weightDiff)} kg to gain` :
                     'Maintain current weight'}
                  </span>
                </div>
              </div>
              <input 
                type="range"
                min="35"
                max="150"
                value={targetWeightKg}
                onChange={e => setTargetWeightKg(Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>Current: {currentWeightKg} kg</span>
                <span>Broca's IBW: ~{liveIBW} kg</span>
                <span>Max Target: 150 kg</span>
              </div>
            </div>

            {/* Target Pace */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-2">
                3. Desired Target Pace *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {WEIGHT_PACES.map(p => {
                  const isSelected = weightPace === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setWeightPace(p.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs' 
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {p.badge}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                      </div>
                      <span className="font-bold text-xs mt-1 leading-snug">{p.label}</span>
                      <p className={`text-[10px] mt-1 leading-tight ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {p.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Focus Chips (Crucial for weight management) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-stone-600">
                  4. Specific Weight Management Focus Areas (Pick All That Apply) *
                </label>
                <span className="text-[10px] text-stone-400">Multi-select</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEIGHT_FOCUS_AREAS.map(area => {
                  const isSelected = selectedFocusAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleFocusArea(area)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs' 
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-stone-100">
              <button 
                type="button"
                onClick={() => setSignUpStep(2)}
                className="w-1/3 py-3.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="button"
                onClick={handleStep3Next}
                className="w-2/3 py-3.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-stone-900/10"
              >
                Continue to Clinical Screening <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── ONBOARDING STEP 4: Clinical Screening & Medical History ─── */}
        {isSignUp && signUpStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-stone-900 flex items-center justify-center gap-2">
                <Stethoscope className="w-5 h-5 text-orange-600" />
                Medical Screening & History
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Exact clinical categories from the hospital assessment protocol
              </p>
            </div>

            {/* Medical History Checklist from Image 1 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider font-extrabold text-stone-600">
                  Pre-existing Conditions & Medical History (From Sheet)
                </label>
                <span className="text-[10px] text-stone-400">Select any that apply</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MEDICAL_CONDITIONS.map(cond => {
                  const isSelected = selectedConditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diagnosis / Recent Procedures (From Sheet e.g. Post CABG, Surgery) */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5">
                Diagnosis or Past Surgical Procedure (Optional)
              </label>
              <input 
                type="text" 
                value={diagnosisOrProcedure}
                onChange={e => setDiagnosisOrProcedure(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                placeholder="e.g. Post-CABG, TURP, Gallbladder removal, Thyroidectomy"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Helps your dietician prescribe safe post-surgical sodium, fiber, and protein adjustments.
              </span>
            </div>

            {/* Food Allergy Screening (From Sheet: No vs Yes) */}
            <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-extrabold text-stone-700 block">
                    Food Allergy Screening
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Do you experience any food allergies, celiac disease, or intolerances?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasAllergies(false);
                      setSelectedAllergies([]);
                      setCustomAllergy('');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      !hasAllergies 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-stone-600 border-stone-200'
                    }`}
                  >
                    No Allergies
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasAllergies(true)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      hasAllergies 
                        ? 'bg-rose-600 text-white border-rose-600' 
                        : 'bg-white text-stone-600 border-stone-200'
                    }`}
                  >
                    Yes, Specify
                  </button>
                </div>
              </div>

              {hasAllergies && (
                <div className="pt-3 border-t border-stone-200/80 space-y-2.5">
                  <span className="text-[11px] font-bold text-stone-700 block">
                    Select Allergen Categories:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALLERGEN_OPTIONS.map(alg => {
                      const isSel = selectedAllergies.includes(alg);
                      return (
                        <button
                          key={alg}
                          type="button"
                          onClick={() => toggleAllergy(alg)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                            isSel 
                              ? 'bg-rose-50 border-rose-400 text-rose-800' 
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          {isSel && <Check className="w-3 h-3 text-rose-600" />}
                          {alg}
                        </button>
                      );
                    })}
                  </div>

                  <input 
                    type="text" 
                    value={customAllergy}
                    onChange={e => setCustomAllergy(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-xs outline-none focus:border-rose-500"
                    placeholder="Other specific allergies (e.g. Mushrooms, Sesame, Mustard)"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-stone-100">
              <button 
                type="button"
                onClick={() => setSignUpStep(3)}
                className="w-1/3 py-3.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="button"
                onClick={handleStep4Next}
                className="w-2/3 py-3.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-stone-900/10"
              >
                Continue to Lifestyle & Preferences <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── ONBOARDING STEP 5: Dietary Preferences & Occupation ─────── */}
        {isSignUp && signUpStep === 5 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-stone-900 flex items-center justify-center gap-2">
                <Leaf className="w-5 h-5 text-orange-600" />
                Dietary Pattern & Daily Routine
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Finalizing your profile to design your meal plan and caloric baseline
              </p>
            </div>

            {/* Food Preference (from Sheet) */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-2">
                Food Preference (From Sheet) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FOOD_PREFERENCES.map(pref => {
                  const isSelected = dietaryType === pref.id;
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => setDietaryType(pref.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400/40' 
                          : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-orange-600 bg-orange-600' : 'border-stone-300'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">{pref.label}</span>
                        <span className="text-[10px] text-stone-500 leading-tight block">{pref.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Occupation (from Sheet) */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-2">
                Occupation (From Sheet) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {OCCUPATIONS.map(occ => {
                  const isSelected = occupation === occ.id;
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setOccupation(occ.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected 
                          ? 'border-stone-900 bg-stone-900 text-white' 
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <span className="font-bold text-xs block mb-0.5">{occ.label}</span>
                      <span className={`text-[10px] block leading-tight ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {occ.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Activity Level */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-2">
                Daily Physical Activity Level *
              </label>
              <select 
                value={activityLevel}
                onChange={e => setActivityLevel(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-xs font-semibold"
              >
                <option value="Sedentary">Sedentary (Desk Job, minimal daily movement, &lt; 3000 steps)</option>
                <option value="Light">Lightly Active (1–3 days light exercise/walks per week)</option>
                <option value="Moderate">Moderately Active (3–5 days workout/sports per week)</option>
                <option value="High">Very Active (Heavy training 6+ days or physically demanding labor)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-3 border-t border-stone-100">
              <button 
                type="button"
                onClick={() => setSignUpStep(4)}
                className="w-1/3 py-3.5 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="w-2/3 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-pink-600 hover:brightness-105 text-white text-xs uppercase tracking-widest font-black rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Dossier...' : 'Complete Intake & Launch Portal'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ─── TOGGLE BETWEEN LOGIN & SIGN UP ─────────────────────────── */}
        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-500 mb-1.5">
            {isSignUp ? 'Already registered with a clinical file?' : 'Need to register as a new patient?'}
          </p>
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setSignUpStep(1);
              setError('');
            }} 
            className="text-xs uppercase tracking-widest text-orange-600 hover:text-orange-700 font-extrabold transition-colors underline"
          >
            {isSignUp ? 'Sign In to Existing Account' : 'Start Clinical Intake Survey'}
          </button>
        </div>

      </div>
    </div>
  );
}
