import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { txnId, country, useSandbox } = await req.json();

    const apiKey = useSandbox
      ? Deno.env.get('CODAPAY_SANDBOX_API_KEY')
      : Deno.env.get('CODAPAY_PRODUCTION_API_KEY');
    const projectId = Deno.env.get('CODAPAY_PROJECT_ID');

    const baseUrl = useSandbox
      ? 'https://sandbox.codapayments.com/airtime/api/restful/v2.0/Payment'
      : 'https://airtime.codapayments.com/airtime/api/restful/v2.0/Payment';

    const body = {
      inquiryPaymentRequest: {
        apiKey: apiKey,
        country: country,
        projectId: String(projectId),
        txnId: String(txnId),
        needStatusFinal: 'true',
      }
    };

    const response = await fetch(`${baseUrl}/inquiryPaymentResult.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const profileEntries = data.paymentResult?.profile?.entry || [];
    const statusEntry = profileEntries.find(e => e.key === 'status');
    const status = statusEntry?.value || 'pending';
    const resultCode = data.paymentResult?.resultCode;

    // If payment successful, activate subscription on member profile
    if (status === 'success' && resultCode === 0) {
      // Verify transaction ownership: the user_id in the payment result must match the caller
      const userIdEntry = profileEntries.find(e => e.key === 'user_id');
      if (!userIdEntry || userIdEntry.value !== user.id) {
        return Response.json({ error: 'Transaction does not belong to this user.' }, { status: 403 });
      }

      // Verify the paid amount matches the server-side subscription price
      const configs = await base44.asServiceRole.entities.SiteConfig.list();
      const config = configs[0] || {};
      const expectedPrice = Number(config.subscription_price ?? 5);
      const actualPrice = Number(data.paymentResult?.totalPrice);
      if (!actualPrice || actualPrice < expectedPrice) {
        return Response.json({ error: 'Payment amount does not match the required subscription price.' }, { status: 400 });
      }

      const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        const profile = profiles[0];
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString().split('T')[0],
          subscription_end_date: endDate.toISOString().split('T')[0],
          paymentnerds_subscription_id: String(txnId),
        });
      }
    }

    return Response.json({
      status,
      resultCode,
      resultDesc: data.paymentResult?.resultDesc,
      txnId: data.paymentResult?.txnId,
      totalPrice: data.paymentResult?.totalPrice,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});