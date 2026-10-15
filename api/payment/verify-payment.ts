import { guard, getAdminDb, parseBody, sendError, HttpError } from '../_lib/security.js';
import { getPlan } from '../_lib/plans.js';
import { razorpayKeys, razorpayRequest, isValidCheckoutSignature } from '../_lib/razorpay.js';

// POST /api/payment/verify-payment  (also /api/verify-payment)   — patients only
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Verifies the signature, confirms the order belongs to the caller and was for the plan's price,
// then activates the subscription server-side. Clients cannot write subscription fields.
export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['POST'], roles: ['patient'] });
  if (!caller) return;

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parseBody(req);
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpError(400, 'Missing payment confirmation fields');
    }

    const { keySecret } = razorpayKeys();
    if (!isValidCheckoutSignature(String(razorpay_order_id), String(razorpay_payment_id), String(razorpay_signature), keySecret)) {
      throw new HttpError(400, 'Payment verification failed');
    }

    const order = await razorpayRequest('GET', `/v1/orders/${encodeURIComponent(String(razorpay_order_id))}`);
    if (order.statusCode >= 400 || !order.data) throw new HttpError(502, 'Could not confirm the order');
    const notes = order.data.notes || {};
    const plan = getPlan(notes.planId);
    if (!plan || notes.uid !== caller.uid) throw new HttpError(403, 'Order does not belong to this account');
    if (Number(order.data.amount) !== plan.priceInPaise || order.data.currency !== 'INR') {
      throw new HttpError(400, 'Order amount does not match the plan');
    }

    const db = getAdminDb();
    const paymentRef = db.collection('payments').doc(String(razorpay_payment_id));
    const userRef = db.collection('users').doc(caller.uid);
    const profileRef = db.collection('patient_profiles').doc(caller.uid);

    const subscription = await db.runTransaction(async (tx) => {
      const existingPayment = await tx.get(paymentRef);
      if (existingPayment.exists) {
        if (existingPayment.get('uid') !== caller.uid) throw new HttpError(403, 'Payment already used');
        return existingPayment.get('subscription');
      }
      const userSnap = await tx.get(userRef);
      const current = userSnap.exists ? userSnap.get('subscription') : null;
      const now = new Date();
      // Extend from the current expiry if the patient renews early.
      const currentExpiry = current?.status === 'active' ? new Date(current.expiresAt) : null;
      const start = currentExpiry && currentExpiry > now ? currentExpiry : now;
      const expires = new Date(start.getTime() + plan.durationDays * 86400000);
      const sub = {
        status: 'active',
        planId: plan.id,
        planName: plan.name,
        amount: plan.priceInPaise / 100,
        startDate: now.toISOString(),
        expiresAt: expires.toISOString(),
        paymentId: String(razorpay_payment_id),
        orderId: String(razorpay_order_id),
      };
      tx.set(paymentRef, { uid: caller.uid, planId: plan.id, amount: plan.priceInPaise, subscription: sub, createdAt: now.toISOString() });
      tx.set(userRef, { subscription: sub }, { merge: true });
      tx.set(profileRef, { subscription: sub }, { merge: true });
      return sub;
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      subscription,
    });
  } catch (err) {
    return sendError(res, err);
  }
}
