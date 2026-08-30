import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logMeal } from '../../services/db';
import { Camera, Upload, Loader2, Check } from 'lucide-react';

export default function FoodScanner() {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logged, setLogged] = useState(false);

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setResult(null);
    setLogged(false);
    
    // Simulate AI delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      const res = await fetch('/api/ai/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'base64...' })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert('Failed to scan food');
    } finally {
      setScanning(false);
    }
  };

  const handleLog = async () => {
    if (!profile || !result) return;
    await logMeal({
      patientId: profile.uid,
      date: new Date().toISOString().split('T')[0],
      mealType: 'Snack',
      description: result.detectedFoods.join(', '),
      nutrition: result.nutrition
    });
    setLogged(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Food Scanner</h1>
      
      <div className="bg-white rounded-none  border border-stone-100 p-8 text-center mb-6">
        <div className="w-24 h-24 mx-auto bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-4">
          <Camera className="w-10 h-10" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 mb-2">Snap a photo of your meal</h2>
        <p className="text-stone-500 mb-6">Our AI will analyze it and estimate calories and macros.</p>
        
        <input 
          type="file" 
          accept="image/*" 
          id="camera-input" 
          className="hidden" 
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <label 
          htmlFor="camera-input"
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-medium rounded-none hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          Choose Image
        </label>
        
        {file && (
          <div className="mt-4 text-sm text-stone-600 font-medium">
            Selected: {file.name}
          </div>
        )}
      </div>

      {file && !result && !scanning && (
        <button 
          onClick={handleScan}
          className="w-full py-4 bg-stone-900 text-white font-bold rounded-none hover:bg-stone-800 transition-colors"
        >
          Scan Food
        </button>
      )}

      {scanning && (
        <div className="text-center p-8">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="font-medium text-stone-600">Analyzing photo... Detecting foods...</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-none  border border-stone-100 p-6 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold text-stone-900 mb-4">Results</h3>
          
          <div className="bg-stone-50 p-4 rounded-none mb-4">
            <p className="font-medium text-stone-900">{result.detectedFoods.join(', ')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 border border-stone-100 rounded-none">
              <p className="text-xs text-stone-500 font-medium">Calories</p>
              <p className="text-xl font-bold text-stone-900">{result.nutrition.calories} <span className="text-sm font-normal text-stone-500">kcal</span></p>
            </div>
            <div className="p-4 border border-stone-100 rounded-none">
              <p className="text-xs text-stone-500 font-medium">Protein</p>
              <p className="text-xl font-bold text-stone-900">{result.nutrition.protein} <span className="text-sm font-normal text-stone-500">g</span></p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-brand-50 text-green-900 rounded-none mb-6 text-sm">
            <span>💡</span>
            <p>{result.insight}</p>
          </div>

          <button 
            onClick={handleLog}
            disabled={logged}
            className="w-full flex items-center justify-center gap-2 py-4 bg-stone-900 text-white font-bold rounded-none hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:bg-stone-300"
          >
            {logged ? <><Check className="w-5 h-5" /> Logged to today</> : 'Save to Food Log'}
          </button>
        </div>
      )}
    </div>
  );
}
