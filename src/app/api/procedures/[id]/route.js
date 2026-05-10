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

function payload(data) {
  return {
    name: data.name,
    category: data.category || null,
    description: data.description || null,
    default_price: Number(data.default_price ?? 0),
    is_active: data.is_active ?? true
  };
}

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  const procedure = await prisma.procedure.findUnique({ where: { id } });
  if (!procedure) return NextResponse.json({ detail: "Procedimento não encontrado" }, { status: 404 });
  return NextResponse.json(procedure);
}

export async function PUT(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const data = await req.json();
    const procedure = await prisma.procedure.update({
      where: { id },
      data: payload(data)
    });
    return NextResponse.json(procedure);
  } catch (error) {
    console.error("Erro ao atualizar procedimento:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, ctx) {
  return PUT(req, ctx);
}

export async function DELETE(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  await prisma.procedure.update({
    where: { id },
    data: { is_active: false }
  });
  return NextResponse.json({ message: "Procedimento inativado com sucesso" });
}
