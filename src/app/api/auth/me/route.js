import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: "Token não fornecido" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (e) {
      return NextResponse.json({ detail: "Token inválido ou expirado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        username: decoded.sub
      },
      select: {
        id: true,
        username: true,
        is_active: true
      }
    });

    if (!user) {
      return NextResponse.json({ detail: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
