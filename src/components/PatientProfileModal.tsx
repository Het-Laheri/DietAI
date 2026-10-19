import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Scale, 
  Target, 
  Heart, 
  Sparkles, 
  Check, 
  Plus, 
  ShieldCheck, 
  TrendingDown, 
  Activity, 
  Apple, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import {
  PatientProfile,
  PatientLabBiomarkers,
  updatePatientProfile,
  saveProgressRecord,
  getPatientProfile,
  CLINICAL_BIOMARKER_DEFINITIONS,
  validateLabBiomarkers,
  BiomarkerKey
} from '../services/db';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onProfileUpdated?: (updated: PatientProfile) => void;
  onOpenChangePassword?: () => void;
}

const PRESET_GOALS = [
  'Weight Loss & Fat Reduction',
  'Visceral & Belly Fat Reduction',
  'Preventing Weight Rebound (Anti-Yo-Yo)',
  'Metabolic Health',
  'Muscle Tone & Strength',
  'Healthy Blood Pressure',
  'Blood Sugar Stabilization',
  'Gut Health & Digestion',
  'PCOD / Hormonal Balance',
  'Thyroid Support'
];

const DIETARY_TYPES = [
  'Vegetarian',
  'Eggetarian',
  'Non-Vegetarian',
  'Vegan',
  'Jain',
  'Pescatarian'
];

const ACTIVITY_LEVELS = [
  'Sedentary',
  'Light',
  'Moderate',
  'High',
  'Athlete'
];

const TARGET_PACES = [
  'Steady & Sustainable (0.5 kg / week)',
  'Gentle & Gradual (0.25 kg / week)',
  'Accelerated Clinical (0.75 kg / week)',
  'Weight Maintenance (0.0 kg / week)'
];

