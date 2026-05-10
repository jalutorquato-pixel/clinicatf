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

function formatReferral(referral) {
  return {
    ...referral,
    created_at: referral.referred_at,
    ambassador_name: referral.ambassador?.public_name,
    client_name: referral.client?.full_name
  };
}

async function ensureActiveCycle() {
  const existing = await prisma.cycle.findFirst({ where: { status: 'ativo' } });
  if (existing) return existing;

  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 90);

  return prisma.cycle.create({
    data: {
      name: 'Ciclo Atual',
      start_date: today,
      end_date: end,
      status: 'ativo'
    }
  });
}

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  const referral = await prisma.referral.findUnique({
    where: { id },
    include: { ambassador: true, client: true }
  });
  if (!referral) return NextResponse.json({ detail: "Indicação não encontrada" }, { status: 404 });
  return NextResponse.json(formatReferral(referral));
}

export async function PATCH(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const data = await req.json();
    const existing = await prisma.referral.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ detail: "Indicação não encontrada" }, { status: 404 });

    const shouldValidatePoint = data.status === 'ponto_validado' && !existing.generated_point;
    const cycle = shouldValidatePoint ? await ensureActiveCycle() : null;

    const referral = await prisma.$transaction(async (tx) => {
      const updated = await tx.referral.update({
        where: { id },
        data: {
          status: data.status,
          coupon_used: data.coupon_used,
          channel: data.channel,
          generated_point: shouldValidatePoint ? true : data.generated_point,
          point_validated_at: shouldValidatePoint ? new Date() : (data.point_validated_at ? new Date(data.point_validated_at) : undefined),
          notes: data.notes
        },
        include: { ambassador: true, client: true }
      });

      if (shouldValidatePoint) {
        await tx.point.create({
          data: {
            ambassador_id: existing.ambassador_id,
            referral_id: id,
            cycle_id: cycle.id,
            points: Number(data.points || 1),
            reason: 'Indicação validada',
            validated_by: user.username || user.sub || 'Sistema'
          }
        });
      }

      return updated;
    });

    return NextResponse.json(formatReferral(referral));
  } catch (error) {
    console.error("Erro ao atualizar indicação:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, ctx) {
  return PATCH(req, ctx);
}

export async function DELETE(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  await prisma.referral.delete({ where: { id } });
  return NextResponse.json({ message: "Indicação deletada com sucesso" });
}
