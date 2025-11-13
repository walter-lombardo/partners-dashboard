import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LayoutDashboard, Key, Settings, HelpCircle, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import type { MeResponse } from "@shared/schema";
import dkitLogo from "@assets/tmAkfS22mCPeHBTusOxQMQyKNe4_1762386813472.png";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/api-keys", label: "API Keys", icon: Key },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/support", label: "Support", icon: HelpCircle },
];

export function AppHeader() {
  const [location, setLocation] = useLocation();

  const { data: meData } = useQuery<MeResponse>({
    queryKey: ["/api/me"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <img
            src={dkitLogo}
            alt="dKit"
            className="h-8 w-auto object-contain"
            style={{ maxWidth: '150px' }}
          />
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setLocation(item.path)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>

        {meData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {meData.user.email.charAt(0).toUpperCase()}
                </div>
                <span>Account</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{meData.project?.name || meData.user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {meData.user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