export default function PatientProfileModal({ isOpen, onClose, patientId, onProfileUpdated, onOpenChangePassword }: PatientProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('Female');
  const [occupation, setOccupation] = useState('');

  // Anthropometrics
  const [heightCm, setHeightCm] = useState<number | ''>(165);
  const [currentWeightKg, setCurrentWeightKg] = useState<number | ''>(68);
  const [targetWeightKg, setTargetWeightKg] = useState<number | ''>(60);
  const [waistCm, setWaistCm] = useState<number | ''>(81);
  const [inchLoss, setInchLoss] = useState<number | ''>(0);
  const [targetPace, setTargetPace] = useState(TARGET_PACES[0]);
  const [recordNewWeighIn, setRecordNewWeighIn] = useState(true);

  // Lifestyle & Goals
  const [dietaryType, setDietaryType] = useState('Vegetarian');
  const [activityLevel, setActivityLevel] = useState('Moderate');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoalInput, setCustomGoalInput] = useState('');

  // Medical & Health info
  const [conditions, setConditions] = useState('None / Healthy');
  const [allergies, setAllergies] = useState('None');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');

  // 13 Clinical Biomarkers
  const [biomarkerInputs, setBiomarkerInputs] = useState<Record<BiomarkerKey, string>>(() => {
    const init = {} as Record<BiomarkerKey, string>;
    for (const def of CLINICAL_BIOMARKER_DEFINITIONS) {
      init[def.key] = '';
    }
    return init;
  });
  const [unavailableBiomarkers, setUnavailableBiomarkers] = useState<BiomarkerKey[]>([]);
  const [biomarkerErrors, setBiomarkerErrors] = useState<Partial<Record<BiomarkerKey, string>>>({});
  const [labTestDate, setLabTestDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [labNotes, setLabNotes] = useState<string>('');
  const [existingLabHistory, setExistingLabHistory] = useState<PatientLabBiomarkers[]>([]);

  // Initial load
  useEffect(() => {
    if (!isOpen || !patientId) return;

    let isMounted = true;
    setLoading(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    setBiomarkerErrors({});

    getPatientProfile(patientId).then(profile => {
      if (!isMounted) return;
      if (profile) {
        setName(profile.name || '');
        setMobile(profile.mobile || '');
        setAge(profile.age || 29);
        setGender(profile.gender || 'Female');
        setOccupation(profile.occupation || '');

        setHeightCm(profile.heightCm || 165);
        setCurrentWeightKg(profile.currentWeightKg || 68);
        setTargetWeightKg(profile.targetWeightKg || 60);
        setWaistCm(profile.waistCm || 81);
        setInchLoss(profile.inchLoss ?? (profile.initialWaistCm && profile.waistCm ? Number(((profile.initialWaistCm - profile.waistCm) / 2.54).toFixed(1)) : 0));
        setTargetPace(profile.weightManagement?.targetPace || TARGET_PACES[0]);

        setDietaryType(profile.dietaryType || 'Vegetarian');
        setActivityLevel(profile.activityLevel || 'Moderate');

        const initialGoals = profile.goals && profile.goals.length > 0 
          ? profile.goals 
          : profile.weightManagement?.specificFocus || ['Weight Loss & Fat Reduction', 'Metabolic Health'];
        setSelectedGoals(initialGoals);

        setConditions(profile.healthInfo?.conditions || (profile.medicalHistory ? profile.medicalHistory.join(', ') : 'None / Healthy'));
        setAllergies(profile.healthInfo?.allergies || (profile.allergies ? profile.allergies.join(', ') : 'None'));
        setMedications(profile.healthInfo?.medications || '');
        setNotes(profile.healthInfo?.notes || '');

        const labs = profile.labBiomarkers || {};
        const nextInputs = {} as Record<BiomarkerKey, string>;
        for (const def of CLINICAL_BIOMARKER_DEFINITIONS) {
          const val = (labs as any)[def.key];
          nextInputs[def.key] = typeof val === 'number' && Number.isFinite(val) ? String(val) : '';
        }
        setBiomarkerInputs(nextInputs);
        setUnavailableBiomarkers(Array.isArray(labs.unavailableBiomarkers) ? labs.unavailableBiomarkers : []);
        setLabTestDate(labs.testDate || new Date().toISOString().split('T')[0]);
        setLabNotes(labs.notes || '');
        setExistingLabHistory(Array.isArray(profile.labHistory) ? profile.labHistory : []);
      }
      setLoading(false);
    }).catch(err => {
      if (isMounted) {
        console.warn('Error loading patient profile:', err);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  // Real-time calculated clinical metrics
  const hNum = Number(heightCm) || 165;
  const wNum = Number(currentWeightKg) || 68;
  const tNum = Number(targetWeightKg) || 60;

  const heightM = hNum / 100;
  const calculatedBmi = Number((wNum / (heightM * heightM)).toFixed(1));
  
  let bmiClass = 'Normal (18.5 - 24.9)';
  if (calculatedBmi < 18.5) bmiClass = 'Underweight (< 18.5)';
  else if (calculatedBmi >= 25 && calculatedBmi < 30) bmiClass = 'Overweight (25 - 29.9)';
  else if (calculatedBmi >= 30) bmiClass = 'Obese (≥ 30)';

  // Broca's Ideal Body Weight index (Height in cm - 100)
  const brocaIbw = Math.round(hNum - 100);
  const weightDifference = Number((wNum - tNum).toFixed(1));

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleAddCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customGoalInput.trim();
    if (trimmed && !selectedGoals.includes(trimmed)) {
      setSelectedGoals(prev => [...prev, trimmed]);
      setCustomGoalInput('');
    }
  };

  const toggleBiomarkerUnavailable = (key: BiomarkerKey) => {
    setUnavailableBiomarkers(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setBiomarkerErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const labValidation = validateLabBiomarkers(biomarkerInputs, unavailableBiomarkers, {
      testDate: labTestDate,
      notes: labNotes
    });
    if (!labValidation.valid) {
      setBiomarkerErrors(labValidation.errors);
      setErrorMessage(Object.values(labValidation.errors)[0] || 'Please fix the highlighted biomarker values.');
      return;
    }
    setBiomarkerErrors({});

    setSaving(true);
    setErrorMessage(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const nextLabs: PatientLabBiomarkers = {
      ...labValidation.sanitized,
      testDate: labValidation.sanitized.testDate || todayStr
    };
    const nextLabHistory = labValidation.measuredCount > 0
      ? [
          ...existingLabHistory.filter(h => h.testDate !== nextLabs.testDate),
          nextLabs
        ].sort((a, b) => (a.testDate || '').localeCompare(b.testDate || ''))
      : existingLabHistory;

    const updatedProfileData: Partial<PatientProfile> = {
      name: name.trim(),
      mobile: mobile.trim(),
      age: Number(age) || undefined,
      gender,
      occupation: occupation.trim(),
      heightCm: hNum,
      currentWeightKg: wNum,
      targetWeightKg: tNum,
      waistCm: Number(waistCm) || undefined,
      inchLoss: Number(inchLoss) || 0,
      idealBodyWeightKg: brocaIbw,
      bmi: calculatedBmi,
      bmiClassification: bmiClass,
      weightManagement: {
        primaryGoal: selectedGoals[0] || 'Weight Loss & Fat Reduction',
        targetPace,
        specificFocus: selectedGoals,
        targetDifferenceKg: Math.abs(weightDifference),
        inchLoss: Number(inchLoss) || 0
      },
      goals: selectedGoals,
      dietaryType,
      activityLevel,
      healthInfo: {
        conditions: conditions.trim() || 'None / Healthy',
        allergies: allergies.trim() || 'None',
        medications: medications.trim(),
        notes: notes.trim()
      },
      medicalHistory: conditions.trim() ? [conditions.trim()] : ['None / Healthy'],
      allergies: allergies.trim() ? [allergies.trim()] : ['None'],
      labBiomarkers: nextLabs,
      labHistory: nextLabHistory,
      onboardingCompleted: true
    };

    try {
      // 1. Update patient profile
      const ok = await updatePatientProfile(patientId, updatedProfileData);
      if (!ok) {
        throw new Error('Could not save profile updates to the database.');
      }

      // 2. If record weigh-in is checked, add to progress records
      if (recordNewWeighIn) {
        await saveProgressRecord({
          patientId,
          date: todayStr,
          weightKg: wNum,
          waterLiters: 2.0,
          adherencePercentage: 100
        });
      }

      setSaveSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfileData as PatientProfile);
      }

      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving profile changes:', err);
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-stone-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {name?.charAt(0) || 'P'}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Clinical Health Profile & Metrics
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Live Synced
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Update your biometric metrics, target goals, and lifestyle details
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center text-stone-400 text-sm">
              Loading your clinical metrics...
            </div>
          ) : (
            <form id="profileForm" onSubmit={handleSave} className="space-y-6">
              {/* Alert or confirmation */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Your metrics were updated and synced with your dietician's clinical dossier!</span>
                </div>
              )}

              {/* ─── SECTION 1: ANTHROPOMETRICS & WEIGHT TRACKING ─────────────────── */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-brand-700" />
                    Anthropometrics & Weight Target
                  </h3>
                  <span className="text-[11px] font-semibold text-stone-500">
                    Broca IBW: ~{brocaIbw} kg
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Current Weight */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Current Weight (kg)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={currentWeightKg}
                      onChange={e => setCurrentWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  {/* Target Goal Weight */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Target Goal Weight (kg)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={targetWeightKg}
                      onChange={e => setTargetWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Height (cm)
                    </label>
                    <input 
                      type="number" 
                      step="0.5"
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  {/* Waist Circumference */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Waist Circumference (cm)
                    </label>
                    <input 
                      type="number" 
                      step="0.5"
                      value={waistCm}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setWaistCm(val);
                      }}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. 81"
                    />
                  </div>

                  {/* Inch Loss */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Cumulative Inch Loss (inches)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={inchLoss}
                      onChange={e => setInchLoss(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm font-bold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. 2.5"
                    />
                  </div>
                </div>

                {/* Real-time calculated indicators */}
                <div className="mt-3 pt-3 border-t border-stone-200/80 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-stone-200">
                    <span className="block text-[10px] text-stone-400 uppercase font-semibold">Clinical BMI</span>
                    <span className="text-sm font-bold text-stone-900">{calculatedBmi}</span>
                    <span className="block text-[9px] text-stone-500 truncate">{bmiClass.split(' ')[0]}</span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-stone-200">
                    <span className="block text-[10px] text-stone-400 uppercase font-semibold">Target Goal</span>
                    <span className="text-sm font-bold text-brand-700">{targetWeightKg} kg</span>
                    <span className="block text-[9px] text-stone-500">
                      {weightDifference > 0 ? `${weightDifference} kg to lose` : weightDifference < 0 ? `${Math.abs(weightDifference)} kg to gain` : 'At Goal!'}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-stone-200">
                    <span className="block text-[10px] text-stone-400 uppercase font-semibold">Ideal Body Weight</span>
                    <span className="text-sm font-bold text-stone-900">~{brocaIbw} kg</span>
                    <span className="block text-[9px] text-stone-500">Broca Protocol</span>
                  </div>
                </div>

                {/* Target Pace & Log today's weight */}
                <div className="mt-3 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Target Pace
                    </label>
                    <select
                      value={targetPace}
                      onChange={e => setTargetPace(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      {TARGET_PACES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                      <input 
                        type="checkbox"
                        checked={recordNewWeighIn}
                        onChange={e => setRecordNewWeighIn(e.target.checked)}
                        className="rounded-sm border-stone-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                      />
                      <span>Record new weigh-in entry for today ({new Date().toISOString().split('T')[0]})</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ─── SECTION 2: HEALTH & CLINICAL FOCUS GOALS ───────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand-700" />
                    Active Health & Clinical Goals
                  </h3>
                  <span className="text-[11px] text-stone-400">Select all that apply</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_GOALS.map(goal => {
                    const active = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                          active 
                            ? 'bg-brand-50 border-brand-300 text-brand-900 font-bold shadow-2xs' 
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-brand-700" />}
                        {goal}
                      </button>
                    );
                  })}
                  {/* Any custom selected goals not in preset */}
                  {selectedGoals.filter(g => !PRESET_GOALS.includes(g)).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGoal(g)}
                      className="text-xs px-3 py-1.5 rounded-full border bg-brand-50 border-brand-300 text-brand-900 font-bold flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-brand-700" />
                      {g}
                    </button>
                  ))}
                </div>

                {/* Add custom goal */}
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text"
                    placeholder="Add custom health goal (e.g. Lower HbA1c, Increase Hydration)..."
                    value={customGoalInput}
                    onChange={e => setCustomGoalInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomGoal(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGoal}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* ─── SECTION 3: PERSONAL DEMOGRAPHICS & LIFESTYLE ───────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Mobile / WhatsApp Contact
                  </label>
                  <input 
                    type="text" 
                    value={mobile}
                    placeholder="+91..."
                    onChange={e => setMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Age (yrs)
                    </label>
                    <input 
                      type="number" 
                      value={age}
                      onChange={e => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Occupation / Work Routine
                  </label>
                  <input 
                    type="text" 
                    value={occupation}
                    placeholder="e.g. Software Engineer, Homemaker..."
                    onChange={e => setOccupation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Dietary Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Dietary Classification
                  </label>
                  <select
                    value={dietaryType}
                    onChange={e => setDietaryType(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    {DIETARY_TYPES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Physical Activity Level
                  </label>
                  <select
                    value={activityLevel}
                    onChange={e => setActivityLevel(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    {ACTIVITY_LEVELS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ─── SECTION 4: MEDICAL SCREENING & ALLERGIES ──────────────────── */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  Medical Screening, Allergies & Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Pre-existing Conditions / History
                    </label>
                    <input 
                      type="text" 
                      value={conditions}
                      placeholder="e.g. Thyroid, PCOD, None / Healthy..."
                      onChange={e => setConditions(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Food Allergies & Intolerances
                    </label>
                    <input 
                      type="text" 
                      value={allergies}
                      placeholder="e.g. Lactose, Gluten, Peanuts, None..."
                      onChange={e => setAllergies(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Special Dietary Instructions or Personal Notes
                  </label>
                  <textarea 
                    rows={2}
                    value={notes}
                    placeholder="Any notes for your dietician (e.g. prefer warm water in the morning, avoid spicy dinner)..."
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* ─── SECTION 5: 13 CLINICAL LAB BIOMARKERS PANEL ───────────────── */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200/80">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-600" />
                      13 Clinical Lab Biomarkers Panel
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                        13 Parameters
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Update your lab report numbers or mark unavailable tests as Skip / N/A.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase text-stone-500">Report Date:</label>
                    <input
                      type="date"
                      value={labTestDate}
                      onChange={e => setLabTestDate(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CLINICAL_BIOMARKER_DEFINITIONS.map(def => {
                    const isUnavailable = unavailableBiomarkers.includes(def.key);
                    const val = biomarkerInputs[def.key] ?? '';
                    const fieldErr = biomarkerErrors[def.key];
                    return (
                      <div
                        key={def.key}
                        className={`p-2.5 rounded-lg border transition-all ${
                          fieldErr
                            ? 'bg-rose-50/70 border-rose-300'
                            : isUnavailable
                            ? 'bg-stone-100/70 border-stone-200 opacity-75'
                            : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <div>
                            <label
                              htmlFor={`profile-bio-${def.key}`}
                              className="text-xs font-bold text-stone-900 block leading-tight"
                            >
                              {def.shortName}{' '}
                              <span className="text-[10px] font-semibold text-stone-500">({def.unit})</span>
                            </label>
                            <span className="text-[10px] text-stone-400 block">
                              Ref: {def.normalRange}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleBiomarkerUnavailable(def.key)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors shrink-0 ${
                              isUnavailable
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {isUnavailable ? 'N/A' : 'Skip / N/A'}
                          </button>
                        </div>
                        {isUnavailable ? (
                          <div className="text-[10px] text-stone-500 italic py-1 px-2 bg-stone-50 rounded border border-dashed border-stone-200">
                            Not available yet
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              id={`profile-bio-${def.key}`}
                              type="number"
                              step={def.step}
                              min={def.min}
                              max={def.max}
                              value={val}
                              onChange={e => {
                                const nextVal = e.target.value;
                                setBiomarkerInputs(prev => ({ ...prev, [def.key]: nextVal }));
                                if (biomarkerErrors[def.key]) {
                                  setBiomarkerErrors(prev => {
                                    const next = { ...prev };
                                    delete next[def.key];
                                    return next;
                                  });
                                }
                              }}
                              placeholder={def.placeholder}
                              className="w-full pr-12 pl-2.5 py-1 rounded border border-stone-200 bg-stone-50/60 focus:bg-white focus:border-orange-500 outline-none text-xs font-mono text-stone-900"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-stone-400 pointer-events-none">
                              {def.unit}
                            </span>
                          </div>
                        )}
                        {fieldErr && (
                          <p className="text-[10px] font-semibold text-rose-600 mt-1">{fieldErr}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Lab Report Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={labNotes}
                    onChange={e => setLabNotes(e.target.value)}
                    placeholder="e.g. Fasting 12h blood test notes..."
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Changes sync in real-time with your dietician's clinical portal.</span>
            {onOpenChangePassword && (
              <button
                type="button"
                onClick={onOpenChangePassword}
                className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-[11px] transition-colors"
              >
                <KeyRound className="w-3 h-3 text-orange-600" />
                Change Password
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="profileForm"
              disabled={saving || loading}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Updates...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Saved & Synced!
                </>
              ) : (
                'Save & Sync Profile'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
