/**
 * Shared auth check for platform automation functions (scheduled/entity automations).
 * Verifies either:
 *   1. Base44-Service-Authorization header (platform automation call), OR
 *   2. Admin user authentication (direct admin call).
 * Returns true if authorized, false otherwise.
 */
export async function verifyAutomationOrAdmin(req, base44) {
  const hasServiceAuth = req.headers.get('Base44-Service-Authorization') !== null;
  const hasUserAuth = req.headers.get('Authorization') !== null;

  if (hasServiceAuth && !hasUserAuth) {
    // Platform automation call — verify with a lightweight read
    try {
      await base44.asServiceRole.entities.SiteConfig.list();
    } catch {
      return false;
    }
    return true;
  } else if (hasUserAuth) {
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

  return false;
}