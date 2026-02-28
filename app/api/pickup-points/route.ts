import { NextResponse } from 'next/server';
import { getAllPickupPoints, createPickupPoint } from '@/lib/pickup-points';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Public endpoint — returns active pickup points
    const points = await getAllPickupPoints(true);
    return NextResponse.json(points);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pickup points' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any)?.role || '';
  if (!role.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const point = await createPickupPoint({
      name: body.name,
      address: body.address,
      isActive: true,
      createdAt: new Date(),
    });
    return NextResponse.json(point);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create pickup point' }, { status: 500 });
  }
}
