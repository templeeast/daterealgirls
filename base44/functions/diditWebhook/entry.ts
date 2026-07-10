import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createHmac, timingSafeEqual } from "node:crypto";

function sortKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc, k) => {
      acc[k] = sortKeys(obj[k]);
      return acc;
    }, {});
  }
  return obj;
}

function verifyV2(parsedBody, sig, secret) {
  const canonical = JSON.stringify(sortKeys(parsedBody));
  const expected  = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig ?? "", "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyRaw(rawBody, sig, secret) {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig ?? "", "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifySimple(parsed, sig, timestampHdr, secret) {
  const envelope = `${timestampHdr}:${parsed.session_id}:${parsed.status}:${parsed.webhook_type}`;
  const expected = createHmac("sha256", secret).update(envelope, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig ?? "", "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const rawBody  = await req.text();
    const sigV2    = req.headers.get("x-signature-v2");
    const sigRaw   = req.headers.get("x-signature");
    const sigSimple = req.headers.get("x-signature-simple");
    const timestamp = req.headers.get("x-timestamp") ?? "";

    // Validate timestamp freshness (within 300 seconds)
    const now     = Math.floor(Date.now() / 1000);
    const tsEpoch = parseInt(timestamp, 10);
    if (isNaN(tsEpoch) || Math.abs(now - tsEpoch) > 300) {
      return Response.json({ error: "Timestamp expired" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Get active Didit webhook secret via dev_mode
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config  = configs[0] || {};
    const isDevMode = config.dev_mode === true;
    const secret = isDevMode
      ? Deno.env.get('DIDIT_WEBHOOK_SECRET_DEV')
      : Deno.env.get('DIDIT_WEBHOOK_SECRET_PROD');

    // Verify signature — try V2 first, then raw, then simple
    let verified = false;
    if (sigV2)                  verified = verifyV2(body,    sigV2,     secret);
    if (!verified && sigRaw)    verified = verifyRaw(rawBody, sigRaw,   secret);
    if (!verified && sigSimple) verified = verifySimple(body, sigSimple, timestamp, secret);

    if (!verified) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Process event
    if (body.webhook_type === "status.updated") {
      const { session_id, vendor_data, status } = body;

      // vendor_data is the MemberProfile.id passed at session creation
      const profiles = await base44.asServiceRole.entities.MemberProfile
        .filter({ id: vendor_data });
      const profile = profiles[0];
      if (!profile) return Response.json({ received: true });

      if (status === "Approved") {
        // Extract gender from webhook payload, or fall back to decision API
        let diditGender = null;
        const idv = (body.id_verifications ?? [])[0];
        if (idv?.gender) {
          diditGender = idv.gender;
        }
        if (!diditGender) {
          try {
            const apiKey = isDevMode
              ? Deno.env.get('DIDIT_API_KEY_DEV')
              : Deno.env.get('DIDIT_API_KEY_PROD');
            const decisionRes = await fetch(
              `https://verification.didit.me/v3/session/${session_id}/decision/`,
              { method: 'GET', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } }
            );
            if (decisionRes.ok) {
              const decision = await decisionRes.json();
              const decisionIdv = (decision.id_verifications ?? [])[0];
              if (decisionIdv?.gender) diditGender = decisionIdv.gender;
            }
          } catch (e) { /* proceed without gender if decision API fails */ }
        }

        // Map Didit gender codes to profile gender values
        const genderMap = { 'M': 'male', 'F': 'female' };
        const mappedGender = genderMap[diditGender] || null;
        const genderMismatch = mappedGender && mappedGender !== profile.gender;
        const genderUnknown = !mappedGender; // "U" or not present on document

        if (genderMismatch || genderUnknown) {
          // Flag for admin review — do not auto-verify
          await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
            didit_session_id:          session_id,
            didit_verification_status: "Approved",
            didit_verified_at:         new Date().toISOString(),
            didit_extracted_gender:    diditGender || 'U',
            gender_review_needed:      true,
            profile_review_status:     "pending",
          });
        } else {
          // Gender matches — auto-verify as before
          await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
            didit_session_id:          session_id,
            didit_verification_status: "Approved",
            didit_verified_at:         new Date().toISOString(),
            verification_status:       "verified",
            didit_extracted_gender:    diditGender || null,
            gender_review_needed:      false,
          });
        }
      } else if (status === "Declined") {
        await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
          didit_verification_status: "Declined",
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});