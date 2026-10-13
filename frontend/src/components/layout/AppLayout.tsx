import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  UsersRound,
  Activity,
  Settings2,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AppLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const navItems = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Students', to: '/students', icon: UsersRound },
  { label: 'System health', to: '/system', icon: Activity },
  { label: 'Settings', to: '/settings', icon: Settings2 },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ title, subtitle, children }) => {
  const location = useLocation();

  const isNavActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
        {/* Brand */}
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 pb-8 transition-opacity hover:opacity-90"
          aria-label="CampusOps home"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap size={21} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[16px] font-extrabold leading-tight tracking-tight text-foreground">
              CampusOps
            </span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              ADMINISTRATION
            </span>
          </span>
        </NavLink>

        {/* Workspace Nav Header */}
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>

        {/* Navigation items */}
        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map(({ label, to, icon: Icon }) => {
            const active = isNavActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'group flex min-h-10 items-center gap-3 rounded-md px-3 text-[13px] font-semibold transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Service Health Widget */}
        <div className="mt-auto rounded-lg border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-30" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            Campus operations
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            A clear view of your student services.
          </p>
          <NavLink
            to="/system"
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            View service health <ArrowUpRight size={13} />
          </NavLink>
        </div>
      </aside>

      {/* Main Area */}
      <div className="min-h-screen md:pl-[248px]">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="mx-auto flex min-h-[64px] max-w-[1420px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground md:hidden">
                <GraduationCap size={19} />
              </span>
              <div>
                <div className="font-display text-[15px] font-bold leading-tight text-foreground">
                  {title}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  Campus operations / {title}
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Production services</span>
              <span className="ml-2 flex size-9 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-secondary-foreground shadow-xs">
                CO
              </span>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
          <nav
            className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden"
            aria-label="Mobile navigation"
          >
            {navItems.map(({ label, to, icon: Icon }) => {
              const active = isNavActive(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </header>

        {/* Page Content */}
        <main className="mx-auto max-w-[1420px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mb-8">
            <h1 className="font-display text-[26px] font-bold leading-tight text-foreground sm:text-[29px]">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
