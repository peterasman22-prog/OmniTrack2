import { Menu, Bell, Search, User } from 'lucide-react';
import { useAlertStore } from '@/store/useAlertStore';
import { useAuthStore } from '@/services/useAuthStore';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Live Tracking Dashboard',
  '/reports': 'Reports & Analytics',
  '/alerts': 'Alert Management',
  '/users': 'User Management',
  '/settings': 'Settings',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const user = useAuthStore((s) => s.user);
  const pageTitle = pageTitles[location.pathname] || 'OmniTrack';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="btn-ghost rounded-lg p-2">
          <Search className="h-5 w-5 text-gray-500" />
        </button>

        {/* Notifications */}
        <button className="btn-ghost relative rounded-lg p-2">
          <Bell className="h-5 w-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="ml-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'Dev User'}</p>
            <p className="text-[10px] text-gray-500">{user?.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
