import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';

export async function POST(req) {
  try {
    const textData = await req.text();
    const params = new URLSearchParams(textData);
    const username = params.get('username');
    const password = params.get('password');

    if (!username || !password) {
      return NextResponse.json({ detail: "Usuário e senha são obrigatórios" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: username,
        is_active: true
      }
    });

    if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
      return NextResponse.json({ detail: "Usuário ou senha inválidos" }, { status: 401 });
    }

    const token = jwt.sign({ sub: user.username }, SECRET_KEY, { expiresIn: '1d' });

    return NextResponse.json({ access_token: token, token_type: "bearer" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
