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

function monthKey(date) {
  return new Date(date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalClientes,
      embaixadorasAtivas,
      referrals,
      procedureRecords,
      sales,
      earnedBenefitsPending,
      contractsPending,
      ambassadors
    ] = await Promise.all([
      prisma.client.count({ where: { is_active: true } }),
      prisma.ambassador.count({ where: { status: 'ativa' } }),
      prisma.referral.findMany({
        where: { referred_at: { gte: sixMonthsAgo } },
        include: { ambassador: true }
      }),
      prisma.procedureRecord.findMany({
        where: { date: { gte: sixMonthsAgo } },
        include: { procedure: true }
      }),
      prisma.sale.findMany({ where: { sale_date: { gte: sixMonthsAgo } }, include: { client: true } }),
      prisma.earnedBenefit.count({ where: { status: 'conquistado' } }),
      prisma.generatedContract.count({ where: { status: { in: ['gerado', 'impresso'] } } }),
      prisma.ambassador.findMany({ include: { points: true } })
    ]);

    const referralsMonth = referrals.filter(ref => new Date(ref.referred_at) >= monthStart);
    const validReferralsMonth = referralsMonth.filter(ref => ref.status === 'ponto_validado' || ref.generated_point);
    const proceduresMonth = procedureRecords.filter(record => new Date(record.date) >= monthStart);
    const receitaIndicados = sales.reduce((sum, sale) => sum + sale.total, 0);

    const monthBuckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { key: `${date.getFullYear()}-${date.getMonth()}`, mes: monthKey(date), indicacoes: 0, validas: 0 };
    });

    referrals.forEach(ref => {
      const date = new Date(ref.referred_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = monthBuckets.find(item => item.key === key);
      if (bucket) {
        bucket.indicacoes += 1;
        if (ref.status === 'ponto_validado' || ref.generated_point) bucket.validas += 1;
      }
    });

    const procedureMap = new Map();
    procedureRecords.forEach(record => {
      const name = record.procedure?.name || 'Procedimento';
      procedureMap.set(name, (procedureMap.get(name) || 0) + 1);
    });

    const ambassadorRanking = ambassadors
      .map(ambassador => ({
        posicao: 0,
        embaixadora: ambassador.public_name,
        nivel: ambassador.level,
        pontos: ambassador.points.reduce((sum, point) => sum + point.points, 0)
      }))
      .sort((a, b) => b.pontos - a.pontos)
      .map((row, index) => ({ ...row, posicao: index + 1 }));

    return NextResponse.json({
      metrics: {
        total_clientes: totalClientes,
        embaixadoras_ativas: embaixadorasAtivas,
        indicacoes_mes: referralsMonth.length,
        indicacoes_validas_mes: validReferralsMonth.length,
        taxa_conversao: referralsMonth.length ? Number(((validReferralsMonth.length / referralsMonth.length) * 100).toFixed(1)) : 0,
        procedimentos_mes: proceduresMonth.length,
        receita_indicados: receitaIndicados,
        beneficios_pendentes: earnedBenefitsPending,
        contratos_pendentes: contractsPending
      },
      charts: {
        indicacoes_por_mes: monthBuckets.map(({ key, ...bucket }) => bucket),
        procedimentos_tipo: Array.from(procedureMap.entries()).map(([name, value]) => ({ name, value })).slice(0, 6),
        pontos_embaixadora: ambassadorRanking.slice(0, 5).map(row => ({ nome: row.embaixadora, pontos: row.pontos })),
        receita_embaixadora: sales.slice(0, 5).map(sale => ({ nome: sale.client?.full_name || 'Avulso', receita: sale.total }))
      },
      ranking_ciclo: ambassadorRanking.slice(0, 10)
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
