import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AppLayout from './layouts/AppLayout';
import Pages from './pages/Pages';
import Clientes from './pages/Clientes';
import ClienteDetail from './pages/ClienteDetail';
import Embaixadoras from './pages/Embaixadoras';
import EmbaixadoraDashboard from './pages/EmbaixadoraDashboard';
import Indicacoes from './pages/Indicacoes';
import Ciclos from './pages/Ciclos';
import Pontos from './pages/Pontos';
import Beneficios from './pages/Beneficios';
import Creditos from './pages/Creditos';
import Agenda from './pages/Agenda';
import Vendas from './pages/Vendas';
import Procedimentos from './pages/Procedimentos';
import Financeiro from './pages/Financeiro';
import Estoque from './pages/Estoque';
import Contratos from './pages/Contratos';
import Atendimento from './pages/Atendimento';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Protegidas dentro de AppLayout */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Pages />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="atendimento" element={<Atendimento />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetail />} />
          <Route path="embaixadoras" element={<Embaixadoras />} />
          <Route path="embaixadoras/:id" element={<EmbaixadoraDashboard />} />
          <Route path="indicacoes" element={<Indicacoes />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="procedimentos" element={<Procedimentos />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="ciclos" element={<Ciclos />} />
          <Route path="beneficios" element={<Beneficios />} />
          <Route path="creditos" element={<Creditos />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          {/* Adicione outras rotas protegidas aqui */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
