"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '../../api/client';
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

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Clínica TF</h2>
        </div>
        
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
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
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
