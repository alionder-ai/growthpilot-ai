'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Menu,
  Settings,
  Sparkles,
  Target,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

import { LogoutButton } from '@/components/auth/LogoutButton';
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navigationItems: NavItem[] = [
  {
    href: '/dashboard/overview',
    label: 'Gösterge Paneli',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: '/dashboard/clients',
    label: 'Müşteriler',
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: '/dashboard/campaigns',
    label: 'Kampanyalar',
    icon: <Target className="w-5 h-5" />,
  },
  {
    href: '/dashboard/action-plan',
    label: 'Aksiyon Planı',
    icon: <ListChecks className="w-5 h-5" />,
  },
  {
    href: '/dashboard/strategy-cards',
    label: 'Strateji Kartları',
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    href: '/dashboard/target-audience',
    label: 'Hedef Kitle Analizi',
    icon: <Target className="w-5 h-5" />,
  },
  {
    href: '/dashboard/reports',
    label: 'Raporlar',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    href: '/dashboard/creative-generator',
    label: 'Kreatif Üretici',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    href: '/dashboard/leads',
    label: 'Potansiyel Müşteriler',
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    href: '/dashboard/profile',
    label: 'Profil Ayarları',
    icon: <Settings className="w-5 h-5" />,
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string): boolean => {
    if (href === '/dashboard/overview') {
      return pathname === '/dashboard' || pathname === '/dashboard/overview';
    }
    return pathname?.startsWith(href) ?? false;
  };

  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 flex-shrink-0 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">
                GrowthPilot AI
              </span>
            </Link>
            <button
              onClick={closeSidebar}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
              aria-label="Menüyü kapat"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={openSidebar}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
              aria-label="Menüyü aç"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            {/* User profile menu */}
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
