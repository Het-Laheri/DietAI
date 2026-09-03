import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Trash2, Loader2, Info, Search, Utensils, Clock, BookOpen } from 'lucide-react';
import { RecipeDBItem } from '../../services/db';

export default function KnowledgeBase() {
  const [recipes, setRecipes] = useState<RecipeDBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDiet, setFilterDiet] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/knowledge/list');
      const data = await res.json();
      setRecipes(data.recipes || data.sample || []);
    } catch (e) {
      console.error('Failed to fetch recipes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result;
        if (typeof base64 === 'string') {
          const res = await fetch('/api/knowledge/import-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64File: base64, fileName: file.name })
          });
          if (res.ok) {
            alert('Excel recipes uploaded & saved to database successfully!');
            fetchRecipes();
          } else {
            alert('Failed to process Excel file.');
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert('Upload error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear the entire recipe knowledge base database?')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/knowledge/clear', { method: 'DELETE' });
      if (res.ok) {
        setRecipes([]);
      }
    } catch (e) {
      alert('Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  const filtered = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          (r.ingredients || []).join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesDiet = filterDiet === 'All' || r.dietaryType.toLowerCase() === filterDiet.toLowerCase();
    return matchesSearch && matchesDiet;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-stone-900">Clinical Recipe Knowledge Base DB</h1>
        <p className="text-stone-500 text-sm mt-1">Upload your custom Excel recipe sheets to persist in Firestore Cloud DB & feed AI patient meal assignments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Upload Card */}
        <div className="bg-white rounded-none border border-stone-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-3 text-emerald-700">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-stone-900 mb-1">Upload Recipes (Excel / CSV)</h3>
          <p className="text-xs text-stone-500 mb-5">Accepts columns: Meal Name, Dietary Type, Calories, Protein, Carbs, Fat, Ingredients, Preparation Steps, Prep/Cook time.</p>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept=".xlsx,.xls,.csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-2.5 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-wider font-bold rounded-full"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            {uploading ? 'Processing Excel...' : 'Select Excel File'}
          </button>
        </div>

        {/* Stats & Info Card */}
        <div className="bg-white rounded-none border border-stone-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-stone-900">Firestore Recipe DB Status</h3>
                <p className="text-xs text-stone-500 mt-0.5">Persisted Cloud Storage for Meal Plans</p>
              </div>
              <span className="text-3xl font-serif font-black text-emerald-700">{recipes.length}</span>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 rounded space-y-1">
              <p className="font-bold flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                Live Patient Meal Plan Synced
              </p>
              <p>When you assign a meal plan to a patient, these exact Excel recipes & ingredients are automatically fetched and assigned to their profile.</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="text-xs text-stone-400">{filtered.length} recipes showing</span>
            <button 
              onClick={handleClear}
              disabled={clearing || recipes.length === 0}
              className="text-red-600 font-medium text-xs hover:underline disabled:opacity-50 flex items-center gap-1.5"
            >
              {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Clear Database
            </button>
          </div>
        </div>
      </div>

      {/* Recipe List & Search Database View */}
      <div className="bg-white border border-stone-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search recipes or ingredients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded text-xs outline-none focus:border-stone-900 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-stone-500 uppercase tracking-wider">Dietary Filter:</span>
            <select 
              value={filterDiet}
              onChange={e => setFilterDiet(e.target.value)}
              className="border border-stone-300 px-3 py-1.5 rounded outline-none focus:border-stone-900 bg-white"
            >
              <option value="All">All Diets</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Eggetarian">Eggetarian</option>
              <option value="Jain">Jain</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              Loading database recipes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              No recipes found in database matching your filter. Upload an Excel file above to populate the DB.
            </div>
          ) : (
            filtered.map((r, idx) => (
              <div key={r.id || idx} className="p-5 hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200">
                        {r.dietaryType}
                      </span>
                      {r.clinicalFocus && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {r.clinicalFocus}
                        </span>
                      )}
                      {r.sourceFileName && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                          📄 {r.sourceFileName} {r.sheetName ? `(${r.sheetName})` : ''}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-stone-900 text-base">{r.name}</h4>
                  </div>
                  <div className="text-right text-xs font-semibold text-stone-600">
                    <span className="text-emerald-700 font-bold">{r.calories} kcal</span>
                    <div className="text-[11px] text-stone-400 font-medium">
                      P: {r.protein}g • C: {r.carbs}g • F: {r.fat}g
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                  <div className="bg-stone-50 p-3 border border-stone-100">
                    <span className="font-bold text-stone-500 block mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-emerald-600" /> Ingredients ({r.ingredients?.length || 0})
                    </span>
                    <p className="text-stone-700 leading-relaxed font-sans">{r.ingredients?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="bg-stone-50 p-3 border border-stone-100">
                    <span className="font-bold text-stone-500 block mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" /> Prep & Steps
                    </span>
                    <p className="text-stone-700 leading-relaxed font-sans line-clamp-2">
                      {r.recipe?.join(' ') || 'Standard clinical preparation.'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
