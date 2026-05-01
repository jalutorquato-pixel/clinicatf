import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { setToken } from '../api/client';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Endpoint geralmente espera JSON se configurarmos assim no FastAPI
      // ou form-data (OAuth2PasswordRequestForm) dependendo da implementação do backend.
      // Assumindo form-data pois é padrão do FastAPI OAuth2
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Supondo que a resposta seja no formato padrão OAuth2: { access_token: "..." }
      if (response.data && response.data.access_token) {
        setToken(response.data.access_token);
        navigate('/');
      } else {
        setError('Formato de token inválido recebido.');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Usuário ou senha incorretos.');
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="login-header">
          <h2>Clínica TF</h2>
          <p>Faça login para acessar o sistema</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Usuário</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
