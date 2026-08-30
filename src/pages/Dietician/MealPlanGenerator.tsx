import { useState, useEffect } from 'react';
import { getPatients, PatientProfile, MealPlan, saveMealPlan } from '../../services/db';
import { Loader2, Wand2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MealPlanGenerator() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  const [targets, setTargets] = useState({ calories: 2000, protein: 120, carbs: 200, fat: 60 });
  const [instructions, setInstructions] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const pts = await getPatients();
      setPatients(pts);
    }
    load();
  }, []);

  const handleGenerate = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient first.');
      return;
    }
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    setGenerating(true);
    setGeneratedPlan(null);
    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile: patient,
          targets,
          instructions
        })
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setGeneratedPlan(data);
    } catch (e) {
      console.error(e);
      alert('Failed to generate meal plan. The AI might be overloaded or returning invalid JSON.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPlan || !selectedPatientId) return;
    setSaving(true);
    try {
      const newPlan: MealPlan = {
        patientId: selectedPatientId,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
        status: 'draft',
        targets,
        days: generatedPlan,
        createdAt: new Date()
      };
      await saveMealPlan(newPlan);
      alert('Meal plan saved successfully!');
      navigate(`/dietician/patients/${selectedPatientId}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save meal plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Meal Plan Generator</h1>
        <p className="text-stone-500 text-sm mt-1">Generate AI meal plans strictly referencing your Knowledge Base recipes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-stone-200 p-6">
            <h3 className="font-bold text-stone-900 mb-4">Patient Selection</h3>
            <select 
              value={selectedPatientId} 
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-stone-900"
            >
              <option value="">Select a patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.dietaryType})</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-stone-200 p-6 space-y-4">
            <h3 className="font-bold text-stone-900">Macros & Targets</h3>
            <div>
              <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Calories (kcal)</label>
              <input type="number" value={targets.calories} onChange={e => setTargets({...targets, calories: Number(e.target.value)})} className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-stone-900" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Protein (g)</label>
                <input type="number" value={targets.protein} onChange={e => setTargets({...targets, protein: Number(e.target.value)})} className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-stone-900" />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Carbs (g)</label>
                <input type="number" value={targets.carbs} onChange={e => setTargets({...targets, carbs: Number(e.target.value)})} className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-stone-900" />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Fat (g)</label>
                <input type="number" value={targets.fat} onChange={e => setTargets({...targets, fat: Number(e.target.value)})} className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-stone-900" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6">
            <h3 className="font-bold text-stone-900 mb-4">Additional Instructions</h3>
            <textarea 
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="E.g., High fiber, avoid nuts, use easy recipes..."
              className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-stone-900 h-24 resize-none"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={generating || !selectedPatientId}
            className="w-full py-4 bg-brand-600 text-white font-bold tracking-widest uppercase text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {generating && (
            <div className="h-64 border border-dashed border-stone-300 flex items-center justify-center text-stone-500 flex-col gap-4 bg-white">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <p>AI is assembling a 7-day meal plan from your knowledge base...</p>
            </div>
          )}

          {!generating && !generatedPlan && (
            <div className="h-64 border border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-white">
              Select a patient and click Generate to see the plan here.
            </div>
          )}

          {!generating && generatedPlan && (
            <div className="bg-white border border-stone-200">
              <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                <h3 className="font-bold text-stone-900">7-Day Meal Plan Preview</h3>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Plan
                </button>
              </div>
              <div className="p-6 space-y-8 max-h-[800px] overflow-y-auto">
                {generatedPlan.map((day: any) => (
                  <div key={day.dayNumber}>
                    <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2 mb-4">Day {day.dayNumber}</h4>
                    <div className="space-y-4">
                      {day.meals.map((meal: any, idx: number) => (
                        <div key={idx} className="p-4 bg-stone-50 border border-stone-100">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{meal.type}</span>
                              <h5 className="font-bold text-stone-900">{meal.name}</h5>
                            </div>
                            <div className="text-right text-xs text-stone-500 font-medium">
                              {meal.calories} kcal • P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                            </div>
                          </div>
                          <p className="text-sm text-stone-600 mb-2"><strong>Ingredients:</strong> {meal.ingredients.join(', ')}</p>
                          <p className="text-sm text-stone-600"><strong>Recipe:</strong> {meal.recipe.join(' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
