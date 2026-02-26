import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileId = crypto.randomUUID();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `uploads/${fileId}.${ext}`;
    
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(fileName);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });
    
    await fileRef.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
