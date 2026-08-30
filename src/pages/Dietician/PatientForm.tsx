import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPatientProfile } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft } from 'lucide-react';

export default function PatientForm() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    whatsappNumber: '',
    dietaryType: 'Vegetarian',
    currentWeightKg: 60,
    targetWeightKg: 55,
  });

  const [credentials, setCredentials] = useState<{email: string, pass: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const res = await createPatientProfile(profile.uid, formData);
      setCredentials({ email: res.email, pass: res.tempPassword });
    } catch (err) {
      alert('Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  if (credentials) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-brand-600 mb-4">Patient Created Successfully!</h2>
        <div className="bg-white p-6 rounded-none  border border-stone-100 mb-6 text-left">
          <p className="text-sm text-stone-500 mb-4">Share these temporary credentials with the patient. They must use them to log in.</p>
          <div className="bg-stone-50 p-4 rounded-none border border-stone-200 font-mono text-sm space-y-2">
            <div><span className="font-bold text-stone-700">Email:</span> {credentials.email}</div>
            <div><span className="font-bold text-stone-700">Password:</span> {credentials.pass}</div>
          </div>
        </div>
        <Link to="/dietician/patients" className="px-6 py-3 bg-stone-900 text-white font-medium rounded-none hover:bg-stone-800 transition-colors">
          Back to Patients List
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to="/dietician/patients" className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 mb-6 w-max">
        <ChevronLeft className="w-4 h-4" />
        Back to Patients
      </Link>
      
      <h1 className="text-2xl font-bold text-stone-900 mb-8">Add New Patient</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-none  border border-stone-100 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
            <input 
              required
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-stone-200 rounded-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input 
              type="email" required
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-stone-200 rounded-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Mobile</label>
            <input 
              value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})}
              className="w-full px-4 py-2 border border-stone-200 rounded-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">WhatsApp Number (Meta Cloud Channel)</label>
            <input 
              value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
              className="w-full px-4 py-2 border border-stone-200 rounded-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none font-mono"
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Dietary Type</label>
            <select 
              value={formData.dietaryType} onChange={e => setFormData({...formData, dietaryType: e.target.value})}
              className="w-full px-4 py-2 border border-stone-200 rounded-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
            >
              <option>Vegetarian</option>
              <option>Non-Vegetarian</option>
              <option>Vegan</option>
              <option>Eggetarian</option>
              <option>Jain</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Current Weight (kg)</label>
            <input 
              type="number" required
              value={formData.currentWeightKg} onChange={e => setFormData({...formData, currentWeightKg: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-stone-200 rounded-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Target Weight (kg)</label>
            <input 
              type="number" required
              value={formData.targetWeightKg} onChange={e => setFormData({...formData, targetWeightKg: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-stone-200 rounded-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-stone-100">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-stone-900 text-white font-medium rounded-none hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
