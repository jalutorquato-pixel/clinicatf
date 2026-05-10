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

  const credits = await prisma.credit.findMany({
    include: { ambassador: true, referral: true },
    orderBy: { date: 'desc' }
  });

  return NextResponse.json(credits.map(credit => ({
    id: credit.id,
    ambassador_id: credit.ambassador_id,
    ambassador_name: credit.ambassador?.public_name,
    type: credit.type,
    amount: credit.value,
    value: credit.value,
    date: credit.date,
    description: credit.description,
    referred_name: credit.referral?.referred_name
  })));
}
