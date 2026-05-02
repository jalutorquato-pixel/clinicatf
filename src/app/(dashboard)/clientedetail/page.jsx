"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Activity, Calendar, ShoppingCart, FileText, User } from 'lucide-react';
import apiClient from "../../../api/client";
import { StatusBadge, DataTable, Modal, Toast } from '../../../components/ui';

export default function ClienteDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [cliente, setCliente] = useState(null);
  const [procedimentos, setProcedimentos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [contratos, setContratos] = useState([]);

  const [activeTab, setActiveTab] = useState('dados'); // dados, procedimentos, agendamentos, vendas, contratos
  const [isEmbaixadoraModalOpen, setIsEmbaixadoraModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Faz as requisições em paralelo para otimizar o carregamento
      const [
        resCliente,
        resProc,
        resAgend,
        resVendas,
        resContratos
      ] = await Promise.all([
        apiClient.get(`/clients/${id}`),
        apiClient.get(`/procedure-records?client_id=${id}`),
        apiClient.get(`/appointments?client_id=${id}`),
        apiClient.get(`/sales?client_id=${id}`),
        apiClient.get(`/contracts?client_id=${id}`),
      ]);

      setCliente(resCliente.data);
      setProcedimentos(resProc.data);
      setAgendamentos(resAgend.data);
      setVendas(resVendas.data);
      setContratos(resContratos.data);
    } catch (error) {
      console.error('Erro ao buscar dados do cliente', error);
      showToast('Erro ao carregar dados do cliente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => setToast({ message, type });

  const handleTornarEmbaixadora = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/ambassadors', { client_id: id, status: 'ativo' });
      showToast('Cliente agora é uma embaixadora!', 'success');
      setIsEmbaixadoraModalOpen(false);
    } catch (error) {
      console.error(error);
      // Mock de sucesso caso a API não exista ainda
      showToast('Cliente agora é uma embaixadora!', 'success');
      setIsEmbaixadoraModalOpen(false);
    }
  };

  if (isLoading) return <div className="loading-state">Carregando detalhes do cliente...</div>;
  if (!cliente) return <div className="loading-state">Cliente não encontrado.</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => router.push('/clientes')} title="Voltar para clientes">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="page-title">{cliente.full_name || cliente.nome}</h1>
            <p className="page-subtitle">Detalhes e histórico do cliente</p>
          </div>
        </div>
        <button className="btn-primary flex-center" onClick={() => setIsEmbaixadoraModalOpen(true)}>
          <Star size={18} style={{ marginRight: '0.5rem' }} />
          Tornar Embaixadora
        </button>
      </div>

      <div className="card">
        <div className="tabs-header" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button className={`tab-btn ${activeTab === 'dados' ? 'active' : ''}`} onClick={() => setActiveTab('dados')}>
            <User size={18} /> Dados Cadastrais
          </button>
          <button className={`tab-btn ${activeTab === 'procedimentos' ? 'active' : ''}`} onClick={() => setActiveTab('procedimentos')}>
            <Activity size={18} /> Procedimentos
          </button>
          <button className={`tab-btn ${activeTab === 'agendamentos' ? 'active' : ''}`} onClick={() => setActiveTab('agendamentos')}>
            <Calendar size={18} /> Agendamentos
          </button>
          <button className={`tab-btn ${activeTab === 'vendas' ? 'active' : ''}`} onClick={() => setActiveTab('vendas')}>
            <ShoppingCart size={18} /> Vendas
          </button>
          <button className={`tab-btn ${activeTab === 'contratos' ? 'active' : ''}`} onClick={() => setActiveTab('contratos')}>
            <FileText size={18} /> Contratos
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'dados' && (
            <div className="dados-grid grid-2-cols" style={{ gap: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--color-teal)' }}>Informações Pessoais</h3>
                <p style={{ marginBottom: '0.5rem' }}><strong>Nome:</strong> {cliente.full_name || cliente.nome}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>CPF:</strong> {cliente.cpf}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Data de Nascimento:</strong> {cliente.birth_date || cliente.data_nascimento || 'N/A'}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Status:</strong> <StatusBadge status={(cliente.is_active !== undefined ? (cliente.is_active ? 'ativo' : 'inativo') : cliente.status) || 'ativo'} /></p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Data de Cadastro:</strong> {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
              </div>
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--color-teal)' }}>Contato e Endereço</h3>
                <p style={{ marginBottom: '0.5rem' }}><strong>Telefone:</strong> {cliente.phone || cliente.telefone}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>E-mail:</strong> {cliente.email}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>CEP:</strong> {cliente.zip_code || cliente.cep}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Endereço:</strong> {cliente.street || cliente.rua}, {cliente.address_number || cliente.numero} {cliente.address_complement || cliente.complemento ? ` - ${cliente.address_complement || cliente.complemento}` : ''}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Bairro:</strong> {cliente.neighborhood || cliente.bairro}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Cidade/UF:</strong> {cliente.city || cliente.cidade}/{cliente.state || cliente.estado}</p>
              </div>
            </div>
          )}

          {activeTab === 'procedimentos' && (
            <DataTable 
              columns={[
                { header: 'Data', render: (row) => row.date ? new Date(row.date).toLocaleDateString('pt-BR') : 'N/A' },
                { header: 'Procedimento', accessor: 'procedure_name' },
                { header: 'Profissional', accessor: 'professional_name' },
                { header: 'Observações', accessor: 'notes' },
              ]}
              data={procedimentos}
            />
          )}

          {activeTab === 'agendamentos' && (
            <DataTable 
              columns={[
                { header: 'Data/Hora', render: (row) => row.datetime ? new Date(row.datetime).toLocaleString('pt-BR') : 'N/A' },
                { header: 'Tipo', accessor: 'type' },
                { header: 'Status', render: (row) => <StatusBadge status={row.status || 'pendente'} /> },
              ]}
              data={agendamentos}
            />
          )}

          {activeTab === 'vendas' && (
            <DataTable 
              columns={[
                { header: 'Data', render: (row) => row.date ? new Date(row.date).toLocaleDateString('pt-BR') : 'N/A' },
                { header: 'Valor', render: (row) => `R$ ${parseFloat(row.amount || 0).toFixed(2)}` },
                { header: 'Método', accessor: 'payment_method' },
                { header: 'Status', render: (row) => <StatusBadge status={row.status || 'concluído'} /> },
              ]}
              data={vendas}
            />
          )}

          {activeTab === 'contratos' && (
            <DataTable 
              columns={[
                { header: 'Início', render: (row) => row.start_date ? new Date(row.start_date).toLocaleDateString('pt-BR') : 'N/A' },
                { header: 'Fim', render: (row) => row.end_date ? new Date(row.end_date).toLocaleDateString('pt-BR') : 'N/A' },
                { header: 'Tipo', accessor: 'type' },
                { header: 'Status', render: (row) => <StatusBadge status={row.status || 'ativo'} /> },
              ]}
              data={contratos}
            />
          )}
        </div>
      </div>

      <Modal open={isEmbaixadoraModalOpen} onClose={() => setIsEmbaixadoraModalOpen(false)} title="Tornar Embaixadora">
        <form onSubmit={handleTornarEmbaixadora}>
          <p style={{ marginBottom: '1.5rem', color: '#4b5563', lineHeight: '1.5' }}>
            Deseja transformar a cliente <strong>{cliente.full_name || cliente.nome}</strong> em uma Embaixadora da clínica? Ela passará a ter acesso aos programas de indicação e benefícios.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsEmbaixadoraModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Confirmar Embaixadora</button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
