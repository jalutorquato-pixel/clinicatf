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
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    const parsedClientId = clientId ? Number(clientId) : null;

    if (clientId && (!Number.isInteger(parsedClientId) || parsedClientId <= 0)) {
      return NextResponse.json({ detail: "client_id inválido" }, { status: 400 });
    }

    const records = await prisma.appointment.findMany({
      where: parsedClientId ? { client_id: parsedClientId } : undefined,
      include: { 
        client: { select: { full_name: true } },
        procedure: { select: { name: true } }
      },
      orderBy: { start_at: 'desc' }
    });
    
    const formatted = records.map(r => ({
      id: r.id,
      client_id: r.client_id,
      procedure_id: r.procedure_id,
      title: r.title,
      client_name: r.client?.full_name,
      procedure_name: r.procedure?.name,
      start_time: r.start_at,
      end_time: r.end_at,
      start_at: r.start_at,
      end_at: r.end_at,
      scheduled_time: r.start_at,
      professional: r.professional,
      professional_name: r.professional,
      room: r.room,
      status: r.status,
      color: r.color,
      notes: r.notes
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
