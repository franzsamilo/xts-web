import { NextRequest, NextResponse } from 'next/server';
import { updateConsultationStatus, updateConsultationFields } from '@/lib/consultations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'in-progress'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any)?.role || '';
  if (!role.includes('admin') && !role.includes('expert')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // If only status is provided, use the simple update
    if (body.status && Object.keys(body).length === 1) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      await updateConsultationStatus(id, body.status);
      return NextResponse.json({ success: true });
    }

    // Multi-field update
    const fields: Record<string, any> = {};
    if (body.status && VALID_STATUSES.includes(body.status)) fields.status = body.status;
    if (typeof body.expertName === 'string') fields.expertName = body.expertName;
    if (typeof body.expertTitle === 'string') fields.expertTitle = body.expertTitle;
    if (typeof body.expertPrice === 'string') fields.expertPrice = body.expertPrice;
    if (typeof body.expertId === 'string') fields.expertId = body.expertId;
    if (typeof body.slot === 'string') fields.slot = body.slot;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await updateConsultationFields(id, fields);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 });
  }
}
