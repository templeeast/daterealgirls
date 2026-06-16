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
    const { file, filename } = body;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Decode base64 to binary
    const binaryStr = atob(file);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', blob, filename || 'upload.jpg');

    const auth = btoa(`${apiKey}:${apiSecret}`);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}` },
      body: cloudinaryForm,
    });

    const result = await res.json();

    if (result.secure_url) {
      return Response.json({ url: result.secure_url, public_id: result.public_id });
    }

    return Response.json({ error: result.error?.message || 'Upload failed' }, { status: 500 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});