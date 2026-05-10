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

function parseId(params) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function formatAppointment(r) {
  return {
    ...r,
    client_name: r.client?.full_name,
    procedure_name: r.procedure?.name,
    start_time: r.start_at,
    end_time: r.end_at,
    professional_name: r.professional
  };
}

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, procedure: true }
  });
  if (!appointment) return NextResponse.json({ detail: "Agendamento não encontrado" }, { status: 404 });
  return NextResponse.json(formatAppointment(appointment));
}

export async function PATCH(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const data = await req.json();
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        start_at: data.start_time ? new Date(data.start_time) : undefined,
        end_at: data.end_time ? new Date(data.end_time) : undefined
      },
      include: { client: true, procedure: true }
    });
    return NextResponse.json(formatAppointment(appointment));
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, ctx) {
  return PATCH(req, ctx);
}

export async function DELETE(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ message: "Agendamento deletado com sucesso" });
}
