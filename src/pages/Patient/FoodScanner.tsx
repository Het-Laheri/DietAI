import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logMeal, FoodLogItem } from '../../services/db';
import { isPatientSubscribed } from '../../services/subscription';
import SubscriptionPaywall from '../../components/SubscriptionPaywall';
import { 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  Utensils, 
  FileText, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw,
  Flame,
  Dna,
  Wheat,
  Droplet
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ScanResult {
  detectedFoods: string[];
  items: FoodLogItem[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  suggestedMealType?: string;
  insight: string;
  healthScore?: string;
}

const QUICK_NOTE_CHIPS = [
  'Cooked in 1 tbsp Olive Oil',
  'Cooked in 1 tsp Desi Ghee',
  'Home-Cooked (Low Oil)',
  'Restaurant / Takeaway',
  'Added 1 Scoop Whey Protein',
  'Low Sodium / No Extra Salt',
  'Sugar-Free / Stevia',
  'Ate Half Portion'
];

export default function FoodScanner() {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('Lunch');
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const [subscribed, setSubscribed] = useState(() => isPatientSubscribed(profile));

  useEffect(() => {
    setSubscribed(isPatientSubscribed(profile));
    const handleSubChange = () => setSubscribed(isPatientSubscribed(profile));
    window.addEventListener('nutrisnap:subscription_change', handleSubChange);
    return () => window.removeEventListener('nutrisnap:subscription_change', handleSubChange);
  }, [profile]);

  if (!subscribed) {
    return (
      <SubscriptionPaywall 
        featureName="AI Multimodal Food Scanner" 
        onUnlocked={() => setSubscribed(true)} 
      />
    );
  }

  // Determine initial meal type based on hour
  const getAutoMealType = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Breakfast';
    if (hour < 16) return 'Lunch';
    if (hour < 19) return 'Snack';
    return 'Dinner';
  };

  const handleImageChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    setLogged(false);
    setScanError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleChipClick = (chip: string) => {
    setUserNotes(prev => {
      if (prev.includes(chip)) return prev;
      return prev ? `${prev}, ${chip}` : chip;
    });
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    setScanning(true);
    setScanError(null);
    setResult(null);
    setLogged(false);

    try {
      const mimeType = file?.type || 'image/jpeg';
      const res = await fetch('/api/ai/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagePreview,
          mimeType,
          userNotes,
          patientProfile: profile ? {
            name: profile.name,
            dietaryType: (profile as any).dietaryType,
            goals: (profile as any).goals,
            healthInfo: (profile as any).healthInfo
          } : undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.details || data.error || 'Failed to analyze food photo');
      }

      setResult(data);
      if (data.suggestedMealType) {
        setSelectedMealType(data.suggestedMealType);
      } else {
        setSelectedMealType(getAutoMealType());
      }
    } catch (e: any) {
      console.error('Scan error:', e);
      setScanError(e.message || 'Failed to scan food photo. Please check your Gemini API key and try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleLog = async () => {
    if (!profile || !result) return;
    setLogging(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const description = result.items?.map(i => `${i.name} (${i.portion})`).join(', ') || result.detectedFoods.join(', ');

      const logPayload: any = {
        patientId: profile.uid,
        patientName: profile.name || 'Patient',
        date: todayStr,
        mealType: selectedMealType,
        description,
        items: result.items || [],
        nutrition: {
          calories: Number(result.nutrition?.calories) || 0,
          protein: Number(result.nutrition?.protein) || 0,
          carbs: Number(result.nutrition?.carbs) || 0,
          fat: Number(result.nutrition?.fat) || 0,
          fiber: Number(result.nutrition?.fiber) || 0
        },
        source: 'scanner'
      };

      if (userNotes && userNotes.trim()) {
        logPayload.userNotes = userNotes.trim();
      }
      if (imagePreview) {
        logPayload.imageUrl = imagePreview;
      }
      if (result.insight) {
        logPayload.insight = result.insight;
      }

      await logMeal(logPayload);
      setLogged(true);
    } catch (err: any) {
      alert(`Error saving meal log: ${err.message}`);
    } finally {
      setLogging(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImagePreview(null);
    setUserNotes('');
    setResult(null);
    setLogged(false);
    setScanError(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 bg-brand-50 border border-brand-200 text-brand-800 text-[11px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-600" /> Powered by Gemini Vision
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">AI Food & Plate Scanner</h1>
        <p className="text-stone-500 text-sm">
          Snap a photo of your plate, add any preparation notes, and our clinical AI will breakdown every food item, portion quantity, and nutritional value.
        </p>
      </div>

      {/* Main Upload / Camera Box */}
      <div className="bg-white border border-stone-200 p-6 md:p-8 mb-6 shadow-sm">
        {!imagePreview ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto bg-brand-50 text-brand-700 rounded-full flex items-center justify-center mb-4 border border-brand-100 shadow-inner">
              <Camera className="w-9 h-9" />
            </div>
            <h2 className="text-lg font-serif font-bold text-stone-900 mb-2">Upload or Take a Photo of Your Meal</h2>
            <p className="text-stone-500 text-xs max-w-md mx-auto mb-6">
              Ensure the meal is well-lit and clearly visible. You can add extra details below for precision accuracy.
            </p>

            <input 
              type="file" 
              accept="image/*" 
              id="camera-input" 
              className="hidden" 
              onChange={e => handleImageChange(e.target.files?.[0] || null)}
            />
            <label 
              htmlFor="camera-input"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-stone-900 text-white text-xs uppercase font-bold tracking-widest rounded-none hover:bg-stone-800 transition-colors cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Choose Photo / Camera
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview & Details */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-56 h-56 relative bg-stone-100 border border-stone-200 overflow-hidden shrink-0 group">
                <img 
                  src={imagePreview} 
                  alt="Scanned Food Preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-1.5 bg-stone-900/80 text-white text-xs rounded hover:bg-stone-900 transition-colors flex items-center gap-1 shadow"
                  title="Change image"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake
                </button>
              </div>

              {/* Extra Context Notes Input */}
              <div className="flex-1 w-full space-y-3">
                <label className="block text-xs uppercase tracking-widest font-bold text-stone-700">
                  Specify Extra Details & Context for Gemini AI:
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={userNotes}
                    onChange={e => setUserNotes(e.target.value)}
                    placeholder="e.g. Cooked in 1 tbsp olive oil, 2 whole wheat rotis, 1 cup homemade yellow dal, added 1 scoop whey protein..."
                    className="w-full p-3 text-xs text-stone-900 border border-stone-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none bg-[#FCFBF9] resize-none"
                  />
                  <FileText className="w-4 h-4 text-stone-400 absolute right-3 bottom-3 pointer-events-none" />
                </div>

                {/* Quick Context Chips */}
                <div>
                  <p className="text-[11px] text-stone-400 mb-1.5 font-medium">Quick Context Tags (Click to add):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_NOTE_CHIPS.map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleChipClick(chip)}
                        className={`text-[11px] px-2.5 py-1 border rounded-sm transition-colors ${
                          userNotes.includes(chip)
                            ? 'bg-brand-50 border-brand-300 text-brand-800 font-semibold'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scan Action Button */}
            {!result && !scanning && (
              <button 
                onClick={handleScan}
                className="w-full py-4 bg-brand-700 text-white font-bold text-xs uppercase tracking-widest rounded-none hover:bg-brand-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-brand-200" />
                Analyze Plate with Gemini Multimodal AI
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {scanning && (
        <div className="bg-white border border-stone-200 p-8 text-center mb-6 animate-pulse">
          <Loader2 className="w-10 h-10 animate-spin text-brand-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-stone-900 mb-1">Gemini AI is Analyzing Your Food Plate...</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Detecting individual food items, measuring portion weights, calculating macronutrients, and compiling clinical feedback.
          </p>
        </div>
      )}

      {/* Scan Error Message */}
      {scanError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-none mb-6 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Scan Analysis Failed</p>
            <p>{scanError}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-6 md:p-8 shadow-sm">
            {/* Header & Total Calories */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-stone-200 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 bg-brand-50 text-brand-800 border border-brand-200 rounded-sm">
                  AI Nutrition Breakdown
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 mt-1">Plate Analysis Results</h2>
                <p className="text-xs text-stone-500">
                  {result.items?.length || result.detectedFoods.length} items detected on plate
                </p>
              </div>

              {/* Total Calorie Pill */}
              <div className="bg-stone-900 text-white px-5 py-3 text-right">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Total Meal Energy</p>
                <div className="text-2xl font-serif font-bold text-white flex items-baseline gap-1">
                  {result.nutrition.calories} <span className="text-xs font-normal text-stone-300 font-sans">kcal</span>
                </div>
              </div>
            </div>

            {/* Macro Cards Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Protein</span>
                  <Dna className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-emerald-950">{result.nutrition.protein} <span className="text-xs font-normal text-emerald-700">g</span></p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between text-amber-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Carbohydrates</span>
                  <Wheat className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-amber-950">{result.nutrition.carbs} <span className="text-xs font-normal text-amber-700">g</span></p>
              </div>

              <div className="p-3.5 bg-rose-50/70 border border-rose-200">
                <div className="flex items-center justify-between text-rose-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Fats</span>
                  <Droplet className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-rose-950">{result.nutrition.fat} <span className="text-xs font-normal text-rose-700">g</span></p>
              </div>

              <div className="p-3.5 bg-sky-50/70 border border-sky-200">
                <div className="flex items-center justify-between text-sky-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Fiber</span>
                  <Flame className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-sky-950">{result.nutrition.fiber || 0} <span className="text-xs font-normal text-sky-700">g</span></p>
              </div>
            </div>

            {/* Itemized Food Breakdown Table */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-700 mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-brand-700" />
                Detected Plate Items & Quantities
              </h3>

              <div className="border border-stone-200 divide-y divide-stone-100 overflow-x-auto">
                {result.items && result.items.length > 0 ? (
                  result.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Portion: <strong className="text-stone-700">{item.portion}</strong>
                          {item.notes ? ` • ${item.notes}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                        <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-900 font-bold font-sans rounded-sm">
                          {item.calories} kcal
                        </span>
                        <div className="hidden sm:flex items-center gap-2 text-stone-500 text-[11px] font-sans">
                          <span>P: <strong className="text-stone-800">{item.protein}g</strong></span>
                          <span>C: <strong className="text-stone-800">{item.carbs}g</strong></span>
                          <span>F: <strong className="text-stone-800">{item.fat}g</strong></span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-stone-600">
                    {result.detectedFoods.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Clinical AI Feedback Card */}
            {result.insight && (
              <div className="bg-brand-50/70 border border-brand-200 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-brand-950 uppercase tracking-wider mb-0.5">Clinical Dietician Insight</p>
                    <p className="text-xs text-brand-900 leading-relaxed">{result.insight}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Meal Type Selection Before Logging */}
            <div className="pt-4 border-t border-stone-200 mb-6">
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-700 mb-2">
                Select Meal Category to Log:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedMealType(type)}
                    className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border rounded-none transition-colors ${
                      selectedMealType === type
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Log Action Button or Success State */}
            {!logged ? (
              <button 
                onClick={handleLog}
                disabled={logging}
                className="w-full py-4 bg-brand-700 text-white font-bold text-xs uppercase tracking-widest rounded-none hover:bg-brand-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {logging ? 'Saving to Your Health Record...' : `Save ${selectedMealType} (${result.nutrition.calories} kcal) to Progress Log`}
              </button>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-950">Successfully Logged to Your Progress!</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Added {result.nutrition.calories} kcal to your daily intake tracker. Your dietician can now see this meal and its nutritional breakdown.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    to="/patient/progress"
                    className="px-5 py-2.5 bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-colors inline-flex items-center gap-1.5"
                  >
                    View Progress Page <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/patient"
                    className="px-5 py-2.5 bg-white border border-stone-300 text-stone-800 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition-colors"
                  >
                    Today's Plan
                  </Link>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 text-stone-500 hover:text-stone-900 text-xs font-bold uppercase tracking-wider"
                  >
                    Scan Another Meal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
