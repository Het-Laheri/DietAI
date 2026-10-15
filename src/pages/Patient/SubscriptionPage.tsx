import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SUBSCRIPTION_PLANS, 
  isPatientSubscribed, 
  getLocalSubscription, 
  saveLocalSubscription,
  initiateRazorpayPayment,
  ActiveSubscription
} from '../../services/subscription';
import { createNotification } from '../../services/db';
import RazorpayCheckoutButton from '../../components/RazorpayCheckoutButton';
import { 
  ShieldCheck, 
  CreditCard, 
  Check, 
  Sparkles, 
  Clock, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';

export default function SubscriptionPage() {
  const { user, profile } = useAuth();
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(() => getLocalSubscription(user?.uid));
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubscribed = isPatientSubscribed(profile);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 font-sans">
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 md:p-8 text-white relative shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-stone-800 border border-stone-700/80 text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <CreditCard className="w-3.5 h-3.5" />
              Razorpay Standard Checkout
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1.5">
              Membership & Clinical Billing
            </h1>
            <p className="text-stone-400 text-xs md:text-sm max-w-xl leading-relaxed">
              Unlock unlimited multimodal food plate scanning, daily clinical recipes, and real-time dietitian consultations.
            </p>
          </div>

          <div className="bg-stone-800/90 border border-stone-700/80 rounded-lg p-4 shrink-0 min-w-[200px] shadow-xs">
            <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1">Current Membership</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                {isSubscribed ? (activeSub?.planName || 'Active Premium') : 'Free Plan'}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${isSubscribed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-stone-700 text-stone-300'}`}>
                {isSubscribed ? '★ Active' : 'Limited'}
              </span>
            </div>
            {activeSub?.expiresAt && (
              <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Valid until: {new Date(activeSub.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-800 text-xs md:text-sm font-medium animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-700 text-xs md:text-sm font-medium animate-in fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Full Subscription Plans Grid */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-stone-900 mb-3.5">Choose Your Membership Plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl p-5 md:p-6 border border-stone-200 hover:border-orange-500/80 transition-colors flex flex-col justify-between shadow-xs relative"
            >
              {plan.badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-stone-700 shadow-xs">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-stone-900 text-sm md:text-base">{plan.name}</h3>
                </div>

                <div className="mb-3">
                  <span className="text-2xl font-bold text-stone-900">{plan.displayPrice}</span>
                  <span className="text-stone-500 text-xs ml-1 font-normal">/ {plan.durationDays} days</span>
                </div>

                <p className="text-xs text-stone-500 mb-5 leading-relaxed">
                  {plan.description}
                </p>

                <div className="space-y-2 pt-3.5 border-t border-stone-100 mb-5">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-stone-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <RazorpayCheckoutButton
                planId={plan.id}
                amountInPaise={plan.priceInPaise}
                currency="INR"
                name="NutriSnap"
                description={`${plan.name} - ${plan.displayPrice}`}
                buttonText={`Subscribe for ${plan.displayPrice}`}
                prefill={{
                  name: profile?.name || user?.displayName || 'Patient',
                  email: user?.email || ''
                }}
                onSuccess={(result) => {
                  setErrorMessage(null);
                  setSuccessMessage(`Subscription activated! Payment ID: ${result.razorpay_payment_id}`);
                  // Also update local subscription state
                  const now = new Date();
                  const expires = new Date();
                  expires.setDate(now.getDate() + plan.durationDays);
                  const sub: ActiveSubscription = {
                    status: 'active',
                    planId: plan.id,
                    planName: plan.name,
                    amount: plan.priceInInr,
                    startDate: now.toISOString(),
                    expiresAt: expires.toISOString(),
                    paymentId: result.razorpay_payment_id,
                    orderId: result.razorpay_order_id
                  };
                  const uid = user?.uid || profile?.uid;
                  if (uid) {
                    saveLocalSubscription(uid, sub);
                    
                    // Notify patient
                    createNotification({
                      recipientRole: 'patient',
                      recipientId: uid,
                      type: 'SUBSCRIPTION_UPGRADE',
                      title: 'Membership Activated',
                      patientId: uid,
                      message: `Your ${plan.name} plan is now active! All premium clinical diet features unlocked.`,
                      link: '/patient/meals',
                      read: false
                    }).catch(() => {});
                  }
                  
                  // Notify dietician
                  createNotification({
                    recipientRole: 'dietician',
                    type: 'SUBSCRIPTION_UPGRADE',
                    title: 'Patient Subscribed to Membership',
                    patientId: uid,
                    patientName: profile?.name || 'Patient',
                    message: `${profile?.name || 'Patient'} purchased ${plan.name} (${plan.displayPrice}).`,
                    link: uid ? `/dietician/patients/${uid}` : '/dietician/patients',
                    read: false
                  }).catch(() => {});

                  setActiveSub(sub);
                }}
                onError={(err) => {
                  setSuccessMessage(null);
                  setErrorMessage(err);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Security & Support Guarantee */}
      <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-around gap-4 text-stone-500 text-xs">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-bit Encrypted Razorpay Gateway</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-orange-600" />
          <span>Instant Service Activation</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>UPI, Cards, NetBanking & Wallets Accepted</span>
        </span>
      </div>
    </div>
  );
}
