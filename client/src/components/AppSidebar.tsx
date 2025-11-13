import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LayoutDashboard, Key, Settings, HelpCircle, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { MeResponse } from "@shared/schema";
import dkitLogo from "@assets/tmAkfS22mCPeHBTusOxQMQyKNe4_1762386813472.png";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/api-keys", label: "API Keys", icon: Key },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/support", label: "Support", icon: HelpCircle },
];

export function AppSidebar() {
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
    <Sidebar collapsible="none">
      <SidebarHeader className="p-6">
        <div className="flex justify-start">
          <img 
            src={dkitLogo} 
            alt="dKit" 
            className="h-10 w-auto object-contain"
            style={{ maxWidth: '200px' }}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      data-testid={`link-${item.label.toLowerCase()}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {meData && (
        <SidebarFooter className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-3">
            {meData.project?.logoUrl ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-border/40 bg-card/30">
                <img 
                  src={meData.project.logoUrl} 
                  alt={meData.project.name || "Project logo"} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {meData.user.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {meData.project.name || "Partner"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {meData.user.email}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full group-data-[collapsible=icon]:w-auto"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 group-data-[collapsible=icon]:mr-0 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
