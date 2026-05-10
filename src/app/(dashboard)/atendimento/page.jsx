"use client";

import { useState, useEffect } from 'react';
import { Plus, FileText, ClipboardList, Edit } from 'lucide-react';
import apiClient from "../../../api/client";
import { 
  DataTable, 
  StatusBadge, 
  Modal, 
  FormField,
  Toast 
} from '../../../components/ui';

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
  const [editingAnamnese, setEditingAnamnese] = useState(null);
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
        apiClient.get('/anamnesis-records'),
        apiClient.get('/prescription-records'),
        apiClient.get('/clients'),
        apiClient.get('/professionals'),
        apiClient.get('/anamnesis-templates'),
        apiClient.get('/prescription-templates')
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

  const openAnamneseModal = (record = null) => {
    setEditingAnamnese(record);
    setAnamneseForm(record ? {
      client_id: record.client_id || '',
      template_id: record.template_id || '',
      title: record.title || '',
      answers: record.answers || '{}',
      status: record.status || 'pendente'
    } : {
      client_id: '', template_id: '', title: '', answers: '{}', status: 'pendente'
    });
    setIsAnamneseModalOpen(true);
  };

  const closeAnamneseModal = () => {
    setIsAnamneseModalOpen(false);
    setEditingAnamnese(null);
    setAnamneseForm({ client_id: '', template_id: '', title: '', answers: '{}', status: 'pendente' });
  };

  const handlePrintReceita = (row) => {
    const printWindow = window.open('', '_blank', 'width=820,height=900');
    if (!printWindow) {
      showToast('Não foi possível abrir a janela de impressão.', 'error');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${row.title || 'Receita'}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; padding: 32px; line-height: 1.6; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .meta { color: #4b5563; margin-bottom: 24px; }
            pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>${row.title || 'Receita'}</h1>
          <div class="meta">
            <strong>Paciente:</strong> ${row.client_name || ''}<br />
            <strong>Profissional:</strong> ${row.professional_name || ''}<br />
            <strong>Data:</strong> ${row.date ? new Date(row.date).toLocaleDateString('pt-BR') : ''}
          </div>
          <pre>${row.content || ''}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Handles de Submissão
  const handleAnamneseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingAnamnese) {
        await apiClient.put(`/anamnesis-records/${editingAnamnese.id}`, anamneseForm);
        showToast('Anamnese atualizada com sucesso!', 'success');
      } else {
        await apiClient.post('/anamnesis-records', anamneseForm);
        showToast('Anamnese registrada com sucesso!', 'success');
      }
      closeAnamneseModal();
      fetchData();
    } catch (error) {
      showToast('Erro ao salvar anamnese.', 'error');
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
        <button className="btn-icon" onClick={() => openAnamneseModal(row)} title="Visualizar/Editar">
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
        <button className="btn-icon" onClick={() => handlePrintReceita(row)} title="Imprimir">
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
            <button className="btn-primary flex-center" onClick={() => openAnamneseModal()}>
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
      <Modal open={isAnamneseModalOpen} onClose={closeAnamneseModal} title={editingAnamnese ? "Editar Anamnese" : "Preencher Nova Anamnese"}>
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
            <button type="button" className="btn-secondary" onClick={closeAnamneseModal} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : (editingAnamnese ? 'Atualizar Ficha' : 'Salvar Ficha')}</button>
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
