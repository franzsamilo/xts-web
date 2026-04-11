import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // Unauthenticated users have nothing to accept yet — return false so the
      // UI shows the terms gate after they sign in. (Was previously fail-open
      // returning accepted:true, which let unauthenticated callers bypass.)
      return NextResponse.json({ accepted: false });
    }

    const userDoc = await adminDb.collection('users').doc(session.user.email).get();
    const userData = userDoc.data();

    return NextResponse.json({
      accepted: !!userData?.acceptedTermsAt,
    });
  } catch (error) {
    console.error('users/terms GET error:', error);
    return NextResponse.json({ error: 'Failed to read terms status' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await adminDb.collection('users').doc(session.user.email).set({
      acceptedTermsAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
