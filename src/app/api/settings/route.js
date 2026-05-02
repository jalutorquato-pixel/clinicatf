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
    const settings = await prisma.setting.findMany({
      orderBy: { id: 'asc' }
    });
    
    // Convert array to object
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });
    
    return NextResponse.json(settingsObject);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    
    // Update or create each setting
    const updates = [];
    for (const [key, value] of Object.entries(data)) {
      const update = await prisma.setting.upsert({
        where: { key },
        update: { value: value ? String(value) : null },
        create: { key, value: value ? String(value) : null }
      });
      updates.push(update);
    }
    
    return NextResponse.json({ message: "Configurações atualizadas com sucesso", settings: updates });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ detail: "Chave é requerida" }, { status: 400 });

    await prisma.setting.delete({
      where: { key }
    });
    return NextResponse.json({ message: "Configuração deletada com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
