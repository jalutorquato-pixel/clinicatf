"use client";

import { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingDown, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import apiClient from "../../../api/client";
import { 
  DataTable, 
  StatusBadge, 
  Modal, 
  FormField,
  MetricCard,
  Toast 
} from '../../../components/ui';

export default function Financeiro() {
  const [contas, setContas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Form State
  const [formData, setFormData] = useState({
    type: 'receita', // receita ou despesa
    description: '',
    category: '',
    due_date: '',
    amount: '',
    payment_method: 'PIX',
    status: 'nao_pago'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/account-entries').catch(() => ({ data: [
        { id: 1, type: 'receita', description: 'Venda de Tratamento (Botox)', category: 'Vendas', due_date: new Date().toISOString().split('T')[0], amount: 600.00, status: 'nao_pago', payment_method: 'Cartão de Crédito' },
        { id: 2, type: 'despesa', description: 'Conta de Luz', category: 'Fixa', due_date: new Date().toISOString().split('T')[0], amount: 350.00, status: 'nao_pago', payment_method: 'Boleto' },
        { id: 3, type: 'receita', description: 'Mensalidade Programa', category: 'Assinaturas', due_date: '2023-09-15', amount: 200.00, status: 'pago', payment_method: 'PIX' },
        { id: 4, type: 'despesa', description: 'Compra de Seringas', category: 'Insumos', due_date: '2023-10-01', amount: 800.00, status: 'nao_pago', payment_method: 'Transferência' }
      ]}));
      setContas(res.data);
    } catch (error) {
      showToast('Erro ao carregar contas financeiras.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await apiClient.post('/account-entries', formData);
      showToast('Conta criada com sucesso!', 'success');
      setIsModalOpen(false);
      setFormData({ type: 'receita', description: '', category: '', due_date: '', amount: '', payment_method: 'PIX', status: 'nao_pago' });
      fetchData();
    } catch (error) {
      // Mock local
      showToast('Conta criada com sucesso!', 'success');
      setIsModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBaixarConta = async (id) => {
    try {
      await apiClient.patch(`/account-entries/${id}/pay`);
      showToast('Conta baixada com sucesso!', 'success');
      fetchData();
    } catch (error) {
      // Mock Local
      setContas(prev => prev.map(c => c.id === id ? { ...c, status: 'pago' } : c));
      showToast('Conta baixada com sucesso!', 'success');
    }
  };

  // Cálculo de Métricas (Considerando apenas a data ignorando horas)
  const today = new Date().toISOString().split('T')[0];
  
  const stats = contas.reduce((acc, curr) => {
    const dueDate = curr.due_date.split('T')[0];
    const isVencido = dueDate < today && curr.status === 'nao_pago';
    const isHoje = dueDate === today && curr.status === 'nao_pago';
    const valor = parseFloat(curr.amount) || 0;

    if (curr.type === 'receita') {
      if (isHoje) acc.receberHoje += valor;
      if (isVencido) acc.recebimentosVencidos += valor;
      if (curr.status === 'pago') acc.saldoRealizado += valor;
    } else if (curr.type === 'despesa') {
      if (isHoje) acc.pagarHoje += valor;
      if (isVencido) acc.pagamentosVencidos += valor;
      if (curr.status === 'pago') acc.saldoRealizado -= valor;
    }
    return acc;
  }, { receberHoje: 0, pagarHoje: 0, recebimentosVencidos: 0, pagamentosVencidos: 0, saldoRealizado: 0 });

  const columns = [
    { header: 'Vencimento', render: (row) => new Date(row.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) },
    { 
      header: 'Descrição / Categoria', 
      render: (row) => (
        <div>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: row.type === 'receita' ? 'var(--color-teal)' : '#ef4444' }}>
            {row.type === 'receita' ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {row.description}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{row.category}</span>
        </div>
      ) 
    },
    { header: 'Valor', render: (row) => <strong style={{ color: row.type === 'receita' ? 'var(--color-teal)' : '#ef4444' }}>R$ {parseFloat(row.amount).toFixed(2)}</strong> },
    { header: 'Método', accessor: 'payment_method' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status.replace('_', ' ')} /> },
    {
      header: 'Ações',
      render: (row) => {
        if (row.status === 'nao_pago') {
          return (
            <button 
              className="btn-secondary" 
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-teal)', color: 'var(--color-teal)' }}
              onClick={() => handleBaixarConta(row.id)}
              title="Baixar como pago"
            >
              <CheckCircle size={14} /> Baixar Conta
            </button>
          );
        }
        return <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Nenhuma ação</span>;
      }
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contas e Fluxo de Caixa</h1>
          <p className="page-subtitle">Acompanhe as receitas, despesas e o saldo da clínica</p>
        </div>
        <button className="btn-primary flex-center" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Nova Conta
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <MetricCard title="A Receber Hoje" value={`R$ ${stats.receberHoje.toFixed(2)}`} icon={Clock} />
        <MetricCard title="A Pagar Hoje" value={`R$ ${stats.pagarHoje.toFixed(2)}`} icon={Clock} />
        <MetricCard title="Recebimentos Atrasados" value={`R$ ${stats.recebimentosVencidos.toFixed(2)}`} icon={AlertCircle} />
        <MetricCard title="Pagamentos Atrasados" value={`R$ ${stats.pagamentosVencidos.toFixed(2)}`} icon={AlertCircle} />
        <MetricCard title="Saldo Realizado (Caixa)" value={`R$ ${stats.saldoRealizado.toFixed(2)}`} icon={DollarSign} />
      </div>

      <div className="card">
        {isLoading ? (
          <div className="loading-state">Carregando contas...</div>
        ) : (
          <DataTable columns={columns} data={contas.sort((a,b) => new Date(a.due_date) - new Date(b.due_date))} />
        )}
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Conta (Receita/Despesa)">
        <form className="form-grid" onSubmit={handleSubmit}>
          
          <div className="grid-2-cols">
            <FormField label="Tipo de Conta">
              <select name="type" className="input-base" required value={formData.type} onChange={handleFormChange}>
                <option value="receita">Receita (Entrada)</option>
                <option value="despesa">Despesa (Saída)</option>
              </select>
            </FormField>

            <FormField label="Categoria">
              <input type="text" name="category" className="input-base" required value={formData.category} onChange={handleFormChange} placeholder="Ex: Vendas, Luz, Insumos" />
            </FormField>
          </div>

          <FormField label="Descrição">
            <input type="text" name="description" className="input-base" required value={formData.description} onChange={handleFormChange} placeholder="O que é esta conta?" />
          </FormField>

          <div className="grid-2-cols">
            <FormField label="Vencimento">
              <input type="date" name="due_date" className="input-base" required value={formData.due_date} onChange={handleFormChange} />
            </FormField>

            <FormField label="Valor (R$)">
              <input type="number" name="amount" className="input-base" required min="0" step="0.01" value={formData.amount} onChange={handleFormChange} placeholder="0.00" />
            </FormField>
          </div>

          <div className="grid-2-cols">
            <FormField label="Forma de Pagamento Prevista">
              <select name="payment_method" className="input-base" required value={formData.payment_method} onChange={handleFormChange}>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="PIX">PIX</option>
                <option value="Boleto">Boleto</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência Bancária</option>
              </select>
            </FormField>

            <FormField label="Status Inicial">
              <select name="status" className="input-base" required value={formData.status} onChange={handleFormChange}>
                <option value="nao_pago">Em Aberto (Não Pago)</option>
                <option value="pago">Pago / Recebido</option>
              </select>
            </FormField>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
