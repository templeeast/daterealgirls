import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { sessionId } = await req.json();
    if (!sessionId) return Response.json({ error: 'sessionId is required' }, { status: 400 });

    // Get credentials by reading config directly (same logic as getActiveDiditCredentials)
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};
    const isDevMode = config.dev_mode === true;
    const credentials = {
      apiKey: isDevMode ? Deno.env.get('DIDIT_API_KEY_DEV') : Deno.env.get('DIDIT_API_KEY_PROD'),
    };

    const response = await fetch(
      `https://verification.didit.me/v3/session/${sessionId}/decision/`,
      {
        method: 'GET',
        headers: { 'x-api-key': credentials.apiKey, 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) throw new Error(`Didit lookup failed: ${response.status}`);
    const decision = await response.json();

    const idv = (decision.id_verifications ?? [])[0] ?? null;
    const liveness = (decision.liveness_checks ?? [])[0] ?? null;

    return Response.json({
      status:         decision.status,
      vendor_data:    decision.vendor_data,
      selfie_image:   liveness?.reference_image ?? liveness?.selfie_image ?? liveness?.portrait ?? null,
      id_front_image: idv?.front_image ?? idv?.document_front_image ?? idv?.full_front_image ?? null,
      id_back_image:  idv?.back_image  ?? idv?.document_back_image  ?? idv?.full_back_image  ?? null,
      raw:            decision,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});