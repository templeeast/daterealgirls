import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function extractPublicId(url) {
  if (!url) return null;
  try {
    // Cloudinary URLs: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public_id>.<ext>
    const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function deleteCloudinaryImage(cloudName, apiKey, apiSecret, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = `public_id=${encodeURIComponent(publicId)}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(params));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('signature', signature);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body: formData,
  });
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch site config for retention days
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0];
    const retentionDays = config?.chat_retention_days ?? 90;

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    let deleted = 0;
    let imagesDeleted = 0;
    let hasMore = true;
    let skip = 0;
    const batchSize = 200;

    while (hasMore) {
      const oldMessages = await base44.asServiceRole.entities.Message.filter(
        { created_date: { $lt: cutoff.toISOString() } },
        undefined,
        batchSize,
        skip
      );

      if (oldMessages.length === 0) {
        hasMore = false;
        break;
      }

      for (const msg of oldMessages) {
        // Delete Cloudinary image if present
        if (msg.image_url && cloudName && apiKey && apiSecret) {
          const publicId = extractPublicId(msg.image_url);
          if (publicId) {
            const result = await deleteCloudinaryImage(cloudName, apiKey, apiSecret, publicId);
            if (result.result === 'ok') imagesDeleted++;
          }
        }

        await base44.asServiceRole.entities.Message.delete(msg.id);
        deleted++;
      }

      skip += batchSize;
    }

    return Response.json({
      success: true,
      retention_days: retentionDays,
      deleted,
      images_deleted: imagesDeleted,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});