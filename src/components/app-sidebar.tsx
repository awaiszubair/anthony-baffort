import { Lightbulb, BarChart3, Settings, LogOut, LogIn } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Ad Creative Resize", url: "/", icon: BarChart3 },
  { title: "Inspiration Ads", url: "/inspiration", icon: Lightbulb },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarTrigger className="m-2 self-end" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="hover:bg-sidebar-accent/50" 
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-2 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <SidebarMenuButton
                onClick={signOut}
                className="hover:bg-sidebar-accent/50 text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Uitloggen</span>}
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                onClick={() => navigate("/auth")}
                className="hover:bg-sidebar-accent/50 text-muted-foreground"
              >
                <LogIn className="h-4 w-4" />
                {!collapsed && <span>Inloggen</span>}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}
