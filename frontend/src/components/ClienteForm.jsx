import { useState, useEffect } from 'react';
import { FormField } from './ui';
import apiClient from '../api/client';

// Funções de Máscara
const maskCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const maskPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
const maskCEP = (v) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');

export default function ClienteForm({ initialData, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    data_nascimento: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    origem: 'Instagram'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Preenche o formulário se houver dados iniciais (Edição)
  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.full_name || initialData.nome || '',
        telefone: (initialData.phone || initialData.telefone) ? maskPhone(initialData.phone || initialData.telefone) : '',
        email: initialData.email || '',
        cpf: initialData.cpf ? maskCPF(initialData.cpf) : '',
        data_nascimento: initialData.birth_date || initialData.data_nascimento || '',
        cep: (initialData.zip_code || initialData.cep) ? maskCEP(initialData.zip_code || initialData.cep) : '',
        rua: initialData.street || initialData.rua || '',
        numero: initialData.address_number || initialData.numero || '',
        complemento: initialData.address_complement || initialData.complemento || '',
        bairro: initialData.neighborhood || initialData.bairro || '',
        cidade: initialData.city || initialData.cidade || '',
        estado: initialData.state || initialData.estado || '',
        origem: initialData.origin || initialData.origem || 'Instagram'
      });
    }
  }, [initialData]);

  // Gerenciador de mudanças com aplicação de máscaras e gatilho do ViaCEP
  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    
    if (name === 'cpf') val = maskCPF(value);
    if (name === 'telefone') val = maskPhone(value);
    if (name === 'cep') {
      val = maskCEP(value);
      if (val.replace(/\D/g, '').length === 8) {
        buscarCep(val.replace(/\D/g, ''));
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  // Consulta à API ViaCEP
  const buscarCep = async (cep) => {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar CEP', err);
    }
  };

  // Submissão do Formulário (POST ou PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Remove máscaras antes de enviar para o banco e mapeia para o padrão da API
      const payload = { 
        full_name: formData.nome,
        phone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null,
        email: formData.email || null,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
        birth_date: formData.data_nascimento || null,
        zip_code: formData.cep ? formData.cep.replace(/\D/g, '') : null,
        street: formData.rua || null,
        address_number: formData.numero || null,
        address_complement: formData.complemento || null,
        neighborhood: formData.bairro || null,
        city: formData.cidade || null,
        state: formData.estado || null,
        origin: formData.origem || null
      };
      
      if (initialData?.id) {
        await apiClient.put(`/clients/${initialData.id}`, payload);
      } else {
        await apiClient.post('/clients', payload);
      }
      
      onSuccess();
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <FormField label="Nome Completo">
        <input type="text" name="nome" className="input-base" required value={formData.nome} onChange={handleChange} />
      </FormField>
      
      <div className="grid-2-cols">
        <FormField label="Telefone">
          <input type="text" name="telefone" className="input-base" required placeholder="(00) 00000-0000" value={formData.telefone} onChange={handleChange} />
        </FormField>
        <FormField label="E-mail">
          <input type="email" name="email" className="input-base" required value={formData.email} onChange={handleChange} />
        </FormField>
      </div>

      <div className="grid-2-cols">
        <FormField label="CPF">
          <input type="text" name="cpf" className="input-base" required placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} />
        </FormField>
        <FormField label="Data de Nascimento">
          <input type="date" name="data_nascimento" className="input-base" required value={formData.data_nascimento} onChange={handleChange} />
        </FormField>
      </div>

      <div className="grid-2-cols">
        <FormField label="CEP">
          <input type="text" name="cep" className="input-base" required placeholder="00000-000" value={formData.cep} onChange={handleChange} />
        </FormField>
        <FormField label="Rua">
          <input type="text" name="rua" className="input-base" required value={formData.rua} onChange={handleChange} />
        </FormField>
      </div>

      <div className="grid-2-cols">
        <FormField label="Número">
          <input type="text" name="numero" className="input-base" required value={formData.numero} onChange={handleChange} />
        </FormField>
        <FormField label="Complemento">
          <input type="text" name="complemento" className="input-base" value={formData.complemento} onChange={handleChange} />
        </FormField>
      </div>

      <div className="grid-2-cols">
        <FormField label="Bairro">
          <input type="text" name="bairro" className="input-base" required value={formData.bairro} onChange={handleChange} />
        </FormField>
        <FormField label="Cidade">
          <input type="text" name="cidade" className="input-base" required value={formData.cidade} onChange={handleChange} />
        </FormField>
      </div>

      <div className="grid-2-cols">
        <FormField label="Estado">
          <input type="text" name="estado" className="input-base" maxLength={2} required placeholder="UF" value={formData.estado} onChange={handleChange} />
        </FormField>
        <FormField label="Origem">
          <select name="origem" className="input-base" value={formData.origem} onChange={handleChange}>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Google">Google</option>
            <option value="Indicação">Indicação</option>
            <option value="Outros">Outros</option>
          </select>
        </FormField>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Cliente'}
        </button>
      </div>
    </form>
  );
}
