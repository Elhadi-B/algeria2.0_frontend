import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Trophy, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Zap
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { adminLogout } = await import("@/lib/api");
      await adminLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminUser");
      navigate("/admin/login");
    }
  };

  const navItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Tableau de Bord" },
    { path: "/admin/actions", icon: Zap, label: "Évaluations" },
    { path: "/admin/teams", icon: Users, label: "Équipes" },
    { path: "/admin/judges", icon: FileText, label: "Jurys" },
    { path: "/admin/ranking", icon: Trophy, label: "Classements" },
    { path: "/admin/winners", icon: Trophy, label: "Annonce Gagnants" },
    { path: "/admin/settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="pt-4 border-b flex justify-center">
            <img src="/logo/logo-algeria20.svg" alt="Algeria 2.0" className="h-28 w-28" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Add left padding on small screens so page titles are not overlapped by the mobile menu button */}
        <main className="p-6 pl-16 lg:p-8 lg:pl-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
