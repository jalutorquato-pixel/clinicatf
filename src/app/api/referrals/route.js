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
    const referrals = await prisma.referral.findMany({
      include: {
        ambassador: true,
        client: true
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(referrals);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const newReferral = await prisma.referral.create({
      data: {
        ambassador_id: data.ambassador_id,
        client_id: data.client_id,
        referred_name: data.referred_name,
        referred_phone: data.referred_phone,
        referred_email: data.referred_email,
        coupon_used: data.coupon_used,
        channel: data.channel || 'recepção',
        status: data.status || 'recebida',
        notes: data.notes
      },
      include: {
        ambassador: true,
        client: true
      }
    });
    return NextResponse.json(newReferral);
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

    const updatedReferral = await prisma.referral.update({
      where: { id: parseInt(id) },
      data: {
        status: data.status,
        coupon_used: data.coupon_used,
        channel: data.channel,
        generated_point: data.generated_point,
        point_validated_at: data.point_validated_at ? new Date(data.point_validated_at) : undefined,
        notes: data.notes
      },
      include: {
        ambassador: true,
        client: true
      }
    });
    return NextResponse.json(updatedReferral);
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

    await prisma.referral.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ message: "Indicação deletada com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
