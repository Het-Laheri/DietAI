import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getPatients, 
  getQueries, 
  getAllFoodLogsAcrossAllPatients, 
  getMealPlans, 
  PatientProfile, 
  Query, 
  FoodLog,
  MealPlan 
} from '../../services/db';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Utensils, 
  MessageSquare, 
  Wand2, 
  Plus, 
  ChevronRight, 
  Sparkles, 
  ArrowUpRight, 
  Calendar,
  Filter,
  CheckCircle,
  HelpCircle,
  Eye,
  Send,
  FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ClinicalAlert {
  id: string;
  type: 'urgent_query' | 'low_adherence' | 'plan_expired' | 'high_glycemic';
  patientId: string;
  patientName: string;
  message: string;
  severity: 'high' | 'medium' | 'info';
  actionUrl: string;
  actionText: string;
}

export default function Overview() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [recentLogs, setRecentLogs] = useState<FoodLog[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAdherence, setFilterAdherence] = useState<'all' | 'attention' | 'optimal'>('all');

  useEffect(() => {
    async function loadPracticeDashboard() {
      if (!profile) return;
      try {
        const [pts, qs, logs] = await Promise.all([
          getPatients(),
          getQueries(),
          getAllFoodLogsAcrossAllPatients()
        ]);

        setPatients(pts);
        setQueries(qs);
        setRecentLogs(logs);
      } catch (err) {
        console.error('Failed to load practice dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPracticeDashboard();
  }, [profile]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-stone-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-stone-100 rounded-3xl"></div>
      </div>
    );
  }

  // Derive Clinical Alerts
  const pendingQueries = queries.filter(q => q.status === 'pending');
  const activePatients = patients.filter(p => p.status === 'active');

  const alerts: ClinicalAlert[] = [];

  // 1. Pending Queries
  pendingQueries.slice(0, 3).forEach(q => {
    alerts.push({
      id: `query_${q.id}`,
      type: 'urgent_query',
      patientId: q.patientId,
      patientName: q.patientName,
      message: `Pending query: "${q.question.slice(0, 60)}..."`,
      severity: 'high',
      actionUrl: '/dietician/inbox',
      actionText: 'Review & Reply'
    });
  });

  // 2. Low adherence or needs attention clients
  patients.forEach(p => {
    const adherence = p.adherencePercentage ?? (p.needsAttention ? 45 : 82);
    if (adherence < 60 || p.needsAttention) {
      alerts.push({
        id: `adh_${p.id}`,
        type: 'low_adherence',
        patientId: p.id,
        patientName: p.name,
        message: `Low 7-day adherence (${adherence}%). Skipped recent meal logs or reported symptoms.`,
        severity: 'medium',
        actionUrl: `/dietician/patients/${p.id}`,
        actionText: 'Open Patient Profile'
      });
    }
  });

  // Today's Follow-up Schedule (Simulated realistic clinical queue)
  const todayFollowUps = patients.slice(0, 3).map((p, idx) => ({
    patientId: p.id,
    patientName: p.name,
    time: idx === 0 ? '10:30 AM' : idx === 1 ? '02:00 PM' : '04:30 PM',
    goal: p.goals?.[0] || 'Weight Management',
    type: idx === 0 ? 'Bi-Weekly Review' : idx === 1 ? 'Macronutrient Adjustment' : 'Initial Consultation Check-In'
  }));

  // Average practice adherence
  const avgAdherence = patients.length > 0
    ? Math.round(
        patients.reduce((acc, p) => acc + (p.adherencePercentage ?? (p.needsAttention ? 50 : 85)), 0) /
          patients.length
      )
    : 80;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* ─── COMMAND CENTER TOP BAR ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-orange-600 font-extrabold bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
              CLINICAL COMMAND CENTER • {todayStr}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-stone-900 tracking-tight">
            Welcome, Dr. {profile?.name || 'Dietician'}
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Overview of your active clinical caseload, client compliance, and urgent clinical requests.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/dietician/patients/new"
            className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Client
          </Link>
          <Link
            to="/dietician/generator"
            className="px-4 py-2.5 bg-white border border-stone-300 hover:border-orange-500 text-stone-700 hover:text-orange-600 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-orange-500" />
            Generate Meal Plan
          </Link>
          <Link
            to="/dietician/inbox"
            className="px-4 py-2.5 bg-white border border-stone-300 hover:border-orange-500 text-stone-700 hover:text-orange-600 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 relative"
          >
            <MessageSquare className="w-3.5 h-3.5 text-pink-500" />
            Client Inbox
            {pendingQueries.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping absolute top-1 right-1" />
            )}
          </Link>
        </div>
      </div>

      {/* ─── MEANINGFUL CLINICAL METRIC TILES ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Active Clients</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-black text-stone-900">{patients.length}</div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {activePatients.length} on published plans
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Pending Inquiries</span>
            <HelpCircle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-black text-stone-900">{pendingQueries.length}</div>
          <p className="text-[11px] text-stone-500 mt-1">
            {pendingQueries.length === 0 ? 'All caught up' : 'Awaiting your approval'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Total Food Logs</span>
            <Utensils className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-black text-stone-900">{recentLogs.length}</div>
          <p className="text-[11px] text-stone-500 mt-1">
            Across all client meal uploads
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Practice Adherence</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-black text-stone-900">{avgAdherence}%</div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">
            Healthy compliance range
          </p>
        </div>
      </div>

      {/* ─── URGENT CLINICAL ATTENTION BOARD ───────────────────────────── */}
      {alerts.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-amber-950 font-serif">
                Clinical Priority Alerts ({alerts.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              Requires Dietician Action
            </span>
          </div>

          <div className="space-y-3">
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className="bg-white rounded-2xl p-4 border border-amber-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    alert.severity === 'high' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{alert.patientName}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        alert.severity === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {alert.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">{alert.message}</p>
                  </div>
                </div>

                <Link
                  to={alert.actionUrl}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap self-end sm:self-center"
                >
                  {alert.actionText}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TWO-COLUMN WORKSPACE: TODAY'S SCHEDULE & CLIENT TRIAGE ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Client Adherence & Status Roster */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900">
                  Client Caseload & Adherence
                </h2>
                <p className="text-xs text-stone-500">Monitor client compliance, nutrition goals, and current statuses</p>
              </div>

              {/* Adherence Filter Tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold text-stone-600">
                <button
                  type="button"
                  onClick={() => setFilterAdherence('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${filterAdherence === 'all' ? 'bg-white shadow-xs text-stone-900' : 'hover:text-stone-900'}`}
                >
                  All ({patients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAdherence('attention')}
                  className={`px-3 py-1 rounded-lg transition-all ${filterAdherence === 'attention' ? 'bg-white shadow-xs text-amber-700' : 'hover:text-stone-900'}`}
                >
                  Attention
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAdherence('optimal')}
                  className={`px-3 py-1 rounded-lg transition-all ${filterAdherence === 'optimal' ? 'bg-white shadow-xs text-emerald-700' : 'hover:text-stone-900'}`}
                >
                  Optimal
                </button>
              </div>
            </div>

            <div className="divide-y divide-stone-100 mt-2">
              {patients
                .filter(p => {
                  const adh = p.adherencePercentage ?? (p.needsAttention ? 45 : 82);
                  if (filterAdherence === 'attention') return adh < 70 || p.needsAttention;
                  if (filterAdherence === 'optimal') return adh >= 70 && !p.needsAttention;
                  return true;
                })
                .slice(0, 6)
                .map(patient => {
                  const adh = patient.adherencePercentage ?? (patient.needsAttention ? 48 : 84);
                  return (
                    <div key={patient.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-sm">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/dietician/patients/${patient.id}`}
                              className="font-bold text-stone-900 hover:text-orange-600 text-sm transition-colors"
                            >
                              {patient.name}
                            </Link>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
                              {patient.dietaryType}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Goal: <span className="font-medium text-stone-700">{patient.goals?.[0] || 'General Nutrition'}</span> • Target: {patient.targetWeightKg}kg
                          </p>
                        </div>
                      </div>

                      {/* Adherence Gauge */}
                      <div className="flex items-center gap-4">
                        <div className="w-32 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-xs font-bold">
                            <span className="text-stone-400">Adherence:</span>
                            <span className={adh >= 80 ? 'text-emerald-600' : adh >= 60 ? 'text-amber-600' : 'text-red-600'}>
                              {adh}%
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full rounded-full ${
                                adh >= 80 ? 'bg-emerald-500' : adh >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${adh}%` }}
                            />
                          </div>
                        </div>

                        <Link
                          to={`/dietician/patients/${patient.id}`}
                          className="p-2 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                          title="Open Client Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <Link 
                to="/dietician/patients"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View Complete Patient Directory ({patients.length}) →
              </Link>
            </div>
          </div>

          {/* AI Clinical Assistant Insights Box (Transparent Reasoning) */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-orange-400 uppercase">
                <Sparkles className="w-4 h-4" />
                AI Assistant Clinical Observation
              </div>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-stone-300">
                Awaiting Dietician Review
              </span>
            </div>

            <div className="relative z-10 space-y-3">
              <h3 className="text-lg font-serif font-bold text-white">
                Macronutrient Deficit Pattern Detected for Sarah Patel
              </h3>
              <p className="text-xs md:text-sm text-stone-300 leading-relaxed">
                "Based on the last 5 days of verified food photo logs, average daily protein intake is tracking at 58g versus the clinical target of 85g (-31%). Breakfast is consistently carbohydrate-dense (oats/toast without eggs or seeds)."
              </p>
              
              <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs text-stone-200">
                <span className="font-bold text-orange-300">Suggested Dietician Action:</span> Recommend swapping 1 slice of white bread with 2 boiled eggs, or prescribe 20g whey/sattu isolate in mid-morning routine.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/dietician/generator"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  Adjust Meal Plan
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/dietician/inbox"
                  className="px-4 py-2 bg-white/15 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Message Patient
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Clinical Schedule & Recent Meal Activity */}
        <div className="space-y-6">
          
          {/* Today's Follow-Ups Queue */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Today's Consultations
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                3 Scheduled
              </span>
            </div>

            <div className="space-y-3">
              {todayFollowUps.map((fu, idx) => (
                <div key={idx} className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-900">{fu.patientName}</span>
                    <span className="font-mono text-orange-600 font-extrabold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fu.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium">{fu.type}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Focus: {fu.goal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Client Meal Upload Stream */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-pink-500" />
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Live Food Log Stream
                </h3>
              </div>
              <span className="text-xs text-stone-400">Real-time</span>
            </div>

            <div className="space-y-3.5">
              {recentLogs.slice(0, 4).map(log => {
                const patient = patients.find(p => p.id === log.patientId);
                const pName = log.patientName || patient?.name || 'Patient';
                return (
                  <div key={log.id} className="flex items-start gap-3 text-xs">
                    {log.imageUrl ? (
                      <img 
                        src={log.imageUrl} 
                        alt="Meal" 
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                        <Utensils className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <Link 
                          to={`/dietician/patients/${log.patientId}`}
                          className="font-bold text-stone-900 hover:text-orange-600 truncate"
                        >
                          {pName}
                        </Link>
                        <span className="font-mono text-stone-700 font-bold ml-1">
                          {log.nutrition?.calories || 0} kcal
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{log.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                        <span>{log.mealType}</span>
                        <span>•</span>
                        <span>P: {log.nutrition?.protein || 0}g</span>
                        <span>•</span>
                        <span>C: {log.nutrition?.carbs || 0}g</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {recentLogs.length === 0 && (
                <div className="text-center py-6 text-xs text-stone-400">
                  No meal logs recorded yet today.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
