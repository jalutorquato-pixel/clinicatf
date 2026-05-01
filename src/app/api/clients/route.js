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
    const clients = await prisma.client.findMany({
      where: { is_active: true },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const newClient = await prisma.client.create({
      data: {
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        cpf: data.cpf,
        birth_date: data.birth_date ? new Date(data.birth_date) : null,
        address: data.address,
        zip_code: data.zip_code,
        street: data.street,
        address_number: data.address_number,
        address_complement: data.address_complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        origin: data.origin,
        notes: data.notes
      }
    });
    return NextResponse.json(newClient);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
