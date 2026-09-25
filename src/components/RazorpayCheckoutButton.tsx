import React, { useState } from 'react';
import { CreditCard, Loader2, ArrowRight } from 'lucide-react';
import { ensureRazorpayScriptLoaded } from '../services/subscription';

export interface RazorpayCheckoutButtonProps {
  amountInPaise: number; // e.g., 10000 = ₹100
  currency?: string;     // defaults to 'INR'
  name?: string;         // Business/company name
  description?: string;  // Product/service description
  receipt?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  themeColor?: string;
  onSuccess?: (paymentResult: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    verificationResult: any;
  }) => void;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

export default function RazorpayCheckoutButton({
  amountInPaise,
  currency = 'INR',
  name = 'NutriSnap',
  description = 'Standard Checkout Payment',
  receipt,
  notes,
  prefill,
  buttonText,
  className,
  disabled = false,
  themeColor = '#f97316',
  onSuccess,
  onError,
  onDismiss
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled || loading) return;

    if (!amountInPaise || amountInPaise < 100) {
      const err = 'Minimum payment amount is 100 paise (₹1.00).';
      if (onError) onError(err);
      else alert(err);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Ensure Razorpay checkout script is loaded
      const scriptReady = await ensureRazorpayScriptLoaded();
      if (!scriptReady || typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your network and refresh.');
      }

      // Step 2: Call backend to create order (POST /api/create-order)
      const createRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amountInPaise),
          currency,
          receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          notes: notes || {}
        })
      });

      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create order (Status ${createRes.status})`);
      }

      const orderData = await createRes.json();
      const keyId = orderData.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_TgHwgxTVyxnCry';

      if (!keyId) {
        throw new Error('Razorpay Key ID missing. Set VITE_RAZORPAY_KEY_ID in .env.');
      }

      // Step 3: Open Razorpay modal with order_id
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name,
        description,
        image: '/logo.jpg',
        order_id: orderData.order_id,
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || ''
        },
        notes: notes || {},
        theme: {
          color: themeColor
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Step 4: Verify payment signature on backend (POST /api/verify-payment)
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

            setLoading(false);
            if (onSuccess) {
              onSuccess({
                ...response,
                verificationResult: verifyData
              });
            }
          } catch (vErr: any) {
            setLoading(false);
            const errMsg = vErr.message || 'Payment signature verification failed.';
            console.error('Signature verification error:', vErr);
            if (onError) onError(errMsg);
            else alert(errMsg);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            console.log('Razorpay modal closed by user');
            if (onDismiss) onDismiss();
          }
        }
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', function (failResponse: any) {
        setLoading(false);
        console.error('Payment failed event:', failResponse.error);
        const desc = failResponse.error?.description || failResponse.error?.reason || 'Payment failed or declined.';
        if (onError) onError(`Payment failed: ${desc}`);
      });

      rzpInstance.open();
    } catch (err: any) {
      setLoading(false);
      const errMsg = err.message || 'Failed to initiate payment.';
      console.error('Checkout error:', err);
      if (onError) onError(errMsg);
      else alert(errMsg);
    }
  };

  const formattedAmount = `₹${(amountInPaise / 100).toLocaleString('en-IN')}`;
  const defaultText = `Pay ${formattedAmount} with Razorpay`;

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={
        className ||
        'px-6 py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]'
      }
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Opening Checkout...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          <span>{buttonText || defaultText}</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </>
      )}
    </button>
  );
}
