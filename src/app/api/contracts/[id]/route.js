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

function formatContract(contract) {
  return {
    ...contract,
    created_at: contract.generated_at,
    client_name: contract.client?.full_name,
    template_name: contract.template?.name
  };
}

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  const contract = await prisma.generatedContract.findUnique({
    where: { id },
    include: { client: true, template: true, procedure_record: true }
  });
  if (!contract) return NextResponse.json({ detail: "Contrato não encontrado" }, { status: 404 });
  return NextResponse.json(formatContract(contract));
}

export async function PATCH(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const data = await req.json();
    const contract = await prisma.generatedContract.update({
      where: { id },
      data: {
        status: data.status,
        final_content: data.final_content,
        signed_at: data.status === 'assinado' ? new Date() : (data.signed_at ? new Date(data.signed_at) : undefined),
        notes: data.notes
      },
      include: { client: true, template: true, procedure_record: true }
    });
    return NextResponse.json(formatContract(contract));
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error);
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

  await prisma.generatedContract.delete({ where: { id } });
  return NextResponse.json({ message: "Contrato deletado com sucesso" });
}
