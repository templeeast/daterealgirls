export async function getActiveDiditCredentials(base44) {
  const configs = await base44.asServiceRole.entities.SiteConfig.list();
  const config = configs[0] || {};
  const isDevMode = config.dev_mode === true;
  return {
    apiKey:        isDevMode ? Deno.env.get('DIDIT_API_KEY_DEV')        : Deno.env.get('DIDIT_API_KEY_PROD'),
    workflowId:    isDevMode ? Deno.env.get('DIDIT_WORKFLOW_ID_DEV')    : Deno.env.get('DIDIT_WORKFLOW_ID_PROD'),
    webhookSecret: isDevMode ? Deno.env.get('DIDIT_WEBHOOK_SECRET_DEV') : Deno.env.get('DIDIT_WEBHOOK_SECRET_PROD'),
    isDevMode,
  };
}