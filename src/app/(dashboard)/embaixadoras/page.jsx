"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Eye } from 'lucide-react';
import { useRouter } from "next/navigation";
import apiClient from "../../../api/client";
import { 
  DataTable, 
  SearchInput, 
  StatusBadge, 
  Modal, 
  FormField,
  Toast 
} from '../../../components/ui';

export default function Embaixadoras() {
  const router = useRouter();
  const [embaixadoras, setEmbaixadoras] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmbassador, setEditingAmbassador] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Form states
  const [formData, setFormData] = useState({
    client_id: '',
    public_name: '',
    coupon_code: '',
    level: 'comum',
    status: 'ativa'
  });
  
  // Clients for autocomplete/select
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resAmbassadors, resClients] = await Promise.all([
        apiClient.get('/ambassadors'),
        apiClient.get('/clients')
      ]);
      setEmbaixadoras(resAmbassadors.data);
      setClientes(resClients.data);
    } catch (error) {
      showToast('Erro ao carregar dados.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  // Modal Handlers
  const openModal = (ambassador = null) => {
    setEditingAmbassador(ambassador);
    if (ambassador) {
      setFormData({
        client_id: ambassador.client_id || '',
        public_name: ambassador.public_name || '',
        coupon_code: ambassador.coupon_code || '',
        level: ambassador.level || 'comum',
        status: ambassador.status || 'ativa'
      });
    } else {
      setFormData({ client_id: '', public_name: '', coupon_code: '', level: 'comum', status: 'ativa' });
    }
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateCoupon = () => {
    if (!formData.public_name) {
      showToast('Preencha o nome público primeiro', 'error');
      return;
    }
    const firstWord = formData.public_name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
    const randomNum = Math.floor(Math.random() * 99) + 10;
    setFormData(prev => ({ ...prev, coupon_code: `${firstWord}${randomNum}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingAmbassador) {
        await apiClient.put(`/ambassadors/${editingAmbassador.id}`, formData);
        showToast('Embaixadora atualizada com sucesso!', 'success');
      } else {
        await apiClient.post('/ambassadors', formData);
        showToast('Embaixadora criada com sucesso!', 'success');
      }
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      showToast('Erro ao salvar embaixadora.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter
  const filteredData = embaixadoras.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      (e.public_name && e.public_name.toLowerCase().includes(term)) ||
      (e.coupon_code && e.coupon_code.toLowerCase().includes(term))
    );
  });

  const columns = [
    { header: 'Nome Público', accessor: 'public_name' },
    { header: 'Cupom', accessor: 'coupon_code' },
    { 
      header: 'Nível', 
      render: (row) => (
        <span style={{ textTransform: 'capitalize', fontWeight: '500', color: row.level === 'elite' ? '#eab308' : row.level === 'avançada' ? '#3b82f6' : '#6b7280' }}>
          {row.level}
        </span>
      )
    },
    { header: 'Status', render: (row) => <StatusBadge status={row.status || 'ativa'} /> },
    { header: 'Pontos Atuais', render: (row) => <strong>{row.current_points || 0} pts</strong> },
    {
      header: 'Ações',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-icon" onClick={() => router.push(`/embaixadoras/${row.id}`)} title="Ver Detalhes">
            <Eye size={16} />
          </button>
          <button className="btn-icon" onClick={() => openModal(row)} title="Editar">
            <Edit size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Embaixadoras</h1>
          <p className="page-subtitle">Gerencie as parceiras e seus cupons de indicação</p>
        </div>
        <button className="btn-primary flex-center" onClick={() => openModal()}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Nova Embaixadora
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <SearchInput 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Buscar por nome público ou cupom..."
          />
        </div>

        {isLoading ? (
          <div className="loading-state">Carregando embaixadoras...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingAmbassador ? "Editar Embaixadora" : "Nova Embaixadora"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <FormField label="Cliente Vinculado">
            <select 
              name="client_id" 
              className="input-base" 
              required 
              value={formData.client_id} 
              onChange={handleFormChange}
              disabled={!!editingAmbassador} // Não permite mudar o cliente na edição
            >
              <option value="">Selecione um cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.full_name || c.nome}</option>
              ))}
            </select>
          </FormField>
          
          <div className="grid-2-cols">
            <FormField label="Nome Público">
              <input type="text" name="public_name" className="input-base" required value={formData.public_name} onChange={handleFormChange} />
            </FormField>
            
            <FormField label="Cupom de Indicação">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  name="coupon_code" 
                  className="input-base" 
                  style={{ textTransform: 'uppercase' }}
                  required 
                  value={formData.coupon_code} 
                  onChange={handleFormChange} 
                />
                <button type="button" className="btn-secondary" onClick={generateCoupon} style={{ padding: '0 0.75rem' }} title="Gerar Cupom">
                  Auto
                </button>
              </div>
            </FormField>
          </div>

          <div className="grid-2-cols">
            <FormField label="Nível">
              <select name="level" className="input-base" required value={formData.level} onChange={handleFormChange}>
                <option value="comum">Comum</option>
                <option value="avançada">Avançada</option>
                <option value="elite">Elite</option>
              </select>
            </FormField>
            
            <FormField label="Status">
              <select name="status" className="input-base" required value={formData.status} onChange={handleFormChange}>
                <option value="ativa">Ativa</option>
                <option value="pausada">Pausada</option>
                <option value="inativa">Inativa</option>
              </select>
            </FormField>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Embaixadora'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
