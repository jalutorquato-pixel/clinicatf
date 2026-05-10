import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';
export const dynamic = 'force-dynamic';

async function getUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try { return jwt.verify(authHeader.split(' ')[1], SECRET_KEY); } catch (e) { return null; }
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const points = await prisma.point.findMany({
    include: {
      ambassador: true,
      referral: true,
      cycle: true
    },
    orderBy: { date: 'desc' }
  });

  return NextResponse.json(points.map(point => ({
    id: point.id,
    ambassador_name: point.ambassador?.public_name,
    referred_name: point.referral?.referred_name,
    cycle_name: point.cycle?.name,
    points: point.points,
    date: point.date,
    validated_by: point.validated_by
  })));
}
