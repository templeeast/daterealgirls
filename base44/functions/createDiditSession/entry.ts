import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId } = await req.json();
    if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 });

    // Get active Didit credentials via dev_mode (mirrors WHOP pattern)
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};
    const isDevMode = config.dev_mode === true;
    const apiKey    = isDevMode ? Deno.env.get('DIDIT_API_KEY_DEV')     : Deno.env.get('DIDIT_API_KEY_PROD');
    const workflowId = isDevMode ? Deno.env.get('DIDIT_WORKFLOW_ID_DEV') : Deno.env.get('DIDIT_WORKFLOW_ID_PROD');

    // Determine callback base URL from request origin header
    const origin = req.headers.get('origin') || '';
    const baseUrl = origin || Deno.env.get('APP_BASE_URL') || 'https://your-app-url.here';

    const response = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "x-api-key":    apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id:     workflowId,
        vendor_data:     memberId,
        callback:        `${baseUrl}/verify/complete`,
        callback_method: "both",
        metadata:        { source: "daterealgirls", dev: isDevMode },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Didit session creation failed: ${response.status} — ${errorText}`);
    }

    const session = await response.json();
    return Response.json({ session_id: session.session_id, url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});