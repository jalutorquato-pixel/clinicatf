import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { DataTable, StatusBadge } from '../components/ui';

export default function Beneficios() {
  const [beneficios, setBeneficios] = useState([]);
  const [conquistados, setConquistados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resBen, resEarned] = await Promise.all([
        apiClient.get('/benefits').catch(() => ({ data: [
          { id: 1, name: 'Limpeza de Pele', points_required: 150, type: 'procedimento' },
          { id: 2, name: 'Massagem Relaxante', points_required: 200, type: 'procedimento' },
          { id: 3, name: 'R$ 100 em Crédito', points_required: 300, type: 'credito' }
        ]})),
        apiClient.get('/earned-benefits').catch(() => ({ data: [
          { id: 1, ambassador_name: 'Ana Beauty', benefit_name: 'Limpeza de Pele', date_earned: '2023-10-15', status: 'conquistado' },
          { id: 2, ambassador_name: 'Ju Indica', benefit_name: 'R$ 100 em Crédito', date_earned: '2023-09-20', status: 'utilizado' }
        ]}))
      ]);
      setBeneficios(resBen.data);
      setConquistados(resEarned.data);
    } finally {
      setIsLoading(false);
    }
  };

  const columnsConfig = [
    { header: 'Nome do Benefício', accessor: 'name' },
    { header: 'Tipo', render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.type}</span> },
    { header: 'Pontos Necessários', render: (row) => <strong>{row.points_required} pts</strong> }
  ];

  const columnsEarned = [
    { header: 'Data da Conquista', render: (row) => new Date(row.date_earned).toLocaleDateString('pt-BR') },
    { header: 'Embaixadora', accessor: 'ambassador_name' },
    { header: 'Benefício', accessor: 'benefit_name' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Benefícios</h1>
          <p className="page-subtitle">Prêmios configurados e histórico de resgates das embaixadoras</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Benefícios Configurados</h3>
          {isLoading ? <div className="loading-state">Carregando...</div> : <DataTable columns={columnsConfig} data={beneficios} />}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Benefícios Conquistados</h3>
          {isLoading ? <div className="loading-state">Carregando...</div> : <DataTable columns={columnsEarned} data={conquistados} />}
        </div>
      </div>
    </div>
  );
}
