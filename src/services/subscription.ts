import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
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

  // Test / VIP Demo Patient bypass - grant full unlocked access without paying
  const emailLower = (profile.email || '').toLowerCase();
  if (
    emailLower === 'testpatient@nutrisnap.com' ||
    emailLower === 'demo@nutrisnap.com' ||
    emailLower === 'test@nutrisnap.com' ||
    emailLower.startsWith('testpatient') ||
    (profile as any).isTestPatient === true ||
    (profile as any).isVip === true
  ) {
    return true;
  }

  // 1. Check profile in Firestore state
  const subInProfile = (profile as any).subscription as ActiveSubscription | undefined;
  if (subInProfile?.status === 'active' && new Date(subInProfile.expiresAt).getTime() > Date.now()) {
    return true;
  }

  // 2. Check persistent local storage cache
  const localSub = getLocalSubscription(profile.uid);
  if (localSub?.status === 'active' && new Date(localSub.expiresAt).getTime() > Date.now()) {
    return true;
  }

  return false;
}

export async function initiateRazorpayPayment(params: {
  plan: SubscriptionPlan;
  user: { uid: string; email?: string | null; displayName?: string | null };
  onSuccess: (sub: ActiveSubscription) => void;
  onError: (errorMsg: string) => void;
}) {
  const { plan, user, onSuccess, onError } = params;

  try {
    // 1. Check if Razorpay script is loaded
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      onError('Payment gateway is still loading. Please refresh the page and try again.');
      return;
    }

    // 2. Create order on backend
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: plan.priceInPaise,
        currency: 'INR',
        receipt: `rcpt_${user.uid.slice(0, 6)}_${Date.now()}`,
        notes: {
          planId: plan.id,
          userId: user.uid,
          userName: user.displayName || 'Patient'
        }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server error ${res.status}: Failed to create payment order`);
    }

    const orderData = await res.json();
    const keyId = orderData.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_TeiwuIBQ2HzmnL';

    // 3. Configure Razorpay modal options
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

          // 5. Calculate subscription expiry
          const now = new Date();
          const expires = new Date();
          expires.setDate(now.getDate() + plan.durationDays);

          const newSubscription: ActiveSubscription = {
            status: 'active',
            planId: plan.id,
            planName: plan.name,
            amount: plan.priceInInr,
            startDate: now.toISOString(),
            expiresAt: expires.toISOString(),
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id
          };

          // Save locally
          saveLocalSubscription(user.uid, newSubscription);

          // Update Firestore
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              subscription: newSubscription
            });
            await updateDoc(doc(db, 'patient_profiles', user.uid), {
              subscription: newSubscription
            });
          } catch (dbErr) {
            console.warn('Notice: Firestore subscription write note:', dbErr);
          }

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
        color: '#f97316' // NutriSnap orange
      },
      modal: {
        ondismiss: function () {
          console.log('Payment modal dismissed by user');
        }
      }
    };

    const rzpInstance = new (window as any).Razorpay(options);
    rzpInstance.on('payment.failed', function (response: any) {
      console.error('Payment failed event:', response.error);
      onError(response.error?.description || 'Payment was unsuccessful or declined by your bank.');
    });

    rzpInstance.open();
  } catch (err: any) {
    console.error('Payment initialization error:', err);
    onError(err.message || 'Could not initiate checkout. Please try again.');
  }
}
