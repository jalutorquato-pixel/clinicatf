"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Trophy, Target, Users, TrendingUp, DollarSign, Star, Gift, CheckCircle } from 'lucide-react';
import apiClient from "../../../api/client";
import { MetricCard, DataTable, StatusBadge, Toast } from '../../../components/ui';

export default function EmbaixadoraDashboard() {
  const { id } = useParams();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/ambassadors/${id}/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erro ao buscar dashboard da embaixadora:', error);
      showToast('Erro ao carregar dados. Usando dados de teste.', 'error');
      
      // Mock de dados caso a API não esteja pronta
      setDashboardData({
        ambassador: {
          id: id,
          public_name: 'Ana Beauty',
          coupon_code: 'ANAB10',
          level: 'avançada',
          status: 'ativa',
          link: `https://clinica.com/indica/ANAB10`
        },
        metrics: {
          current_cycle_points: 450,
          historical_points: 1200,
          ranking_position: 3,
          total_referrals: 25,
          valid_referrals: 18,
          conversion_rate: 72.0,
          generated_revenue: 4500.00
        },
        benefits: {
          next_benefit: {
            name: 'Limpeza de Pele Profunda',
            points_required: 500,
            points_remaining: 50
          },
          earned_benefits: [
            { id: 1, name: 'Sessão de Laser', status: 'utilizado', date_earned: '2023-08-15' },
            { id: 2, name: 'Peeling Químico', status: 'agendado', date_earned: '2023-10-05' },
            { id: 3, name: 'Massagem Relaxante', status: 'conquistado', date_earned: '2023-10-20' }
          ]
        },
        credits: {
          available_amount: 150.00
        },
        referred_clients: [
          { id: 1, name: 'Carlos Santos', date: '2023-10-15', status: 'compra_realizada', points_generated: 50, revenue: 200.00 },
          { id: 2, name: 'Mariana Lima', date: '2023-10-22', status: 'agendado', points_generated: 0, revenue: 0.00 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  const handleCopyLink = () => {
    if (dashboardData?.ambassador?.link) {
      navigator.clipboard.writeText(dashboardData.ambassador.link);
      showToast('Link de indicação copiado!', 'success');
    }
  };

  if (isLoading) return <div className="loading-state">Carregando painel da embaixadora...</div>;
  if (!dashboardData) return <div className="loading-state">Dados não encontrados.</div>;

  const { ambassador, metrics, benefits, credits, referred_clients } = dashboardData;

  // Calcula porcentagem de progresso para o próximo benefício
  const progressPercent = benefits.next_benefit 
    ? Math.min(100, Math.round(((benefits.next_benefit.points_required - benefits.next_benefit.points_remaining) / benefits.next_benefit.points_required) * 100))
    : 100;

  return (
    <div className="page-container">
      {/* Header e Ações */}
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => router.push('/embaixadoras')} title="Voltar">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {ambassador.public_name} 
              <span style={{ fontSize: '0.875rem', fontWeight: '500', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#eab308', color: 'white', textTransform: 'capitalize' }}>
                {ambassador.level}
              </span>
            </h1>
            <p className="page-subtitle">Dashboard de Performance</p>
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', maxWidth: '400px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Cupom / Link Exclusivo</p>
            <div style={{ fontWeight: '600', color: 'var(--color-teal)', fontSize: '1.125rem' }}>{ambassador.coupon_code}</div>
          </div>
          <button className="btn-secondary flex-center" onClick={handleCopyLink} style={{ padding: '0.5rem' }} title="Copiar Link">
            <Copy size={16} /> Copiar
          </button>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <MetricCard title="Pontos no Ciclo" value={`${metrics.current_cycle_points} pts`} icon={Target} />
        <MetricCard title="Posição no Ranking" value={`${metrics.ranking_position}º Lugar`} icon={Trophy} />
        <MetricCard title="Indicações (Totais / Válidas)" value={`${metrics.total_referrals} / ${metrics.valid_referrals}`} icon={Users} />
        <MetricCard title="Taxa de Conversão" value={`${metrics.conversion_rate}%`} icon={TrendingUp} />
        <MetricCard title="Receita Gerada" value={`R$ ${metrics.generated_revenue.toFixed(2)}`} icon={DollarSign} />
        <MetricCard title="Créditos Disponíveis" value={`R$ ${credits.available_amount.toFixed(2)}`} icon={Gift} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Seção de Benefícios e Progresso */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Próximo Benefício */}
          {benefits.next_benefit && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={18} color="var(--color-teal)" /> Próxima Conquista
              </h3>
              <p style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.5rem' }}>{benefits.next_benefit.name}</p>
              <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '999px', height: '8px', marginBottom: '0.5rem' }}>
                <div style={{ backgroundColor: 'var(--color-teal)', height: '8px', borderRadius: '999px', width: `${progressPercent}%` }}></div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'right' }}>Faltam <strong>{benefits.next_benefit.points_remaining} pts</strong></p>
            </div>
          )}

          {/* Histórico de Benefícios */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} color="var(--color-teal)" /> Benefícios Conquistados
            </h3>
            
            {benefits.earned_benefits.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Nenhum benefício conquistado ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {benefits.earned_benefits.map(benefit => (
                  <div key={benefit.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                      <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>{benefit.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(benefit.date_earned).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <StatusBadge status={benefit.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Indicados */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '1rem' }}>Histórico de Indicações</h3>
          <DataTable 
            columns={[
              { header: 'Data', render: (row) => new Date(row.date).toLocaleDateString('pt-BR') },
              { header: 'Nome', accessor: 'name' },
              { header: 'Status', render: (row) => <StatusBadge status={row.status.replace('_', ' ')} /> },
              { header: 'Pontos', render: (row) => <span style={{ color: row.points_generated > 0 ? 'var(--color-teal)' : '#9ca3af', fontWeight: '600' }}>+{row.points_generated}</span> },
              { header: 'Receita', render: (row) => `R$ ${row.revenue.toFixed(2)}` },
            ]}
            data={referred_clients}
          />
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
