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

  const cycles = await prisma.cycle.findMany({ orderBy: { start_date: 'desc' } });
  return NextResponse.json(cycles);
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const cycle = await prisma.cycle.create({
      data: {
        name: data.name,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        status: data.status || 'futuro',
        notes: data.notes || null
      }
    });
    return NextResponse.json(cycle);
  } catch (error) {
    console.error("Erro ao criar ciclo:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
