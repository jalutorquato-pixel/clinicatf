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

function procedurePayload(data) {
  return {
    name: data.name,
    category: data.category || null,
    description: data.description || null,
    default_price: Number(data.default_price ?? data.price ?? 0),
    is_active: data.is_active ?? true
  };
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const records = await prisma.procedure.findMany({ 
      orderBy: { name: 'asc' } 
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const procedure = await prisma.procedure.create({
      data: procedurePayload(data)
    });
    return NextResponse.json(procedure);
  } catch (error) {
    console.error("Erro ao criar procedimento:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
