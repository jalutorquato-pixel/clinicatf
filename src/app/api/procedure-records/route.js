import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';

export const dynamic = 'force-dynamic';

async function getUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (e) {
    return null;
  }
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const procedureRecords = await prisma.procedureRecord.findMany({
      include: {
        client: {
          select: { full_name: true }
        },
        procedure: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Mapear os resultados para o formato que o frontend espera (similar ao que foi mockado)
    const formattedRecords = procedureRecords.map(record => ({
      id: record.id,
      client_name: record.client?.full_name || 'Desconhecido',
      procedure_name: record.procedure?.name || 'Desconhecido',
      date: record.date,
      amount_charged: record.charged_value,
      professional_name: record.professional,
      status: record.status,
      notes: record.notes
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error("Erro ao buscar procedure-records:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
