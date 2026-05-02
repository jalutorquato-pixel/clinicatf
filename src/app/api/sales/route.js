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
    const sales = await prisma.sale.findMany({
      include: {
        client: true,
        appointment: true,
        items: {
          include: {
            procedure: true,
            product: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const newSale = await prisma.sale.create({
      data: {
        client_id: data.client_id,
        appointment_id: data.appointment_id,
        type: data.type || 'orcamento',
        status: data.status || 'aberto',
        sale_date: data.sale_date ? new Date(data.sale_date) : new Date(),
        due_date: data.due_date ? new Date(data.due_date) : null,
        total: data.total || 0,
        paid_value: data.paid_value || 0,
        payment_method: data.payment_method,
        professional: data.professional,
        notes: data.notes
      },
      include: {
        client: true,
        appointment: true,
        items: true
      }
    });
    return NextResponse.json(newSale);
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

    const updatedSale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: {
        status: data.status,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
        total: data.total,
        paid_value: data.paid_value,
        payment_method: data.payment_method,
        notes: data.notes
      },
      include: {
        client: true,
        appointment: true,
        items: true
      }
    });
    return NextResponse.json(updatedSale);
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

    await prisma.sale.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ message: "Venda deletada com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
