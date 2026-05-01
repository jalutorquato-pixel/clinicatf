import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { getToken } from '../api/client';
import {
  LayoutDashboard, Calendar, Users, Star, Gift,
  ShoppingCart, Activity, Repeat, Award, CreditCard,
  FileText, Stethoscope, DollarSign, Package,
  PieChart, Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/embaixadoras', label: 'Embaixadoras', icon: Star },
  { path: '/indicacoes', label: 'Indicações', icon: Gift },
  { path: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { path: '/procedimentos', label: 'Procedimentos', icon: Activity },
  { path: '/ciclos', label: 'Ciclos', icon: Repeat },
  { path: '/beneficios', label: 'Benefícios', icon: Award },
  { path: '/creditos', label: 'Créditos', icon: CreditCard },
  { path: '/contratos', label: 'Contratos', icon: FileText },
  { path: '/atendimento', label: 'Atendimento', icon: Stethoscope },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/estoque', label: 'Estoque', icon: Package },
  { path: '/relatorios', label: 'Relatórios', icon: PieChart },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function AppLayout() {
  const token = getToken();

  // Proteção de rota: redireciona para o login se não houver token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Clínica TF</h2>
        </div>
        
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
