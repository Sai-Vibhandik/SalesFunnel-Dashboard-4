import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Users,
  CheckSquare,
  ClipboardCheck,
  FileCheck,
  BookOpen,
  Briefcase,
  CheckCircle,
  PenTool,
} from 'lucide-react';

// Role labels for display
const roleLabels = {
  admin: 'Admin',
  performance_marketer: 'Performance Marketer',
  content_creator: 'Content Creator',
  content_writer: 'Content Writer',
  ui_ux_designer: 'UI/UX Designer',
  graphic_designer: 'Designer',
  video_editor: 'Video Editor',
  developer: 'Developer',
  tester: 'Tester',
};

// Navigation configurations per role
const navigationByRole = {
  // ADMIN SIDEBAR
  admin: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Briefcase },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Team Management', href: '/team', icon: Users },
    { name: 'SOP Library', href: '/sop-library', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],

  // PERFORMANCE MARKETER SIDEBAR
  performance_marketer: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Creative Approvals', href: '/tasks/approval', icon: CheckCircle },
  ],

  // CONTENT WRITER SIDEBAR
  content_writer: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  ],

  // CONTENT CREATOR SIDEBAR (legacy - kept for backward compatibility)
  content_creator: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  ],

  // GRAPHIC DESIGNER SIDEBAR
  graphic_designer: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  ],

  // VIDEO EDITOR SIDEBAR
  video_editor: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  ],

  // UI/UX DESIGNER SIDEBAR
  ui_ux_designer: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  ],

  // DEVELOPER SIDEBAR
  developer: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  ],

  // TESTER SIDEBAR
  tester: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Assets Awaiting Review', href: '/tasks/review', icon: ClipboardCheck },
    { name: 'Approved Assets', href: '/tasks/approved', icon: FileCheck },
  ],
};

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Get navigation based on user role
  const role = user?.role || 'graphic_designer';
  const navigation = navigationByRole[role] || navigationByRole.graphic_designer;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-dark-300 border-r border-dark-200 transition-all duration-300',
        'flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-dark-200">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-dark-300 font-bold text-lg">G</span>
            </div>
            <div>
              <span className="font-bold text-white text-lg">Growth</span>
              <span className="font-bold text-primary-500 text-lg ml-1">Valley</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-9 h-9 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-dark-300 font-bold text-lg">G</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-200 transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 dark-sidebar">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-500/10 text-primary-500 border-l-2 border-primary-500'
                      : 'text-gray-400 hover:bg-dark-200 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={20} className={cn(isActive && 'text-primary-500')} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-dark-200 p-4">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={logout}
              className="p-2 rounded-xl hover:bg-dark-200 text-gray-400 hover:text-white transition-all duration-200"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark-200 rounded-xl flex items-center justify-center ring-2 ring-primary-500/20">
              <User size={18} className="text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {roleLabels[role] || role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl hover:bg-dark-200 text-gray-400 hover:text-white transition-all duration-200"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}