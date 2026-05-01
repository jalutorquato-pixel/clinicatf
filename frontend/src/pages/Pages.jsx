import { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Share2, CheckCircle, Percent, Stethoscope, 
  DollarSign, Gift, FileSignature 
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import apiClient from '../api/client';
import { MetricCard, DataTable } from '../components/ui';

const COLORS = ['#1D9E75', '#D85A30', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Pages() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/dashboard').catch(() => ({
        // MOCK DE DADOS CASO A API NÃO ESTEJA PRONTA
        data: {
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
        }
      }));
      
      setData(res.data);
    } catch (error) {
      console.error("Erro ao buscar dashboard", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom Label para o Pie Chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    if (percent < 0.05) return null; // Não exibe se for menor que 5%
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const columnsRanking = [
    { header: 'Posição', accessor: 'posicao', render: (row) => <strong style={{ color: 'var(--color-teal)' }}>#{row.posicao}</strong> },
    { header: 'Embaixadora', accessor: 'embaixadora', render: (row) => <span style={{ fontWeight: 500 }}>{row.embaixadora}</span> },
    { 
      header: 'Nível', 
      render: (row) => (
        <span style={{ 
          color: row.nivel === 'Elite' ? '#d97706' : row.nivel === 'Avançada' ? '#2563eb' : '#6b7280',
          fontWeight: 600 
        }}>
          {row.nivel}
        </span>
      ) 
    },
    { header: 'Pontos do Ciclo', accessor: 'pontos', render: (row) => <strong>{row.pontos} pts</strong> }
  ];

  if (isLoading) {
    return <div className="page-container"><div className="loading-state">Carregando painel analítico...</div></div>;
  }

  if (!data) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel de Controle</h1>
          <p className="page-subtitle">Visão geral do desempenho da clínica e do programa de embaixadoras</p>
        </div>
      </div>

      {/* MÉTRICAS (KPIs) - 3 colunas em telas grandes, 2 médias, 1 celular */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <MetricCard title="Total de Clientes" value={data.metrics?.total_clientes || 0} icon={Users} />
        <MetricCard title="Embaixadoras Ativas" value={data.metrics?.embaixadoras_ativas || 0} icon={UserCheck} />
        <MetricCard title="Indicações no Mês" value={data.metrics?.indicacoes_mes || 0} icon={Share2} />
        <MetricCard title="Indicações Válidas (Mês)" value={data.metrics?.indicacoes_validas_mes || 0} icon={CheckCircle} />
        <MetricCard title="Taxa de Conversão" value={`${data.metrics?.taxa_conversao || 0}%`} icon={Percent} />
        <MetricCard title="Procedimentos (Mês)" value={data.metrics?.procedimentos_mes || 0} icon={Stethoscope} />
        <MetricCard title="Receita de Indicados" value={`R$ ${(data.metrics?.receita_indicados || 0).toLocaleString('pt-BR')}`} icon={DollarSign} />
        <MetricCard title="Benefícios Pendentes" value={data.metrics?.beneficios_pendentes || 0} icon={Gift} />
        <MetricCard title="Contratos Pendentes" value={data.metrics?.contratos_pendentes || 0} icon={FileSignature} />
      </div>

      {/* GRÁFICOS RECHARTS - Grid Responsivo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Gráfico 1: Evolução das Indicações */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>Evolução de Indicações vs Válidas</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={data.charts?.indicacoes_por_mes || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '14px' }} />
                <Line type="monotone" dataKey="indicacoes" name="Total Recebidas" stroke="#D85A30" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="validas" name="Convertidas" stroke="#1D9E75" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribuição de Procedimentos */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>Distribuição por Tipo de Procedimento</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.charts?.procedimentos_tipo || []}
                  cx="50%" cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(data.charts?.procedimentos_tipo || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Top Embaixadoras (Pontos) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>Top 5 Embaixadoras (Pontuação)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data.charts?.pontos_embaixadora || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} width={80} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="pontos" name="Pontos Gerados" fill="#1D9E75" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 4: Top Embaixadoras (Receita) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>Top 5 Embaixadoras (Receita Gerada)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data.charts?.receita_embaixadora || []} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `R$ ${value/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Bar dataKey="receita" name="Receita Bruta" fill="#D85A30" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABELA DE RANKING (Full Width) */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', marginBottom: '1.5rem' }}>Ranking do Ciclo Atual</h3>
        <DataTable columns={columnsRanking} data={data.ranking_ciclo || []} />
      </div>

    </div>
  );
}
