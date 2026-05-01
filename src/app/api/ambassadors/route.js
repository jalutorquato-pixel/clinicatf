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
    const ambassadors = await prisma.ambassador.findMany({
      include: {
        client: true
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(ambassadors);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
