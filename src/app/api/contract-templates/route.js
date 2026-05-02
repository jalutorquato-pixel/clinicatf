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
    const templates = await prisma.contractTemplate.findMany({
      where: { is_active: true },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const newTemplate = await prisma.contractTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        content: data.content,
        is_active: data.is_active ?? true
      }
    });
    return NextResponse.json(newTemplate);
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

    const updatedTemplate = await prisma.contractTemplate.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        category: data.category,
        content: data.content,
        is_active: data.is_active
      }
    });
    return NextResponse.json(updatedTemplate);
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

    // Soft delete - apenas marca como inativo
    await prisma.contractTemplate.update({
      where: { id: parseInt(id) },
      data: { is_active: false }
    });
    return NextResponse.json({ message: "Modelo de contrato deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
