import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, Syringe, Baby, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { VERSION } from '@/lib/version';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDate } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dogs': 'Dogs',
  '/litters': 'Litters',
  '/heat-cycles': 'Heat Cycles',
  '/transport': 'Transport',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/clients': 'Clients',
  '/settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { notifications, count } = useNotifications();

  const getTitle = () => {
    // Check for exact match first
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }
    
    // Check for detail pages
    if (location.pathname.startsWith('/dogs/')) return 'Dog Details';
    if (location.pathname.startsWith('/litters/')) return 'Litter Details';
    
    return 'Respectabullz';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <h1 className="text-xl font-semibold text-foreground font-display animate-fade-in">
        {getTitle()}
      </h1>

      <div className="flex items-center gap-3">
        {/* Version */}
        <span className="text-xs text-muted-foreground font-mono">
          v{VERSION}
        </span>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-glow-pulse shadow-[0_0_8px_hsl(var(--destructive)/0.5)]">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
              {count > 0 && (
                <span className="text-sm text-muted-foreground">{count} new</span>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const Icon =
                      notification.type === 'vaccination_overdue' ||
                      notification.type === 'vaccination_due_soon'
                        ? Syringe
                        : notification.type === 'litter_due_soon'
                        ? Baby
                        : AlertCircle;
                    
                    const iconColor =
                      notification.type === 'vaccination_overdue'
                        ? 'text-red-500'
                        : notification.type === 'vaccination_due_soon'
                        ? 'text-amber-500'
                        : 'text-pink-500';

                    return (
                      <div
                        key={notification.id}
                        className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (notification.link) {
                            navigate(notification.link);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            {notification.date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(notification.date)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <span className="mr-2">💻</span>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

