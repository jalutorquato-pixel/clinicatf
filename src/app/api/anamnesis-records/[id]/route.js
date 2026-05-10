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

function formatRecord(record) {
  return {
    ...record,
    date: record.created_at,
    client_name: record.client?.full_name,
    template_name: record.template?.name
  };
}

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  const record = await prisma.anamnesisRecord.findUnique({
    where: { id },
    include: { client: true, appointment: true, template: true }
  });
  if (!record) return NextResponse.json({ detail: "Anamnese não encontrada" }, { status: 404 });
  return NextResponse.json(formatRecord(record));
}

export async function PUT(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const data = await req.json();
    const record = await prisma.anamnesisRecord.update({
      where: { id },
      data: {
        title: data.title,
        answers: data.answers,
        status: data.status,
        signed_at: data.signed_at ? new Date(data.signed_at) : undefined
      },
      include: { client: true, appointment: true, template: true }
    });
    return NextResponse.json(formatRecord(record));
  } catch (error) {
    console.error("Erro ao atualizar anamnese:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, ctx) {
  return PUT(req, ctx);
}
