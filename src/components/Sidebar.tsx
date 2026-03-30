'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { BarChart3, MapPin, MessageSquare, LogOut, Leaf, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href: '/', label: 'Statistika', icon: BarChart3 },
  { href: '/places', label: 'Joylar', icon: MapPin },
  { href: '/reviews', label: 'Sharhlar', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
          <Leaf size={20} color="white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm">Nature Go</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={active ? { background: 'var(--primary)', color: 'white' } : {}}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-2 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {/* User info */}
        <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="text-xs font-medium text-white truncate">{user?.email}</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Administrator</div>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 h-screen sticky top-0 overflow-y-auto"
        style={{ background: 'var(--bg-sidebar)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div
        className="lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Leaf size={16} color="white" />
          </div>
          <span className="font-bold text-sm">Nature Go Admin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--text-muted)' }}>
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="w-64 h-full flex flex-col" style={{ background: 'var(--bg-sidebar)' }}>
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="text-slate-400">
                <X size={22} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
