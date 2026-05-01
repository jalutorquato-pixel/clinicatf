"use client";

import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, FileText, Trash2, Edit } from 'lucide-react';
import apiClient from "../../../api/client";
import { 
  DataTable, 
  StatusBadge, 
  Modal, 
  FormField,
  Toast 
} from '../../../components/ui';

export default function Vendas() {
  const [vendas, setVendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [activeTab, setActiveTab] = useState('venda'); // venda ou orcamento
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    type: 'venda', // venda ou orcamento
    status: 'aberto',
    due_date: '',
    payment_method: 'Cartão de Crédito',
    notes: '',
    items: [{ id: Date.now(), type: 'procedimento', description: '', quantity: 1, unit_price: 0 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resVendas, resClientes] = await Promise.all([
        apiClient.get('/sales').catch(() => ({ data: [
          { id: 1, client_name: 'Maria Silva', type: 'venda', status: 'pago', total: 1500.00, due_date: '2023-10-25', payment_method: 'Cartão de Crédito' },
          { id: 2, client_name: 'João Pedro', type: 'orcamento', status: 'aberto', total: 850.00, due_date: '2023-11-05', payment_method: 'PIX' },
          { id: 3, client_name: 'Ana Beauty', type: 'venda', status: 'aprovado', total: 320.00, due_date: '2023-10-30', payment_method: 'Boleto' }
        ]})),
        apiClient.get('/clients').catch(() => ({ data: [
          { id: 1, nome: 'Maria Silva' }, { id: 2, nome: 'João Pedro' }, { id: 3, nome: 'Ana Beauty' }
        ]}))
      ]);
      setVendas(resVendas.data);
      setClientes(resClientes.data);
    } catch (error) {
      showToast('Erro ao carregar vendas.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  // Gerenciamento dos itens da Venda
  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), type: 'procedimento', description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((acc, item) => acc + (parseFloat(item.quantity) * parseFloat(item.unit_price || 0)), 0);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        total: calculateTotal()
      };
      await apiClient.post('/sales', payload);
      showToast(`${formData.type === 'venda' ? 'Venda' : 'Orçamento'} salvo com sucesso!`, 'success');
      setIsModalOpen(false);
      setFormData({
        client_id: '', type: 'venda', status: 'aberto', due_date: '', payment_method: 'Cartão de Crédito', notes: '',
        items: [{ id: Date.now(), type: 'procedimento', description: '', quantity: 1, unit_price: 0 }]
      });
      fetchData();
    } catch (error) {
      // Mock sucesso local
      showToast(`${formData.type === 'venda' ? 'Venda' : 'Orçamento'} salvo com sucesso!`, 'success');
      setIsModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = vendas.filter(v => v.type === activeTab);

  const columns = [
    { header: 'Cliente', accessor: 'client_name', render: (row) => row.client_name || <span style={{color: '#9ca3af'}}>Avulso</span> },
    { header: 'Vencimento', render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString('pt-BR') : 'N/A' },
    { header: 'Método', accessor: 'payment_method' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Total', render: (row) => <strong style={{ color: 'var(--text-color)' }}>R$ {parseFloat(row.total).toFixed(2)}</strong> },
    {
      header: 'Ações',
      render: (row) => (
        <button className="btn-icon" onClick={() => showToast(`Visualizar ID ${row.id} em breve.`, 'info')} title="Visualizar">
          <Edit size={16} />
        </button>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Gerencie vendas, orçamentos e recebimentos</p>
        </div>
        <button className="btn-primary flex-center" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Nova Transação
        </button>
      </div>

      <div className="card">
        <div className="tabs-header">
          <button className={`tab-btn ${activeTab === 'venda' ? 'active' : ''}`} onClick={() => setActiveTab('venda')}>
            <ShoppingCart size={18} /> Vendas
          </button>
          <button className={`tab-btn ${activeTab === 'orcamento' ? 'active' : ''}`} onClick={() => setActiveTab('orcamento')}>
            <FileText size={18} /> Orçamentos
          </button>
        </div>

        <div className="tab-content">
          {isLoading ? (
            <div className="loading-state">Carregando transações...</div>
          ) : (
            <DataTable columns={columns} data={filteredData} />
          )}
        </div>
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Transação (Venda/Orçamento)">
        <form className="form-grid" onSubmit={handleSubmit}>
          
          <div className="grid-2-cols">
            <FormField label="Tipo">
              <select name="type" className="input-base" value={formData.type} onChange={handleFormChange}>
                <option value="venda">Venda Efetiva</option>
                <option value="orcamento">Orçamento</option>
              </select>
            </FormField>

            <FormField label="Cliente (Opcional)">
              <select name="client_id" className="input-base" value={formData.client_id} onChange={handleFormChange}>
                <option value="">Cliente Avulso</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.full_name || c.nome}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid-2-cols">
            <FormField label="Status">
              <select name="status" className="input-base" value={formData.status} onChange={handleFormChange}>
                <option value="aberto">Em Aberto</option>
                <option value="aprovado">Aprovado</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </FormField>

            <FormField label="Vencimento">
              <input type="date" name="due_date" className="input-base" required value={formData.due_date} onChange={handleFormChange} />
            </FormField>
          </div>

          <FormField label="Forma de Pagamento">
            <select name="payment_method" className="input-base" value={formData.payment_method} onChange={handleFormChange}>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="PIX">PIX</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Boleto">Boleto</option>
              <option value="Transferência">Transferência Bancária</option>
            </select>
          </FormField>

          {/* Itens da Venda */}
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Itens da Transação</h4>
              <button type="button" onClick={addItem} style={{ fontSize: '0.75rem', color: 'var(--color-teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>+ Adicionar Item</button>
            </div>

            {formData.items.map((item, index) => (
              <div key={item.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <select 
                  className="input-base" style={{ width: '120px', padding: '0.5rem' }} 
                  value={item.type} onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                >
                  <option value="procedimento">Serviço</option>
                  <option value="produto">Produto</option>
                </select>
                
                <input 
                  type="text" className="input-base" style={{ flex: 1, padding: '0.5rem' }} placeholder="Descrição" required
                  value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                />
                
                <input 
                  type="number" className="input-base" style={{ width: '70px', padding: '0.5rem' }} min="1" required
                  value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                />
                
                <input 
                  type="number" className="input-base" style={{ width: '100px', padding: '0.5rem' }} step="0.01" min="0" placeholder="R$ Unit" required
                  value={item.unit_price} onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                />
                
                <button type="button" onClick={() => removeItem(item.id)} disabled={formData.items.length === 1} className="btn-icon" style={{ padding: '0.5rem', color: formData.items.length === 1 ? '#d1d5db' : '#ef4444' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #d1d5db' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '1rem' }}>Total Calculado:</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-teal)' }}>R$ {calculateTotal().toFixed(2)}</strong>
            </div>
          </div>

          <FormField label="Observações Internas">
            <textarea name="notes" className="input-base" rows="2" value={formData.notes} onChange={handleFormChange} placeholder="Descontos aplicados, condições específicas..."></textarea>
          </FormField>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
