import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Users, Settings, Home, Menu, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Team", icon: Users, path: "/team" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-16"
        } bg-sidebar border-r border-sidebar-border flex flex-col transition-[width] duration-300 ease-in-out fixed inset-y-0 left-0 z-40 lg:relative`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-mono font-bold text-sm">{`</>`}</span>
          </div>
          {sidebarOpen && (
            <span className="font-mono font-semibold text-sidebar-foreground text-sm truncate">
              DevCollab
            </span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>


        {/* Logout & Collapse */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Logged out");
              navigate("/auth");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Log out</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <Menu className="w-4 h-4" />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen ${sidebarOpen ? "lg:ml-0" : "lg:ml-0"}`}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
