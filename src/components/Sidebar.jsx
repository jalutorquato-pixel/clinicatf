"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, DollarSign } from 'lucide-react';
import { hasPermission, PERMISSIONS } from '../lib/rbac';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    label: 'Clientes', 
    href: '/clientes', 
    icon: Users, 
    permission: PERMISSIONS.CLIENTS_VIEW 
  },
  { 
    label: 'Financeiro', 
    href: '/financeiro', 
    icon: DollarSign, 
    permission: PERMISSIONS.FINANCE_VIEW 
  },
  { 
    label: 'Configurações', 
    href: '/admin/users', 
    icon: UserPlus, 
    permission: PERMISSIONS.USERS_MANAGE 
  },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar-container">
      <nav className="nav-list">
        {menuItems.map((item) => {
          // Verifica permissão antes de renderizar o link
          if (item.permission && !hasPermission(user, item.permission)) {
            return null;
          }

          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}