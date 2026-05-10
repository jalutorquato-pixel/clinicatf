import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';

export const dynamic = 'force-dynamic';

const PROFESSIONALS = [
  { id: 1, name: 'Dra. Ana' },
  { id: 2, name: 'Dr. Carlos' },
];

async function getUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try { return jwt.verify(token, SECRET_KEY); } catch (e) { return null; }
}

function resolveProfessionalName(data) {
  if (typeof data.professional === 'string' && data.professional.trim()) {
    return data.professional.trim();
  }

  const professionalId = Number(data.professional_id);
  if (Number.isInteger(professionalId)) {
    return PROFESSIONALS.find((p) => p.id === professionalId)?.name ?? null;
  }

  return null;
}

function formatAppointment(record) {
  return {
    ...record,
    client_name: record.client?.full_name ?? null,
    procedure_name: record.procedure?.name ?? null,
    professional_name: record.professional ?? null,
    start_time: record.start_at,
    end_time: record.end_at,
  };
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    
    let where = {};
    if (clientId) {
      where.client_id = parseInt(clientId);
    }

    const records = await prisma.appointment.findMany({
      where,
      include: { client: { select: { full_name: true } }, procedure: { select: { name: true } } },
      orderBy: { start_at: 'asc' },
    });
    return NextResponse.json(records.map(formatAppointment));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: 'Não autorizado' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return NextResponse.json(
      { detail: 'Content-Type must be application/json' },
      { status: 415 }
    );
  }

  try {
    const data = await req.json();
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const room = typeof data.room === 'string' ? data.room.trim() : '';
    const status = typeof data.status === 'string' && data.status.trim() ? data.status : 'agendado';
    const color = typeof data.color === 'string' && data.color.trim() ? data.color : null;
    const notes = typeof data.notes === 'string' && data.notes.trim() ? data.notes.trim() : null;
    const professional = resolveProfessionalName(data);

    if (!title) {
      return NextResponse.json({ detail: 'Título é obrigatório' }, { status: 400 });
    }

    if (!room) {
      return NextResponse.json({ detail: 'Sala é obrigatória' }, { status: 400 });
    }

    if (!professional) {
      return NextResponse.json({ detail: 'Profissional é obrigatório' }, { status: 400 });
    }

    if (!data.start_time) {
      return NextResponse.json({ detail: 'Horário inicial é obrigatório' }, { status: 400 });
    }

    const startAt = new Date(data.start_time);
    const endAt = data.end_time ? new Date(data.end_time) : null;

    if (Number.isNaN(startAt.getTime())) {
      return NextResponse.json({ detail: 'Horário inicial inválido' }, { status: 400 });
    }

    if (endAt && Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ detail: 'Horário final inválido' }, { status: 400 });
    }

    const clientId = data.client_id ? Number(data.client_id) : null;
    const procedureId = data.procedure_id ? Number(data.procedure_id) : null;

    const appointment = await prisma.appointment.create({
      data: {
        title,
        client_id: Number.isInteger(clientId) ? clientId : null,
        procedure_id: Number.isInteger(procedureId) ? procedureId : null,
        professional,
        room,
        start_at: startAt,
        end_at: endAt,
        status,
        color,
        notes,
      },
      include: {
        client: { select: { full_name: true } },
        procedure: { select: { name: true } },
      },
    });

    return NextResponse.json(formatAppointment(appointment), { status: 201 });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}
