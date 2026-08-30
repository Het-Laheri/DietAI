import { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Trash2, Loader2, Info } from 'lucide-react';

export default function KnowledgeBase() {
  const [stats, setStats] = useState<{ count: number, sample: any[] }>({ count: 0, sample: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/knowledge/list');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
            body: JSON.stringify({ base64File: base64 })
          });
          if (res.ok) {
            alert('File uploaded successfully!');
            fetchStats();
          } else {
            alert('Failed to process file.');
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
    if (!window.confirm('Are you sure you want to clear the entire recipe knowledge base?')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/knowledge/clear', { method: 'DELETE' });
      if (res.ok) {
        setStats({ count: 0, sample: [] });
      }
    } catch (e) {
      alert('Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Clinical Knowledge Base</h1>
        <p className="text-stone-500 text-sm mt-1">Upload your custom Excel recipes to train the AI Meal Plan Generator.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Upload Card */}
        <div className="bg-white rounded-none border border-stone-200 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4 text-brand-700">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-stone-900 mb-2">Upload Recipes (Excel/CSV)</h3>
          <p className="text-sm text-stone-500 mb-6">File should contain columns like Meal Name, Calories, Protein, Carbs, Fat, Ingredients, Preparation Steps.</p>
          
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
            className="px-6 py-3 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
            {uploading ? 'Processing...' : 'Select File'}
          </button>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-none border border-stone-200 p-8 flex flex-col">
          <div className="flex-1">
            <h3 className="font-bold text-stone-900 mb-6">Database Status</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-stone-500"><Loader2 className="w-4 h-4 animate-spin"/> Loading...</div>
            ) : (
              <div>
                <div className="text-4xl font-black text-brand-700 mb-2">{stats.count}</div>
                <p className="text-stone-500 font-medium">Total Recipes Ingested</p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 flex gap-3 text-sm text-blue-800">
                  <Info className="w-5 h-5 shrink-0" />
                  <p>The AI will prioritize these recipes when generating meal plans. We limit the context to 30 recipes per request to optimize speed.</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-stone-100 text-right">
            <button 
              onClick={handleClear}
              disabled={clearing || stats.count === 0}
              className="text-red-600 font-medium text-sm hover:underline disabled:opacity-50 flex items-center gap-2 ml-auto"
            >
              {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Clear Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
