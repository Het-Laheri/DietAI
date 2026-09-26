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

  const compressImage = (selectedFile: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1024;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressed);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(selectedFile);
    });
  };

  const handleImageChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    setLogged(false);
    setScanError(null);

    try {
      const compressedDataUrl = await compressImage(selectedFile);
      setImagePreview(compressedDataUrl);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
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
      const res = await fetch('/api/ai/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagePreview,
          mimeType: 'image/jpeg',
          userNotes,
          patientProfile: profile ? {
            name: profile.name,
            dietaryType: (profile as any).dietaryType,
            goals: (profile as any).goals,
            healthInfo: (profile as any).healthInfo
          } : undefined
        })
      });

      const resText = await res.text();
      let data: any;
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error(
          resText.toLowerCase().includes('server error') || !res.ok
            ? 'The scanner service is currently busy. Please try scanning again.'
            : resText
        );
      }

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
      setScanError(e.message || 'Failed to scan food photo. Please check your network and try again.');
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
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-600" /> Powered by Gemini Vision
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">AI Food & Plate Scanner</h1>
        <p className="text-stone-500 text-xs md:text-sm mt-0.5">
          Snap a photo of your plate, add any preparation notes, and our clinical AI will breakdown every food item, portion quantity, and nutritional value.
        </p>
      </div>

      {/* Main Upload / Camera Box */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-6 md:p-8 mb-6 shadow-xs">
        {!imagePreview ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-3.5 border border-orange-100 shadow-xs">
              <Camera className="w-7 h-7" />
            </div>
            <h2 className="text-base font-semibold text-stone-900 mb-1.5">Upload or Take a Photo of Your Meal</h2>
            <p className="text-stone-500 text-xs max-w-md mx-auto mb-5">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              Choose Photo / Camera
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview & Details */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-56 h-56 relative bg-stone-100 border border-stone-200 rounded-lg overflow-hidden shrink-0 group">
                <img 
                  src={imagePreview} 
                  alt="Scanned Food Preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-1.5 bg-stone-900/80 text-white text-xs rounded-md hover:bg-stone-900 transition-colors flex items-center gap-1 shadow-xs"
                  title="Change image"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake
                </button>
              </div>

              {/* Extra Context Notes Input */}
              <div className="flex-1 w-full space-y-3">
                <label className="block text-xs uppercase tracking-wider font-bold text-stone-700">
                  Specify Extra Details & Context for Gemini AI:
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={userNotes}
                    onChange={e => setUserNotes(e.target.value)}
                    placeholder="e.g. Cooked in 1 tbsp olive oil, 2 whole wheat rotis, 1 cup homemade yellow dal, added 1 scoop whey protein..."
                    className="w-full p-3 text-xs text-stone-900 border border-stone-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-stone-50/40 resize-none"
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
                        className={`text-[11px] px-2.5 py-1 border rounded-md transition-colors ${
                          userNotes.includes(chip)
                            ? 'bg-orange-50 border-orange-300 text-orange-800 font-semibold'
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
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs md:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-orange-200" />
                Analyze Plate with Gemini Multimodal AI
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {scanning && (
        <div className="bg-white border border-stone-200/90 rounded-xl p-8 text-center mb-6 shadow-xs animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-900 mb-1">Gemini AI is Analyzing Your Food Plate...</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Detecting individual food items, measuring portion weights, calculating macronutrients, and compiling clinical feedback.
          </p>
        </div>
      )}

      {/* Scan Error Message */}
      {scanError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg mb-6 flex items-start gap-3 text-xs">
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
          <div className="bg-white border border-stone-200/90 rounded-xl p-6 md:p-8 shadow-xs">
            {/* Header & Total Calories */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-stone-200 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-md">
                  AI Nutrition Breakdown
                </span>
                <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-1">Plate Analysis Results</h2>
                <p className="text-xs text-stone-500">
                  {result.items?.length || result.detectedFoods.length} items detected on plate
                </p>
              </div>

              {/* Total Calorie Pill */}
              <div className="bg-stone-900 text-white px-5 py-2.5 rounded-lg text-right shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Total Meal Energy</p>
                <div className="text-xl font-bold text-white flex items-baseline gap-1">
                  {result.nutrition.calories} <span className="text-xs font-normal text-stone-300">kcal</span>
                </div>
              </div>
            </div>

            {/* Macro Cards Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Protein</span>
                  <Dna className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-emerald-950">{result.nutrition.protein} <span className="text-xs font-normal text-emerald-700">g</span></p>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-lg">
                <div className="flex items-center justify-between text-amber-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Carbs</span>
                  <Wheat className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-lg font-bold text-amber-950">{result.nutrition.carbs} <span className="text-xs font-normal text-amber-700">g</span></p>
              </div>

              <div className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-lg">
                <div className="flex items-center justify-between text-rose-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Fats</span>
                  <Droplet className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-lg font-bold text-rose-950">{result.nutrition.fat} <span className="text-xs font-normal text-rose-700">g</span></p>
              </div>

              <div className="p-3.5 bg-sky-50/50 border border-sky-200/80 rounded-lg">
                <div className="flex items-center justify-between text-sky-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Fiber</span>
                  <Flame className="w-4 h-4 text-sky-600" />
                </div>
                <p className="text-lg font-bold text-sky-950">{result.nutrition.fiber || 0} <span className="text-xs font-normal text-sky-700">g</span></p>
              </div>
            </div>

            {/* Itemized Food Breakdown Table */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider font-bold text-stone-700 mb-2.5 flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-orange-600" />
                Detected Plate Items & Quantities
              </h3>

              <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-x-auto shadow-xs">
                {result.items && result.items.length > 0 ? (
                  result.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
                      <div>
                        <h4 className="font-semibold text-stone-900 text-sm">{item.name}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Portion: <strong className="text-stone-700 font-medium">{item.portion}</strong>
                          {item.notes ? ` • ${item.notes}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3.5 text-xs font-mono shrink-0">
                        <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-900 font-semibold font-sans rounded-md">
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
              <div className="bg-orange-50/40 border border-orange-200/80 rounded-lg p-4 mb-6 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-orange-950 uppercase tracking-wider mb-0.5">Clinical Dietician Insight</p>
                    <p className="text-xs text-stone-700 leading-relaxed">{result.insight}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Meal Type Selection Before Logging */}
            <div className="pt-4 border-t border-stone-200 mb-6">
              <label className="block text-xs uppercase tracking-wider font-bold text-stone-700 mb-2">
                Select Meal Category to Log:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedMealType(type)}
                    className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider border rounded-lg transition-colors ${
                      selectedMealType === type
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
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
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs md:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {logging ? 'Saving to Your Health Record...' : `Save ${selectedMealType} (${result.nutrition.calories} kcal) to Progress Log`}
              </button>
            ) : (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-6 text-center space-y-4 shadow-xs">
                <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-emerald-950">Successfully Logged to Your Progress!</h4>
                  <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                    Added {result.nutrition.calories} kcal to your daily intake tracker. Your dietician can now see this meal and its nutritional breakdown.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <Link
                    to="/patient/progress"
                    className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    View Progress Page <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/patient"
                    className="px-4 py-2 bg-white border border-stone-300 text-stone-800 text-xs font-semibold rounded-lg hover:bg-stone-50 transition-colors shadow-xs"
                  >
                    Today's Plan
                  </Link>
                  <button
                    onClick={handleReset}
                    className="px-3.5 py-2 text-stone-500 hover:text-stone-900 text-xs font-semibold transition-colors cursor-pointer"
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
