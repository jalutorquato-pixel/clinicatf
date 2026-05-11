
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';

export const dynamic = 'force-dynamic';

async function getUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try { return jwt.verify(token, SECRET_KEY); } catch (e) { return null; }
}

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const record = await prisma.client.findUnique({ where: { id: parseInt(params.id) } });
    if (!record) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    return NextResponse.json(record);
  } catch(e) {
    return NextResponse.json({ detail: "Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const id = parseInt(params.id);
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ detail: "Deleted" });
  } catch(e) {
    return NextResponse.json({ detail: "Error" }, { status: 500 });
  }
}
