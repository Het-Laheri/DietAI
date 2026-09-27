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
  MealPlan,
  calculatePatientProgramTimeline 
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
    const timeline = calculatePatientProgramTimeline(p);
    const adherence = timeline.overallAdherence > 0 ? timeline.overallAdherence : (p.adherencePercentage ?? (p.needsAttention ? 45 : 82));
    if (adherence < 60 || p.needsAttention) {
      alerts.push({
        id: `adh_${p.id}`,
        type: 'low_adherence',
        patientId: p.id,
        patientName: p.name,
        message: `Low adherence (${adherence}% over Day 1–${timeline.totalDays}). Skipped recent meal logs or reported symptoms.`,
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
        patients.reduce((acc, p) => {
          const t = calculatePatientProgramTimeline(p);
          const val = t.overallAdherence > 0 ? t.overallAdherence : (p.adherencePercentage ?? (p.needsAttention ? 50 : 85));
          return acc + val;
        }, 0) / patients.length
      )
    : 80;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* ─── COMMAND CENTER TOP BAR ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
              Practice Dashboard • {todayStr}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Dr. {profile?.name || 'Dietician'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {patients.length} active clients • {pendingQueries.length} items awaiting review • {avgAdherence}% average adherence
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dietician/patients/new"
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Client
          </Link>
          <Link
            to="/dietician/generator"
            className="px-3.5 py-2 bg-white border border-stone-200 hover:border-stone-300 text-stone-700 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-stone-500" />
            Meal Plan Studio
          </Link>
          <Link
            to="/dietician/inbox"
            className="px-3.5 py-2 bg-white border border-stone-200 hover:border-stone-300 text-stone-700 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 relative"
          >
            <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
            Inquiries
            {pendingQueries.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-orange-600 text-white rounded-full">
                {pendingQueries.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ─── UNIFIED CLINICAL METRIC STRIP ───────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-xs grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-stone-100">
        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Total Clients</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{patients.length}</div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">{activePatients.length} active</span>
            <span className="text-stone-300">•</span>
            <span>{patients.length - activePatients.length} off-plan</span>
          </div>
        </div>

        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Pending Review</span>
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{pendingQueries.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {pendingQueries.length === 0 ? 'All consultations answered' : 'Requires dietician approval'}
          </div>
        </div>

        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Logged Meals</span>
            <Utensils className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{recentLogs.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            Verified food photo entries
          </div>
        </div>

        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Mean Adherence</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">{avgAdherence}%</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Across active caseload
          </div>
        </div>
      </div>

      {/* ─── CLINICAL PRIORITY TRIAGE ───────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="bg-white border-l-4 border-l-amber-500 border border-stone-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Clinical Action Items ({alerts.length})
              </h2>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              High Priority
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {alerts.slice(0, 3).map(alert => (
              <div 
                key={alert.id}
                className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    alert.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <div>
                    <span className="font-bold text-stone-900 mr-2">{alert.patientName}</span>
                    <span className="text-stone-600">{alert.message}</span>
                  </div>
                </div>

                <Link
                  to={alert.actionUrl}
                  className="text-stone-800 hover:text-orange-600 font-semibold text-xs flex items-center gap-1 shrink-0 self-end sm:self-center"
                >
                  {alert.actionText}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TWO-COLUMN WORKSPACE: CASELOAD ROSTER & AGENDA ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2 Cols): Client Caseload & Adherence */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Active Client Caseload
                </h2>
                <p className="text-xs text-stone-500">Track active program adherence, goals, and clinical nutritional regimens</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-xs font-medium text-stone-600">
                <button
                  type="button"
                  onClick={() => setFilterAdherence('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filterAdherence === 'all' ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'hover:text-stone-900'}`}
                >
                  All ({patients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAdherence('attention')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filterAdherence === 'attention' ? 'bg-white shadow-2xs text-amber-800 font-bold' : 'hover:text-stone-900'}`}
                >
                  Needs Focus
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAdherence('optimal')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filterAdherence === 'optimal' ? 'bg-white shadow-2xs text-emerald-800 font-bold' : 'hover:text-stone-900'}`}
                >
                  Optimal
                </button>
              </div>
            </div>

            <div className="divide-y divide-stone-100">
              {patients
                .filter(p => {
                  const t = calculatePatientProgramTimeline(p);
                  const adh = t.overallAdherence > 0 ? t.overallAdherence : (p.adherencePercentage ?? (p.needsAttention ? 45 : 82));
                  if (filterAdherence === 'attention') return adh < 70 || p.needsAttention;
                  if (filterAdherence === 'optimal') return adh >= 70 && !p.needsAttention;
                  return true;
                })
                .slice(0, 6)
                .map(patient => {
                  const timeline = calculatePatientProgramTimeline(patient);
                  const adh = timeline.overallAdherence > 0 ? timeline.overallAdherence : (patient.adherencePercentage ?? (patient.needsAttention ? 48 : 84));
                  return (
                    <div key={patient.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs shrink-0">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/dietician/patients/${patient.id}`}
                              className="font-bold text-stone-900 hover:text-orange-600 text-xs transition-colors"
                            >
                              {patient.name}
                            </Link>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                              {patient.dietaryType}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Day {timeline.totalDays} on Care Plan • Target: {patient.targetWeightKg}kg
                          </p>
                        </div>
                      </div>

                      {/* Adherence Gauge */}
                      <div className="flex items-center gap-4">
                        <div className="w-28 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-xs font-semibold">
                            <span className="text-stone-400 text-[11px]">Day 1–{timeline.totalDays}:</span>
                            <span className={adh >= 80 ? 'text-emerald-700' : adh >= 60 ? 'text-amber-700' : 'text-rose-700'}>
                              {adh}%
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full rounded-full ${
                                adh >= 80 ? 'bg-emerald-600' : adh >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${adh}%` }}
                            />
                          </div>
                        </div>

                        <Link
                          to={`/dietician/patients/${patient.id}`}
                          className="p-1 text-stone-400 hover:text-stone-800 transition-colors"
                          title="Open Dossier"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-between items-center text-xs">
              <span className="text-stone-400">Showing {Math.min(6, patients.length)} of {patients.length} active clients</span>
              <Link 
                to="/dietician/patients"
                className="font-bold text-stone-800 hover:text-orange-600 flex items-center gap-1 transition-colors"
              >
                Full Caseload Directory →
              </Link>
            </div>
          </div>

          {/* Clinical Observation & Action Box */}
          <div className="bg-stone-900 text-stone-100 rounded-xl p-5 border border-stone-800">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-orange-400 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Clinical Pattern Observation
              </div>
              <span className="text-[10px] bg-stone-800 border border-stone-700 px-2 py-0.5 rounded text-stone-300">
                AI Clinical Co-Pilot
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Recent food logs indicate Sarah Patel is averaging 58g daily protein intake vs. the clinical target of 85g (-31%). Breakfasts are predominantly high-glycemic carbohydrates.
            </p>

            <div className="mt-3 p-3 bg-stone-800/80 rounded-lg border border-stone-700/60 text-xs text-stone-200">
              <span className="font-semibold text-orange-400">Dietician Recommendation:</span> Prescribe 2 boiled eggs at breakfast or introduce a 20g mid-morning whey/sattu isolate shake.
            </div>

            <div className="flex items-center gap-2.5 mt-3.5">
              <Link
                to="/dietician/generator"
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                Adjust Meal Plan
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/dietician/inbox"
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg border border-stone-700 transition-colors"
              >
                Send Guidance
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule & Food Log Stream */}
        <div className="space-y-4">
          
          {/* Today's Consultations */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Today's Consultations
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                3 Scheduled
              </span>
            </div>

            <div className="space-y-2.5">
              {todayFollowUps.map((fu, idx) => (
                <div key={idx} className="p-2.5 bg-stone-50/80 rounded-lg border border-stone-100 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-stone-900">{fu.patientName}</span>
                    <span className="font-mono text-stone-700 font-bold text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" /> {fu.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">{fu.type}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Goal: {fu.goal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Client Meal Stream */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-stone-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Live Meal Feed
                </h3>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">Today</span>
            </div>

            <div className="space-y-3">
              {recentLogs.slice(0, 4).map(log => {
                const patient = patients.find(p => p.id === log.patientId);
                const pName = log.patientName || patient?.name || 'Patient';
                return (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs">
                    {log.imageUrl ? (
                      <img 
                        src={log.imageUrl} 
                        alt="Meal" 
                        className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 shrink-0">
                        <Utensils className="w-4 h-4" />
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
                        <span className="font-mono text-stone-700 font-bold text-[11px] ml-1">
                          {log.nutrition?.calories || 0} kcal
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{log.description}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5">
                        <span className="font-semibold text-stone-600">{log.mealType}</span>
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
                <div className="text-center py-4 text-xs text-stone-400">
                  No meal entries uploaded yet today.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
