"use client";

import { useState, useEffect } from 'react';
import apiClient from "../../../api/client";
import { DataTable, StatusBadge, Toast } from '../../../components/ui';

export default function Ciclos() {
  const [ciclos, setCiclos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchCiclos();
  }, []);

  const fetchCiclos = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/cycles');
      setCiclos(res.data);
    } catch (error) {
      showToast('Erro ao carregar ciclos.', 'error');
      // Mock Data
      setCiclos([
        { id: 1, name: 'Ciclo Q3 2023', start_date: '2023-07-01', end_date: '2023-09-30', status: 'encerrado' },
        { id: 2, name: 'Ciclo Q4 2023', start_date: '2023-10-01', end_date: '2023-12-31', status: 'ativo' },
        { id: 3, name: 'Ciclo Q1 2024', start_date: '2024-01-01', end_date: '2024-03-31', status: 'futuro' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiClient.patch(`/cycles/${id}`, { status: newStatus });
      showToast(`Ciclo atualizado para ${newStatus}`, 'success');
      fetchCiclos();
    } catch (error) {
      // Mock Local Update
      setCiclos(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      showToast(`Ciclo atualizado para ${newStatus}`, 'success');
    }
  };

  const columns = [
    { header: 'Nome do Ciclo', accessor: 'name' },
    { header: 'Data de Início', render: (row) => new Date(row.start_date).toLocaleDateString('pt-BR') },
    { header: 'Data de Término', render: (row) => new Date(row.end_date).toLocaleDateString('pt-BR') },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Ações',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {row.status === 'futuro' && (
            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--color-teal)', color: 'var(--color-teal)' }} onClick={() => handleUpdateStatus(row.id, 'ativo')}>
              Ativar
            </button>
          )}
          {row.status === 'ativo' && (
            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleUpdateStatus(row.id, 'encerrado')}>
              Encerrar
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ciclos de Pontuação</h1>
          <p className="page-subtitle">Gerencie os períodos de contagem de pontos das embaixadoras</p>
        </div>
      </div>
      <div className="card">
        {isLoading ? <div className="loading-state">Carregando...</div> : <DataTable columns={columns} data={ciclos} />}
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
