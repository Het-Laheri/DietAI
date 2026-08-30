import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatientProfile, getMealPlans, saveMealPlan, getProgressRecords, PatientProfile, MealPlan, ProgressRecord } from '../../services/db';
import { ChevronLeft, Calendar, User, Loader2, Target, Droplets, Phone } from 'lucide-react';

export default function PatientProfileView() {
  const { id } = useParams();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      if (id) {
        const p = await getPatientProfile(id);
        const plans = await getMealPlans(id);
        const prog = await getProgressRecords(id);
        setProfile(p);
        setMealPlans(plans);
        setProgress(prog);
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link to="/dietician/patients" className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 mb-6 w-max">
        <ChevronLeft className="w-4 h-4" />
        Back to Patients
      </Link>

      <div className="bg-white rounded-none  border border-stone-100 p-6 mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-brand-700">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              {profile.name}
              {profile.whatsappNumber && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 border border-emerald-200 rounded-full flex items-center gap-1 font-medium font-mono">
                  <Phone className="w-3 h-3 text-emerald-600" /> WhatsApp: +{profile.whatsappNumber}
                </span>
              )}
            </h1>
            <p className="text-stone-500">{profile.email} • {profile.dietaryType}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateAIPlan}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-none font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Generate AI Meal Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-none  border border-stone-100 p-6">
            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-stone-400" />
              Profile details
            </h3>
              <div className="space-y-2 pb-2 border-b border-stone-100">
                <span className="text-stone-500 font-medium block">Clinical Goals & Specifics</span>
                {profile.goals?.length ? (
                  <div className="space-y-2">
                    {profile.goals.map(g => (
                      <div key={g} className="bg-stone-50 p-2.5 border border-stone-200 text-xs">
                        <p className="font-bold text-brand-900 mb-1">{g}</p>
                        {profile.goalDetails && profile.goalDetails[g]?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.goalDetails[g].map(det => (
                              <span key={det} className="px-2 py-0.5 bg-white border border-stone-300 text-stone-700 font-medium">
                                {det}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">General clinical care</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="font-medium text-stone-900">General Wellness & Optimization</span>
                )}
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-stone-500">Health Conditions</span>
                <span className="font-medium text-stone-900 text-right">{profile.healthInfo?.conditions || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Allergies</span>
                <span className="font-medium text-stone-900 text-right">{profile.healthInfo?.allergies || 'None'}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-none  border border-stone-100 p-6">
            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-stone-400" />
              Meal Plans
            </h3>
            {mealPlans.length === 0 ? (
              <div className="text-center py-8 text-stone-500">No meal plans yet.</div>
            ) : (
              <div className="space-y-4">
                {mealPlans.map(plan => (
                  <div key={plan.id} className="border border-stone-200 rounded-none p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-stone-900">{plan.startDate} to {plan.endDate}</div>
                      <div className="text-sm text-stone-500">{plan.targets.calories} kcal/day • {plan.status}</div>
                    </div>
                    <button className="text-sm font-medium text-brand-600 hover:underline">View</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-none  border border-stone-100 p-6 mt-8">
            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-stone-400" />
              Patient Progress
            </h3>
            {progress.length === 0 ? (
              <div className="text-center py-8 text-stone-500">No progress logged yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {progress.map(rec => (
                  <div key={rec.id} className="border border-stone-200 p-4">
                    <p className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-wider">{rec.date}</p>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-stone-500 text-sm">Weight</span>
                      <span className="font-bold text-stone-900">{rec.weightKg} kg</span>
                    </div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-stone-500 text-sm flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-500"/> Water</span>
                      <span className="font-bold text-stone-900">{rec.waterLiters}L</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-stone-500 text-sm">Adherence</span>
                      <span className="font-bold text-green-600">{rec.adherencePercentage}%</span>
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
