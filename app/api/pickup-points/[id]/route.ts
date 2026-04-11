import { NextResponse } from 'next/server';
import { updatePickupPoint, PickupPoint } from '@/lib/pickup-points';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';

const MAX_NAME = 200;
const MAX_ADDRESS = 400;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const update: Partial<PickupPoint> = {};
    if (typeof body?.name === 'string') update.name = body.name.trim().slice(0, MAX_NAME);
    if (typeof body?.address === 'string') update.address = body.address.trim().slice(0, MAX_ADDRESS);
    if (typeof body?.isActive === 'boolean') update.isActive = body.isActive;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await updatePickupPoint(id, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('pickup-points PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update pickup point' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    // Soft delete: keep historical orders' pickupPointId references valid.
    // GET /api/pickup-points already filters out inactive points for non-admins.
    await updatePickupPoint(id, { isActive: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete pickup point' }, { status: 500 });
  }
}
