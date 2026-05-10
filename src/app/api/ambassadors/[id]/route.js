import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';
export const dynamic = 'force-dynamic';

async function getUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try { return jwt.verify(authHeader.split(' ')[1], SECRET_KEY); } catch (e) { return null; }
}

function parseId(params) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
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

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  const ambassador = await prisma.ambassador.findUnique({
    where: { id },
    include: { client: true, points: true }
  });

  if (!ambassador) return NextResponse.json({ detail: "Embaixadora não encontrada" }, { status: 404 });
  return NextResponse.json(formatAmbassador(ambassador));
}

export async function PUT(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const data = await req.json();
    const coupon = sanitizeCoupon(data.coupon_code || data.coupon);
    const ambassador = await prisma.ambassador.update({
      where: { id },
      data: {
        public_name: data.public_name,
        coupon,
        exclusive_link: data.exclusive_link || `https://wa.me/?text=${encodeURIComponent(`Tenho o cupom ${coupon}`)}`,
        status: data.status,
        level: data.level,
        notes: data.notes
      },
      include: { client: true, points: true }
    });

    return NextResponse.json(formatAmbassador(ambassador));
  } catch (error) {
    console.error("Erro ao atualizar embaixadora:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, ctx) {
  return PUT(req, ctx);
}

export async function DELETE(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  await prisma.ambassador.update({
    where: { id },
    data: { status: 'inativa' }
  });

  return NextResponse.json({ message: "Embaixadora inativada com sucesso" });
}
