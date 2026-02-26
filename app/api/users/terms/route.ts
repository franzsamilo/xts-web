import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ accepted: true }); // Don't block unauthenticated users
    }

    const userDoc = await adminDb.collection('users').doc(session.user.email).get();
    const userData = userDoc.data();

    return NextResponse.json({
      accepted: !!userData?.acceptedTermsAt,
    });
  } catch (error) {
    return NextResponse.json({ accepted: true }); // Fail open
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
