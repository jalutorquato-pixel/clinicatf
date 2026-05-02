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
    const contracts = await prisma.generatedContract.findMany({
      include: {
        client: true,
        template: true,
        procedure_record: true
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(contracts);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const newContract = await prisma.generatedContract.create({
      data: {
        client_id: data.client_id,
        procedure_record_id: data.procedure_record_id,
        template_id: data.template_id,
        final_content: data.final_content,
        status: data.status || 'gerado',
        notes: data.notes
      },
      include: {
        client: true,
        template: true,
        procedure_record: true
      }
    });
    return NextResponse.json(newContract);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ detail: "ID é requerido" }, { status: 400 });

    const updatedContract = await prisma.generatedContract.update({
      where: { id: parseInt(id) },
      data: {
        status: data.status,
        final_content: data.final_content,
        signed_at: data.signed_at ? new Date(data.signed_at) : undefined,
        notes: data.notes
      },
      include: {
        client: true,
        template: true,
        procedure_record: true
      }
    });
    return NextResponse.json(updatedContract);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ detail: "ID é requerido" }, { status: 400 });

    await prisma.generatedContract.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ message: "Contrato deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
