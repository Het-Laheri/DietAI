import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatients, getQueries, getAllFoodLogsAcrossAllPatients, PatientProfile, Query, FoodLog } from '../../services/db';
import { Users, Activity, Bell, CheckCircle, Utensils, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [recentLogs, setRecentLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      
      const [pts, qs, logs] = await Promise.all([
        getPatients(),
        getQueries(),
        getAllFoodLogsAcrossAllPatients()
      ]);
      
      setPatients(pts);
      setQueries(qs);
      setRecentLogs(logs);
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
            <Utensils className="w-5 h-5 text-brand-700" />
            <span className="text-xs uppercase tracking-widest font-bold">Total Meal Logs</span>
          </div>
          <div className="text-4xl font-serif text-stone-900">{recentLogs.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Queries */}
        <div className="bg-white border border-stone-200 shadow-sm">
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

        {/* Live Patient Meal Logs Stream */}
        <div className="bg-white border border-stone-200 shadow-sm">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-[#FDFCFB]">
            <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-brand-700" />
              Recent Patient Meal Logs
            </h2>
            <Link to="/dietician/patients" className="text-xs uppercase tracking-widest font-bold text-brand-700 hover:text-brand-900 transition-colors">Patients</Link>
          </div>
          <div className="divide-y divide-stone-100">
            {recentLogs.slice(0,5).map(log => {
              const patient = patients.find(p => p.id === log.patientId);
              const pName = log.patientName || patient?.name || 'Patient';

              return (
                <div key={log.id} className="p-5 hover:bg-stone-50 transition-colors">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <Link 
                        to={`/dietician/patients/${log.patientId}`} 
                        className="font-bold text-stone-900 text-sm hover:text-brand-700 transition-colors flex items-center gap-1.5"
                      >
                        {pName}
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>
                      <p className="text-xs text-stone-500 mt-0.5">{log.description}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-stone-900 text-white font-mono text-xs font-bold shrink-0">
                      {log.nutrition?.calories || 0} kcal
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-stone-100 px-2 py-0.5 border border-stone-200 text-stone-600">
                      {log.mealType}
                    </span>
                    {log.source === 'scanner' && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-brand-50 text-brand-800 px-2 py-0.5 border border-brand-200 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> AI Scanned
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400 ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {log.date}
                    </span>
                  </div>
                </div>
              );
            })}
            {recentLogs.length === 0 && (
              <div className="p-10 text-center text-stone-500 font-medium">No meals logged yet by patients.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
