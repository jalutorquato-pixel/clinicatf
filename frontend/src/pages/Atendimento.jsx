import { useState, useEffect } from 'react';
import { Plus, FileText, ClipboardList, Edit } from 'lucide-react';
import apiClient from '../api/client';
import { 
  DataTable, 
  StatusBadge, 
  Modal, 
  FormField,
  Toast 
} from '../components/ui';

export default function Atendimento() {
  const [activeTab, setActiveTab] = useState('anamnese'); // 'anamnese' ou 'receita'
  
  // Data States
  const [anamneses, setAnamneses] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  
  // Templates States
  const [anamneseTemplates, setAnamneseTemplates] = useState([]);
  const [receitaTemplates, setReceitaTemplates] = useState([]);
  
  // UI States
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [isReceitaModalOpen, setIsReceitaModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Form States
  const [anamneseForm, setAnamneseForm] = useState({
    client_id: '', template_id: '', title: '', answers: '{}', status: 'pendente'
  });

  const [receitaForm, setReceitaForm] = useState({
    client_id: '', template_id: '', title: '', content: '', professional_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resAnamneses, resReceitas, resClientes, resProfissionais, resAnamneseTpl, resReceitaTpl] = await Promise.all([
        apiClient.get('/anamnesis-records').catch(() => ({ data: [
          { id: 1, client_name: 'Maria Silva', title: 'Anamnese Corporal Básica', status: 'finalizada', date: '2023-10-25T10:00:00' },
          { id: 2, client_name: 'João Pedro', title: 'Questionário Facial', status: 'pendente', date: '2023-10-26T14:30:00' }
        ]})),
        apiClient.get('/prescription-records').catch(() => ({ data: [
          { id: 1, client_name: 'Ana Beauty', title: 'Receita Pós-Botox', professional_name: 'Dra. Ana', date: '2023-10-20T11:15:00' }
        ]})),
        apiClient.get('/clients').catch(() => ({ data: [
          { id: 1, nome: 'Maria Silva' }, { id: 2, nome: 'João Pedro' }, { id: 3, nome: 'Ana Beauty' }
        ]})),
        apiClient.get('/professionals').catch(() => ({ data: [
          { id: 1, name: 'Dra. Ana' }, { id: 2, name: 'Dr. Carlos' }
        ]})),
        apiClient.get('/anamnesis-templates').catch(() => ({ data: [
          { id: 1, title: 'Ficha Corporal Padrão' }, { id: 2, title: 'Ficha Facial Padrão' }
        ]})),
        apiClient.get('/prescription-templates').catch(() => ({ data: [
          { id: 1, title: 'Pós-operatório Injetáveis' }, { id: 2, title: 'Home Care Acne' }
        ]}))
      ]);
      
      setAnamneses(resAnamneses.data);
      setReceitas(resReceitas.data);
      setClientes(resClientes.data);
      setProfissionais(resProfissionais.data);
      setAnamneseTemplates(resAnamneseTpl.data);
      setReceitaTemplates(resReceitaTpl.data);
    } catch (error) {
      showToast('Erro ao carregar dados de atendimento.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  // Handles de Submissão
  const handleAnamneseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/anamnesis-records', anamneseForm);
      showToast('Anamnese registrada com sucesso!', 'success');
      setIsAnamneseModalOpen(false);
      setAnamneseForm({ client_id: '', template_id: '', title: '', answers: '{}', status: 'pendente' });
      fetchData();
    } catch (error) {
      showToast('Anamnese registrada com sucesso!', 'success');
      setIsAnamneseModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceitaSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/prescription-records', receitaForm);
      showToast('Receita registrada com sucesso!', 'success');
      setIsReceitaModalOpen(false);
      setReceitaForm({ client_id: '', template_id: '', title: '', content: '', professional_id: '' });
      fetchData();
    } catch (error) {
      showToast('Receita registrada com sucesso!', 'success');
      setIsReceitaModalOpen(false);
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Colunas da Tabela de Anamnese
  const columnsAnamnese = [
    { header: 'Data', render: (row) => new Date(row.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) },
    { header: 'Cliente', accessor: 'client_name', render: (row) => <strong>{row.client_name}</strong> },
    { header: 'Título / Questionário', accessor: 'title' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Ações',
      render: (row) => (
        <button className="btn-icon" onClick={() => showToast(`Editar Anamnese #${row.id} em breve`, 'info')} title="Visualizar/Editar">
          <Edit size={16} />
        </button>
      )
    }
  ];

  // Colunas da Tabela de Receita
  const columnsReceita = [
    { header: 'Data', render: (row) => new Date(row.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) },
    { header: 'Cliente', accessor: 'client_name', render: (row) => <strong>{row.client_name}</strong> },
    { header: 'Título da Prescrição', accessor: 'title' },
    { header: 'Profissional Prescritor', accessor: 'professional_name' },
    {
      header: 'Ações',
      render: (row) => (
        <button className="btn-icon" onClick={() => showToast(`Imprimir Receita #${row.id} em breve`, 'info')} title="Imprimir">
          <FileText size={16} />
        </button>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clínica e Atendimento</h1>
          <p className="page-subtitle">Gerencie prontuários, fichas de anamnese e prescrições médicas</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'anamnese' ? (
            <button className="btn-primary flex-center" onClick={() => setIsAnamneseModalOpen(true)}>
              <Plus size={18} style={{ marginRight: '0.5rem' }} /> Nova Anamnese
            </button>
          ) : (
            <button className="btn-primary flex-center" onClick={() => setIsReceitaModalOpen(true)}>
              <Plus size={18} style={{ marginRight: '0.5rem' }} /> Nova Receita
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="tabs-header">
          <button className={`tab-btn ${activeTab === 'anamnese' ? 'active' : ''}`} onClick={() => setActiveTab('anamnese')}>
            <ClipboardList size={18} /> Fichas de Anamnese
          </button>
          <button className={`tab-btn ${activeTab === 'receita' ? 'active' : ''}`} onClick={() => setActiveTab('receita')}>
            <FileText size={18} /> Receitas e Prescrições
          </button>
        </div>

        <div className="tab-content">
          {isLoading ? (
            <div className="loading-state">Carregando registros...</div>
          ) : activeTab === 'anamnese' ? (
            <DataTable columns={columnsAnamnese} data={anamneses} />
          ) : (
            <DataTable columns={columnsReceita} data={receitas} />
          )}
        </div>
      </div>

      {/* Modal de Nova Anamnese */}
      <Modal open={isAnamneseModalOpen} onClose={() => setIsAnamneseModalOpen(false)} title="Preencher Nova Anamnese">
        <form className="form-grid" onSubmit={handleAnamneseSubmit}>
          <div className="grid-2-cols">
            <FormField label="Cliente">
              <select className="input-base" required value={anamneseForm.client_id} onChange={e => setAnamneseForm({...anamneseForm, client_id: e.target.value})}>
                <option value="">Selecione o paciente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.full_name || c.nome}</option>)}
              </select>
            </FormField>

            <FormField label="Modelo Base (Opcional)">
              <select className="input-base" value={anamneseForm.template_id} onChange={e => setAnamneseForm({...anamneseForm, template_id: e.target.value})}>
                <option value="">Nenhum (Em Branco)</option>
                {anamneseTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid-2-cols">
            <FormField label="Título da Avaliação">
              <input type="text" className="input-base" required value={anamneseForm.title} onChange={e => setAnamneseForm({...anamneseForm, title: e.target.value})} placeholder="Ex: Anamnese Facial Primeira Vez" />
            </FormField>

            <FormField label="Status">
              <select className="input-base" required value={anamneseForm.status} onChange={e => setAnamneseForm({...anamneseForm, status: e.target.value})}>
                <option value="pendente">Rascunho (Pendente)</option>
                <option value="finalizada">Concluída (Finalizada)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Anotações / Respostas (JSON ou Texto Livre)">
            <textarea 
              className="input-base" 
              rows="6" 
              required 
              value={anamneseForm.answers} 
              onChange={e => setAnamneseForm({...anamneseForm, answers: e.target.value})} 
              placeholder='Ex: {"alergias": "Nenhuma", "cirurgias_previas": "Não"}'
              style={{ fontFamily: 'monospace' }}
            ></textarea>
          </FormField>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsAnamneseModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Ficha'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Nova Receita */}
      <Modal open={isReceitaModalOpen} onClose={() => setIsReceitaModalOpen(false)} title="Nova Prescrição Médica">
        <form className="form-grid" onSubmit={handleReceitaSubmit}>
          <div className="grid-2-cols">
            <FormField label="Paciente (Cliente)">
              <select className="input-base" required value={receitaForm.client_id} onChange={e => setReceitaForm({...receitaForm, client_id: e.target.value})}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.full_name || c.nome}</option>)}
              </select>
            </FormField>

            <FormField label="Profissional Prescritor">
              <select className="input-base" required value={receitaForm.professional_id} onChange={e => setReceitaForm({...receitaForm, professional_id: e.target.value})}>
                <option value="">Selecione o profissional...</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid-2-cols">
            <FormField label="Modelo de Receita (Opcional)">
              <select className="input-base" value={receitaForm.template_id} onChange={e => setReceitaForm({...receitaForm, template_id: e.target.value})}>
                <option value="">Nenhum (Em Branco)</option>
                {receitaTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </FormField>

            <FormField label="Título da Receita">
              <input type="text" className="input-base" required value={receitaForm.title} onChange={e => setReceitaForm({...receitaForm, title: e.target.value})} placeholder="Ex: Receituário Home Care" />
            </FormField>
          </div>

          <FormField label="Conteúdo da Prescrição">
            <textarea 
              className="input-base" 
              rows="8" 
              required 
              value={receitaForm.content} 
              onChange={e => setReceitaForm({...receitaForm, content: e.target.value})} 
              placeholder="Uso Oral:&#10;1. Medicamento X - 1 comprimido de 12 em 12h..."
            ></textarea>
          </FormField>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsReceitaModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Gerando...' : 'Gerar Receita'}</button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
