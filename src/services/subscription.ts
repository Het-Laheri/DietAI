import { User, PatientProfile } from './db';

export interface SubscriptionPlan {
  id: '1_month' | '2_months' | '3_months';
  name: string;
  durationMonths: number;
  durationDays: number;
  priceInInr: number;
  priceInPaise: number;
  displayPrice: string;
  badge?: string;
  description: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '1_month',
    name: '1 Month Kickstart',
    durationMonths: 1,
    durationDays: 30,
    priceInInr: 1500,
    priceInPaise: 150000,
    displayPrice: '₹1,500',
    description: 'Personalized meal coaching & full AI food scanner access.',
    features: [
      'Chef-tailored daily meals & clinical recipes',
      'Unlimited AI multimodal food scanning',
      'Real-time nutritional macro & calorie tracking',
      'Direct lead dietician guidance'
    ]
  },
  {
    id: '2_months',
    name: '2 Months Transformation',
    durationMonths: 2,
    durationDays: 60,
    priceInInr: 2500,
    priceInPaise: 250000,
    displayPrice: '₹2,500',
    badge: 'Most Popular',
    description: 'Metabolic adaptation and sustainable health habit building.',
    features: [
      'Everything in 1 Month Plan',
      'Save ₹500 over monthly renewal',
      'Dynamic bi-weekly caloric adjustments',
      'Priority dietician consultation reviews'
    ]
  },
  {
    id: '3_months',
    name: '3 Months Total Health',
    durationMonths: 3,
    durationDays: 90,
    priceInInr: 4000,
    priceInPaise: 400000,
    displayPrice: '₹4,000',
    badge: 'Best Value',
    description: 'Complete nutritional lifestyle transformation with long-term results.',
    features: [
      'Everything in 2 Months Plan',
      'Best value: save ₹500 off multi-month rate',
      'Full clinical biomarker & goal progression',
      'Personalized chef recipes & grocery guides'
    ]
  }
];

const LOCAL_SUB_KEY = 'nutrisnap_active_subscription';

export interface ActiveSubscription {
  status: 'active' | 'inactive' | 'expired';
  planId: '1_month' | '2_months' | '3_months';
  planName: string;
  amount: number;
  startDate: string;
  expiresAt: string;
  paymentId?: string;
  orderId?: string;
}

export function getLocalSubscription(userId?: string): ActiveSubscription | null {
  try {
    if (!userId || typeof window === 'undefined') return null;
    const raw = localStorage.getItem(`${LOCAL_SUB_KEY}_${userId}`);
    if (!raw) return null;
    const sub: ActiveSubscription = JSON.parse(raw);
    const now = Date.now();
    if (new Date(sub.expiresAt).getTime() < now) {
      sub.status = 'expired';
      localStorage.setItem(`${LOCAL_SUB_KEY}_${userId}`, JSON.stringify(sub));
    }
    return sub;
  } catch {
    return null;
  }
}

export function saveLocalSubscription(userId: string, sub: ActiveSubscription) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_SUB_KEY}_${userId}`, JSON.stringify(sub));
      window.dispatchEvent(new CustomEvent('nutrisnap:subscription_change', { detail: sub }));
    }
  } catch (e) {
    console.warn('Failed to save subscription locally:', e);
  }
}

export function isPatientSubscribed(profile?: User | null): boolean {
  if (!profile) return false;
  // Dieticians never need to pay
  if (profile.role === 'dietician') return true;

  // Complimentary access flags can only be set by a dietician (enforced by firestore.rules).
  if ((profile as any).isTestPatient === true || (profile as any).isVip === true) {
    return true;
  }

  // 1. Check profile in Firestore state
  const subInProfile = (profile as any).subscription as ActiveSubscription | undefined;
  if (subInProfile?.status === 'active' && new Date(subInProfile.expiresAt).getTime() > Date.now()) {
    return true;
  }

  return false;
}

export function ensureRazorpayScriptLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(!!(window as any).Razorpay), 1500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiateRazorpayPayment(params: {
  plan: SubscriptionPlan;
  user: { uid: string; email?: string | null; displayName?: string | null };
  onSuccess: (sub: ActiveSubscription) => void;
  onError: (errorMsg: string) => void;
  onDismiss?: () => void;
}) {
  const { plan, user, onSuccess, onError, onDismiss } = params;

  try {
    // 1. Ensure Razorpay script is loaded
    const scriptLoaded = await ensureRazorpayScriptLoaded();
    if (!scriptLoaded || typeof window === 'undefined' || !(window as any).Razorpay) {
      onError('Razorpay checkout SDK failed to load. Please check your internet connection and try again.');
      return;
    }

    // 2. Create order on backend
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.details || `Server error ${res.status}: Failed to create payment order`);
    }

    const orderData = await res.json();
    const keyId = orderData.key_id;

    if (!keyId) {
      throw new Error('Razorpay Key ID is not configured. Please check VITE_RAZORPAY_KEY_ID in .env');
    }

    // 3. Configure Razorpay Standard Checkout modal options
    const options = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'NutriSnap',
      description: `${plan.name} - ${plan.displayPrice}`,
      image: '/logo.jpg',
      order_id: orderData.order_id,
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        try {
          // 4. Verify payment signature on backend
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Payment signature verification failed.');
          }

          // 5. The server activated the subscription after verifying the payment.
          const newSubscription: ActiveSubscription = verifyData.subscription;
          saveLocalSubscription(user.uid, newSubscription); // display cache only; never trusted for access

          onSuccess(newSubscription);
        } catch (vErr: any) {
          console.error('Verification error:', vErr);
          onError(vErr.message || 'Payment verification failed.');
        }
      },
      prefill: {
        name: user.displayName || '',
        email: user.email || ''
      },
      notes: {
        planId: plan.id,
        patientId: user.uid
      },
      theme: {
        color: '#f97316' // NutriSnap brand orange
      },
      modal: {
        ondismiss: function () {
          console.log('Razorpay payment modal dismissed by user');
          if (onDismiss) {
            onDismiss();
          } else {
            onError('Payment window closed. Transaction was not completed.');
          }
        }
      }
    };

    const rzpInstance = new (window as any).Razorpay(options);
    rzpInstance.on('payment.failed', function (response: any) {
      console.error('Razorpay payment failed:', response.error);
      const desc = response.error?.description || response.error?.reason || 'Payment failed or declined by your bank.';
      onError(`Payment failed: ${desc}`);
    });

    rzpInstance.open();
  } catch (err: any) {
    console.error('Payment initialization error:', err);
    onError(err.message || 'Could not initiate checkout. Please try again.');
  }
}
