"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePermissions } from '../../hooks/usePermissions';
import { getToken } from '../../api/client';
import { decodeJwt, PERMISSIONS } from '../../lib/rbac';
import {
  LayoutDashboard, Calendar, Users, Star, Gift,
  ShoppingCart, Activity, Repeat, Award, CreditCard,
  FileText, Stethoscope, DollarSign, Package,
  PieChart, Settings, Menu, X, LogOut, User as UserIcon
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
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign, permission: PERMISSIONS.FINANCE_VIEW },
  { path: '/estoque', label: 'Estoque', icon: Package },
  { path: '/relatorios', label: 'Relatórios', icon: PieChart },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, permission: PERMISSIONS.ADMIN_ACCESS },
  { path: '/admin/users', label: 'Gestão de Usuários', icon: Users, permission: PERMISSIONS.USERS_MANAGE },
];

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { canAccess } = usePermissions();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Fecha a sidebar automaticamente ao mudar de rota (útil no mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const token = getToken();
      if (token) {
        const decoded = decodeJwt(token);
        if (decoded) setUser(decoded);
      } else {
        router.replace('/login');
      }
    } catch (err) {
      console.error("Erro ao carregar layout:", err);
    } finally {
      setMounted(true);
    }
  }, [router]);

  const handleLogout = () => {
    // Remove o cookie do token e redireciona
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.replace('/login');
  };

  if (!mounted) return null;

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-active' : ''}`}>
      {/* Header Mobile - Visível apenas em telas pequenas */}
      <header className="mobile-top-bar">
        <button 
          className="menu-toggle-btn" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Abrir menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="mobile-logo">Clínica TF</span>
      </header>

      <div className="app-container">
        <aside className={`sidebar ${isSidebarOpen ? 'show' : ''}`}>
          <div className="sidebar-header">
            <h2>Clínica TF</h2>
          </div>
          
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              // Verifica acesso pelo path ou pela permissão explícita
              const hasAccess = item.permission ? canAccess(item.permission) : canAccess(item.path);
              
              if (!hasAccess) {
                return null;
              }
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="nav-icon" size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Perfil do Usuário e Logout */}
          {user && (
            <div className="sidebar-footer">
              <div className="user-info">
                <div className="user-avatar">
                  <UserIcon size={18} />
                </div>
                <div className="user-details">
                  <span className="user-name">{user.username}</span>
                  <span className="user-role">{user.roles?.[0]?.name || 'Colaborador'}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Sair">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </aside>

        {/* Overlay para fechar o menu ao clicar fora no mobile */}
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
        
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
