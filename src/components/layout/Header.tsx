import { useLocation } from 'react-router-dom';
import { Moon, Sun, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const { setTheme, theme } = useTheme();

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
      <h1 className="text-xl font-semibold text-foreground">
        {getTitle()}
      </h1>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>

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

