import { NextResponse } from 'next/server';

export async function GET() {
  // Retorna os dados mockados do dashboard como no backend/frontend original
  return NextResponse.json({
    metrics: {
      total_clientes: 1240,
      embaixadoras_ativas: 45,
      indicacoes_mes: 120,
      indicacoes_validas_mes: 85,
      taxa_conversao: 70.8,
      procedimentos_mes: 312,
      receita_indicados: 45200.00,
      beneficios_pendentes: 12,
      contratos_pendentes: 5
    },
    charts: {
      indicacoes_por_mes: [
        { mes: 'Mai', indicacoes: 65, validas: 40 },
        { mes: 'Jun', indicacoes: 78, validas: 50 },
        { mes: 'Jul', indicacoes: 90, validas: 62 },
        { mes: 'Ago', indicacoes: 105, validas: 75 },
        { mes: 'Set', indicacoes: 110, validas: 80 },
        { mes: 'Out', indicacoes: 120, validas: 85 }
      ],
      procedimentos_tipo: [
        { name: 'Botox', value: 45 },
        { name: 'Limpeza de Pele', value: 25 },
        { name: 'Preenchimento', value: 20 },
        { name: 'Laser', value: 10 }
      ],
      pontos_embaixadora: [
        { nome: 'Ana Beauty', pontos: 1250 },
        { nome: 'Maria S.', pontos: 950 },
        { nome: 'Clara M.', pontos: 800 },
        { nome: 'Juliana', pontos: 600 },
        { nome: 'Bia Clinic', pontos: 450 }
      ],
      receita_embaixadora: [
        { nome: 'Ana Beauty', receita: 12500 },
        { nome: 'Maria S.', receita: 9000 },
        { nome: 'Clara M.', receita: 7500 },
        { nome: 'Juliana', receita: 5800 },
        { nome: 'Bia Clinic', receita: 4000 }
      ]
    },
    ranking_ciclo: [
      { posicao: 1, embaixadora: 'Ana Beauty', nivel: 'Elite', pontos: 1250 },
      { posicao: 2, embaixadora: 'Maria Silva', nivel: 'Avançada', pontos: 950 },
      { posicao: 3, embaixadora: 'Clara Marques', nivel: 'Avançada', pontos: 800 },
      { posicao: 4, embaixadora: 'Juliana Castro', nivel: 'Comum', pontos: 600 },
      { posicao: 5, embaixadora: 'Bia Clinic', nivel: 'Comum', pontos: 450 }
    ]
  });
}
