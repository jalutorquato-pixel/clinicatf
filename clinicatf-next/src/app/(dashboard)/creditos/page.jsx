"use client";

import { useState, useEffect } from 'react';
import apiClient from "../../../api/client";
import { DataTable } from '../../../components/ui';

export default function Creditos() {
  const [creditos, setCreditos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCreditos();
  }, []);

  const fetchCreditos = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/credits');
      setCreditos(res.data);
    } catch (error) {
      // Mock Data
      setCreditos([
        { id: 1, ambassador_name: 'Ana Beauty', type: 'entrada', amount: 100.00, date: '2023-10-15T10:00:00', description: 'Conversão do benefício ID 3' },
        { id: 2, ambassador_name: 'Ju Indica', type: 'entrada', amount: 50.00, date: '2023-10-20T14:30:00', description: 'Bônus de aniversário' },
        { id: 3, ambassador_name: 'Ana Beauty', type: 'uso', amount: 45.00, date: '2023-10-25T11:00:00', description: 'Abatimento no procedimento X' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Data', render: (row) => new Date(row.date).toLocaleString('pt-BR') },
    { header: 'Embaixadora', accessor: 'ambassador_name' },
    { 
      header: 'Tipo', 
      render: (row) => (
        <span style={{ textTransform: 'capitalize', fontWeight: '500', color: row.type === 'entrada' ? 'var(--color-teal)' : row.type === 'uso' ? '#ef4444' : '#f59e0b' }}>
          {row.type}
        </span>
      )
    },
    { 
      header: 'Valor', 
      render: (row) => (
        <strong style={{ color: row.type === 'entrada' ? 'var(--color-teal)' : '#ef4444' }}>
          {row.type === 'entrada' ? '+' : '-'} R$ {parseFloat(row.amount).toFixed(2)}
        </strong>
      )
    },
    { header: 'Descrição', accessor: 'description' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Extrato de Créditos</h1>
          <p className="page-subtitle">Histórico financeiro das carteiras das embaixadoras (Cashback)</p>
        </div>
      </div>
      <div className="card">
        {isLoading ? <div className="loading-state">Carregando...</div> : <DataTable columns={columns} data={creditos} />}
      </div>
    </div>
  );
}
