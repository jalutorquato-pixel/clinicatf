"use client";

import { useState, useEffect } from 'react';
import apiClient from "../../../api/client";
import { DataTable } from '../../../components/ui';

export default function Pontos() {
  const [pontos, setPontos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPontos();
  }, []);

  const fetchPontos = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/points');
      setPontos(res.data);
    } catch (error) {
      // Mock Data
      setPontos([
        { id: 1, ambassador_name: 'Ana Beauty', referred_name: 'Julia Silva', cycle_name: 'Ciclo Q4 2023', points: 50, date: '2023-10-25T14:00:00', validated_by: 'Admin' },
        { id: 2, ambassador_name: 'Ju Indica', referred_name: 'Marcos Costa', cycle_name: 'Ciclo Q4 2023', points: 50, date: '2023-10-22T09:30:00', validated_by: 'Recepção' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Data', render: (row) => new Date(row.date).toLocaleDateString('pt-BR') },
    { header: 'Embaixadora', accessor: 'ambassador_name' },
    { header: 'Indicação', accessor: 'referred_name' },
    { header: 'Ciclo', accessor: 'cycle_name' },
    { header: 'Pontos', render: (row) => <strong style={{ color: 'var(--color-teal)' }}>+{row.points}</strong> },
    { header: 'Validado por', accessor: 'validated_by' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Extrato de Pontos</h1>
          <p className="page-subtitle">Histórico de pontuação gerada por indicações concluídas</p>
        </div>
      </div>
      <div className="card">
        {isLoading ? <div className="loading-state">Carregando...</div> : <DataTable columns={columns} data={pontos} />}
      </div>
    </div>
  );
}
