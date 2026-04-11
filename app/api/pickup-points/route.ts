import { NextResponse } from 'next/server';
import { getAllPickupPoints, createPickupPoint } from '@/lib/pickup-points';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';

const MAX_NAME = 200;
const MAX_ADDRESS = 400;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const adminCaller = isAdmin((session?.user as any)?.role);

    const points = await getAllPickupPoints(!adminCaller);
    return NextResponse.json(points, {
      // Public list — cache aggressively at the edge but revalidate quickly so
      // newly added points appear within a couple of minutes.
      headers: adminCaller
        ? { 'Cache-Control': 'private, no-store' }
        : { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pickup points' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
    const address = typeof body?.address === 'string' ? body.address.trim().slice(0, MAX_ADDRESS) : '';
    if (!name || !address) {
      return NextResponse.json({ error: 'name and address are required' }, { status: 400 });
    }

    const point = await createPickupPoint({
      name,
      address,
      isActive: true,
      createdAt: new Date(),
    });
    return NextResponse.json(point);
  } catch (error) {
    console.error('pickup-points POST error:', error);
    return NextResponse.json({ error: 'Failed to create pickup point' }, { status: 500 });
  }
}
