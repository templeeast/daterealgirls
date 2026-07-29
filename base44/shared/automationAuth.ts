/**
 * Shared auth check for platform automation functions (scheduled/entity automations).
 * Verifies either:
 *   1. Shared secret (AUTOMATION_AUTH_SECRET) passed via function_args, OR
 *   2. Admin user authentication (direct admin call).
 * Returns true if authorized, false otherwise.
 */
export async function verifyAutomationOrAdmin(req, base44) {
  const hasUserAuth = req.headers.get('Authorization') !== null;

  if (hasUserAuth) {
    // Direct user call — require admin authentication
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return false;
    }
    if (!user || user.role !== 'admin') {
      return false;
    }
    return true;
  }

  // Automation call — validate the shared secret from the request body.
  // The secret is passed via function_args in the automation configuration.
  // asServiceRole always succeeds regardless of the caller (it uses the
  // function's own credentials), and the Base44-Service-Authorization header
  // can be spoofed by any attacker. Neither can verify the caller. Instead,
  // we check for a shared secret that is only known to the automation
  // configuration (set by admins) and the environment variable (set in
  // dashboard settings).
  try {
    const clonedReq = req.clone();
    const body = await clonedReq.json();
    const automationSecret =
      body?.automation_secret || body?.function_args?.automation_secret;
    const expectedSecret = Deno.env.get('AUTOMATION_AUTH_SECRET');
    if (expectedSecret && automationSecret === expectedSecret) {
      return true;
    }
  } catch {
    // Body parsing failed — not an automation call with a secret
  }

  return false;
}