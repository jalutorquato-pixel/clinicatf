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

function sanitizeCoupon(value) {
  return String(value || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function formatAmbassador(ambassador) {
  const currentPoints = ambassador.points?.reduce((sum, point) => sum + point.points, 0) || 0;

  return {
    ...ambassador,
    coupon_code: ambassador.coupon,
    link: ambassador.exclusive_link,
    current_points: currentPoints,
    client_name: ambassador.client?.full_name
  };
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const ambassadors = await prisma.ambassador.findMany({
      include: {
        client: true,
        points: true
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(ambassadors.map(formatAmbassador));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const clientId = Number(data.client_id);
    if (!Number.isInteger(clientId) || clientId <= 0) {
      return NextResponse.json({ detail: "Cliente é obrigatório" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ detail: "Cliente não encontrado" }, { status: 404 });

    const publicName = data.public_name || client.full_name;
    const coupon = sanitizeCoupon(data.coupon_code || data.coupon || `${publicName.split(' ')[0]}${clientId}`);

    const ambassador = await prisma.ambassador.create({
      data: {
        client_id: clientId,
        public_name: publicName,
        coupon,
        exclusive_link: data.exclusive_link || `https://wa.me/?text=${encodeURIComponent(`Tenho o cupom ${coupon}`)}`,
        status: data.status || 'ativa',
        level: data.level || 'comum',
        notes: data.notes || null
      },
      include: {
        client: true,
        points: true
      }
    });

    return NextResponse.json(formatAmbassador(ambassador));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
