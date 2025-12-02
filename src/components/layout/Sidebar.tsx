import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Dog,
  Baby,
  Heart,
  Truck,
  DollarSign,
  BarChart3,
  Users,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { VERSION } from '@/lib/version';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Dogs', href: '/dogs', icon: Dog },
  { name: 'Litters', href: '/litters', icon: Baby },
  { name: 'Heat Cycles', href: '/heat-cycles', icon: Heart },
  { name: 'Transport', href: '/transport', icon: Truck },
  { name: 'Expenses', href: '/expenses', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Inquiries', href: '/inquiries', icon: MessageSquare },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue text-white font-bold text-lg">
          R
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">Respectabullz</span>
          <span className="text-xs text-muted-foreground">Breeder Management</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <Separator className="my-4" />

        {/* Settings */}
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            location.pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground text-center font-mono">
          v{VERSION}
        </div>
      </div>
    </aside>
  );
}

