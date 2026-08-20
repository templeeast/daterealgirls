import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Retired: the platform moved from Whop subscriptions to a token-based payment
// model. Subscription activation is no longer used. This function is kept as a
// no-op stub so any stale references resolve without performing subscription
// work. Token purchases are handled by whopCreateCheckoutSession + whopPaymentWebhook.
Deno.serve(async (_req) => {
  return Response.json(
    { error: 'This function is retired. Subscriptions are no longer used; purchases are token-based.' },
    { status: 410 }
  );
});