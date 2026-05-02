import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';

export const dynamic = 'force-dynamic';

async function getUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try { return jwt.verify(token, SECRET_KEY); } catch (e) { return null; }
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const benefits = await prisma.earnedBenefit.findMany({ 
      include: { 
        client: { select: { full_name: true } },
        benefit: { select: { name: true, type: true } }
      },
      orderBy: { created_at: 'desc' } 
    });
    
    const formatted = benefits.map(b => ({
      id: b.id,
      client_name: b.client?.full_name,
      benefit_name: b.benefit?.name,
      benefit_type: b.benefit?.type,
      status: b.status,
      date_earned: b.created_at,
      date_used: b.used_at
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
