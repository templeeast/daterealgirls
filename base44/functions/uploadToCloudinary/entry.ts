import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      return Response.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { file, filename, media_type, content_type } = body;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Decode base64 to binary
    const binaryStr = atob(file);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const isVideo = media_type === 'video';
    const mimeType = content_type || (isVideo ? 'video/mp4' : 'image/jpeg');
    const blob = new Blob([bytes], { type: mimeType });

    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', blob, filename || (isVideo ? 'upload.mp4' : 'upload.jpg'));

    const auth = btoa(`${apiKey}:${apiSecret}`);
    const uploadEndpoint = isVideo
      ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}` },
      body: cloudinaryForm,
    });

    const result = await res.json();

    if (result.secure_url) {
      const response = { url: result.secure_url, public_id: result.public_id };

      // For videos, construct a thumbnail/poster URL from the public_id
      if (isVideo && result.public_id) {
        response.thumbnail_url = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,f_jpg/${result.public_id}.jpg`;
      }

      return Response.json(response);
    }

    return Response.json({ error: result.error?.message || 'Upload failed' }, { status: 500 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});