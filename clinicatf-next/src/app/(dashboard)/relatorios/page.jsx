"use client";

import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, FileText, Gift, Star, DollarSign, Award, Calendar, Filter
} from 'lucide-react';
import apiClient from "../../../api/client";
import { 
  DataTable, 
  CsvExportButton,
  StatusBadge
} from '../../../components/ui';

export default function Relatorios() {
  const [activeReport, setActiveReport] = useState('clientes');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filtros Globais de Data
  const [dateFilter, setDateFilter] = useState({
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1º dia do mês
    end_date: new Date().toISOString().split('T')[0] // Hoje
  });

  const reportsList = [
    { id: 'clientes', name: 'Clientes Cadastrados', icon: Users, endpoint: '/clients' },
    { id: 'indicacoes', name: 'Indicações Realizadas', icon: UserPlus, endpoint: '/referrals' },
    { id: 'procedimentos', name: 'Procedimentos Executados', icon: FileText, endpoint: '/procedure-records' },
    { id: 'pontos', name: 'Pontuação de Embaixadoras', icon: Star, endpoint: '/points' },
    { id: 'beneficios', name: 'Benefícios Resgatados', icon: Gift, endpoint: '/earned-benefits' },
    { id: 'receita', name: 'Receita por Embaixadora', icon: DollarSign, endpoint: '/sales' }, // Simulado a partir das vendas
    { id: 'ranking', name: 'Ranking de Parceiras', icon: Award, endpoint: '/ambassadors' } // Simulado
  ];

  useEffect(() => {
    fetchReportData();
  }, [activeReport, dateFilter]); // Refaz a busca ao trocar de relatório ou data

  const fetchReportData = async () => {
    setIsLoading(true);
    const report = reportsList.find(r => r.id === activeReport);
    
    try {
      // Aqui passaríamos start_date e end_date como params reais para a API
      // const params = { start_date: dateFilter.start_date, end_date: dateFilter.end_date };
      // const res = await apiClient.get(report.endpoint, { params });
      // setData(res.data);
      
      // MOCK DATA PARA DEMONSTRAÇÃO BASEADO NO TIPO
      await new Promise(r => setTimeout(r, 600)); // Simulando delay de rede
      
      let mockData = [];
      if (activeReport === 'clientes') {
        mockData = [
          { id: 1, nome: 'Ana Souza', telefone: '(11) 99999-9999', cidade: 'São Paulo', data_cadastro: '2023-10-01', status: 'ativo' },
          { id: 2, nome: 'Carlos Silva', telefone: '(11) 98888-8888', cidade: 'Campinas', data_cadastro: '2023-10-15', status: 'inativo' }
        ];
      } else if (activeReport === 'indicacoes') {
        mockData = [
          { id: 1, data: '2023-10-20', embaixadora: 'Maria Beauty', indicado: 'Joana Costa', canal: 'Instagram', status: 'ponto_validado' },
          { id: 2, data: '2023-10-22', embaixadora: 'Bia Clinic', indicado: 'Fernando', canal: 'WhatsApp', status: 'cancelada' }
        ];
      } else if (activeReport === 'procedimentos') {
        mockData = [
          { id: 1, data: '2023-10-10', cliente: 'Joana Costa', procedimento: 'Botox 50U', profissional: 'Dra. Ana', valor: 850.00 },
          { id: 2, data: '2023-10-11', cliente: 'Carlos Silva', procedimento: 'Limpeza de Pele', profissional: 'Fátima Esteticista', valor: 120.00 }
        ];
      } else if (activeReport === 'pontos') {
        mockData = [
          { id: 1, data: '2023-10-21', embaixadora: 'Maria Beauty', ciclo: 'Outubro/2023', pontos: 150, indicação_id: 101 },
          { id: 2, data: '2023-10-25', embaixadora: 'Bia Clinic', ciclo: 'Outubro/2023', pontos: 50, indicação_id: 105 }
        ];
      } else if (activeReport === 'beneficios') {
        mockData = [
          { id: 1, data_resgate: '2023-10-26', embaixadora: 'Maria Beauty', beneficio: 'Limpeza de Pele Grátis', pontos_gastos: 300, status: 'agendado' }
        ];
      } else if (activeReport === 'receita') {
        mockData = [
          { embaixadora: 'Maria Beauty', indicacoes_pagas: 5, receita_gerada: 4250.00, comissao_teorica: 425.00 },
          { embaixadora: 'Bia Clinic', indicacoes_pagas: 2, receita_gerada: 1200.00, comissao_teorica: 120.00 }
        ];
      } else if (activeReport === 'ranking') {
        mockData = [
          { posicao: 1, embaixadora: 'Maria Beauty', nivel: 'Elite', pontos_ciclo: 1250, pontos_historicos: 4500 },
          { posicao: 2, embaixadora: 'Bia Clinic', nivel: 'Avançada', pontos_ciclo: 850, pontos_historicos: 1200 },
          { posicao: 3, embaixadora: 'Clara Alves', nivel: 'Comum', pontos_ciclo: 150, pontos_historicos: 150 }
        ];
      }
      
      setData(mockData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Dinamicamente renderiza colunas baseado no tipo de relatório ativo
  const getColumnsForReport = () => {
    switch (activeReport) {
      case 'clientes': return [
        { header: 'Data Cadastro', render: (row) => new Date(row.data_cadastro).toLocaleDateString('pt-BR') },
        { header: 'Nome', accessor: 'nome' },
        { header: 'Telefone', accessor: 'telefone' },
        { header: 'Cidade', accessor: 'cidade' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> }
      ];
      case 'indicacoes': return [
        { header: 'Data', render: (row) => new Date(row.data).toLocaleDateString('pt-BR') },
        { header: 'Embaixadora', accessor: 'embaixadora' },
        { header: 'Indicado', accessor: 'indicado' },
        { header: 'Canal', accessor: 'canal' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> }
      ];
      case 'procedimentos': return [
        { header: 'Data', render: (row) => new Date(row.data).toLocaleDateString('pt-BR') },
        { header: 'Cliente', accessor: 'cliente' },
        { header: 'Procedimento', accessor: 'procedimento' },
        { header: 'Profissional', accessor: 'profissional' },
        { header: 'Valor', render: (row) => `R$ ${parseFloat(row.valor).toFixed(2)}` }
      ];
      case 'pontos': return [
        { header: 'Data', render: (row) => new Date(row.data).toLocaleDateString('pt-BR') },
        { header: 'Embaixadora', accessor: 'embaixadora' },
        { header: 'Ciclo', accessor: 'ciclo' },
        { header: 'Pontos Gerados', accessor: 'pontos', render: (row) => <strong>+{row.pontos} pts</strong> },
        { header: 'Ref. Indicação #', accessor: 'indicação_id' }
      ];
      case 'beneficios': return [
        { header: 'Data Resgate', render: (row) => new Date(row.data_resgate).toLocaleDateString('pt-BR') },
        { header: 'Embaixadora', accessor: 'embaixadora' },
        { header: 'Benefício Escolhido', accessor: 'beneficio' },
        { header: 'Custo (Pts)', accessor: 'pontos_gastos', render: (row) => <span style={{ color: '#ef4444' }}>-{row.pontos_gastos} pts</span> },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> }
      ];
      case 'receita': return [
        { header: 'Embaixadora', accessor: 'embaixadora', render: (row) => <strong>{row.embaixadora}</strong> },
        { header: 'Indicações Pagas', accessor: 'indicacoes_pagas' },
        { header: 'Receita Bruta Gerada', render: (row) => <span style={{ color: 'var(--color-teal)', fontWeight: '600' }}>R$ {parseFloat(row.receita_gerada).toFixed(2)}</span> },
        { header: 'Potencial (10%)', render: (row) => `R$ ${parseFloat(row.comissao_teorica).toFixed(2)}` }
      ];
      case 'ranking': return [
        { header: 'Posição', accessor: 'posicao', render: (row) => <h2>#{row.posicao}</h2> },
        { header: 'Embaixadora', accessor: 'embaixadora' },
        { header: 'Nível', accessor: 'nivel' },
        { header: 'Pontos do Ciclo', accessor: 'pontos_ciclo' },
        { header: 'Pontos Históricos', accessor: 'pontos_historicos' }
      ];
      default: return [];
    }
  };

  const currentReportParams = reportsList.find(r => r.id === activeReport);

  return (
    <div className="page-container" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      
      {/* Sidebar de Relatórios */}
      <div className="card" style={{ width: '280px', flexShrink: 0, padding: '1rem 0' }}>
        <h3 style={{ padding: '0 1.5rem', marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>
          Tipos de Relatório
        </h3>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {reportsList.map(report => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.75rem 1.5rem', border: 'none', background: activeReport === report.id ? 'var(--color-teal-light)' : 'transparent',
                color: activeReport === report.id ? 'var(--color-teal)' : 'var(--text-color)',
                borderRight: activeReport === report.id ? '3px solid var(--color-teal)' : '3px solid transparent',
                fontWeight: activeReport === report.id ? '600' : '400',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <report.icon size={18} />
              {report.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo Principal do Relatório */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Filtros e Cabeçalho */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: 'var(--text-color)' }}>
              {currentReportParams?.icon && <currentReportParams.icon size={24} color="var(--color-teal)" />}
              {currentReportParams?.name}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Visualização analítica e exportação de dados
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
              <Calendar size={16} color="#6b7280" />
              <input 
                type="date" 
                value={dateFilter.start_date}
                onChange={e => setDateFilter({...dateFilter, start_date: e.target.value})}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: '#374151' }}
              />
              <span style={{ color: '#9ca3af' }}>até</span>
              <input 
                type="date" 
                value={dateFilter.end_date}
                onChange={e => setDateFilter({...dateFilter, end_date: e.target.value})}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: '#374151' }}
              />
            </div>
            
            <CsvExportButton 
              data={data} 
              filename={`relatorio_${activeReport}_${dateFilter.start_date}_a_${dateFilter.end_date}.csv`} 
            />
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="card">
          {isLoading ? (
            <div className="loading-state" style={{ padding: '4rem 0' }}>Gerando relatório...</div>
          ) : data.length === 0 ? (
            <div className="loading-state" style={{ padding: '4rem 0', color: '#6b7280' }}>Nenhum registro encontrado para este período.</div>
          ) : (
            <DataTable columns={getColumnsForReport()} data={data} />
          )}
        </div>

      </div>
    </div>
  );
}
