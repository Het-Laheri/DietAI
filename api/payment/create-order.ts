import { guard, parseBody, sendError, HttpError } from '../_lib/security.js';
import { getPlan } from '../_lib/plans.js';
import { razorpayKeys, razorpayRequest } from '../_lib/razorpay.js';

// POST /api/payment/create-order  (also /api/create-order)   — patients only
// Body: { planId }. The amount is decided by the server, never by the browser.
export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['POST'], roles: ['patient'] });
  if (!caller) return;

  try {
    const body = parseBody(req);
    const plan = getPlan(body.planId ?? body.notes?.planId);
    if (!plan) throw new HttpError(400, 'Unknown subscription plan');

    const { keyId } = razorpayKeys();
    const response = await razorpayRequest('POST', '/v1/orders', {
      amount: plan.priceInPaise,
      currency: 'INR',
      receipt: `sub_${caller.uid.slice(0, 12)}_${Date.now()}`.slice(0, 40),
      notes: { uid: caller.uid, planId: plan.id },
    });

    if (response.statusCode >= 400 || !response.data?.id) {
      console.error('[create-order] Razorpay error status', response.statusCode);
      throw new HttpError(502, 'Could not create payment order. Please try again.');
    }

    return res.status(200).json({
      order_id: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency,
      key_id: keyId, // publishable key id, safe to return
      planId: plan.id,
    });
  } catch (err) {
    return sendError(res, err);
  }
}
