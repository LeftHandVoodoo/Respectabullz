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
  ShoppingCart,
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
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue text-white font-bold text-lg shadow-[0_0_15px_hsl(215_18%_24%/0.4)] animate-glow-pulse">
          R
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground font-display">Respectabullz</span>
          <span className="text-xs text-muted-foreground">Breeder Management</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item, index) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium font-nav transition-all duration-200 ease-out',
                  'animate-slide-up-fade opacity-0',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-sm'
                )}
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-primary-foreground rounded-r-full shadow-[0_0_8px_hsl(var(--primary-foreground)/0.5)]" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )} />
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
            'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium font-nav transition-all duration-200 ease-out',
            location.pathname === '/settings'
              ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-sm'
          )}
        >
          {location.pathname === '/settings' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-primary-foreground rounded-r-full shadow-[0_0_8px_hsl(var(--primary-foreground)/0.5)]" />
          )}
          <Settings className={cn(
            "h-5 w-5 transition-transform duration-200",
            location.pathname !== '/settings' && "group-hover:rotate-45"
          )} />
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

