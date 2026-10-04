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
  Droplet,
  Sun,
  Eye,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ScanResult {
  scanType?: 'plate' | 'label';
  productName?: string;
  servingSize?: string;
  servingsPerContainer?: number;
  labelDetails?: {
    sugars?: number;
    sodium?: number;
    saturatedFat?: number;
  };
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
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);
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
        throw new Error(data.error || data.details || 'Failed to analyze food photo');
      }

      setResult(data);
      if (data.suggestedMealType && ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(data.suggestedMealType)) {
        setSelectedMealType(data.suggestedMealType);
      } else {
        setSelectedMealType(getAutoMealType());
      }
      setServingMultiplier(1);
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
      const mult = result.scanType === 'label' ? servingMultiplier : 1;
      const baseCal = Number(result.nutrition?.calories) || 0;
      const baseProt = Number(result.nutrition?.protein) || 0;
      const baseCarbs = Number(result.nutrition?.carbs) || 0;
      const baseFat = Number(result.nutrition?.fat) || 0;
      const baseFiber = Number(result.nutrition?.fiber) || 0;

      const calcCalories = Math.round(baseCal * mult);
      const calcProtein = Math.round(baseProt * mult * 10) / 10;
      const calcCarbs = Math.round(baseCarbs * mult * 10) / 10;
      const calcFat = Math.round(baseFat * mult * 10) / 10;
      const calcFiber = Math.round(baseFiber * mult * 10) / 10;

      const adjustedItems = (result.items || []).map(item => ({
        ...item,
        portion: mult !== 1 ? `${item.portion} (x${mult})` : item.portion,
        calories: Math.round(item.calories * mult),
        protein: Math.round(item.protein * mult * 10) / 10,
        carbs: Math.round(item.carbs * mult * 10) / 10,
        fat: Math.round(item.fat * mult * 10) / 10,
        fiber: Math.round(item.fiber * mult * 10) / 10
      }));

      const description = result.scanType === 'label'
        ? `${result.productName || 'Packaged Item'} (${mult} serving${mult > 1 ? 's' : ''}, ${result.servingSize || ''})`
        : (adjustedItems.map(i => `${i.name} (${i.portion})`).join(', ') || result.detectedFoods.join(', '));

      const logPayload: any = {
        patientId: profile.uid,
        patientName: profile.name || 'Patient',
        date: todayStr,
        mealType: selectedMealType,
        description,
        items: adjustedItems,
        nutrition: {
          calories: calcCalories,
          protein: calcProtein,
          carbs: calcCarbs,
          fat: calcFat,
          fiber: calcFiber
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
    setServingMultiplier(1);
    setLogged(false);
    setScanError(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8 font-sans">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white text-[11px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm shadow-orange-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Powered by Gemini Multimodal Vision
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-black text-stone-900 tracking-tight">AI Food & Nutrition Facts Scanner</h1>
        <p className="text-stone-600 text-xs md:text-sm mt-1 max-w-xl font-medium">
          Snap a photo of your meal plate or packaged food Nutrition Facts label. Our clinical AI immediately measures portion sizes, itemizes ingredients, and calculates accurate calories & macros.
        </p>
      </div>

      {/* Main Upload / Camera Box */}
      <div className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/20 border-2 border-orange-200/80 rounded-3xl p-6 md:p-8 mb-6 shadow-sm hover:shadow-md transition-shadow">
        {!imagePreview ? (
          <div className="text-center py-6">
            <input 
              type="file" 
              accept="image/*" 
              id="camera-input" 
              className="hidden" 
              onChange={e => handleImageChange(e.target.files?.[0] || null)}
            />

            {/* Clickable Camera Icon */}
            <label
              htmlFor="camera-input"
              role="button"
              tabIndex={0}
              title="Click or tap to snap / upload photo"
              className="w-20 h-20 mx-auto bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-orange-500/30 hover:scale-108 active:scale-95 transition-all cursor-pointer group animate-float border-2 border-white/50"
            >
              <Camera className="w-10 h-10 group-hover:scale-110 transition-transform text-white drop-shadow-sm" />
            </label>

            <h2 className="text-xl font-serif font-black text-stone-900 mb-1.5">
              Tap Camera to Snap or Upload Photo
            </h2>
            <p className="text-stone-500 text-xs max-w-md mx-auto mb-5 font-medium">
              Click the camera icon above or use the button below to capture or select a photo of your food or nutrition label.
            </p>

            {/* Clinical Photo Instructions Banner */}
            <div className="max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-left shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                <Info className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Essential Scanning Guidelines for 100% Accuracy:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-700">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span><strong>Upload One Item at a Time:</strong> Photograph single food items or one plate/packaged product per scan for precise portion and macro measurement.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span><strong>Ensure Bright, Visible Light:</strong> Take photos in well-lit natural or bright indoor lighting. Avoid heavy shadows or yellow tints.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <span><strong>Keep it Very Sharp & Clear:</strong> Hold phone steady and focus directly on the food surface or the nutrition table. Avoid blur or glare.</span>
                </li>
              </ul>
            </div>

            <label 
              htmlFor="camera-input"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-xs md:text-sm font-black rounded-xl hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-lg shadow-orange-500/25"
            >
              <Upload className="w-4 h-4" />
              Choose Photo / Open Camera
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview & Details */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-56 h-56 relative bg-stone-100 border-2 border-orange-200 rounded-2xl overflow-hidden shrink-0 group shadow-md shadow-orange-500/10">
                <img 
                  src={imagePreview} 
                  alt="Scanned Food Preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1.5 bg-stone-900/80 backdrop-blur-md text-white text-xs font-bold rounded-lg hover:bg-black transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Change image"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake
                </button>
              </div>

              {/* Extra Context Notes Input */}
              <div className="flex-1 w-full space-y-3">
                <label className="block text-xs uppercase tracking-wider font-extrabold text-stone-700">
                  Specify Extra Details & Context for Gemini AI:
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={userNotes}
                    onChange={e => setUserNotes(e.target.value)}
                    placeholder="e.g. Cooked in 1 tbsp olive oil, 2 whole wheat rotis, 1 cup homemade yellow dal, added 1 scoop whey protein..."
                    className="w-full p-3.5 text-xs text-stone-900 border-2 border-orange-200/80 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none bg-white resize-none shadow-2xs"
                  />
                  <FileText className="w-4 h-4 text-orange-400 absolute right-3.5 bottom-3.5 pointer-events-none" />
                </div>

                {/* Quick Context Chips with lively colors */}
                <div>
                  <p className="text-[11px] text-stone-500 mb-1.5 font-bold uppercase tracking-wider">Quick Context Tags (Click to add):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_NOTE_CHIPS.map((chip, idx) => {
                      const isSelected = userNotes.includes(chip);
                      const colors = [
                        'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
                        'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
                        'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100',
                        'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100',
                        'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100',
                        'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100',
                        'bg-pink-50 text-pink-800 border-pink-300 hover:bg-pink-100',
                        'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100',
                      ];
                      const colorClass = colors[idx % colors.length];

                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className={`text-[11px] px-3 py-1 border rounded-lg font-bold transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border-transparent shadow-xs scale-102'
                              : `${colorClass} shadow-2xs`
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Scan Action Button */}
            {!result && !scanning && (
              <button 
                onClick={handleScan}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs md:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 hover:scale-101 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-200" />
                Analyze Food with Gemini Multimodal AI
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {scanning && (
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/70 border-2 border-orange-200/90 rounded-3xl p-8 text-center mb-6 shadow-md animate-pulse">
          <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-3" />
          <h3 className="text-base font-serif font-black text-stone-900 mb-1">Gemini Multimodal AI is Analyzing Your Food...</h3>
          <p className="text-xs text-stone-600 max-w-sm mx-auto font-medium">
            Detecting individual ingredients, calculating accurate portion weights, reconciling macronutrients, and compiling clinical feedback.
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="bg-gradient-to-br from-white via-orange-50/15 to-amber-50/20 border-2 border-orange-200/90 rounded-3xl p-6 md:p-8 shadow-xl shadow-orange-500/5">
            {/* Header, Multiplier & Nutrient Cards */}
            {(() => {
              const isLabelScan = result.scanType === 'label';
              const mult = isLabelScan ? servingMultiplier : 1;
              const displayCalories = Math.round((result.nutrition?.calories ?? 0) * mult);
              const displayProtein = Math.round(((result.nutrition?.protein ?? 0) * mult) * 10) / 10;
              const displayCarbs = Math.round(((result.nutrition?.carbs ?? 0) * mult) * 10) / 10;
              const displayFat = Math.round(((result.nutrition?.fat ?? 0) * mult) * 10) / 10;
              const displayFiber = Math.round(((result.nutrition?.fiber ?? 0) * mult) * 10) / 10;

              return (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-orange-100 gap-4">
                    <div>
                      <span className={`text-[11px] uppercase tracking-wider font-black px-3 py-1 rounded-full border shadow-2xs inline-flex items-center gap-1.5 ${
                        isLabelScan
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow-blue-500/20'
                          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white border-transparent shadow-orange-500/20'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {isLabelScan ? 'Nutrition Facts Label Detected' : 'AI Nutrition Breakdown'}
                      </span>
                      <h2 className="text-xl md:text-2xl font-serif font-black text-stone-900 tracking-tight mt-2">
                        {isLabelScan ? (result.productName || 'Packaged Nutrition Analysis') : 'Plate Analysis Results'}
                      </h2>
                      <p className="text-xs text-stone-500 mt-1 font-medium">
                        {isLabelScan ? (
                          <>
                            Declared Serving Size: <strong className="text-stone-800 font-bold">{result.servingSize || '1 serving'}</strong>
                            {result.servingsPerContainer ? ` • ${result.servingsPerContainer} servings per container` : ''}
                          </>
                        ) : (
                          `${result.items?.length || result.detectedFoods.length} items detected on plate`
                        )}
                      </p>
                    </div>

                    {/* Total Calorie Pill with radiant gradient */}
                    <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-white px-6 py-3 rounded-2xl text-right shadow-lg shadow-orange-500/25">
                      <p className="text-[10px] uppercase tracking-widest text-amber-100 font-bold">
                        {isLabelScan ? `Calculated (${mult} serving${mult > 1 ? 's' : ''})` : 'Total Meal Energy'}
                      </p>
                      <div className="text-2xl font-black text-white flex items-baseline justify-end gap-1 font-mono">
                        {displayCalories} <span className="text-xs font-semibold text-rose-100 font-sans">kcal</span>
                      </div>
                    </div>
                  </div>

                  {/* Serving Multiplier Selector for Labels */}
                  {isLabelScan && (
                    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/80 border-2 border-blue-200/80 rounded-2xl p-4 my-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div>
                        <span className="text-xs font-black text-indigo-950 block">Portion Consumed:</span>
                        <span className="text-[11px] text-indigo-700 font-medium">Select how many servings you ate to scale calories & macros:</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[0.5, 1, 1.5, 2, 3].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setServingMultiplier(m)}
                            className={`px-3.5 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                              servingMultiplier === m
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/25 scale-105'
                                : 'bg-white text-indigo-900 border-indigo-200/80 hover:bg-indigo-50'
                            }`}
                          >
                            {m}x
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Macro Cards Summary with Vibrant Palettes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 my-6">
                    {/* Protein */}
                    <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border-2 border-emerald-300/80 rounded-2xl shadow-sm shadow-emerald-500/10 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between text-emerald-800 mb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider">Protein</span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Dna className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-2xl font-black text-emerald-950 font-mono tracking-tight">{displayProtein} <span className="text-xs font-bold text-emerald-700 font-sans">g</span></p>
                    </div>

                    {/* Carbs */}
                    <div className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border-2 border-amber-300/80 rounded-2xl shadow-sm shadow-amber-500/10 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between text-amber-800 mb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider">Carbs</span>
                        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Wheat className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                      </div>
                      <p className="text-2xl font-black text-amber-950 font-mono tracking-tight">{displayCarbs} <span className="text-xs font-bold text-amber-700 font-sans">g</span></p>
                    </div>

                    {/* Total Fats */}
                    <div className="p-4 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-white border-2 border-rose-300/80 rounded-2xl shadow-sm shadow-rose-500/10 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between text-rose-800 mb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider">Total Fats</span>
                        <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                          <Droplet className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                      </div>
                      <p className="text-2xl font-black text-rose-950 font-mono tracking-tight">{displayFat} <span className="text-xs font-bold text-rose-700 font-sans">g</span></p>
                    </div>

                    {/* Fiber */}
                    <div className="p-4 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-white border-2 border-sky-300/80 rounded-2xl shadow-sm shadow-sky-500/10 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between text-sky-800 mb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider">Fiber</span>
                        <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center">
                          <Flame className="w-3.5 h-3.5 text-sky-600" />
                        </div>
                      </div>
                      <p className="text-2xl font-black text-sky-950 font-mono tracking-tight">{displayFiber} <span className="text-xs font-bold text-sky-700 font-sans">g</span></p>
                    </div>
                  </div>

                  {/* Micronutrients if label */}
                  {isLabelScan && (result.labelDetails?.sugars !== undefined || result.labelDetails?.sodium !== undefined || result.labelDetails?.saturatedFat !== undefined) && (
                    <div className="grid grid-cols-3 gap-2.5 mb-6">
                      {result.labelDetails?.sugars !== undefined && (
                        <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/80 rounded-xl text-center">
                          <span className="text-[10px] uppercase text-purple-700 font-black block tracking-wider">Sugars</span>
                          <span className="text-base font-black text-purple-950 font-mono">{Math.round(((result.labelDetails.sugars || 0) * mult) * 10) / 10}g</span>
                        </div>
                      )}
                      {result.labelDetails?.sodium !== undefined && (
                        <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-xl text-center">
                          <span className="text-[10px] uppercase text-indigo-700 font-black block tracking-wider">Sodium</span>
                          <span className="text-base font-black text-indigo-950 font-mono">{Math.round((result.labelDetails.sodium || 0) * mult)}mg</span>
                        </div>
                      )}
                      {result.labelDetails?.saturatedFat !== undefined && (
                        <div className="p-3 bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/80 rounded-xl text-center">
                          <span className="text-[10px] uppercase text-rose-700 font-black block tracking-wider">Sat. Fat</span>
                          <span className="text-base font-black text-rose-950 font-mono">{Math.round(((result.labelDetails.saturatedFat || 0) * mult) * 10) / 10}g</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Itemized Food Breakdown Table */}
                  <div className="mb-6">
                    <h3 className="text-xs uppercase tracking-wider font-black text-stone-700 mb-2.5 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-orange-100 flex items-center justify-center">
                        <Utensils className="w-3 h-3 text-orange-600" />
                      </div>
                      {isLabelScan ? 'Declared Item Nutrition' : 'Detected Plate Items & Quantities'}
                    </h3>

                    <div className="border-2 border-orange-100 rounded-2xl divide-y divide-orange-100/70 overflow-hidden bg-white shadow-xs">
                      {result.items && result.items.length > 0 ? (
                        result.items.map((item, idx) => (
                          <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-orange-50/30 transition-colors">
                            <div>
                              <h4 className="font-black text-stone-900 text-sm tracking-tight">{item.name}</h4>
                              <p className="text-xs text-stone-500 mt-0.5 font-medium">
                                Portion: <strong className="text-stone-800 font-bold">{item.portion}{mult !== 1 ? ` (x${mult})` : ''}</strong>
                                {item.notes ? ` • ${item.notes}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-3.5 text-xs font-mono shrink-0">
                              <span className="px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-950 font-black font-sans rounded-xl shadow-2xs">
                                {Math.round(item.calories * mult)} kcal
                              </span>
                              <div className="hidden sm:flex items-center gap-2 text-stone-600 text-[11px] font-sans font-medium">
                                <span className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-emerald-900">P: <strong className="font-bold">{Math.round(item.protein * mult * 10) / 10}g</strong></span>
                                <span className="bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 text-amber-900">C: <strong className="font-bold">{Math.round(item.carbs * mult * 10) / 10}g</strong></span>
                                <span className="bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 text-rose-900">F: <strong className="font-bold">{Math.round(item.fat * mult * 10) / 10}g</strong></span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-xs text-stone-600 font-medium">
                          {result.detectedFoods.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Clinical AI Feedback Card */}
            {result.insight && (
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 border-2 border-orange-200/90 rounded-2xl p-4 mb-6 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-200" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-orange-950 uppercase tracking-wider mb-0.5">Clinical Dietician Insight</p>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">{result.insight}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Meal Type Selection Before Logging */}
            <div className="pt-4 border-t border-orange-100 mb-6">
              <label className="block text-xs uppercase tracking-wider font-black text-stone-700 mb-2.5">
                Select Meal Category to Log:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'Breakfast', label: 'Breakfast', activeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 border-transparent' },
                  { id: 'Lunch', label: 'Lunch', activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 border-transparent' },
                  { id: 'Dinner', label: 'Dinner', activeClass: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/25 border-transparent' },
                  { id: 'Snack', label: 'Snack', activeClass: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25 border-transparent' },
                ].map(({ id, label, activeClass }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedMealType(id)}
                    className={`py-3 px-3 text-xs font-black uppercase tracking-wider border rounded-xl transition-all cursor-pointer ${
                      selectedMealType === id
                        ? `${activeClass} scale-102`
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Log Action Button or Success State */}
            {!logged ? (
              <button 
                onClick={handleLog}
                disabled={logging}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-black text-xs md:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 hover:scale-101 disabled:opacity-50 cursor-pointer"
              >
                {logging ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-200" />}
                {logging ? 'Saving to Your Health Record...' : `Save ${selectedMealType} (${Math.round((result.nutrition?.calories ?? 0) * (result.scanType === 'label' ? servingMultiplier : 1))} kcal) to Progress Log`}
              </button>
            ) : (
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border-2 border-emerald-300 rounded-3xl p-8 text-center space-y-4 shadow-lg shadow-emerald-500/10 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-serif font-black text-emerald-950">Successfully Logged to Your Progress!</h4>
                  <p className="text-xs text-emerald-800 mt-1.5 max-w-md mx-auto font-medium">
                    Added {Math.round((result.nutrition?.calories ?? 0) * (result.scanType === 'label' ? servingMultiplier : 1))} kcal to your daily intake tracker. Your dietician can now inspect this meal and its nutritional breakdown.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    to="/patient/progress"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-black rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
                  >
                    View Progress Page <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/patient"
                    className="px-5 py-2.5 bg-white border border-stone-200 text-stone-800 text-xs font-black rounded-xl hover:bg-stone-50 transition-all shadow-xs"
                  >
                    Today's Plan
                  </Link>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 text-stone-600 hover:text-stone-900 text-xs font-black transition-colors cursor-pointer"
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
