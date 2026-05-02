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
    const records = await prisma.anamnesisRecord.findMany({
      include: {
        client: true,
        appointment: true,
        template: true
      },
      orderBy: { id: 'desc' }
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
    const newRecord = await prisma.anamnesisRecord.create({
      data: {
        client_id: data.client_id,
        appointment_id: data.appointment_id,
        template_id: data.template_id,
        title: data.title,
        answers: data.answers,
        status: data.status || 'pendente'
      },
      include: {
        client: true,
        appointment: true,
        template: true
      }
    });
    return NextResponse.json(newRecord);
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

    const updatedRecord = await prisma.anamnesisRecord.update({
      where: { id: parseInt(id) },
      data: {
        title: data.title,
        answers: data.answers,
        status: data.status,
        signed_at: data.signed_at ? new Date(data.signed_at) : undefined
      },
      include: {
        client: true,
        appointment: true,
        template: true
      }
    });
    return NextResponse.json(updatedRecord);
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

    await prisma.anamnesisRecord.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ message: "Registro de anamnese deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
