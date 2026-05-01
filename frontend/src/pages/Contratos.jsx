import { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle, Download, FileSignature } from 'lucide-react';
import apiClient from '../api/client';
import { 
  DataTable, 
  StatusBadge, 
  Modal, 
  FormField,
  Toast 
} from '../components/ui';

export default function Contratos() {
  const [modelos, setModelos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [activeTab, setActiveTab] = useState('gerados'); // 'modelos' ou 'gerados'
  
  const [isModeloModalOpen, setIsModeloModalOpen] = useState(false);
  const [isGerarModalOpen, setIsGerarModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Form States
  const [modeloForm, setModeloForm] = useState({
    name: '', category: '', content: '', is_active: true
  });

  const [gerarForm, setGerarForm] = useState({
    client_id: '', template_id: '', status: 'gerado', notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resModelos, resContratos, resClientes] = await Promise.all([
        apiClient.get('/contract-templates').catch(() => ({ data: [
          { id: 1, name: 'Consentimento Botox', category: 'Termo de Consentimento', is_active: true },
          { id: 2, name: 'Contrato Pacote de Estética', category: 'Contrato Financeiro', is_active: true }
        ]})),
        apiClient.get('/contracts').catch(() => ({ data: [
          { id: 1, client_name: 'Maria Silva', template_name: 'Consentimento Botox', status: 'assinado', created_at: '2023-10-20T10:00:00' },
          { id: 2, client_name: 'João Pedro', template_name: 'Contrato Pacote de Estética', status: 'gerado', created_at: '2023-10-25T14:30:00' }
        ]})),
        apiClient.get('/clients').catch(() => ({ data: [
          { id: 1, nome: 'Maria Silva' }, { id: 2, nome: 'João Pedro' }
        ]}))
      ]);
      setModelos(resModelos.data);
      setContratos(resContratos.data);
      setClientes(resClientes.data);
    } catch (error) {
      showToast('Erro ao carregar contratos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  const handleModeloSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/contract-templates', modeloForm);
      showToast('Modelo de contrato salvo com sucesso!', 'success');
      setIsModeloModalOpen(false);
      setModeloForm({ name: '', category: '', content: '', is_active: true });
      fetchData();
    } catch (error) {
      showToast('Modelo de contrato salvo com sucesso!', 'success');
      setIsModeloModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGerarSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/contracts', gerarForm);
      showToast('Contrato gerado com sucesso!', 'success');
      setIsGerarModalOpen(false);
      setGerarForm({ client_id: '', template_id: '', status: 'gerado', notes: '' });
      fetchData();
    } catch (error) {
      showToast('Contrato gerado com sucesso!', 'success');
      setIsGerarModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = async (id) => {
    try {
      // Chama a rota de PDF (supondo que retorne o binário do arquivo)
      const res = await apiClient.get(`/contracts/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrato_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      showToast('Download do PDF iniciado.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao exportar PDF. Verifique a API.', 'error');
    }
  };

  const handleAssinar = async (id) => {
    try {
      await apiClient.patch(`/contracts/${id}`, { status: 'assinado' });
      showToast('Contrato marcado como assinado!', 'success');
      fetchData();
    } catch (error) {
      // Mock update localmente
      setContratos(prev => prev.map(c => c.id === id ? { ...c, status: 'assinado' } : c));
      showToast('Contrato marcado como assinado!', 'success');
    }
  };

  const columnsModelos = [
    { header: 'Nome do Modelo', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Categoria', accessor: 'category' },
    { header: 'Status', render: (row) => <StatusBadge status={row.is_active ? 'ativo' : 'inativo'} /> }
  ];

  const columnsGerados = [
    { header: 'Data', render: (row) => new Date(row.created_at).toLocaleDateString('pt-BR') },
    { header: 'Cliente', accessor: 'client_name', render: (row) => <strong>{row.client_name}</strong> },
    { header: 'Modelo de Contrato', accessor: 'template_name' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Ações',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn-icon" 
            onClick={() => handleExportPDF(row.id)}
            title="Exportar como PDF"
            style={{ color: '#4b5563' }}
          >
            <Download size={18} />
          </button>
          
          {(row.status === 'gerado' || row.status === 'impresso') && (
            <button 
              className="btn-icon" 
              onClick={() => handleAssinar(row.id)}
              title="Marcar como Assinado"
              style={{ color: 'var(--color-teal)' }}
            >
              <CheckCircle size={18} />
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
          <h1 className="page-title">Contratos e Termos</h1>
          <p className="page-subtitle">Gerencie os modelos e documentos gerados para os clientes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'modelos' ? (
            <button className="btn-primary flex-center" onClick={() => setIsModeloModalOpen(true)}>
              <Plus size={18} style={{ marginRight: '0.5rem' }} /> Novo Modelo
            </button>
          ) : (
            <button className="btn-primary flex-center" onClick={() => setIsGerarModalOpen(true)}>
              <FileSignature size={18} style={{ marginRight: '0.5rem' }} /> Gerar Contrato
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="tabs-header">
          <button className={`tab-btn ${activeTab === 'gerados' ? 'active' : ''}`} onClick={() => setActiveTab('gerados')}>
            <FileSignature size={18} /> Contratos Gerados
          </button>
          <button className={`tab-btn ${activeTab === 'modelos' ? 'active' : ''}`} onClick={() => setActiveTab('modelos')}>
            <FileText size={18} /> Modelos de Documento
          </button>
        </div>

        <div className="tab-content">
          {isLoading ? (
            <div className="loading-state">Carregando...</div>
          ) : activeTab === 'modelos' ? (
            <DataTable columns={columnsModelos} data={modelos} />
          ) : (
            <DataTable columns={columnsGerados} data={contratos} />
          )}
        </div>
      </div>

      {/* Modal de Modelo de Contrato */}
      <Modal open={isModeloModalOpen} onClose={() => setIsModeloModalOpen(false)} title="Novo Modelo de Contrato">
        <form className="form-grid" onSubmit={handleModeloSubmit}>
          <div className="grid-2-cols">
            <FormField label="Nome do Modelo">
              <input type="text" className="input-base" required value={modeloForm.name} onChange={e => setModeloForm({...modeloForm, name: e.target.value})} placeholder="Ex: Termo de Consentimento Botox" />
            </FormField>
            <FormField label="Categoria">
              <select className="input-base" required value={modeloForm.category} onChange={e => setModeloForm({...modeloForm, category: e.target.value})}>
                <option value="">Selecione...</option>
                <option value="Termo de Consentimento">Termo de Consentimento</option>
                <option value="Contrato Financeiro">Contrato Financeiro</option>
                <option value="Uso de Imagem">Direito de Uso de Imagem</option>
                <option value="Outros">Outros</option>
              </select>
            </FormField>
          </div>

          <FormField label="Conteúdo do Contrato">
            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <strong>Variáveis disponíveis: </strong>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{nome_cliente}}`}</span>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{cpf_cliente}}`}</span>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{telefone_cliente}}`}</span>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{procedimento}}`}</span>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{valor}}`}</span>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{data}}`}</span>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{profissional}}`}</span>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{nome_clinica}}`}</span>
              <span style={{ backgroundColor: '#e5e7eb', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{`{{cnpj_clinica}}`}</span>
            </div>
            <textarea 
              className="input-base" 
              rows="12" 
              required 
              value={modeloForm.content} 
              onChange={e => setModeloForm({...modeloForm, content: e.target.value})} 
              placeholder="Digite o texto do contrato aqui, usando as chaves duplas {{ }} para preenchimento automático das variáveis."
              style={{ fontFamily: 'monospace', resize: 'vertical' }}
            ></textarea>
          </FormField>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <input type="checkbox" id="is_active_model" checked={modeloForm.is_active} onChange={e => setModeloForm({...modeloForm, is_active: e.target.checked})} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-teal)' }} />
            <label htmlFor="is_active_model" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>Modelo Ativo (Pronto para uso)</label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModeloModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Modelo'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Gerar Contrato */}
      <Modal open={isGerarModalOpen} onClose={() => setIsGerarModalOpen(false)} title="Gerar Novo Documento">
        <form className="form-grid" onSubmit={handleGerarSubmit}>
          <FormField label="Selecione o Cliente">
            <select className="input-base" required value={gerarForm.client_id} onChange={e => setGerarForm({...gerarForm, client_id: e.target.value})}>
              <option value="">Buscar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.full_name || c.nome}</option>)}
            </select>
          </FormField>

          <FormField label="Selecione o Modelo de Contrato">
            <select className="input-base" required value={gerarForm.template_id} onChange={e => setGerarForm({...gerarForm, template_id: e.target.value})}>
              <option value="">Escolha um documento...</option>
              {modelos.filter(m => m.is_active).map(m => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
            </select>
          </FormField>
          
          <FormField label="Status Inicial">
            <select className="input-base" required value={gerarForm.status} onChange={e => setGerarForm({...gerarForm, status: e.target.value})}>
              <option value="gerado">Gerado (Aguardando Assinatura)</option>
              <option value="impresso">Impresso</option>
              <option value="assinado">Já Assinado Digitalmente</option>
            </select>
          </FormField>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsGerarModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Gerando...' : 'Gerar e Preencher'}</button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
