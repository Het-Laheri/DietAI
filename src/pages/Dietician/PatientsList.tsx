import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatients, PatientProfile, calculatePatientProgramTimeline } from '../../services/db';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ChevronRight, 
  Users, 
  Plus, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Wand2, 
  MessageSquare,
  FileText
} from 'lucide-react';

type FilterCategory = 'all' | 'active' | 'attention' | 'veg' | 'non_veg';

export default function PatientsList() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');

  useEffect(() => {
    async function load() {
      if (profile) {
        try {
          const pts = await getPatients();
          setPatients(pts);
        } catch (err) {
          console.error('Failed to load patient caseload:', err);
        }
      }
      setLoading(false);
    }
    load();
  }, [profile]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/4"></div>
        <div className="h-64 bg-stone-100 rounded-3xl"></div>
      </div>
    );
  }

  const filtered = patients.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.goals || []).some(g => g.toLowerCase().includes(query)) ||
      (p.healthInfo?.conditions || '').toLowerCase().includes(query) ||
      (p.dietaryType || '').toLowerCase().includes(query);

    if (!matchesSearch) return false;

    const adh = p.adherencePercentage ?? (p.needsAttention ? 48 : 0);

    if (filterCategory === 'active') return p.status === 'active';
    if (filterCategory === 'attention') return adh < 70 || p.needsAttention;
    if (filterCategory === 'veg') return (p.dietaryType || '').toLowerCase().includes('veg');
    if (filterCategory === 'non_veg') return (p.dietaryType || '').toLowerCase().includes('non');

    return true;
  });

  const activeCount = patients.filter(p => p.status === 'active').length;
  const attentionCount = patients.filter(p => (p.adherencePercentage ?? (p.needsAttention ? 48 : 0)) < 70 || p.needsAttention).length;

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-5 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Client Caseload Directory
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Active patient profiles, clinical targets, adherence ratings, and dietary compliance
          </p>
        </div>

        <Link
          to="/dietician/patients/new"
          className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Client
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-stone-200 p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search by client name, email, dietary goal..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50/70 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-stone-400 focus:outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto text-xs font-medium text-stone-600">
          {[
            { id: 'all', label: `All (${patients.length})` },
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'attention', label: `Needs Focus (${attentionCount})` },
            { id: 'veg', label: 'Vegetarian' },
            { id: 'non_veg', label: 'Non-Veg' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id as FilterCategory)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                filterCategory === tab.id 
                  ? 'bg-stone-900 text-white font-semibold shadow-2xs' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Caseload Table Card */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Client Name & Contact</th>
                <th className="px-6 py-4">Diet & Clinical Goals</th>
                <th className="px-6 py-4">Current Weight / BMI</th>
                <th className="px-6 py-4">Program Adherence</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filtered.map(p => {
                const timeline = calculatePatientProgramTimeline(p);
                const adh = timeline.overallAdherence > 0 ? timeline.overallAdherence : (p.adherencePercentage ?? (p.needsAttention ? 48 : 0));
                const heightM = (p.heightCm || 170) / 100;
                const currentW = p.currentWeightKg || 70;
                const bmi = (currentW / (heightM * heightM)).toFixed(1);

                return (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs flex-shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <Link 
                            to={`/dietician/patients/${p.id}`}
                            className="font-bold text-stone-900 hover:text-orange-600 transition-colors text-sm"
                          >
                            {p.name}
                          </Link>
                          <div className="text-[11px] text-stone-400 mt-0.5">{p.email}</div>
                          <div className="text-[10px] text-orange-700 font-semibold mt-0.5">
                            Day {timeline.totalDays} on Care Plan
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-[10px] uppercase">
                        {p.dietaryType}
                      </span>
                      <div className="text-stone-500 text-[11px] mt-1 font-medium truncate max-w-[180px]">
                        {p.goals?.[0] || 'General Wellness'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{currentW} kg</div>
                      <div className="text-[11px] text-stone-400">BMI: {bmi}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              adh >= 80 ? 'bg-emerald-500' : adh >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${adh}%` }}
                          />
                        </div>
                        <div>
                          <span className={`font-bold ${
                            adh >= 80 ? 'text-emerald-600' : adh >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {adh}%
                          </span>
                          <div className="text-[10px] text-stone-400 font-medium">
                            Day 1–{timeline.totalDays}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md ${
                        p.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/dietician/patients/${p.id}`}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          View Dossier
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-xs text-stone-400 space-y-2">
            <Users className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-600">No matching clients found</p>
            <p>Try adjusting your search query or filter category.</p>
          </div>
        )}
      </div>

    </div>
  );
}
