import { useState, useEffect } from 'react';
import { Plus, Map, List, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { 
  DataTable, 
  SearchInput, 
  StatusBadge, 
  Modal, 
  Toast 
} from '../components/ui';
import ClienteForm from '../components/ClienteForm';
import ClientesMap from '../components/ClientesMap';

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('lista'); // 'lista' ou 'mapa'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Busca os clientes na montagem do componente
  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/clients');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      showToast('Erro ao carregar clientes.', 'error');
      // Mock para teste caso a API não esteja pronta:
      setClientes([
        { id: 1, nome: 'Maria Silva', telefone: '(11) 98765-4321', cpf: '111.222.333-44', cidade: 'São Paulo', status: 'ativo', created_at: '2023-10-01T10:00:00' },
        { id: 2, nome: 'João Pedro', telefone: '(21) 99999-8888', cpf: '555.666.777-88', cidade: 'Rio de Janeiro', status: 'inativo', created_at: '2023-09-15T14:30:00' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Filtragem
  const filteredClientes = clientes.filter(c => {
    const term = searchTerm.toLowerCase();
    const nome = c.full_name || c.nome || '';
    const phone = c.phone || c.telefone || '';
    const cpf = c.cpf || '';
    return (
      nome.toLowerCase().includes(term) ||
      phone.includes(term) ||
      cpf.includes(term)
    );
  });

  // Colunas da Tabela
  const columns = [
    { header: 'Nome', render: (row) => row.full_name || row.nome },
    { header: 'Telefone', render: (row) => row.phone || row.telefone },
    { header: 'CPF', accessor: 'cpf' },
    { header: 'Cidade', render: (row) => row.city || row.cidade },
    { 
      header: 'Status', 
      render: (row) => <StatusBadge status={(row.is_active !== undefined ? (row.is_active ? 'ativo' : 'inativo') : row.status) || 'ativo'} /> 
    },
    { 
      header: 'Data de Cadastro', 
      render: (row) => new Date(row.created_at).toLocaleDateString('pt-BR') 
    },
    {
      header: 'Ações',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn-icon" 
            onClick={() => navigate(`/clientes/${row.id}`)}
            title="Ver Detalhes"
          >
            <Eye size={16} />
          </button>
          <button 
            className="btn-icon" 
            onClick={() => {
              setEditingClient(row);
              setIsModalOpen(true);
            }}
            title="Editar"
          >
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
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gerencie os clientes da clínica</p>
        </div>
        <button 
          className="btn-primary flex-center"
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Novo Cliente
        </button>
      </div>

      <div className="card">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'lista' ? 'active' : ''}`}
            onClick={() => setActiveTab('lista')}
          >
            <List size={18} />
            Lista
          </button>
          <button 
            className={`tab-btn ${activeTab === 'mapa' ? 'active' : ''}`}
            onClick={() => setActiveTab('mapa')}
          >
            <Map size={18} />
            Mapa
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'lista' && (
            <div className="lista-view">
              <div className="toolbar">
                <SearchInput 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Buscar por nome, CPF ou telefone..."
                />
              </div>

              {isLoading ? (
                <div className="loading-state">Carregando clientes...</div>
              ) : (
                <DataTable columns={columns} data={filteredClientes} />
              )}
            </div>
          )}

          {activeTab === 'mapa' && (
            <div className="mapa-view">
              <ClientesMap clientes={filteredClientes} />
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingClient ? "Editar Cliente" : "Novo Cliente"}
      >
        <ClienteForm 
          initialData={editingClient}
          onSuccess={() => {
            setIsModalOpen(false);
            showToast('Cliente salvo com sucesso!', 'success');
            fetchClientes(); // Atualiza a lista
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />
    </div>
  );
}
