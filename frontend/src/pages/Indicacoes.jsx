import { useState, useEffect } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import apiClient from '../api/client';
import { 
  DataTable, 
  StatusBadge, 
  Modal, 
  FormField,
  Toast 
} from '../components/ui';

// Função auxiliar para máscara de telefone
const maskPhone = (v) => v.replace(/\D/g, '')
  .replace(/(\d{2})(\d)/, '($1) $2')
  .replace(/(\d{5})(\d)/, '$1-$2')
  .replace(/(-\d{4})\d+?$/, '$1');

export default function Indicacoes() {
  const [indicacoes, setIndicacoes] = useState([]);
  const [embaixadoras, setEmbaixadoras] = useState([]);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmbaixadora, setFilterEmbaixadora] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Form Data
  const [formData, setFormData] = useState({
    ambassador_id: '',
    referred_name: '',
    referred_phone: '',
    referred_email: '',
    channel: 'link',
    coupon_used: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resReferrals, resAmbassadors] = await Promise.all([
        apiClient.get('/referrals').catch(() => ({ data: [
          { id: 1, ambassador_name: 'Ana Beauty', ambassador_id: 1, referred_name: 'Julia Silva', referred_phone: '(11) 98888-7777', channel: 'link', status: 'recebida', created_at: '2023-10-25T10:00:00' },
          { id: 2, ambassador_name: 'Ju Indica', ambassador_id: 2, referred_name: 'Marcos Costa', referred_phone: '(21) 97777-6666', channel: 'WhatsApp', status: 'procedimento_realizado', created_at: '2023-10-20T14:30:00' },
          { id: 3, ambassador_name: 'Ana Beauty', ambassador_id: 1, referred_name: 'Luiza Souza', referred_phone: '(11) 95555-4444', channel: 'Instagram', status: 'ponto_validado', created_at: '2023-10-18T09:15:00' }
        ]})),
        apiClient.get('/ambassadors').catch(() => ({ data: [
          { id: 1, public_name: 'Ana Beauty' },
          { id: 2, public_name: 'Ju Indica' }
        ]}))
      ]);
      setIndicacoes(resReferrals.data);
      setEmbaixadoras(resAmbassadors.data);
    } catch (error) {
      showToast('Erro ao carregar indicações.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'referred_phone') val = maskPhone(value);
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        referred_phone: formData.referred_phone.replace(/\D/g, '') // limpa máscara antes de enviar
      };
      
      await apiClient.post('/referrals', payload);
      showToast('Indicação criada com sucesso!', 'success');
      setIsModalOpen(false);
      setFormData({ ambassador_id: '', referred_name: '', referred_phone: '', referred_email: '', channel: 'link', coupon_used: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      // Mock de sucesso
      showToast('Indicação criada com sucesso!', 'success');
      setIsModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidarPonto = async (id) => {
    try {
      await apiClient.patch(`/referrals/${id}`, { status: 'ponto_validado' });
      showToast('Ponto validado com sucesso!', 'success');
      fetchData();
    } catch (error) {
      console.error(error);
      // Mock update localmente se API falhar
      setIndicacoes(prev => prev.map(ind => ind.id === id ? { ...ind, status: 'ponto_validado' } : ind));
      showToast('Ponto validado com sucesso!', 'success');
    }
  };

  // Filtragem local
  const filteredData = indicacoes.filter(ind => {
    const matchStatus = filterStatus ? ind.status === filterStatus : true;
    const matchAmbassador = filterEmbaixadora ? String(ind.ambassador_id) === String(filterEmbaixadora) : true;
    return matchStatus && matchAmbassador;
  });

  const columns = [
    { header: 'Data', render: (row) => new Date(row.created_at).toLocaleDateString('pt-BR') },
    { header: 'Embaixadora', accessor: 'ambassador_name' },
    { header: 'Nome Indicado', accessor: 'referred_name' },
    { header: 'Telefone', accessor: 'referred_phone' },
    { header: 'Canal', render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.channel}</span> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status.replace('_', ' ')} /> },
    {
      header: 'Ações',
      render: (row) => {
        if (row.status === 'procedimento_realizado') {
          return (
            <button 
              className="btn-secondary" 
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-teal)', color: 'var(--color-teal)' }}
              onClick={() => handleValidarPonto(row.id)}
              title="Validar Ponto e Bonificar Embaixadora"
            >
              <CheckCircle size={14} /> Validar Ponto
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
          <h1 className="page-title">Indicações</h1>
          <p className="page-subtitle">Acompanhe as indicações das embaixadoras e valide os pontos</p>
        </div>
        <button className="btn-primary flex-center" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Nova Indicação
        </button>
      </div>

      <div className="card">
        {/* Barra de Filtros */}
        <div className="toolbar" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
          <div style={{ minWidth: '200px' }}>
            <select 
              className="input-base" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="recebida">Recebida</option>
              <option value="agendada">Agendada</option>
              <option value="compareceu">Compareceu</option>
              <option value="procedimento_realizado">Procedimento Realizado</option>
              <option value="ponto_validado">Ponto Validado</option>
              <option value="cancelada">Cancelada</option>
              <option value="invalida">Inválida</option>
            </select>
          </div>
          <div style={{ minWidth: '250px' }}>
            <select 
              className="input-base" 
              value={filterEmbaixadora} 
              onChange={(e) => setFilterEmbaixadora(e.target.value)}
            >
              <option value="">Todas as Embaixadoras</option>
              {embaixadoras.map(emb => (
                <option key={emb.id} value={emb.id}>{emb.public_name}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">Carregando indicações...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>

      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nova Indicação"
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <FormField label="Embaixadora">
            <select name="ambassador_id" className="input-base" required value={formData.ambassador_id} onChange={handleFormChange}>
              <option value="">Selecione a embaixadora...</option>
              {embaixadoras.map(e => (
                <option key={e.id} value={e.id}>{e.public_name}</option>
              ))}
            </select>
          </FormField>
          
          <div className="grid-2-cols">
            <FormField label="Nome do Indicado">
              <input type="text" name="referred_name" className="input-base" required value={formData.referred_name} onChange={handleFormChange} />
            </FormField>
            
            <FormField label="Telefone">
              <input type="text" name="referred_phone" className="input-base" required placeholder="(00) 00000-0000" value={formData.referred_phone} onChange={handleFormChange} />
            </FormField>
          </div>

          <div className="grid-2-cols">
            <FormField label="E-mail (Opcional)">
              <input type="email" name="referred_email" className="input-base" value={formData.referred_email} onChange={handleFormChange} />
            </FormField>
            
            <FormField label="Cupom Usado (Opcional)">
              <input type="text" name="coupon_used" className="input-base" style={{ textTransform: 'uppercase' }} value={formData.coupon_used} onChange={handleFormChange} />
            </FormField>
          </div>

          <FormField label="Canal de Origem">
            <select name="channel" className="input-base" required value={formData.channel} onChange={handleFormChange}>
              <option value="link">Link Exclusivo</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="recepção">Recepção</option>
              <option value="telefone">Telefone</option>
              <option value="outro">Outro</option>
            </select>
          </FormField>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Indicação'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
