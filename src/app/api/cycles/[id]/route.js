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

export async function PATCH(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const data = await req.json();
    if (data.status === 'ativo') {
      await prisma.cycle.updateMany({
        where: { status: 'ativo', id: { not: id } },
        data: { status: 'encerrado' }
      });
    }

    const cycle = await prisma.cycle.update({
      where: { id },
      data: {
        status: data.status,
        name: data.name,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
        notes: data.notes
      }
    });

    return NextResponse.json(cycle);
  } catch (error) {
    console.error("Erro ao atualizar ciclo:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, ctx) {
  return PATCH(req, ctx);
}
