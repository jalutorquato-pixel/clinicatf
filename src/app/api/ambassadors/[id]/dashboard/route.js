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

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const [ambassador, activeCycle, benefitsCatalog, credits] = await Promise.all([
      prisma.ambassador.findUnique({
        where: { id },
        include: {
          client: true,
          referrals: true,
          points: { include: { cycle: true, referral: true } },
          earned_benefits: { include: { benefit: true } }
        }
      }),
      prisma.cycle.findFirst({ where: { status: 'ativo' } }),
      prisma.benefit.findMany({ where: { is_active: true }, orderBy: { required_points: 'asc' } }),
      prisma.credit.findMany({ where: { ambassador_id: id } })
    ]);

    if (!ambassador) return NextResponse.json({ detail: "Embaixadora não encontrada" }, { status: 404 });

    const currentCyclePoints = ambassador.points
      .filter(point => !activeCycle || point.cycle_id === activeCycle.id)
      .reduce((sum, point) => sum + point.points, 0);
    const historicalPoints = ambassador.points.reduce((sum, point) => sum + point.points, 0);
    const validReferrals = ambassador.referrals.filter(ref => ref.status === 'ponto_validado' || ref.generated_point).length;
    const totalReferrals = ambassador.referrals.length;
    const availableCredit = credits.reduce((sum, credit) => sum + (credit.type === 'uso' ? -credit.value : credit.value), 0);
    const nextBenefit = benefitsCatalog.find(benefit => benefit.required_points > currentCyclePoints);

    return NextResponse.json({
      ambassador: {
        id: ambassador.id,
        public_name: ambassador.public_name,
        coupon_code: ambassador.coupon,
        level: ambassador.level,
        status: ambassador.status,
        link: ambassador.exclusive_link
      },
      metrics: {
        current_cycle_points: currentCyclePoints,
        historical_points: historicalPoints,
        ranking_position: 1,
        total_referrals: totalReferrals,
        valid_referrals: validReferrals,
        conversion_rate: totalReferrals ? Number(((validReferrals / totalReferrals) * 100).toFixed(1)) : 0,
        generated_revenue: 0
      },
      benefits: {
        next_benefit: nextBenefit ? {
          name: nextBenefit.name,
          points_required: nextBenefit.required_points,
          points_remaining: nextBenefit.required_points - currentCyclePoints
        } : null,
        earned_benefits: ambassador.earned_benefits.map(item => ({
          id: item.id,
          name: item.benefit?.name,
          status: item.status,
          date_earned: item.earned_at
        }))
      },
      credits: {
        available_amount: availableCredit
      },
      referred_clients: ambassador.referrals.map(referral => ({
        id: referral.id,
        name: referral.referred_name,
        date: referral.referred_at,
        status: referral.status,
        points_generated: referral.generated_point ? 1 : 0,
        revenue: 0
      }))
    });
  } catch (error) {
    console.error("Erro no dashboard da embaixadora:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
