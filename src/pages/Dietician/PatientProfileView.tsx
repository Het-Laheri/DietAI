import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getPatientProfile, 
  getMealPlans, 
  saveMealPlan, 
  getProgressRecords, 
  getAllFoodLogsForPatient,
  PatientProfile, 
  MealPlan, 
  ProgressRecord,
  FoodLog 
} from '../../services/db';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Loader2, 
  Target, 
  Droplets, 
  Phone, 
  Utensils, 
  Sparkles, 
  Clock,
  Dna,
  Wheat,
  Droplet
} from 'lucide-react';

export default function PatientProfileView() {
  const { id } = useParams();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      if (id) {
        const [p, plans, prog, logs] = await Promise.all([
          getPatientProfile(id),
          getMealPlans(id),
          getProgressRecords(id),
          getAllFoodLogsForPatient(id)
        ]);
        setProfile(p);
        setMealPlans(plans);
        setProgress(prog);
        setFoodLogs(logs);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleGenerateAIPlan = async () => {
    if (!profile) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile: profile,
          targets: { calories: 1500, protein: 80, carbs: 150, fat: 50 },
          instructions: 'Focus on high fiber and easy to prepare meals.'
        })
      });
      const data = await res.json();
      
      const newPlan: MealPlan = {
        patientId: profile.id,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
        status: 'draft',
        targets: { calories: 1500, protein: 80, carbs: 150, fat: 50 },
        days: data,
        createdAt: new Date()
      };
      
      await saveMealPlan(newPlan);
      // reload plans
      const plans = await getMealPlans(profile.id);
      setMealPlans(plans);
      alert('AI Meal Plan Generated as Draft!');
    } catch (err) {
      alert('Failed to generate plan.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!profile) return <div className="p-8">Patient not found.</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = foodLogs.filter(l => l.date === todayStr);
  const todayCalories = todayLogs.reduce((sum, l) => sum + (Number(l.nutrition?.calories) || 0), 0);
  const activePlan = mealPlans.find(p => p.status === 'published') || mealPlans[0];
  const targetCalories = activePlan?.targets?.calories || 2000;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link to="/dietician/patients" className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 mb-6 w-max">
        <ChevronLeft className="w-4 h-4" />
        Back to Patients
      </Link>

      {/* Patient Header Card */}
      <div className="bg-white border border-stone-200 p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-2xl font-bold text-brand-700">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 flex flex-wrap items-center gap-2">
              {profile.name}
              {profile.whatsappNumber && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 border border-emerald-200 rounded-full flex items-center gap-1 font-medium font-mono">
                  <Phone className="w-3 h-3 text-emerald-600" /> WhatsApp: +{profile.whatsappNumber}
                </span>
              )}
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">{profile.email} • {profile.dietaryType} • {profile.activityLevel || 'Moderate'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateAIPlan}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white rounded-none font-bold text-xs uppercase tracking-wider hover:bg-brand-800 transition-colors disabled:opacity-50 shadow-sm"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Generate AI Meal Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Dossier Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-700" />
              Clinical Dossier
            </h3>
            
            <div className="space-y-3 divide-y divide-stone-100 text-xs">
              <div className="pt-2 first:pt-0">
                <span className="text-stone-500 font-bold block mb-1">Clinical Goals & Specifics</span>
                {profile.goals?.length ? (
                  <div className="space-y-1.5">
                    {profile.goals.map(g => (
                      <div key={g} className="bg-stone-50 p-2 border border-stone-200">
                        <p className="font-bold text-brand-900">{g}</p>
                        {profile.goalDetails && profile.goalDetails[g]?.length ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.goalDetails[g].map(det => (
                              <span key={det} className="px-1.5 py-0.5 bg-white border border-stone-300 text-stone-700 text-[10px]">
                                {det}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="font-medium text-stone-900">General Wellness & Optimization</span>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-stone-500">Current Weight</span>
                <span className="font-bold text-stone-900">{profile.currentWeightKg || 70} kg</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-stone-500">Target Weight</span>
                <span className="font-bold text-stone-900">{profile.targetWeightKg || 70} kg</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-stone-500">Health Conditions</span>
                <span className="font-medium text-stone-900 text-right">{profile.healthInfo?.conditions || 'None'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-stone-500">Allergies</span>
                <span className="font-medium text-stone-900 text-right">{profile.healthInfo?.allergies || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Today's Intake Widget for Dietician */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-700 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-700" />
              Today's Calorie Tracker
            </h3>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-2xl font-serif font-bold text-stone-900">{todayCalories}</span>
              <span className="text-xs text-stone-500">/ {targetCalories} kcal goal</span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(Math.round((todayCalories / targetCalories) * 100), 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              {todayLogs.length} meals logged today by patient.
            </p>
          </div>
        </div>

        {/* Right Column: Meal Plans & Scanned Food Logs */}
        <div className="md:col-span-2 space-y-8">
          {/* ─── LOGGED MEALS & FOOD SCANNER RECORDS ─────────────────────── */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-stone-200 mb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-brand-700" />
                  Logged Meals & AI Food Scans
                </h3>
                <p className="text-xs text-stone-500">Patient's meal photo uploads, quantities, and macronutrient data</p>
              </div>
              <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold rounded-sm">
                {foodLogs.length} Total Logs
              </span>
            </div>

            {foodLogs.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                No food logs or meal scans recorded by this patient yet.
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-stone-100">
                {foodLogs.map(log => (
                  <div key={log.id} className="pt-4 first:pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {log.imageUrl ? (
                          <div className="w-16 h-16 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                            <img src={log.imageUrl} alt="Logged Meal" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shrink-0">
                            <Utensils className="w-5 h-5" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 text-stone-800 text-[10px] font-bold uppercase tracking-wider">
                              {log.mealType || 'Meal'}
                            </span>
                            {log.source === 'scanner' && (
                              <span className="px-2 py-0.5 bg-brand-50 text-brand-800 border border-brand-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> AI Scan
                              </span>
                            )}
                            <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {log.date}
                            </span>
                          </div>

                          <h4 className="font-bold text-stone-900 text-sm">{log.description}</h4>

                          {log.userNotes && (
                            <p className="text-xs text-stone-600 bg-amber-50/70 p-2 border border-amber-200 mt-1.5 italic">
                              <strong>Patient Preparation Note:</strong> "{log.userNotes}"
                            </p>
                          )}

                          {log.items && log.items.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {log.items.map((item, i) => (
                                <span key={i} className="text-[11px] px-2 py-0.5 bg-stone-50 border border-stone-200 text-stone-700">
                                  {item.name} <strong className="text-stone-900">({item.portion})</strong> • {item.calories} kcal
                                </span>
                              ))}
                            </div>
                          )}

                          {log.insight && (
                            <p className="text-xs text-brand-800 mt-2 bg-brand-50/50 p-2 border border-brand-200">
                              💡 <strong>AI Clinical Note:</strong> {log.insight}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Calorie & Macro Pills */}
                      <div className="text-right shrink-0">
                        <span className="px-3 py-1 bg-stone-900 text-white font-bold text-xs rounded-sm inline-block">
                          {log.nutrition?.calories || 0} kcal
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1.5 justify-end">
                          <span>P: <strong className="text-stone-800">{log.nutrition?.protein || 0}g</strong></span>
                          <span>C: <strong className="text-stone-800">{log.nutrition?.carbs || 0}g</strong></span>
                          <span>F: <strong className="text-stone-800">{log.nutrition?.fat || 0}g</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── MEAL PLANS SECTION ──────────────────────────────────────── */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-stone-400" />
              Assigned Meal Plans
            </h3>
            {mealPlans.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">No meal plans generated yet.</div>
            ) : (
              <div className="space-y-3">
                {mealPlans.map(plan => (
                  <div key={plan.id} className="border border-stone-200 p-4 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-stone-900 text-sm">{plan.startDate} to {plan.endDate}</div>
                      <div className="text-xs text-stone-500">{plan.targets.calories} kcal/day • Status: <span className="uppercase font-bold text-brand-800">{plan.status}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── PATIENT PROGRESS & BIOMETRICS ───────────────────────────── */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-stone-400" />
              Patient Biometrics & Water Progress
            </h3>
            {progress.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">No progress records logged yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {progress.map(rec => (
                  <div key={rec.id} className="border border-stone-200 p-3 bg-[#FCFBF9]">
                    <p className="text-[10px] text-stone-400 mb-1.5 font-bold uppercase tracking-wider">{rec.date}</p>
                    <div className="flex justify-between items-end text-xs mb-1">
                      <span className="text-stone-500">Weight</span>
                      <span className="font-bold text-stone-900">{rec.weightKg} kg</span>
                    </div>
                    <div className="flex justify-between items-end text-xs mb-1">
                      <span className="text-stone-500 flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-500"/> Water</span>
                      <span className="font-bold text-stone-900">{rec.waterLiters}L</span>
                    </div>
                    <div className="flex justify-between items-end text-xs">
                      <span className="text-stone-500">Adherence</span>
                      <span className="font-bold text-green-700">{rec.adherencePercentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
