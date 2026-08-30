import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatients, PatientProfile } from '../../services/db';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';

export default function PatientsList() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      if (profile) {
        const pts = await getPatients();
        setPatients(pts);
      }
      setLoading(false);
    }
    load();
  }, [profile]);

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="p-8">Loading patients...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Patients</h1>
        <Link to="/dietician/patients/new" className="px-4 py-2 bg-stone-900 text-white rounded-none font-medium hover:bg-stone-800 transition-colors">
          Add Patient
        </Link>
      </div>

      <div className="bg-white rounded-none  border border-stone-100 overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -transtone-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
            />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-stone-500 text-sm font-medium border-b border-stone-200">
            <tr>
              <th className="px-6 py-4">Patient</th>
              <th className="px-6 py-4">Dietary Type</th>
              <th className="px-6 py-4">Target Weight</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-stone-900">{p.name}</div>
                  <div className="text-sm text-stone-500">{p.email}</div>
                </td>
                <td className="px-6 py-4 text-stone-600">{p.dietaryType}</td>
                <td className="px-6 py-4 text-stone-600">{p.targetWeightKg} kg</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${p.status === 'active' ? 'bg-green-100 text-brand-700' : 'bg-stone-100 text-stone-700'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/dietician/patients/${p.id}`} className="p-2 text-stone-400 hover:text-brand-600 inline-block">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-stone-500">No patients found.</div>
        )}
      </div>
    </div>
  );
}
