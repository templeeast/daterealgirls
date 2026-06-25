import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};
    const isDevMode = config.dev_mode === true;

    return Response.json({
      apiKey:        isDevMode ? Deno.env.get('DIDIT_API_KEY_DEV')        : Deno.env.get('DIDIT_API_KEY_PROD'),
      workflowId:    isDevMode ? Deno.env.get('DIDIT_WORKFLOW_ID_DEV')    : Deno.env.get('DIDIT_WORKFLOW_ID_PROD'),
      webhookSecret: isDevMode ? Deno.env.get('DIDIT_WEBHOOK_SECRET_DEV') : Deno.env.get('DIDIT_WEBHOOK_SECRET_PROD'),
      isDevMode,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});