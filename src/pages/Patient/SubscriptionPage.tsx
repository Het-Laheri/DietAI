import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SUBSCRIPTION_PLANS, 
  isPatientSubscribed, 
  getLocalSubscription, 
  initiateRazorpayPayment,
  ActiveSubscription
} from '../../services/subscription';
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
  ArrowRight,
  TestTube
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
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl mb-8 border border-stone-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
              <CreditCard className="w-3.5 h-3.5" />
              Razorpay Standard Checkout Integration
            </div>
            
            <h1 className="text-2xl md:text-4xl font-serif font-black text-white tracking-tight mb-2">
              Membership & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Billing Portal</span>
            </h1>
            <p className="text-stone-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Unlock unlimited AI multimodal food scanning, daily chef-curated clinical recipes, and real-time dietitian consultations.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 shrink-0 min-w-[220px]">
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-stone-400 mb-1">Current Membership</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">
                {isSubscribed ? (activeSub?.planName || 'Active Premium') : 'Free Plan'}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isSubscribed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-stone-500/30 text-stone-300'}`}>
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
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-medium animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick ₹1 Test Mode Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 via-amber-50 to-pink-50 border border-orange-200/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <TestTube className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-sm md:text-base">Razorpay Test Transaction (₹1.00)</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                100 Paise Minimum
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Verify order creation and HMAC-SHA256 signature verification instantly with the minimum ₹1 test payment.
            </p>
          </div>
        </div>

        <RazorpayCheckoutButton
          amountInPaise={100}
          currency="INR"
          name="NutriSnap Test"
          description="Razorpay Integration Verification (₹1.00)"
          buttonText="Test Pay ₹1 with Razorpay"
          prefill={{
            name: profile?.name || user?.displayName || 'Test Patient',
            email: user?.email || 'patient@nutrisnap.com'
          }}
          onSuccess={(result) => {
            setErrorMessage(null);
            setSuccessMessage(`Payment verified successfully! Payment ID: ${result.razorpay_payment_id}`);
          }}
          onError={(err) => {
            setSuccessMessage(null);
            setErrorMessage(err);
          }}
        />
      </div>

      {/* Full Subscription Plans Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Choose Your Membership Plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl p-6 border-2 border-stone-200 hover:border-orange-500/70 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-lg relative"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-stone-900 text-base">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-black text-stone-900">{plan.displayPrice}</span>
                  <span className="text-stone-500 text-xs ml-1 font-medium">/ {plan.durationDays} days</span>
                </div>

                <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                  {plan.description}
                </p>

                <div className="space-y-2.5 pt-4 border-t border-stone-100 mb-6">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-stone-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <RazorpayCheckoutButton
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
      <div className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-around gap-6 text-stone-500 text-xs">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>256-bit Encrypted Razorpay Gateway</span>
        </span>
        <span className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <span>Instant Service Activation</span>
        </span>
        <span className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-500" />
          <span>UPI, Cards, NetBanking & Wallets Accepted</span>
        </span>
      </div>
    </div>
  );
}
