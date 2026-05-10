"use client";
import { useState } from 'react';
import { FormField, Toast } from '../../../../components/ui';
import apiClient from "../../../../api/client";

export default function AdminUsers() {
  const [formData, setFormData] = useState({ username: '', password: '', roleId: '' });
  const [toast, setToast] = useState({ message: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/users', formData);
      setToast({ message: 'Usuário criado com sucesso!', type: 'success' });
      setFormData({ username: '', password: '', roleId: '' });
    } catch (error) {
      setToast({ message: 'Erro ao criar usuário.', type: 'error' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Gestão de Usuários</h1>
      </div>

      <div className="card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit} className="form-grid">
          <FormField label="Nome de Usuário">
            <input 
              className="input-base"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              required 
            />
          </FormField>
          <FormField label="Senha Provisória">
            <input 
              type="password"
              className="input-base"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required 
            />
          </FormField>
          <FormField label="Papel Principal">
            <select 
              className="input-base"
              value={formData.roleId}
              onChange={e => setFormData({...formData, roleId: e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              <option value="1">Admin</option>
              <option value="2">Recepcionista</option>
            </select>
          </FormField>
          <button type="submit" className="btn-primary">Criar Colaborador</button>
        </form>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:''})} />
    </div>
  );
}