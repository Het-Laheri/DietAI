import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  SUBSCRIPTION_PLANS, 
  SubscriptionPlan, 
  initiateRazorpayPayment, 
  ActiveSubscription 
} from '../services/subscription';
import { 
  Lock, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface PaywallProps {
  featureName?: string;
  onUnlocked?: () => void;
}

export default function SubscriptionPaywall({ featureName = 'Meals & AI Food Scanner', onUnlocked }: PaywallProps) {
  const { user, profile } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<'1_month' | '2_months' | '3_months'>('2_months');
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSub, setSuccessSub] = useState<ActiveSubscription | null>(null);

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  const handleSubscribe = () => {
    if (!user) {
      setErrorMessage('Please sign in to proceed with your subscription.');
      return;
    }

    setPaying(true);
    setErrorMessage(null);

    initiateRazorpayPayment({
      plan: selectedPlan,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: profile?.name || user.displayName || 'Patient'
      },
      onSuccess: (sub) => {
        setPaying(false);
        setSuccessSub(sub);
        if (onUnlocked) {
          setTimeout(() => {
            onUnlocked();
          }, 1500);
        }
      },
      onError: (err) => {
        setPaying(false);
        setErrorMessage(err);
      },
      onDismiss: () => {
        setPaying(false);
      }
    });
  };

  if (successSub) {
    return (
      <div className="bg-white rounded-3xl border border-emerald-200 p-8 md:p-12 text-center max-w-xl mx-auto my-8 shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Subscription Activated!</h2>
        <p className="text-stone-600 text-sm mb-6">
          Thank you for subscribing to the <span className="font-bold text-orange-600">{successSub.planName}</span>. Your {featureName} is now fully unlocked.
        </p>
        <button
          onClick={() => {
            if (onUnlocked) onUnlocked();
            else window.location.reload();
          }}
          className="px-6 py-3 bg-stone-900 hover:bg-black text-white font-bold rounded-xl text-sm transition-all"
        >
          Continue to {featureName}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 my-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl mb-8 border border-stone-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5" />
            Premium Feature Paywall
          </div>
          
          <h1 className="text-2xl md:text-4xl font-serif font-black text-white tracking-tight mb-3">
            Unlock Full Access to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">{featureName}</span>
          </h1>
          <p className="text-stone-300 text-sm md:text-base max-w-2xl leading-relaxed">
            Get personalized daily meals customized by your clinical dietitian, complete recipe chef cards, and unlimited multimodal AI food scanning.
          </p>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-medium animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between border-2 ${
                isSelected
                  ? 'border-orange-500 bg-white shadow-xl shadow-orange-500/10 scale-[1.02]'
                  : 'border-stone-200 bg-stone-50 hover:bg-white hover:border-stone-300'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-stone-900 text-base">{plan.name}</h3>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-stone-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
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

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlanId(plan.id);
                  handleSubscribe();
                }}
                disabled={paying}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/20 hover:brightness-110'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                {paying && isSelected ? 'Preparing Checkout...' : `Select ${plan.name.split(' ')[0]} ${plan.name.split(' ')[1]}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Checkout Action Box */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Selected Subscription</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-stone-900">{selectedPlan.name}</span>
            <span className="text-lg font-extrabold text-orange-600 font-mono">({selectedPlan.displayPrice})</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">Secure payment processed via Razorpay Standard Checkout</p>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={paying}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
        >
          {paying ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Opening Razorpay Gateway...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay {selectedPlan.displayPrice} with Razorpay
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Trust Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-stone-400 text-xs">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> 256-bit SSL Secure Checkout
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" /> Instant Access to Scanner & Meals
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-sky-500" /> Cancel anytime
        </span>
      </div>
    </div>
  );
}
