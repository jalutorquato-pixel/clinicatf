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
    const entries = await prisma.accountEntry.findMany({
      include: {
        client: true,
        sale: true
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const newEntry = await prisma.accountEntry.create({
      data: {
        type: data.type || 'receita',
        description: data.description,
        client_id: data.client_id,
        sale_id: data.sale_id,
        category: data.category,
        due_date: data.due_date ? new Date(data.due_date) : new Date(),
        value: data.value || 0,
        status: data.status || 'nao_pago',
        payment_method: data.payment_method,
        notes: data.notes
      },
      include: {
        client: true,
        sale: true
      }
    });
    return NextResponse.json(newEntry);
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

    const updatedEntry = await prisma.accountEntry.update({
      where: { id: parseInt(id) },
      data: {
        type: data.type,
        description: data.description,
        category: data.category,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
        paid_at: data.paid_at ? new Date(data.paid_at) : undefined,
        value: data.value,
        status: data.status,
        payment_method: data.payment_method,
        notes: data.notes
      },
      include: {
        client: true,
        sale: true
      }
    });
    return NextResponse.json(updatedEntry);
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

    await prisma.accountEntry.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ message: "Lançamento contábil deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
