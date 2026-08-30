import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatients, getQueries, PatientProfile, Query } from '../../services/db';
import { Users, Activity, Bell, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      
      const pts = await getPatients();
      const qs = await getQueries();
      
      setPatients(pts);
      setQueries(qs);
      setLoading(false);
    }
    load();
  }, [profile]);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  const activePatients = patients.filter(p => p.status === 'active');
  const needsAttention = patients.filter(p => p.needsAttention);
  const pendingQueries = queries.filter(q => q.status === 'pending');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-serif font-bold text-stone-900 tracking-tight mb-2">Welcome back, {profile?.name}</h1>
          <p className="text-stone-500 font-sans">Here's a summary of your clinical practice today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dietician/patients/new" className="px-6 py-3 bg-stone-900 text-stone-50 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-800 transition-colors">
            Add Patient
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 border border-stone-200">
          <div className="flex items-center gap-3 mb-4 text-stone-500">
            <Users className="w-5 h-5 text-stone-400" />
            <span className="text-xs uppercase tracking-widest font-bold">Total Patients</span>
          </div>
          <div className="text-4xl font-serif text-stone-900">{patients.length}</div>
        </div>
        <div className="bg-white p-6 border border-stone-200">
          <div className="flex items-center gap-3 mb-4 text-stone-500">
            <CheckCircle className="w-5 h-5 text-brand-600" />
            <span className="text-xs uppercase tracking-widest font-bold">Active Plans</span>
          </div>
          <div className="text-4xl font-serif text-stone-900">{activePatients.length}</div>
        </div>
        <div className="bg-white p-6 border border-stone-200">
          <div className="flex items-center gap-3 mb-4 text-stone-500">
            <Bell className="w-5 h-5 text-amber-500" />
            <span className="text-xs uppercase tracking-widest font-bold">Pending Queries</span>
          </div>
          <div className="text-4xl font-serif text-stone-900">{pendingQueries.length}</div>
        </div>
        <div className="bg-white p-6 border border-stone-200">
          <div className="flex items-center gap-3 mb-4 text-stone-500">
            <Activity className="w-5 h-5 text-red-500" />
            <span className="text-xs uppercase tracking-widest font-bold">Needs Attention</span>
          </div>
          <div className="text-4xl font-serif text-stone-900">{needsAttention.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-stone-200">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-[#FDFCFB]">
            <h2 className="text-xl font-serif font-bold text-stone-900">Recent Queries</h2>
            <Link to="/dietician/inbox" className="text-xs uppercase tracking-widest font-bold text-brand-700 hover:text-brand-900 transition-colors">View All</Link>
          </div>
          <div className="divide-y divide-stone-100">
            {pendingQueries.slice(0,5).map(q => (
              <div key={q.id} className="p-6 hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-stone-900">{q.patientName}</span>
                  <span className="text-xs text-stone-500 font-medium">{q.date}</span>
                </div>
                <p className="text-sm text-stone-600 mb-3">{q.question}</p>
                <div className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-stone-100 text-stone-600 rounded-sm w-max border border-stone-200">
                  {q.source === 'whatsapp' ? 'WhatsApp' : 'App'}
                </div>
              </div>
            ))}
            {pendingQueries.length === 0 && (
              <div className="p-10 text-center text-stone-500 font-medium">No pending queries.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
