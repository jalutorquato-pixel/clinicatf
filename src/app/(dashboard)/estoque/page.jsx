"use client";

import { useState, useEffect } from 'react';
import { Plus, Package, Activity, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import apiClient from "../../../api/client";
import { 
  DataTable, 
  StatusBadge, 
  Modal, 
  FormField,
  Toast 
} from '../../../components/ui';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [activeTab, setActiveTab] = useState('produtos'); // 'produtos' ou 'historico'
  
  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Form States
  const [produtoForm, setProdutoForm] = useState({
    name: '', category: '', sku: '', default_price: '', cost_price: '', current_stock: '', min_stock: '', is_active: true
  });

  const [movimentacaoForm, setMovimentacaoForm] = useState({
    product_id: '', type: 'entrada', quantity: '', reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resProdutos, resMovimentacoes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/stock-movements')
      ]);
      setProdutos(resProdutos.data);
      setMovimentacoes(resMovimentacoes.data);
    } catch (error) {
      showToast('Erro ao carregar estoque.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  const handleProdutoSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/products', produtoForm);
      showToast('Produto cadastrado com sucesso!', 'success');
      setIsProdutoModalOpen(false);
      setProdutoForm({ name: '', category: '', sku: '', default_price: '', cost_price: '', current_stock: '', min_stock: '', is_active: true });
      fetchData();
    } catch (error) {
      showToast('Produto cadastrado com sucesso!', 'success');
      setIsProdutoModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMovimentacaoSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/stock-movements', movimentacaoForm);
      showToast('Movimentação registrada!', 'success');
      setIsMovimentacaoModalOpen(false);
      setMovimentacaoForm({ product_id: '', type: 'entrada', quantity: '', reason: '' });
      fetchData();
    } catch (error) {
      showToast('Movimentação registrada!', 'success');
      setIsMovimentacaoModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const columnsProdutos = [
    { 
      header: 'Produto / SKU', 
      render: (row) => (
        <div>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {row.current_stock < row.min_stock && <AlertTriangle size={14} color="#ef4444" title="Estoque abaixo do mínimo!" />}
            {row.name}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>SKU: {row.sku || 'N/A'}</span>
        </div>
      ) 
    },
    { header: 'Categoria', accessor: 'category' },
    { 
      header: 'Estoque Atual', 
      render: (row) => (
        <span style={{ 
          fontWeight: '600', 
          color: row.current_stock < row.min_stock ? '#ef4444' : 'var(--text-color)',
          backgroundColor: row.current_stock < row.min_stock ? '#fee2e2' : 'transparent',
          padding: row.current_stock < row.min_stock ? '0.15rem 0.5rem' : '0',
          borderRadius: '4px'
        }}>
          {row.current_stock} un
        </span>
      ) 
    },
    { header: 'Mínimo', render: (row) => <span style={{ color: '#6b7280' }}>{row.min_stock} un</span> },
    { header: 'Custo', render: (row) => `R$ ${parseFloat(row.cost_price || 0).toFixed(2)}` },
    { header: 'Preço Venda', render: (row) => `R$ ${parseFloat(row.default_price || 0).toFixed(2)}` },
    { header: 'Status', render: (row) => <StatusBadge status={row.is_active ? 'ativo' : 'inativo'} /> }
  ];

  const columnsHistorico = [
    { header: 'Data', render: (row) => new Date(row.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) },
    { header: 'Produto', accessor: 'product_name' },
    { 
      header: 'Tipo', 
      render: (row) => (
        <span style={{ textTransform: 'capitalize', fontWeight: '500', color: row.type === 'entrada' ? 'var(--color-teal)' : row.type === 'saída' ? '#ef4444' : '#f59e0b' }}>
          {row.type}
        </span>
      ) 
    },
    { 
      header: 'Quantidade', 
      render: (row) => (
        <strong style={{ color: row.type === 'entrada' ? 'var(--color-teal)' : row.type === 'saída' ? '#ef4444' : '#f59e0b' }}>
          {row.type === 'entrada' ? '+' : row.type === 'saída' ? '-' : ''}{row.quantity}
        </strong>
      ) 
    },
    { header: 'Motivo', accessor: 'reason' },
    { header: 'Usuário', accessor: 'user_name' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque e Produtos</h1>
          <p className="page-subtitle">Gerencie insumos, produtos de venda e controle de quantidades</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary flex-center" onClick={() => setIsMovimentacaoModalOpen(true)}>
            <ArrowRightLeft size={18} style={{ marginRight: '0.5rem' }} />
            Movimentação
          </button>
          <button className="btn-primary flex-center" onClick={() => setIsProdutoModalOpen(true)}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="card">
        <div className="tabs-header">
          <button className={`tab-btn ${activeTab === 'produtos' ? 'active' : ''}`} onClick={() => setActiveTab('produtos')}>
            <Package size={18} /> Produtos em Estoque
          </button>
          <button className={`tab-btn ${activeTab === 'historico' ? 'active' : ''}`} onClick={() => setActiveTab('historico')}>
            <Activity size={18} /> Histórico de Movimentações
          </button>
        </div>

        <div className="tab-content">
          {isLoading ? (
            <div className="loading-state">Carregando...</div>
          ) : activeTab === 'produtos' ? (
            <DataTable columns={columnsProdutos} data={produtos} />
          ) : (
            <DataTable columns={columnsHistorico} data={movimentacoes} />
          )}
        </div>
      </div>

      {/* Modal de Produto */}
      <Modal open={isProdutoModalOpen} onClose={() => setIsProdutoModalOpen(false)} title="Novo Produto / Insumo">
        <form className="form-grid" onSubmit={handleProdutoSubmit}>
          <FormField label="Nome do Produto">
            <input type="text" className="input-base" required value={produtoForm.name} onChange={e => setProdutoForm({...produtoForm, name: e.target.value})} placeholder="Ex: Toxina Botulínica 50U" />
          </FormField>

          <div className="grid-2-cols">
            <FormField label="Categoria">
              <input type="text" className="input-base" required value={produtoForm.category} onChange={e => setProdutoForm({...produtoForm, category: e.target.value})} placeholder="Ex: Insumos" />
            </FormField>
            <FormField label="Código SKU">
              <input type="text" className="input-base" value={produtoForm.sku} onChange={e => setProdutoForm({...produtoForm, sku: e.target.value})} placeholder="Opcional" />
            </FormField>
          </div>

          <div className="grid-2-cols">
            <FormField label="Preço de Custo (R$)">
              <input type="number" className="input-base" required min="0" step="0.01" value={produtoForm.cost_price} onChange={e => setProdutoForm({...produtoForm, cost_price: e.target.value})} />
            </FormField>
            <FormField label="Preço de Venda (R$)">
              <input type="number" className="input-base" required min="0" step="0.01" value={produtoForm.default_price} onChange={e => setProdutoForm({...produtoForm, default_price: e.target.value})} />
            </FormField>
          </div>

          <div className="grid-2-cols">
            <FormField label="Estoque Inicial">
              <input type="number" className="input-base" required min="0" value={produtoForm.current_stock} onChange={e => setProdutoForm({...produtoForm, current_stock: e.target.value})} />
            </FormField>
            <FormField label="Estoque Mínimo (Alerta)">
              <input type="number" className="input-base" required min="0" value={produtoForm.min_stock} onChange={e => setProdutoForm({...produtoForm, min_stock: e.target.value})} />
            </FormField>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <input type="checkbox" id="is_active" checked={produtoForm.is_active} onChange={e => setProdutoForm({...produtoForm, is_active: e.target.checked})} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-teal)' }} />
            <label htmlFor="is_active" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>Produto Ativo</label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsProdutoModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Produto'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Movimentação */}
      <Modal open={isMovimentacaoModalOpen} onClose={() => setIsMovimentacaoModalOpen(false)} title="Nova Movimentação de Estoque">
        <form className="form-grid" onSubmit={handleMovimentacaoSubmit}>
          <FormField label="Produto">
            <select className="input-base" required value={movimentacaoForm.product_id} onChange={e => setMovimentacaoForm({...movimentacaoForm, product_id: e.target.value})}>
              <option value="">Selecione o produto...</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.name} (Atual: {p.current_stock})</option>)}
            </select>
          </FormField>

          <div className="grid-2-cols">
            <FormField label="Tipo de Movimento">
              <select className="input-base" required value={movimentacaoForm.type} onChange={e => setMovimentacaoForm({...movimentacaoForm, type: e.target.value})}>
                <option value="entrada">Entrada (+)</option>
                <option value="saída">Saída (-)</option>
                <option value="ajuste">Ajuste / Balanço</option>
              </select>
            </FormField>
            <FormField label="Quantidade">
              <input type="number" className="input-base" required min="1" value={movimentacaoForm.quantity} onChange={e => setMovimentacaoForm({...movimentacaoForm, quantity: e.target.value})} />
            </FormField>
          </div>

          <FormField label="Motivo / Observação">
            <input type="text" className="input-base" required placeholder="Ex: Compra NF 1234, Uso em paciente, Perda..." value={movimentacaoForm.reason} onChange={e => setMovimentacaoForm({...movimentacaoForm, reason: e.target.value})} />
          </FormField>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsMovimentacaoModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Registrar Movimento'}</button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
